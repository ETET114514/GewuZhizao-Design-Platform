from pathlib import Path
import os
import sys

import torch


REPO_ROOT = Path(__file__).resolve().parents[1]
CUBICASA_ROOT = REPO_ROOT / "third_party" / "CubiCasa5k"
APP_DIR_SUFFIX = "\u5e73\u9762\u751f\u6210\u80fd\u529b"
APP_ROOT = next(
    path
    for path in REPO_ROOT.iterdir()
    if path.is_dir() and path.name.endswith(APP_DIR_SUFFIX)
)
CHECKPOINT = (
    CUBICASA_ROOT
    / "runs_cubi"
    / "finetune_20epoch_lr1e-4"
    / "2026-06-14-14-53-24"
    / "model_best_val_loss_var.pkl"
)
OUTPUT = APP_ROOT / "models" / "cubicasa5k-floorplan.onnx"


def main():
    if not CHECKPOINT.exists():
        raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT}")

    sys.path.insert(0, str(CUBICASA_ROOT))
    cwd = os.getcwd()
    os.chdir(CUBICASA_ROOT)
    try:
        from floortrans.models import get_model

        checkpoint = torch.load(CHECKPOINT, map_location="cpu", weights_only=False)
        model = get_model("hg_furukawa_original", 51)
        model.conv4_ = torch.nn.Conv2d(256, 44, bias=True, kernel_size=1)
        model.upsample = torch.nn.ConvTranspose2d(44, 44, kernel_size=4, stride=4)
        model.load_state_dict(checkpoint["model_state"])
        model.eval()

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        dummy = torch.zeros((1, 3, 256, 256), dtype=torch.float32)
        torch.onnx.export(
            model,
            dummy,
            OUTPUT,
            dynamo=False,
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["image"],
            output_names=["logits"],
            dynamic_axes={
                "image": {0: "batch"},
                "logits": {0: "batch"},
            },
        )
    finally:
        os.chdir(cwd)

    print(f"Exported ONNX model: {OUTPUT}")


if __name__ == "__main__":
    main()
