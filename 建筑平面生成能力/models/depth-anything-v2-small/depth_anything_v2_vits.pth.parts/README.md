# depth_anything_v2_vits.pth parts

The Depth Anything V2 Small checkpoint is split into GitHub-friendly parts.

To restore the full model after cloning:

```powershell
.\scripts\restore_depth_anything_v2_small.ps1
```

The script rebuilds:

```text
建筑平面生成能力/models/depth-anything-v2-small/depth_anything_v2_vits.pth
```

It validates every part and the final checkpoint with SHA-256 hashes from `manifest.json`.
