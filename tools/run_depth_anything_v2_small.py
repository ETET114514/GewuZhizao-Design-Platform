#!/usr/bin/env python3
"""Run Depth Anything V2 Small on a site photo or folder."""

from __future__ import annotations

import argparse
import sys
import types
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
ROOT = Path(__file__).resolve().parents[1]
FLOORPLAN_MODELS = ROOT / "\u5efa\u7b51\u5e73\u9762\u751f\u6210\u80fd\u529b" / "models"
MODEL_PATH = FLOORPLAN_MODELS / "depth-anything-v2-small" / "depth_anything_v2_vits.pth"
DEPTH_SOURCE = ROOT / "third_party" / "Depth-Anything-V2"


def iter_images(input_path: Path) -> list[Path]:
    if input_path.is_file():
        return [input_path]
    return sorted(
        path
        for path in input_path.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Input image or folder")
    parser.add_argument(
        "--outdir",
        type=Path,
        default=ROOT / "datasets" / "site_photos" / "derived" / "depth",
        help="Output folder for depth PNGs",
    )
    parser.add_argument("--input-size", type=int, default=518)
    parser.add_argument("--cpu", action="store_true", help="Force CPU inference")
    args = parser.parse_args()

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model: {MODEL_PATH}")
    if not DEPTH_SOURCE.exists():
        raise FileNotFoundError(f"Missing Depth Anything V2 source: {DEPTH_SOURCE}")
    if not args.input.exists():
        raise FileNotFoundError(args.input)

    sys.path.insert(0, str(DEPTH_SOURCE))
    install_torchvision_compose_fallback()
    try:
        import cv2
        import numpy as np
        import torch
        from depth_anything_v2.dpt import DepthAnythingV2
    except ImportError as exc:
        raise RuntimeError("Install runtime deps first: torch torchvision opencv-python numpy") from exc

    device = "cpu" if args.cpu else "cuda" if torch.cuda.is_available() else "cpu"
    model = DepthAnythingV2(encoder="vits", features=64, out_channels=[48, 96, 192, 384])
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model = model.to(device).eval()

    images = iter_images(args.input)
    args.outdir.mkdir(parents=True, exist_ok=True)
    if not images:
        print(f"No images found: {args.input}")
        return 1

    for index, image_path in enumerate(images, start=1):
        image = cv2.imdecode(np.fromfile(str(image_path), dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            print(f"Skipping unreadable image: {image_path}")
            continue
        depth = model.infer_image(image, args.input_size)
        low = float(depth.min())
        high = float(depth.max())
        if high > low:
            depth_u8 = ((depth - low) / (high - low) * 255.0).astype(np.uint8)
        else:
            depth_u8 = np.zeros(depth.shape, dtype=np.uint8)
        color = cv2.applyColorMap(depth_u8, cv2.COLORMAP_TURBO)

        gray_path = args.outdir / f"{image_path.stem}.depth.png"
        color_path = args.outdir / f"{image_path.stem}.depth-color.png"
        write_png(cv2, gray_path, depth_u8)
        write_png(cv2, color_path, color)
        print(f"[{index}/{len(images)}] {image_path} -> {gray_path}")

    print(f"Depth outputs: {args.outdir}")
    return 0


def install_torchvision_compose_fallback() -> None:
    try:
        import torchvision.transforms  # noqa: F401
        return
    except ImportError:
        pass

    class Compose:
        def __init__(self, transforms):
            self.transforms = transforms

        def __call__(self, value):
            for transform in self.transforms:
                value = transform(value)
            return value

    torchvision_module = types.ModuleType("torchvision")
    transforms_module = types.ModuleType("torchvision.transforms")
    transforms_module.Compose = Compose
    torchvision_module.transforms = transforms_module
    sys.modules["torchvision"] = torchvision_module
    sys.modules["torchvision.transforms"] = transforms_module


def write_png(cv2, path: Path, image) -> None:
    ok, encoded = cv2.imencode(".png", image)
    if not ok:
        raise RuntimeError(f"Unable to encode PNG: {path}")
    encoded.tofile(str(path))


if __name__ == "__main__":
    raise SystemExit(main())
