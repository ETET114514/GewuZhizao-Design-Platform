# GewuZhizao-Design-Platform

## Windows local demo

Double-click `start-windows.bat`, then open the page in the browser window it starts.

## Site photo display model

Use `现场图片` to upload one or more JPG / PNG / WEBP photos from the job site, then click `生成展示模型`.
The current version automatically matches photos to model surfaces, reads rough content signals from each photo, then creates an approximate presentation model in the browser: room shell, reference photo walls, ceiling/floor/wall colors, window and door hints, and furniture blocks optimized from the detected photo content.

## TRELLIS.2 integration

Set the TRELLIS endpoint in the `TRELLIS` field, then click `TRELLIS 生成`.
The frontend sends the matched main site photo as multipart form data (`image`) and expects GLB bytes, or JSON with `glb_url` / `glb_base64`.
See `trellis2-service.example.py` for the local bridge service.

The TRELLIS.2 source is expected at `../TRELLIS.2`.
Run `check-trellis2.ps1` on Windows to verify whether the machine can run TRELLIS.2.
On a Linux/WSL CUDA machine with an NVIDIA GPU >=24GB VRAM and Conda, run `install-trellis2-linux.sh`.
