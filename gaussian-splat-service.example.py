"""
Gaussian Splatting bridge service for GewuZhizao Design Platform.

HTTP contract expected by the browser:
POST /api/gaussian-splat/photos-to-3d
  multipart/form-data:
    images: repeated PNG/JPG files
    output: ksplat | splat | ply | spz

Response:
  Binary .ksplat/.splat/.ply/.spz bytes, or JSON with one of:
    {"ksplat_url": "..."}
    {"splat_url": "..."}
    {"ply_url": "..."}
    {"spz_url": "..."}
    {"model_base64": "...", "filename": "scene.ksplat"}

Built-in real pipeline:
  Nerfstudio Splatfacto
    ns-process-data images -> ns-train splatfacto -> ns-export gaussian-splat

This requires COLMAP, Nerfstudio, and a CUDA-capable PyTorch environment.

Optional override:
  Set GAUSSIAN_SPLAT_COMMAND to run another local reconstruction pipeline. The
  command may use {input_dir}, {output_path}, {output_format}, and {job_dir}
  placeholders.

Example:
  set GAUSSIAN_SPLAT_COMMAND=python train_and_export.py --images "{input_dir}" --out "{output_path}"
  python gaussian-splat-service.example.py
"""

from __future__ import annotations

import os
import shutil
import shlex
import subprocess
import time
from pathlib import Path

from flask import Flask, Response, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

MIME_TYPES = {
    "ksplat": "application/octet-stream",
    "splat": "application/octet-stream",
    "ply": "application/octet-stream",
    "spz": "application/octet-stream",
}


ROOT_DIR = Path(__file__).resolve().parent
DEFAULT_WORK_DIR = ROOT_DIR / "gaussian_splat_jobs"


def gaussian_splat_command() -> str | None:
    command = os.environ.get("GAUSSIAN_SPLAT_COMMAND")
    return command.strip() if command and command.strip() else None


def env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def command_exists(name: str) -> bool:
    return shutil.which(name) is not None


def torch_cuda_available() -> bool:
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def nerfstudio_status() -> dict:
    missing: list[str] = []
    for command in ("colmap", "ns-process-data", "ns-train", "ns-export"):
        if not command_exists(command):
            missing.append(command)

    cuda_available = torch_cuda_available()
    if not cuda_available:
        missing.append("CUDA PyTorch / NVIDIA GPU")

    ready = not missing
    return {
        "ready": ready,
        "missing": missing,
        "cuda_available": cuda_available,
        "commands": {
            "colmap": command_exists("colmap"),
            "ns-process-data": command_exists("ns-process-data"),
            "ns-train": command_exists("ns-train"),
            "ns-export": command_exists("ns-export"),
        },
    }


def pipeline_status() -> dict:
    mode = os.environ.get("GAUSSIAN_SPLAT_PIPELINE", "auto").strip().lower() or "auto"
    command = gaussian_splat_command()
    nerfstudio = nerfstudio_status()
    external_ready = command is not None
    ready = external_ready or (mode in {"auto", "nerfstudio"} and nerfstudio["ready"])

    if external_ready:
        message = "ready: GAUSSIAN_SPLAT_COMMAND configured"
    elif nerfstudio["ready"]:
        message = "ready: built-in Nerfstudio Splatfacto pipeline"
    else:
        message = "missing " + ", ".join(nerfstudio["missing"])

    return {
        "ready": ready,
        "mode": "command" if external_ready else "nerfstudio",
        "command_configured": external_ready,
        "nerfstudio": nerfstudio,
        "missing": [] if ready else nerfstudio["missing"],
        "message": message,
    }


@app.get("/api/gaussian-splat/health")
def health() -> Response:
    status = pipeline_status()
    return jsonify(
        {
            "ok": True,
            "ready": status["ready"],
            "mode": status["mode"],
            "command_configured": status["command_configured"],
            "nerfstudio": status["nerfstudio"],
            "missing": status["missing"],
            "service": "gaussian-splat-bridge",
            "supported_outputs": sorted(MIME_TYPES.keys()),
            "message": status["message"],
        }
    )


def save_uploaded_images(input_dir: Path) -> list[Path]:
    files = request.files.getlist("images")
    if not files:
        single = request.files.get("image")
        files = [single] if single is not None else []
    if not files:
        raise ValueError("missing images field")

    saved: list[Path] = []
    for index, image in enumerate(files, start=1):
        suffix = Path(image.filename or "").suffix.lower() or ".png"
        image_path = input_dir / f"site-photo-{index:03d}{suffix}"
        image.save(image_path)
        saved.append(image_path)
    return saved


def split_extra_args(value: str | None) -> list[str]:
    if not value:
        return []
    return shlex.split(value, posix=os.name != "nt")


def append_log(log_path: Path, text: str) -> None:
    with log_path.open("a", encoding="utf-8") as log_file:
        log_file.write(text)
        if not text.endswith("\n"):
            log_file.write("\n")


def run_logged(args: list[str], log_path: Path, cwd: Path | None = None) -> None:
    append_log(log_path, "\n$ " + " ".join(f'"{item}"' if " " in item else item for item in args))
    with log_path.open("a", encoding="utf-8") as log_file:
        process = subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
    if process.returncode != 0:
        raise RuntimeError(f"command failed with exit code {process.returncode}: {' '.join(args)}")


def run_command_template(command_template: str, log_path: Path, **values: object) -> None:
    command = command_template.format(**{key: str(value) for key, value in values.items()})
    append_log(log_path, "\n$ " + command)
    with log_path.open("a", encoding="utf-8") as log_file:
        process = subprocess.run(
            command,
            shell=True,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
    if process.returncode != 0:
        raise RuntimeError(f"command failed with exit code {process.returncode}: {command}")


def latest_config_path(outputs_dir: Path) -> Path:
    configs = sorted(outputs_dir.rglob("config.yml"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not configs:
        raise RuntimeError(f"Nerfstudio training finished but no config.yml was found in {outputs_dir}")
    return configs[0]


def latest_exported_ply(export_dir: Path) -> Path:
    candidates = sorted(export_dir.rglob("*.ply"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not candidates:
        raise RuntimeError(f"Nerfstudio export finished but no .ply file was found in {export_dir}")
    return candidates[0]


def convert_ply_if_needed(ply_path: Path, output_path: Path, output_format: str, log_path: Path, job_dir: Path) -> None:
    if output_format == "ply":
        shutil.copyfile(ply_path, output_path)
        return

    convert_command = os.environ.get("GAUSSIAN_SPLAT_CONVERT_COMMAND")
    if not convert_command:
        raise RuntimeError(
            "Built-in Nerfstudio pipeline exports .ply. Request output=ply, or set "
            "GAUSSIAN_SPLAT_CONVERT_COMMAND to convert {input_path} to {output_path}."
        )

    run_command_template(
        convert_command,
        log_path,
        input_path=ply_path,
        output_path=output_path,
        output_format=output_format,
        job_dir=job_dir,
    )


def run_nerfstudio_pipeline(input_dir: Path, output_path: Path, output_format: str, job_dir: Path, log_path: Path) -> None:
    status = nerfstudio_status()
    if not status["ready"]:
        raise RuntimeError(
            "Built-in Nerfstudio pipeline is not ready. Missing: " + ", ".join(status["missing"])
        )

    processed_dir = job_dir / "nerfstudio-data"
    outputs_dir = job_dir / "outputs"
    export_dir = job_dir / "exports" / "splat"
    method = os.environ.get("NERFSTUDIO_METHOD", "splatfacto")
    max_iterations = os.environ.get("NERFSTUDIO_MAX_ITERATIONS", "7000")

    process_args = [
        "ns-process-data",
        "images",
        "--data",
        str(input_dir),
        "--output-dir",
        str(processed_dir),
        *split_extra_args(os.environ.get("NERFSTUDIO_PROCESS_ARGS")),
    ]
    run_logged(process_args, log_path, cwd=job_dir)

    train_args = [
        "ns-train",
        method,
        "--data",
        str(processed_dir),
        "--output-dir",
        str(outputs_dir),
        "--max-num-iterations",
        str(max_iterations),
        "--viewer.quit-on-train-completion",
        "True",
        *split_extra_args(os.environ.get("NERFSTUDIO_TRAIN_ARGS")),
    ]
    run_logged(train_args, log_path, cwd=job_dir)

    config_path = latest_config_path(outputs_dir)
    export_args = [
        "ns-export",
        "gaussian-splat",
        "--load-config",
        str(config_path),
        "--output-dir",
        str(export_dir),
        *split_extra_args(os.environ.get("NERFSTUDIO_EXPORT_ARGS")),
    ]
    run_logged(export_args, log_path, cwd=job_dir)

    convert_ply_if_needed(latest_exported_ply(export_dir), output_path, output_format, log_path, job_dir)


def run_gaussian_splat_pipeline(input_dir: Path, output_path: Path, output_format: str, job_dir: Path, log_path: Path) -> None:
    command_template = gaussian_splat_command()
    if command_template:
        run_command_template(
            command_template,
            log_path,
            input_dir=input_dir,
            output_path=output_path,
            output_format=output_format,
            job_dir=job_dir,
        )
    else:
        run_nerfstudio_pipeline(input_dir, output_path, output_format, job_dir, log_path)

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError(f"Gaussian Splatting command did not create {output_path}")


@app.post("/api/gaussian-splat/photos-to-3d")
def photos_to_3d() -> Response:
    output_format = (request.form.get("output") or "ksplat").lower().lstrip(".")
    if output_format not in MIME_TYPES:
        return jsonify({"error": f"unsupported output format: {output_format}"}), 400

    work_dir = Path(os.environ.get("GAUSSIAN_SPLAT_WORKDIR", DEFAULT_WORK_DIR)).resolve()
    work_dir.mkdir(parents=True, exist_ok=True)
    job_base = work_dir / f"job-{time.strftime('%Y%m%d-%H%M%S')}-{int(time.time() * 1000) % 1000:03d}"
    job_dir = job_base
    suffix = 1
    while job_dir.exists():
        suffix += 1
        job_dir = Path(f"{job_base}-{suffix}")
    job_dir.mkdir()
    input_dir = job_dir / "images"
    input_dir.mkdir()
    output_path = job_dir / f"gaussian-splat-output.{output_format}"
    log_path = job_dir / "pipeline.log"

    try:
        saved_images = save_uploaded_images(input_dir)
        append_log(log_path, f"Saved {len(saved_images)} image(s) to {input_dir}")
        run_gaussian_splat_pipeline(input_dir, output_path, output_format, job_dir, log_path)
    except ValueError as exc:
        return jsonify({"error": str(exc), "job_dir": str(job_dir), "log": str(log_path)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc), "job_dir": str(job_dir), "log": str(log_path)}), 500

    return Response(
        output_path.read_bytes(),
        mimetype=MIME_TYPES[output_format],
        headers={"Content-Disposition": f"inline; filename=gaussian-splat-output.{output_format}"},
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=7862)
