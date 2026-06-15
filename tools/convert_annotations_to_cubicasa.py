#!/usr/bin/env python
"""Convert web floorplan annotations to CubiCasa5K folder format.

The CubiCasa loader expects:
  data_root/
    train.txt
    val.txt
    test.txt
    sample_xxx/
      F1_original.png
      F1_scaled.png
      model.svg
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
import sys
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOM_MAP = {
    "living": "LivingRoom",
    "livingroom": "LivingRoom",
    "bedroom": "Bedroom",
    "kitchen": "Kitchen",
    "bath": "Bath",
    "bathroom": "Bath",
    "balcony": "Outdoor",
    "corridor": "HallWay",
    "hallway": "HallWay",
    "storage": "Storage",
    "study": "Office",
    "dining": "Dining",
    "entry": "Entry",
    "unknown": "Room",
    "room": "Room",
}

FIXTURE_MAP = {
    "toilet": "Toilet",
    "sink": "Sink",
    "bathtub": "Bathtub",
    "fixture": "Misc",
    "unknown": "Misc",
}


def default_training_root() -> Path:
    # Keep this ASCII-safe in source while still pointing at the user's folder.
    return Path("D:/") / "\u65b0\u5efa\u6587\u4ef6\u5939" / "\u88c5\u4fee\u5e73\u9762" / "\u8bad\u7ec3\u5e73\u9762\u56fe"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=default_training_root(), help="Folder containing *标注.json files.")
    parser.add_argument(
        "--output",
        type=Path,
        default=repo_root() / "third_party" / "CubiCasa5k" / "data" / "web_annotations",
        help="Output CubiCasa-format dataset folder.",
    )
    parser.add_argument("--limit", type=int, default=0, help="Convert only the first N annotations. 0 means all.")
    parser.add_argument("--wall-thickness", type=float, default=8.0, help="Fallback wall polygon thickness in pixels.")
    parser.add_argument("--opening-thickness", type=float, default=6.0, help="Fallback door/window polygon thickness in pixels.")
    parser.add_argument("--include-fixtures", action="store_true", help="Also export fixtures as FixedFurniture groups.")
    parser.add_argument("--val-count", type=int, default=2)
    parser.add_argument("--test-count", type=int, default=2)
    return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def find_annotations(root: Path) -> list[Path]:
    return sorted(root.rglob("*\u6807\u6ce8.json"))


def image_for_annotation(annotation_path: Path, annotation: dict[str, Any]) -> Path:
    image_name = annotation.get("image") or annotation_path.name.replace("\u6807\u6ce8.json", "")
    candidate = annotation_path.with_name(image_name)
    if candidate.exists():
        return candidate
    stem = Path(image_name).stem
    for suffix in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
        candidate = annotation_path.with_name(stem + suffix)
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Source image not found for {annotation_path}: {image_name}")


def load_image_size(path: Path) -> tuple[int, int]:
    try:
        from PIL import Image

        with Image.open(path) as image:
            return image.size
    except Exception:
        import cv2
        import numpy as np

        image = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise RuntimeError(f"Cannot read image: {path}")
        height, width = image.shape[:2]
        return width, height


def save_png(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image

        with Image.open(source) as image:
            image.convert("RGB").save(destination, "PNG")
        return
    except Exception:
        import cv2
        import numpy as np

        image = cv2.imdecode(np.fromfile(str(source), dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise RuntimeError(f"Cannot read image: {source}")
        success, encoded = cv2.imencode(".png", image)
        if not success:
            raise RuntimeError(f"Cannot write image: {destination}")
        encoded.tofile(str(destination))


def point_xy(point: Any) -> tuple[float, float]:
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    return float(point[0]), float(point[1])


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def format_num(value: float) -> str:
    value = round(float(value), 2)
    if value.is_integer():
        return str(int(value))
    return f"{value:.2f}".rstrip("0").rstrip(".")


def polygon_points(points: list[tuple[float, float]], swap_for_space: bool = False) -> str:
    if swap_for_space:
        return " ".join(f"{format_num(y)},{format_num(x)}" for x, y in points) + " "
    return " ".join(f"{format_num(x)},{format_num(y)}" for x, y in points) + " "


def line_to_polygon(line: dict[str, Any], fallback_thickness: float, width: int, height: int) -> list[tuple[float, float]]:
    x1 = float(line.get("x1", 0))
    y1 = float(line.get("y1", 0))
    x2 = float(line.get("x2", 0))
    y2 = float(line.get("y2", 0))
    thickness = float(line.get("thickness") or fallback_thickness)
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length < 1e-6:
        half = max(thickness / 2, 2)
        points = [(x1 - half, y1 - half), (x1 + half, y1 - half), (x1 + half, y1 + half), (x1 - half, y1 + half)]
    else:
        nx = -dy / length * thickness / 2
        ny = dx / length * thickness / 2
        points = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
    return [(clamp(x, 0, width - 1), clamp(y, 0, height - 1)) for x, y in points]


def bounds_to_polygon(bounds: dict[str, Any], width: int, height: int) -> list[tuple[float, float]]:
    x = float(bounds.get("x", 0))
    y = float(bounds.get("y", 0))
    w = float(bounds.get("width", 0))
    h = float(bounds.get("height", 0))
    return [
        (clamp(x, 0, width - 1), clamp(y, 0, height - 1)),
        (clamp(x + w, 0, width - 1), clamp(y, 0, height - 1)),
        (clamp(x + w, 0, width - 1), clamp(y + h, 0, height - 1)),
        (clamp(x, 0, width - 1), clamp(y + h, 0, height - 1)),
    ]


def add_polygon_group(parent: ET.Element, group_id: str | None, class_name: str | None, points: list[tuple[float, float]], *, space: bool = False) -> None:
    attrs: dict[str, str] = {}
    if group_id:
        attrs["id"] = group_id
    if class_name:
        attrs["class"] = class_name
    group = ET.SubElement(parent, "g", attrs)
    ET.SubElement(group, "polygon", {"points": polygon_points(points, swap_for_space=space)})


def add_fixture(parent: ET.Element, fixture: dict[str, Any], width: int, height: int) -> bool:
    bounds = fixture.get("bounds") or fixture
    points = bounds_to_polygon(bounds, width, height)
    if polygon_area(points) < 4:
        return False
    fixture_type = FIXTURE_MAP.get(str(fixture.get("type", "fixture")).lower(), "Misc")
    group = ET.SubElement(parent, "g", {"class": f"FixedFurniture {fixture_type}", "transform": "matrix(1,0,0,1,0,0)"})
    boundary = ET.SubElement(group, "g", {"class": "BoundaryPolygon"})
    ET.SubElement(boundary, "polygon", {"points": polygon_points(points)})
    return True


def polygon_area(points: list[tuple[float, float]]) -> float:
    if len(points) < 3:
        return 0.0
    area = 0.0
    for index, (x1, y1) in enumerate(points):
        x2, y2 = points[(index + 1) % len(points)]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2


def room_type(value: str | None) -> str:
    return ROOM_MAP.get(str(value or "unknown").lower(), "Room")


def build_svg(
    annotation: dict[str, Any],
    width: int,
    height: int,
    wall_thickness: float,
    opening_thickness: float,
    include_fixtures: bool,
) -> ET.ElementTree:
    svg = ET.Element(
        "svg",
        {
            "xmlns": "http://www.w3.org/2000/svg",
            "version": "1.1",
            "width": str(width),
            "height": str(height),
            "viewBox": f"0 0 {width} {height}",
        },
    )

    for room in annotation.get("rooms", []):
        points = [point_xy(point) for point in room.get("polygon", [])]
        points = [(clamp(x, 0, width - 1), clamp(y, 0, height - 1)) for x, y in points]
        if polygon_area(points) >= 4:
            add_polygon_group(svg, None, f"Space {room_type(room.get('type'))}", points, space=True)

    for wall in annotation.get("walls", []):
        points = line_to_polygon(wall, wall_thickness, width, height)
        if polygon_area(points) >= 4:
            add_polygon_group(svg, "Wall", None, points)

    for door in annotation.get("doors", []):
        points = line_to_polygon(door, opening_thickness, width, height)
        if polygon_area(points) >= 4:
            add_polygon_group(svg, "Door", None, points)

    for window in annotation.get("windows", []):
        points = line_to_polygon(window, opening_thickness, width, height)
        if polygon_area(points) >= 4:
            add_polygon_group(svg, "Window", None, points)

    if include_fixtures:
        for fixture in annotation.get("fixtures", []):
            add_fixture(svg, fixture, width, height)

    return ET.ElementTree(svg)


def write_xml(tree: ET.ElementTree, path: Path) -> None:
    ET.indent(tree, space="  ")
    tree.write(path, encoding="utf-8", xml_declaration=True)


def sample_name(index: int, image_path: Path) -> str:
    stem = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in image_path.stem)
    return f"sample_{index:04d}_{stem}"


def split_samples(samples: list[str], val_count: int, test_count: int) -> tuple[list[str], list[str], list[str]]:
    if len(samples) <= val_count + test_count:
        return samples, [], []
    test = samples[-test_count:] if test_count > 0 else []
    val_end = len(samples) - len(test)
    val_start = max(0, val_end - val_count)
    val = samples[val_start:val_end]
    train = samples[:val_start]
    return train, val, test


def write_list(path: Path, values: list[str]) -> None:
    path.write_text("\n".join(values) + ("\n" if values else ""), encoding="utf-8")


def convert_one(index: int, annotation_path: Path, output: Path, args: argparse.Namespace) -> dict[str, Any]:
    annotation = read_json(annotation_path)
    image_path = image_for_annotation(annotation_path, annotation)
    width, height = load_image_size(image_path)
    name = sample_name(index, image_path)
    sample_dir = output / name
    sample_dir.mkdir(parents=True, exist_ok=True)

    save_png(image_path, sample_dir / "F1_original.png")
    shutil.copy2(sample_dir / "F1_original.png", sample_dir / "F1_scaled.png")
    svg = build_svg(annotation, width, height, args.wall_thickness, args.opening_thickness, args.include_fixtures)
    write_xml(svg, sample_dir / "model.svg")
    shutil.copy2(annotation_path, sample_dir / "annotation.json")

    return {
        "sample": name,
        "annotation": str(annotation_path),
        "image": str(image_path),
        "width": width,
        "height": height,
        "rooms": len(annotation.get("rooms", [])),
        "walls": len(annotation.get("walls", [])),
        "doors": len(annotation.get("doors", [])),
        "windows": len(annotation.get("windows", [])),
        "fixtures": len(annotation.get("fixtures", [])),
    }


def write_manifest(output: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with (output / "manifest.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    annotations = find_annotations(args.input)
    if args.limit > 0:
        annotations = annotations[: args.limit]
    if not annotations:
        print(f"No annotation files found in {args.input}", file=sys.stderr)
        return 1

    args.output.mkdir(parents=True, exist_ok=True)
    rows = []
    for index, annotation_path in enumerate(annotations, start=1):
        rows.append(convert_one(index, annotation_path, args.output, args))

    sample_names = [row["sample"] for row in rows]
    train, val, test = split_samples(sample_names, args.val_count, args.test_count)
    write_list(args.output / "train.txt", train)
    write_list(args.output / "val.txt", val)
    write_list(args.output / "test.txt", test)
    write_list(args.output / "all.txt", sample_names)
    write_manifest(args.output, rows)
    (args.output / "README.md").write_text(
        "\n".join(
            [
                "# Web Annotation CubiCasa Export",
                "",
                f"Source: `{args.input}`",
                f"Samples: {len(rows)}",
                "",
                "Each sample contains `F1_original.png`, `F1_scaled.png`, `model.svg`, and the source `annotation.json`.",
                f"Fixtures exported to SVG: `{args.include_fixtures}`.",
                "Use this folder as CubiCasa `data_folder`, for example with `train.txt`.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(f"Converted {len(rows)} samples -> {args.output}")
    print(f"Split: train={len(train)}, val={len(val)}, test={len(test)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
