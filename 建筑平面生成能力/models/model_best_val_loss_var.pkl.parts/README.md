# model_best_val_loss_var.pkl parts

The local PyTorch checkpoint is split into small Git-friendly parts because the full file is about 209 MB.

To restore the model after cloning:

```powershell
.\scripts\restore_model_best_val_loss_var.ps1
```

The script rebuilds:

```text
建筑平面生成能力/models/model_best_val_loss_var.pkl
```

It validates every part and the final checkpoint with SHA-256 hashes from `manifest.json`.
