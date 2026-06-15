#!/usr/bin/env python
"""Evaluate and grid-search floor-plan ONNX post-processing.

This evaluates the building floor-plan app backend:
  建筑平面生成能力/server.py

Metrics emitted on every run:
  - IoU
  - Dice
  - wall count absolute error
  - door/window/room count absolute error
  - average inference time

The current ONNX backend only predicts wall masks/wall lines. Door, window, and
room count metrics are therefore emitted as null until that backend exposes
those object predictions.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_ROOT = REPO_ROOT / "training_data" / "cubicasa_web_annotations"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "evaluation_reports" / "floorplan_postprocess"


@dataclass(frozen=True)
class Config:
    threshold: float
    min_length: int
    max_thickness: int
    merge_gap: int
    min_noise_area: int
    min_wall_thickness: int

    def settings(self) -> dict[str, int]:
        return {
            "minLength": self.min_length,
            "maxThickness": self.max_thickness,
            "mergeGap": self.merge_gap,
            "minNoiseArea": self.min_noise_area,
            "minWallThickness": self.min_wall_thickness,
        }

    def as_dict(self) -> dict[str, int | float]:
        return {
            "threshold": self.threshold,
            "minLength": self.min_length,
            "maxThickness": self.max_thickness,
            "mergeGap": self.merge_gap,
            "minNoiseArea": self.min_noise_area,
            "minWallThickness": self.min_wall_thickness,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument("--samples", choices=["holdout", "all", "train", "val", "test"], default="holdout")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--grid", action="store_true", help="Run grid search after evaluating the current config.")
    parser.add_argument("--thresholds", default="0.35,0.40,0.45,0.50")
    parser.add_argument("--max-thicknesses", default="24,28,34,42")
    parser.add_argument("--min-lengths", default="60,72,84,96,128")
    parser.add_argument("--threshold", type=float, default=None, help="Single-run wall probability threshold.")
    parser.add_argument("--max-thickness", type=int, default=None)
    parser.add_argument("--min-length", type=int, default=None)
    parser.add_argument("--merge-gap", type=int, default=None)
    parser.add_argument("--min-noise-area", type=int, default=None)
    parser.add_argument("--min-wall-thickness", type=int, default=4)
    return parser.parse_args()


def load_server_module():
    app_root = next(
        path
        for path in REPO_ROOT.iterdir()
        if path.is_dir()
        and (path / "server.py").exists()
        and (path / "models").exists()
        and list((path / "models").glob("*web-annotations*.onnx"))
    )
    spec = importlib.util.spec_from_file_location("building_floorplan_server_for_eval", app_root / "server.py")
    if not spec or not spec.loader:
        raise RuntimeError(f"Cannot load server.py from {app_root}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module, app_root


def current_server_defaults(server) -> Config:
    server_path = Path(server.__file__)
    text = server_path.read_text(encoding="utf-8")

    def int_default(pattern: str, fallback: int) -> int:
        match = re.search(pattern, text)
        return int(match.group(1)) if match else fallback

    threshold = float(getattr(server, "CUBICASA_WALL_PROB_THRESHOLD", 0.45))
    return Config(
        threshold=threshold,
        min_length=int_default(r'settings\.get\("minLength",\s*(\d+)\)', 72),
        max_thickness=int_default(r'settings\.get\("maxThickness",\s*(\d+)\)', 34),
        merge_gap=int_default(r'settings\.get\("mergeGap",\s*(\d+)\)', 6),
        min_noise_area=int_default(r'settings\.get\("minNoiseArea",\s*(\d+)\)', 220),
        min_wall_thickness=int_default(r'settings\.get\("minWallThickness",\s*(\d+)\)', 4),
    )


def parse_number_list(value: str, cast):
    return [cast(item.strip()) for item in value.split(",") if item.strip()]


def sample_names(data_root: Path, split: str) -> list[str]:
    if split == "holdout":
        return sample_names(data_root, "val") + sample_names(data_root, "test")
    file_name = "all.txt" if split == "all" else f"{split}.txt"
    return [line.strip() for line in (data_root / file_name).read_text(encoding="utf-8").splitlines() if line.strip()]


def read_image(path: Path) -> np.ndarray:
    image = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Cannot read image: {path}")
    return image


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def draw_line(mask: np.ndarray, line: dict[str, Any]) -> None:
    x1 = round(float(line.get("x1", 0)))
    y1 = round(float(line.get("y1", 0)))
    x2 = round(float(line.get("x2", 0)))
    y2 = round(float(line.get("y2", 0)))
    thickness = max(1, round(float(line.get("thickness") or 6)))
    cv2.line(mask, (x1, y1), (x2, y2), 255, thickness=thickness, lineType=cv2.LINE_AA)


def wall_mask_from_annotation(annotation: dict[str, Any], shape: tuple[int, int, int]) -> np.ndarray:
    mask = np.zeros(shape[:2], dtype=np.uint8)
    for line in annotation.get("walls", []):
        draw_line(mask, line)
    return mask > 0


def count_metric(predicted: int | None, expected: int) -> int | None:
    return None if predicted is None else abs(predicted - expected)


def mask_metrics(predicted_mask: np.ndarray, expected_mask: np.ndarray) -> dict[str, float]:
    predicted = predicted_mask > 0
    expected = expected_mask > 0
    intersection = int(np.logical_and(predicted, expected).sum())
    union = int(np.logical_or(predicted, expected).sum())
    predicted_count = int(predicted.sum())
    expected_count = int(expected.sum())
    return {
        "iou": intersection / union if union else 1.0,
        "dice": (2 * intersection / (predicted_count + expected_count)) if (predicted_count + expected_count) else 1.0,
        "areaRatio": predicted_count / max(1, expected_count),
    }


def onnx_cache_for_samples(server, data_root: Path, names: list[str]) -> list[dict[str, Any]]:
    session = server.load_cubicasa_onnx_session()
    if session is None:
        raise RuntimeError(f"CubiCasa ONNX unavailable: {server.CUBICASA_ONNX_ERROR}")
    input_name = session.get_inputs()[0].name
    room_classes = server.CUBICASA_WALL_ROOM_CLASSES
    prepared = []
    for name in names:
        folder = data_root / name
        image = read_image(folder / "F1_scaled.png")
        annotation = read_json(folder / "annotation.json")
        height, width = image.shape[:2]
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (server.CUBICASA_IMAGE_SIZE, server.CUBICASA_IMAGE_SIZE), interpolation=cv2.INTER_AREA)
        tensor = resized.astype(np.float32)
        tensor = 2 * (tensor / 255.0) - 1
        tensor = np.transpose(tensor, (2, 0, 1))[None, ...]
        start = time.perf_counter()
        output = session.run(None, {input_name: tensor})[0]
        onnx_seconds = time.perf_counter() - start
        room_logits = output[
            :,
            server.CUBICASA_INPUT_SLICE[0] : server.CUBICASA_INPUT_SLICE[0] + server.CUBICASA_INPUT_SLICE[1],
        ][0].astype(np.float32)
        room_logits = room_logits - room_logits.max(axis=0, keepdims=True)
        room_probs = np.exp(room_logits)
        room_probs = room_probs / np.maximum(room_probs.sum(axis=0, keepdims=True), 1e-6)
        prepared.append(
            {
                "sample": name,
                "image": image,
                "shape": (height, width),
                "roomPrediction": np.argmax(room_probs, axis=0).astype(np.uint8),
                "wallScore": room_probs[list(room_classes)].sum(axis=0),
                "cvMask": server.infer_cv_mask(image, cv2),
                "expectedWallMask": wall_mask_from_annotation(annotation, image.shape),
                "expectedWalls": len(annotation.get("walls", [])),
                "expectedDoors": len(annotation.get("doors", [])),
                "expectedWindows": len(annotation.get("windows", [])),
                "expectedRooms": len(annotation.get("rooms", [])),
                "onnxSeconds": onnx_seconds,
            }
        )
    return prepared


def raw_onnx_mask(server, cached: dict[str, Any], threshold: float) -> np.ndarray:
    height, width = cached["shape"]
    room_classes = server.CUBICASA_WALL_ROOM_CLASSES
    mask = (
        np.isin(cached["roomPrediction"], room_classes)
        | (cached["wallScore"] >= threshold)
    ).astype(np.uint8) * 255
    mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_NEAREST)
    mask = cv2.bitwise_or(mask, cached["cvMask"])
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)


def evaluate_config(server, cached_samples: list[dict[str, Any]], config: Config) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    rows = []
    for cached in cached_samples:
        start = time.perf_counter()
        raw_mask = raw_onnx_mask(server, cached, config.threshold)
        mask = server.postprocess_mask(raw_mask, config.settings(), cv2, np)
        walls = server.vectorize_mask(mask, config.settings(), cv2)
        postprocess_seconds = time.perf_counter() - start
        mm = mask_metrics(mask, cached["expectedWallMask"])
        row = {
            "sample": cached["sample"],
            "iou": mm["iou"],
            "dice": mm["dice"],
            "areaRatio": mm["areaRatio"],
            "wallCount": len(walls),
            "expectedWalls": cached["expectedWalls"],
            "wallCountAbsError": abs(len(walls) - cached["expectedWalls"]),
            "doorCount": None,
            "expectedDoors": cached["expectedDoors"],
            "doorCountAbsError": count_metric(None, cached["expectedDoors"]),
            "windowCount": None,
            "expectedWindows": cached["expectedWindows"],
            "windowCountAbsError": count_metric(None, cached["expectedWindows"]),
            "roomCount": None,
            "expectedRooms": cached["expectedRooms"],
            "roomCountAbsError": count_metric(None, cached["expectedRooms"]),
            "inferenceSeconds": cached["onnxSeconds"] + postprocess_seconds,
        }
        rows.append(row)
    summary = aggregate_rows(rows)
    summary["config"] = config.as_dict()
    return summary, rows


def average(values: list[float | int]) -> float | None:
    return sum(values) / len(values) if values else None


def aggregate_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "sampleCount": len(rows),
        "iou": average([row["iou"] for row in rows]),
        "dice": average([row["dice"] for row in rows]),
        "wallCountAbsError": average([row["wallCountAbsError"] for row in rows]),
        "doorCountAbsError": average([row["doorCountAbsError"] for row in rows if row["doorCountAbsError"] is not None]),
        "windowCountAbsError": average([row["windowCountAbsError"] for row in rows if row["windowCountAbsError"] is not None]),
        "roomCountAbsError": average([row["roomCountAbsError"] for row in rows if row["roomCountAbsError"] is not None]),
        "areaRatio": average([row["areaRatio"] for row in rows]),
        "averageInferenceSeconds": average([row["inferenceSeconds"] for row in rows]),
    }


def score_grid_result(summary: dict[str, Any], baseline: dict[str, Any]) -> float:
    dice_penalty = max(0.0, float(baseline["dice"]) - 0.015 - float(summary["dice"])) * 12
    iou_penalty = max(0.0, float(baseline["iou"]) - 0.01 - float(summary["iou"])) * 10
    area_penalty = abs(float(summary["areaRatio"]) - 1.25) * 0.25
    return float(summary["wallCountAbsError"]) + dice_penalty + iou_penalty + area_penalty


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def rounded(value: Any) -> Any:
    if isinstance(value, float):
        return round(value, 6)
    if isinstance(value, dict):
        return {key: rounded(item) for key, item in value.items()}
    if isinstance(value, list):
        return [rounded(item) for item in value]
    return value


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rounded(payload), ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    server, app_root = load_server_module()
    defaults = current_server_defaults(server)
    config = Config(
        threshold=args.threshold if args.threshold is not None else defaults.threshold,
        min_length=args.min_length if args.min_length is not None else defaults.min_length,
        max_thickness=args.max_thickness if args.max_thickness is not None else defaults.max_thickness,
        merge_gap=args.merge_gap if args.merge_gap is not None else defaults.merge_gap,
        min_noise_area=args.min_noise_area if args.min_noise_area is not None else defaults.min_noise_area,
        min_wall_thickness=args.min_wall_thickness,
    )
    names = sample_names(args.data_root, args.samples)
    output_dir = args.output_dir / args.samples if args.output_dir == DEFAULT_OUTPUT_DIR else args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading ONNX cache for {len(names)} samples...")
    cached = onnx_cache_for_samples(server, args.data_root, names)
    summary, sample_rows = evaluate_config(server, cached, config)
    payload = {
        "appRoot": str(app_root),
        "modelPath": str(server.CUBICASA_ONNX_PATH or server.cubicasa_onnx_path()),
        "dataRoot": str(args.data_root),
        "split": args.samples,
        "unsupportedMetrics": {
            "doorCountAbsError": "Current 建筑平面生成能力 ONNX backend outputs walls only.",
            "windowCountAbsError": "Current 建筑平面生成能力 ONNX backend outputs walls only.",
            "roomCountAbsError": "Current 建筑平面生成能力 ONNX backend outputs walls only.",
        },
        "summary": summary,
    }
    write_json(output_dir / "summary.json", payload)
    write_csv(output_dir / "sample_metrics.csv", sample_rows)

    if args.grid:
        grid_rows = []
        thresholds = parse_number_list(args.thresholds, float)
        max_thicknesses = parse_number_list(args.max_thicknesses, int)
        min_lengths = parse_number_list(args.min_lengths, int)
        for threshold in thresholds:
            for max_thickness in max_thicknesses:
                for min_length in min_lengths:
                    grid_config = Config(
                        threshold=threshold,
                        min_length=min_length,
                        max_thickness=max_thickness,
                        merge_gap=config.merge_gap,
                        min_noise_area=config.min_noise_area,
                        min_wall_thickness=config.min_wall_thickness,
                    )
                    grid_summary, _ = evaluate_config(server, cached, grid_config)
                    grid_rows.append(
                        {
                            **grid_config.as_dict(),
                            "score": score_grid_result(grid_summary, summary),
                            "iou": grid_summary["iou"],
                            "dice": grid_summary["dice"],
                            "wallCountAbsError": grid_summary["wallCountAbsError"],
                            "doorCountAbsError": grid_summary["doorCountAbsError"],
                            "windowCountAbsError": grid_summary["windowCountAbsError"],
                            "roomCountAbsError": grid_summary["roomCountAbsError"],
                            "areaRatio": grid_summary["areaRatio"],
                            "averageInferenceSeconds": grid_summary["averageInferenceSeconds"],
                        }
                    )
        grid_rows.sort(key=lambda row: (row["score"], row["wallCountAbsError"], -row["dice"]))
        write_csv(output_dir / "grid_results.csv", grid_rows)
        write_json(
            output_dir / "grid_summary.json",
            {
                **payload,
                "searchedConfigs": len(grid_rows),
                "best": grid_rows[0] if grid_rows else None,
                "top10": grid_rows[:10],
            },
        )
        print("Best grid config:")
        print(json.dumps(rounded(grid_rows[0]), ensure_ascii=False, indent=2))

    print("Evaluation summary:")
    print(json.dumps(rounded(summary), ensure_ascii=False, indent=2))
    print(f"Reports written to: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
