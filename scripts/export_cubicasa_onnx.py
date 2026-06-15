from pathlib import Path
import argparse
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
DEFAULT_OUTPUT = APP_ROOT / "models" / "cubicasa5k-floorplan.onnx"


def parse_args():
    parser = argparse.ArgumentParser(description="Export a CubiCasa checkpoint to ONNX.")
    parser.add_argument("--checkpoint", type=Path, default=CHECKPOINT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main():
    args = parse_args()
    checkpoint_path = args.checkpoint
    output_path = args.output
    if not checkpoint_path.is_absolute():
        checkpoint_path = REPO_ROOT / checkpoint_path
    if not output_path.is_absolute():
        output_path = REPO_ROOT / output_path
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")

    sys.path.insert(0, str(CUBICASA_ROOT))
    cwd = os.getcwd()
    os.chdir(CUBICASA_ROOT)
    try:
        from floortrans.models import get_model

        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        model = get_model("hg_furukawa_original", 51)
        model.conv4_ = torch.nn.Conv2d(256, 44, bias=True, kernel_size=1)
        model.upsample = torch.nn.ConvTranspose2d(44, 44, kernel_size=4, stride=4)
        model.load_state_dict(checkpoint["model_state"])
        model.eval()

        output_path.parent.mkdir(parents=True, exist_ok=True)
        dummy = torch.zeros((1, 3, 256, 256), dtype=torch.float32)
        torch.onnx.export(
            model,
            dummy,
            output_path,
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

    print(f"Exported ONNX model: {output_path}")


if __name__ == "__main__":
    main()
