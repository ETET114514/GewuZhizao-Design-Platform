#!/usr/bin/env bash
set -euo pipefail

TRELLIS2_DIR="${TRELLIS2_DIR:-../TRELLIS.2}"

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "TRELLIS.2 install aborted: nvidia-smi was not found."
  echo "Use a Linux/WSL machine with an NVIDIA CUDA GPU and >=24GB VRAM."
  exit 1
fi

if ! command -v conda >/dev/null 2>&1; then
  echo "TRELLIS.2 install aborted: conda was not found."
  echo "Install Miniconda/Miniforge first, then rerun this script."
  exit 1
fi

if [ ! -d "$TRELLIS2_DIR/.git" ]; then
  git clone --recursive https://github.com/microsoft/TRELLIS.2.git "$TRELLIS2_DIR"
else
  git -C "$TRELLIS2_DIR" pull
  git -C "$TRELLIS2_DIR" submodule update --init --recursive
fi

cd "$TRELLIS2_DIR"
. ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm

echo "TRELLIS.2 install complete. Activate the environment with: conda activate trellis2"
