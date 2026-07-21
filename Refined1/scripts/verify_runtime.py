import json
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "models" / "cubicasa5k-20260711-30epoch.onnx"


def main():
    if not MODEL.is_file():
        raise FileNotFoundError(f"Missing default CubiCasa ONNX model: {MODEL}")

    required_files = [
        ROOT / "vendor" / "three" / "three.module.js",
        ROOT / "vendor" / "three" / "examples" / "jsm" / "loaders" / "GLTFLoader.js",
        ROOT / "vendor" / "three" / "examples" / "jsm" / "utils" / "BufferGeometryUtils.js",
        ROOT / "assets" / "interiors" / "catalog.json",
        ROOT / "assets" / "interiors" / "catalog.schema.json",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required_files if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing vendored runtime files: {', '.join(missing)}")

    providers = [provider for provider in ("CUDAExecutionProvider", "CPUExecutionProvider") if provider in ort.get_available_providers()]
    session = ort.InferenceSession(str(MODEL), providers=providers or ort.get_available_providers())
    result = {
        "status": "ok",
        "model": MODEL.name,
        "providers": session.get_providers(),
        "input": {"name": session.get_inputs()[0].name, "shape": session.get_inputs()[0].shape},
        "output": {"name": session.get_outputs()[0].name, "shape": session.get_outputs()[0].shape},
        "versions": {"numpy": np.__version__, "opencv": cv2.__version__, "onnxruntime": ort.__version__},
        "offline3d": True,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
