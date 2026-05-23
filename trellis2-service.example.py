"""
Example TRELLIS.2 bridge service for GewuZhizao Design Platform.

This file documents the HTTP contract expected by the browser:
POST /api/trellis/image-to-3d
  multipart/form-data:
    image: PNG/JPG file
    output: glb

Response:
  model/gltf-binary bytes, or JSON with {"glb_url": "..."} / {"glb_base64": "..."}.

Adapt the generate_glb function to the TRELLIS.2 environment you run locally.
TRELLIS.2 itself requires a CUDA-capable Python environment and model weights.
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

from flask import Flask, Response, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

DEFAULT_TRELLIS2_REPO = Path(__file__).resolve().parents[1] / "TRELLIS.2"
TRELLIS2_REPO = Path(os.environ.get("TRELLIS2_REPO", DEFAULT_TRELLIS2_REPO)).resolve()
if TRELLIS2_REPO.exists() and str(TRELLIS2_REPO) not in sys.path:
    sys.path.insert(0, str(TRELLIS2_REPO))


def generate_glb(image_path: Path, output_path: Path) -> None:
    """Run TRELLIS.2 image-to-3D and export GLB.

    This requires running inside the official TRELLIS.2 CUDA environment.
    """

    os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

    import cv2
    import o_voxel
    import torch
    from PIL import Image
    from trellis2.pipelines import Trellis2ImageTo3DPipeline
    from trellis2.renderers import EnvMap

    if not torch.cuda.is_available():
        raise RuntimeError("TRELLIS.2 requires a CUDA GPU; torch.cuda.is_available() is false.")

    envmap_path = TRELLIS2_REPO / "assets" / "hdri" / "forest.exr"
    envmap = EnvMap(
        torch.tensor(
            cv2.cvtColor(cv2.imread(str(envmap_path), cv2.IMREAD_UNCHANGED), cv2.COLOR_BGR2RGB),
            dtype=torch.float32,
            device="cuda",
        )
    )
    _ = envmap  # Initializes the renderer-side environment expected by TRELLIS.2.

    pipeline = Trellis2ImageTo3DPipeline.from_pretrained("microsoft/TRELLIS.2-4B")
    pipeline.cuda()

    image = Image.open(image_path).convert("RGB")
    mesh = pipeline.run(image)[0]
    mesh.simplify(16777216)

    glb = o_voxel.postprocess.to_glb(
        vertices=mesh.vertices,
        faces=mesh.faces,
        attr_volume=mesh.attrs,
        coords=mesh.coords,
        attr_layout=mesh.layout,
        voxel_size=mesh.voxel_size,
        aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
        decimation_target=1000000,
        texture_size=4096,
        remesh=True,
        remesh_band=1,
        remesh_project=0,
        verbose=True,
    )
    glb.export(str(output_path), extension_webp=True)


@app.post("/api/trellis/image-to-3d")
def image_to_3d() -> Response:
    image = request.files.get("image")
    if image is None:
        return jsonify({"error": "missing image field"}), 400

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        image_path = tmp_dir / image.filename
        output_path = tmp_dir / "trellis-output.glb"
        image.save(image_path)

        try:
            generate_glb(image_path, output_path)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

        return Response(
            output_path.read_bytes(),
            mimetype="model/gltf-binary",
            headers={"Content-Disposition": "inline; filename=trellis-output.glb"},
        )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=7861)
