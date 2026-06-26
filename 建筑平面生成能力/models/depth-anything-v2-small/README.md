# Depth Anything V2 Small

This directory stores the Depth Anything V2 Small checkpoint for site-photo depth assistance.

```text
depth_anything_v2_vits.pth
```

Source model:

```text
https://huggingface.co/depth-anything/Depth-Anything-V2-Small
```

Downloaded via mirror because direct Hugging Face access timed out on this machine:

```text
https://hf-mirror.com/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth
```

SHA-256:

```text
715fade13be8f229f8a70cc02066f656f2423a59effd0579197bbf57860e1378
```

GitHub stores this checkpoint as split parts under:

```text
depth_anything_v2_vits.pth.parts/
```

Restore the full local checkpoint with:

```powershell
.\scripts\restore_depth_anything_v2_small.ps1
```

Notes:

- This is a depth-estimation helper for site photos.
- It does not replace the existing CubiCasa floor-plan recognition models.
- Use the Small model for the commercial-safe route; larger Depth Anything V2 checkpoints have different/non-commercial restrictions.
