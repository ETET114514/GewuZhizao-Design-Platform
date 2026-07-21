# Vendored runtime source

This directory keeps the small source-code dependencies required for an offline or repository-independent Refined1 runtime.

- `three/`: Three.js 0.164.1 ES modules, `GLTFLoader`, and `BufferGeometryUtils`. See `three/LICENSE`.
- `cubicasa/LICENSE`: license notice for the retained CubiCasa5K-derived ONNX model.

The floor-plan path uses ONNX Runtime and does not require PyTorch.
