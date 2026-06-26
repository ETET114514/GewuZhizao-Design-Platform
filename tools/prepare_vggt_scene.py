#!/usr/bin/env python3
"""Copy site photos into VGGT's expected scene_dir/images layout."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def image_files(source: Path) -> list[Path]:
    return sorted(
        path
        for path in source.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def prepare_scene(source: Path, scene_dir: Path, force: bool) -> int:
    images_dir = scene_dir / "images"
    if images_dir.exists() and any(images_dir.iterdir()) and not force:
        raise FileExistsError(f"{images_dir} is not empty; pass --force to replace it")

    if images_dir.exists() and force:
        shutil.rmtree(images_dir)
    images_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for count, src in enumerate(image_files(source), start=1):
        dst = images_dir / f"frame_{count:06d}{src.suffix.lower()}"
        shutil.copy2(src, dst)
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Folder containing phone photos")
    parser.add_argument("scene_dir", type=Path, help="VGGT scene directory to create")
    parser.add_argument("--force", action="store_true", help="Replace existing scene_dir/images")
    args = parser.parse_args()

    if not args.source.is_dir():
        raise NotADirectoryError(args.source)

    copied = prepare_scene(args.source, args.scene_dir, args.force)
    print(f"Prepared {copied} images under {args.scene_dir / 'images'}")
    if copied == 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
