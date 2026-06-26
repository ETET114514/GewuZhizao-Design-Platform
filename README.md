# GewuZhizao-Design-Platform

## Windows local demo

Double-click `start-windows.bat`, then open the page in the browser window it starts.

## Floor-plan AI inference service

The furniture-layout test page can call a local Python service at:

```text
POST http://127.0.0.1:8787/api/floorplan/recognize
```

Install dependencies and start it:

```text
pip install -r requirements-floorplan-ai.txt
start-floorplan-ai-service.bat
```

Optional model files:

```text
建筑平面生成能力/models/deepfloorplan.onnx
建筑平面生成能力/models/floorplan-unet.onnx
建筑平面生成能力/models/cubicasa5k.onnx
建筑平面生成能力/models/cubicasa5k.pth
建筑平面生成能力/models/model_best_val_loss_var.pkl
```

The app now requests the `cubicasa` provider by default. A complete CubiCasa5K floor-plan checkpoint
must include the trained segmentation head (`conv4_` / `upsample` weights). The bundled
`third_party/CubiCasa5k/floortrans/models/model_1427.pth` is only the pretrained backbone; when it is
the only model file present, the service reports that in `debug.model` and returns the same
`floorplan-ai-v1` JSON schema using the OpenCV fallback.

## Site photo display model

Use `现场图片` to upload one or more JPG / PNG / WEBP photos from the job site, then click `生成展示模型`.
The current version automatically matches photos to model surfaces, reads rough content signals from each photo, then creates an approximate presentation model in the browser: room shell, reference photo walls, ceiling/floor/wall colors, window and door hints, and furniture blocks optimized from the detected photo content.

## Site photo depth model

Depth Anything V2 Small is stored under:

```text
建筑平面生成能力/models/depth-anything-v2-small/depth_anything_v2_vits.pth
```

Run local depth inference with:

```powershell
.\.venv-depth\Scripts\python.exe tools\run_depth_anything_v2_small.py path\to\site-photo.jpg
```

The script writes normalized grayscale and color depth PNGs to:

```text
datasets/site_photos/derived/depth/
```

## TRELLIS.2 integration

Set the TRELLIS endpoint in the `TRELLIS` field, then click `TRELLIS 生成`.
The frontend sends the matched main site photo as multipart form data (`image`) and expects GLB bytes, or JSON with `glb_url` / `glb_base64`.
See `trellis2-service.example.py` for the local bridge service.

The TRELLIS.2 source is expected at `../TRELLIS.2`.
Run `check-trellis2.ps1` on Windows to verify whether the machine can run TRELLIS.2.
On a Linux/WSL CUDA machine with an NVIDIA GPU >=24GB VRAM and Conda, run `install-trellis2-linux.sh`.

## Gaussian Splatting photo-to-3D

Upload multiple site photos, set the `GS` endpoint, then click `高斯泼溅生成`.
The frontend sends all uploaded photos as repeated multipart `images` fields and requests `output=ply`.
It can load direct binary `.ksplat` / `.splat` / `.ply` / `.spz` responses, or JSON containing
`ksplat_url`, `splat_url`, `ply_url`, `spz_url`, `model_url`, or matching base64 fields.

`gaussian-splat-service.example.py` includes a real local pipeline dispatcher:

- If `GAUSSIAN_SPLAT_COMMAND` is set, it runs that command.
- Otherwise it runs the built-in Nerfstudio Splatfacto flow:
  `ns-process-data images` -> `ns-train splatfacto` -> `ns-export gaussian-splat`.

The built-in flow requires COLMAP, Nerfstudio CLI commands, CUDA PyTorch, and an NVIDIA GPU.
Check readiness at:

```text
http://127.0.0.1:7862/api/gaussian-splat/health
```

Start the bridge service:

```text
pip install -r requirements-gaussian-splat-service.txt
start-gaussian-splat-service.bat
```

Optional external pipeline override:

```text
set GAUSSIAN_SPLAT_COMMAND=python train_and_export.py --images "{input_dir}" --out "{output_path}"
start-gaussian-splat-service.bat
```
