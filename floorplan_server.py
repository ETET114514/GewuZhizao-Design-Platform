import base64
import json
import mimetypes
import os
import re
import sys
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parent
CUBICASA_ROOT = ROOT / "third_party" / "CubiCasa5k"
CUBICASA_BACKBONE_PATH = CUBICASA_ROOT / "floortrans" / "models" / "model_1427.pth"
MODEL_CANDIDATES = [
    ROOT / "models" / "wall-segmentation.onnx",
    ROOT / "floorplan_models" / "wall-segmentation.onnx",
]
RECOGNITION_MODEL_CANDIDATES = {
    "deepfloorplan": [
        ROOT / "models" / "deepfloorplan.onnx",
        ROOT / "floorplan_models" / "deepfloorplan.onnx",
        ROOT / "models" / "deepfloorplan.pt",
    ],
    "unet": [
        ROOT / "models" / "floorplan-unet.onnx",
        ROOT / "models" / "unet-floorplan.onnx",
        ROOT / "floorplan_models" / "floorplan-unet.onnx",
        ROOT / "models" / "floorplan-unet.pt",
    ],
    "cubicasa": [
        ROOT / "models" / "cubicasa5k.onnx",
        ROOT / "models" / "cubicasa5k-floorplan.onnx",
        ROOT / "models" / "cubicasa5k.pth",
        ROOT / "models" / "cubicasa5k.pt",
        ROOT / "models" / "cubicasa5k.pkl",
        ROOT / "models" / "model_best_val_loss_var.pkl",
        ROOT / "floorplan_models" / "cubicasa5k.onnx",
        ROOT / "floorplan_models" / "cubicasa5k.pth",
        ROOT / "floorplan_models" / "cubicasa5k.pt",
        ROOT / "floorplan_models" / "model_best_val_loss_var.pkl",
        CUBICASA_ROOT / "model_best_val_loss_var.pkl",
        CUBICASA_ROOT / "models" / "model_best_val_loss_var.pkl",
    ],
}
CUBICASA_MODEL_CACHE = {}
MAX_IMAGE_SIZE = 1400
RECOGNITION_MAX_IMAGE_SIZE = 1024
TRAINING_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
ANNOTATION_RUN_SUFFIX = "\u8dd11"
ANNOTATION_LABEL_SUFFIX = "\u6807\u6ce8"
ROOM_CLASS_ALIASES = {
    "living": {"living", "living_room", "livingroom", "dining", "dining_room", "living_dining"},
    "bedroom": {"bedroom", "bed_room", "master", "master_bedroom", "child_room", "children_room"},
    "kitchen": {"kitchen", "cookroom"},
    "bath": {"bath", "bathroom", "toilet_room", "wc", "washroom", "restroom"},
    "balcony": {"balcony", "terrace", "loggia"},
    "study": {"study", "office", "workroom"},
    "storage": {"storage", "closet", "wardrobe_room", "utility"},
    "corridor": {"corridor", "hall", "hallway", "entry", "entrance", "foyer", "circulation"},
}
FIXTURE_CLASS_ALIASES = {
    "toilet": {"toilet", "wc_fixture", "water_closet"},
    "sink": {"sink", "basin", "washbasin", "vanity"},
    "shower": {"shower", "shower_room"},
    "bathtub": {"bathtub", "tub", "bath_fixture"},
    "stove": {"stove", "cooktop", "hob"},
    "counter": {"counter", "cabinet", "kitchen_cabinet"},
}
GENERIC_CLASS_ALIASES = {
    "wall": {"wall", "walls", "partition"},
    "door": {"door", "doors", "opening_door"},
    "window": {"window", "windows", "opening_window"},
    "room": {"room", "rooms", "space", "area"},
    "fixture": {"fixture", "fixtures", "object", "symbol"},
}


class FloorPlanHandler(BaseHTTPRequestHandler):
    server_version = "GewuZhizaoFloorPlanHTTP/0.1"

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/annotation/cases":
            self.handle_annotation_cases()
            return
        if parsed.path == "/api/annotation/case":
            self.handle_annotation_case(parsed)
            return
        if parsed.path == "/api/annotation/source":
            self.handle_annotation_source(parsed)
            return
        path = unquote(parsed.path).lstrip("/") or "index.html"
        if path == "favicon.ico":
            self.send_response(204)
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.end_headers()
            return
        file_path = (ROOT / path).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.exists() or file_path.is_dir():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or file_path.suffix.lower() in {".js", ".css", ".json"}:
            content_type = f"{content_type}; charset=utf-8"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/annotation/save":
            self.handle_annotation_save()
            return
        if path not in {"/api/segment", "/api/floorplan/recognize"}:
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if path == "/api/floorplan/recognize":
                self.write_json(200, recognize_payload(payload))
            else:
                self.write_json(200, segment_payload(payload))
        except Exception as exc:
            self.write_json(500, {"error": str(exc), "mode": "error"})

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))

    def write_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_annotation_cases(self):
        try:
            self.write_json(200, list_annotation_cases())
        except Exception as exc:
            self.write_json(500, {"error": str(exc)})

    def handle_annotation_case(self, parsed):
        try:
            case = annotation_case_by_id(query_value(parsed, "id"))
            prediction = read_json_file(case["predictionPath"]) if case.get("predictionPath") else None
            annotation = read_json_file(case["labelPath"]) if case.get("labelPath") else None
            self.write_json(200, {"case": public_annotation_case(case), "prediction": prediction, "annotation": annotation})
        except Exception as exc:
            self.write_json(500, {"error": str(exc)})

    def handle_annotation_source(self, parsed):
        try:
            path = annotation_path_from_id(query_value(parsed, "id"))
            content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            data = path.read_bytes()
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:
            self.write_json(500, {"error": str(exc)})

    def handle_annotation_save(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            case = annotation_case_by_id(str(payload.get("id") or ""))
            annotation = payload.get("annotation")
            if not isinstance(annotation, dict):
                raise ValueError("annotation must be an object")
            label_path = annotation_label_path(case["sourcePath"])
            annotation["image"] = case["fileName"]
            annotation["sourcePrediction"] = case["predictionName"]
            annotation["savedAt"] = payload.get("savedAt")
            label_path.write_text(json.dumps(annotation, ensure_ascii=False, indent=2), encoding="utf-8")
            self.write_json(200, {"ok": True, "path": str(label_path), "case": public_annotation_case(annotation_case_from_path(case["sourcePath"]))})
        except Exception as exc:
            self.write_json(500, {"error": str(exc)})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()


def require_cv():
    try:
        import cv2
        import numpy as np
    except Exception as exc:
        raise RuntimeError("OpenCV unavailable. Install opencv-python and numpy.") from exc
    return cv2, np


def query_value(parsed, name):
    values = parse_qs(parsed.query).get(name)
    return values[0] if values else ""


def training_root():
    configured = os.environ.get("TRAINING_FLOORPLAN_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    desktop = windows_known_folder_desktop()
    return (desktop / "\u88c5\u4fee\u5e73\u9762" / "\u8bad\u7ec3\u5e73\u9762\u56fe").resolve()


def windows_known_folder_desktop():
    if os.name == "nt":
        try:
            import ctypes
            from ctypes import wintypes
            import uuid

            class GUID(ctypes.Structure):
                _fields_ = [
                    ("Data1", wintypes.DWORD),
                    ("Data2", wintypes.WORD),
                    ("Data3", wintypes.WORD),
                    ("Data4", ctypes.c_ubyte * 8),
                ]

            folder_id = GUID.from_buffer_copy(uuid.UUID("B4BFCC3A-DB2C-424C-B029-7FE99A87C641").bytes_le)
            path_ptr = ctypes.c_wchar_p()
            ctypes.windll.shell32.SHGetKnownFolderPath(ctypes.byref(folder_id), 0, None, ctypes.byref(path_ptr))
            try:
                return Path(path_ptr.value)
            finally:
                ctypes.windll.ole32.CoTaskMemFree(path_ptr)
        except Exception:
            pass
    return Path.home() / "Desktop"


def annotation_id_for_path(path):
    rel = path.resolve().relative_to(training_root()).as_posix()
    return base64.urlsafe_b64encode(rel.encode("utf-8")).decode("ascii").rstrip("=")


def annotation_path_from_id(case_id):
    if not case_id:
        raise ValueError("Missing annotation case id")
    padded = case_id + "=" * (-len(case_id) % 4)
    rel = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
    root = training_root()
    path = (root / rel).resolve()
    if not path.is_file() or root not in [path, *path.parents]:
        raise ValueError("Annotation case is outside the training folder")
    return path


def annotation_label_path(source_path):
    return source_path.with_name(f"{source_path.stem}{ANNOTATION_LABEL_SUFFIX}.json")


def annotation_prediction_path(source_path):
    return source_path.with_name(f"{source_path.stem}{ANNOTATION_RUN_SUFFIX}.json")


def annotation_preview_path(source_path):
    return source_path.with_name(f"{source_path.stem}{ANNOTATION_RUN_SUFFIX}.png")


def is_annotation_source_file(path):
    suffix = path.suffix.lower()
    if suffix not in TRAINING_IMAGE_EXTENSIONS:
        return False
    if ANNOTATION_RUN_SUFFIX in path.stem or ANNOTATION_LABEL_SUFFIX in path.stem:
        return False
    return True


def list_annotation_cases():
    root = training_root()
    if not root.exists():
        return {"root": str(root), "cases": [], "error": "Training folder does not exist"}
    cases = []
    for folder in sorted([item for item in root.iterdir() if item.is_dir()], key=lambda item: item.name):
        if folder.name.startswith(("00_", "05_", "06_")):
            continue
        for path in sorted(folder.iterdir(), key=lambda item: item.name.lower()):
            if is_annotation_source_file(path):
                cases.append(public_annotation_case(annotation_case_from_path(path)))
    return {"root": str(root), "cases": cases}


def annotation_case_by_id(case_id):
    path = annotation_path_from_id(case_id)
    if not is_annotation_source_file(path):
        raise ValueError("Selected file is not an annotatable source image")
    return annotation_case_from_path(path)


def annotation_case_from_path(path):
    root = training_root()
    source_path = path.resolve()
    prediction_path = annotation_prediction_path(source_path)
    label_path = annotation_label_path(source_path)
    preview_path = annotation_preview_path(source_path)
    return {
        "id": annotation_id_for_path(source_path),
        "fileName": source_path.name,
        "folder": source_path.parent.name,
        "relativePath": source_path.relative_to(root).as_posix(),
        "sourcePath": source_path,
        "predictionName": prediction_path.name if prediction_path.exists() else None,
        "predictionPath": prediction_path if prediction_path.exists() else None,
        "labelName": label_path.name,
        "labelPath": label_path if label_path.exists() else None,
        "labelExists": label_path.exists(),
        "previewName": preview_path.name if preview_path.exists() else None,
        "previewPath": preview_path if preview_path.exists() else None,
        "previewExists": preview_path.exists(),
    }


def public_annotation_case(case):
    return {
        "id": case["id"],
        "fileName": case["fileName"],
        "folder": case["folder"],
        "relativePath": case["relativePath"],
        "imageUrl": f"/api/annotation/source?id={case['id']}",
        "predictionName": case.get("predictionName"),
        "labelName": case.get("labelName"),
        "labelExists": bool(case.get("labelExists")),
        "previewName": case.get("previewName"),
        "previewExists": bool(case.get("previewExists")),
    }


def read_json_file(path):
    if not path:
        return None
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def segment_payload(payload):
    cv2, np = require_cv()
    image = decode_image(payload["image"], cv2, np)
    settings = payload.get("settings", {})
    image, scale = resize_to_limit(image, MAX_IMAGE_SIZE, cv2)
    settings = scale_vector_settings(settings, scale)
    mask, mode = infer_wall_mask(image, cv2, np)
    mask = postprocess_mask(mask, settings, cv2, np)
    return {
        "mode": mode,
        "image": {"width": int(image.shape[1]), "height": int(image.shape[0])},
        "mask": encode_mask_png(mask, cv2),
        "walls": vectorize_mask(mask, settings, cv2),
    }


def recognize_payload(payload):
    cv2, np = require_cv()
    provider = str(payload.get("provider") or "unet").lower()
    original = decode_image(payload["image"], cv2, np)
    image, scale = resize_to_limit(original, RECOGNITION_MAX_IMAGE_SIZE, cv2)
    settings = scale_vector_settings(default_recognition_settings(payload), scale)
    settings["imageWidth"] = int(image.shape[1])
    settings["imageHeight"] = int(image.shape[0])
    masks, mode, model_info = infer_recognition_masks(image, provider, cv2, np)
    wall_mask = postprocess_mask(masks["wall"], settings, cv2, np)
    wall_lines, wall_quality = vectorize_wall_network(wall_mask, settings, cv2)
    walls = recognition_walls(wall_lines, scale, mode)
    masks["wall"] = wall_mask
    rooms = recognition_rooms(masks, wall_mask, cv2, np, scale, mode, wall_lines)
    doors = recognition_openings(masks.get("door"), "door", cv2, scale, mode)
    windows = recognition_openings(masks.get("window"), "window", cv2, scale, mode)
    estimated_openings = estimate_openings_from_wall_network(wall_lines, scale, mode) if not doors or not windows else {"doors": [], "windows": []}
    if not doors:
        doors = estimated_openings["doors"]
    if not windows:
        windows = estimated_openings["windows"]
    fixtures = recognition_fixtures(masks, cv2, scale, mode)
    return {
        "schemaVersion": "floorplan-ai-v1",
        "provider": provider,
        "model": model_info.get("name", mode),
        "mode": mode,
        "status": "ok" if model_info.get("active") else "fallback",
        "coordinateSystem": "image-pixels",
        "image": {
            "width": int(original.shape[1]),
            "height": int(original.shape[0]),
            "analysisWidth": int(image.shape[1]),
            "analysisHeight": int(image.shape[0]),
            "analysisScale": round(scale, 4),
        },
        "confidence": recognition_confidence(mode, rooms, walls, doors, windows, wall_quality),
        "rooms": rooms,
        "walls": walls,
        "doors": doors,
        "windows": windows,
        "fixtures": fixtures,
        "masks": encode_semantic_masks(masks, cv2),
        "debug": {
            "model": model_info,
            "quality": wall_quality,
            "wallMask": encode_mask_png(wall_mask, cv2),
        },
    }


def default_recognition_settings(payload):
    settings = {
        "minLength": 64,
        "mergeGap": 10,
        "maxThickness": 42,
        "minWallThickness": 3,
        "minNoiseArea": 80,
    }
    settings.update(payload.get("settings", {}) or {})
    return settings


def infer_recognition_masks(image, provider, cv2, np):
    path = recognition_model_path(provider)
    if path:
        try:
            if path.suffix.lower() == ".onnx":
                return infer_onnx_semantic_masks(image, path, cv2, np), "onnx-semantic-segmentation", {"path": str(path), "name": path.stem, "active": True}
            if provider == "cubicasa" and path.suffix.lower() in {".pt", ".pth", ".pkl"}:
                return infer_cubicasa_semantic_masks(image, path, cv2, np), "torch-cubicasa-semantic-segmentation", {"path": str(path), "name": path.stem, "active": True}
            if path.suffix.lower() in {".pt", ".pth"}:
                return infer_torch_semantic_masks(image, path, cv2, np), "torch-semantic-segmentation", {"path": str(path), "name": path.stem, "active": True}
        except Exception as exc:
            print(f"{provider} model failed, falling back to OpenCV: {exc}")
            masks = fallback_recognition_masks(image, cv2, np)
            return masks, "opencv-fallback", {"path": str(path), "name": path.stem, "active": False, "error": str(exc)}
    if provider == "cubicasa" and CUBICASA_BACKBONE_PATH.exists():
        masks = fallback_recognition_masks(image, cv2, np)
        return masks, "opencv-fallback", {
            "path": str(CUBICASA_BACKBONE_PATH),
            "name": "cubicasa5k-backbone-only",
            "active": False,
            "status": "missing-floorplan-checkpoint",
            "message": "CubiCasa5K backbone is present, but a trained floor-plan checkpoint is required at models/cubicasa5k.pth or models/model_best_val_loss_var.pkl.",
        }
    masks = fallback_recognition_masks(image, cv2, np)
    return masks, "opencv-fallback", {"path": None, "name": "opencv-fallback", "active": False}


def recognition_model_path(provider):
    candidates = RECOGNITION_MODEL_CANDIDATES.get(provider, []) + RECOGNITION_MODEL_CANDIDATES.get("unet", [])
    return next((path for path in candidates if path.exists()), None)


def infer_onnx_semantic_masks(image, path, cv2, np):
    import onnxruntime as ort

    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    target_h = int(input_shape[2]) if len(input_shape) >= 4 and isinstance(input_shape[2], int) else 512
    target_w = int(input_shape[3]) if len(input_shape) >= 4 and isinstance(input_shape[3], int) else 512
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)
    tensor = resized.astype(np.float32) / 255.0
    tensor = np.transpose(tensor, (2, 0, 1))[None, ...]
    outputs = session.run(None, {input_name: tensor})
    logits = select_segmentation_output(outputs)
    masks = masks_from_logits(logits, image.shape[:2], path, cv2, np)
    return masks


def infer_torch_semantic_masks(image, path, cv2, np):
    import torch

    model = torch.jit.load(str(path), map_location="cpu")
    model.eval()
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (512, 512), interpolation=cv2.INTER_AREA)
    tensor = torch.from_numpy(np.transpose(resized.astype(np.float32) / 255.0, (2, 0, 1))[None, ...])
    with torch.no_grad():
      output = model(tensor)
    if isinstance(output, (list, tuple)):
        output = output[0]
    logits = output.detach().cpu().numpy()
    return masks_from_logits(logits, image.shape[:2], path, cv2, np)


def infer_cubicasa_semantic_masks(image, path, cv2, np):
    import torch

    model = load_cubicasa_model(path, torch)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    padded, crop = cubicasa_resize_padded(rgb, 512, cv2, np)
    tensor = padded.astype(np.float32)
    tensor = 2.0 * (tensor / 255.0) - 1.0
    tensor = torch.from_numpy(np.transpose(tensor, (2, 0, 1))[None, ...])
    with torch.no_grad():
        output = model(tensor)
    if isinstance(output, (list, tuple)):
        output = output[0]
    logits = output[0].detach().cpu().numpy()
    return masks_from_cubicasa_logits(logits, image.shape[:2], crop, cv2, np)


def load_cubicasa_model(path, torch):
    cache_key = str(path.resolve())
    if cache_key in CUBICASA_MODEL_CACHE:
        return CUBICASA_MODEL_CACHE[cache_key]
    if str(CUBICASA_ROOT) not in sys.path:
        sys.path.insert(0, str(CUBICASA_ROOT))
    from floortrans.models.hg_furukawa_original import hg_furukawa_original

    checkpoint = torch.load(path, map_location="cpu")
    state = checkpoint.get("model_state") if isinstance(checkpoint, dict) and "model_state" in checkpoint else checkpoint
    if not isinstance(state, dict):
        raise RuntimeError("CubiCasa checkpoint does not contain a PyTorch state dict")
    state = {strip_torch_module_prefix(key): value for key, value in state.items()}
    if not has_cubicasa_floorplan_head(state):
        raise RuntimeError("CubiCasa backbone weights found, but the trained floor-plan segmentation head is missing")
    model = hg_furukawa_original(n_classes=44)
    missing, unexpected = model.load_state_dict(state, strict=False)
    missing_required = [key for key in missing if key.startswith(("conv4_", "upsample."))]
    if missing_required:
        raise RuntimeError(f"CubiCasa checkpoint is missing required head weights: {', '.join(missing_required[:4])}")
    if unexpected:
        print(f"CubiCasa checkpoint has unused keys: {unexpected[:6]}")
    model.eval()
    CUBICASA_MODEL_CACHE[cache_key] = model
    return model


def strip_torch_module_prefix(key):
    return key[7:] if str(key).startswith("module.") else key


def has_cubicasa_floorplan_head(state):
    return any(str(key).startswith("conv4_") for key in state) and any(str(key).startswith("upsample.") for key in state)


def cubicasa_resize_padded(rgb, size, cv2, np):
    height, width = rgb.shape[:2]
    ratio = size / max(1, max(width, height))
    resized_width = max(1, int(round(width * ratio)))
    resized_height = max(1, int(round(height * ratio)))
    resized = cv2.resize(rgb, (resized_width, resized_height), interpolation=cv2.INTER_AREA)
    canvas = np.full((size, size, 3), 255, dtype=np.uint8)
    x_pad = (size - resized_width) // 2
    y_pad = (size - resized_height) // 2
    canvas[y_pad : y_pad + resized_height, x_pad : x_pad + resized_width] = resized
    return canvas, {"x": x_pad, "y": y_pad, "width": resized_width, "height": resized_height}


def masks_from_cubicasa_logits(logits, target_shape, crop, cv2, np):
    if logits.ndim != 3 or logits.shape[0] < 44:
        raise RuntimeError(f"Unsupported CubiCasa output shape: {logits.shape}")
    room_logits = logits[21:33]
    icon_logits = logits[33:44]
    rooms = np.argmax(room_logits, axis=0).astype(np.uint8)
    icons = np.argmax(icon_logits, axis=0).astype(np.uint8)
    x = int(crop["x"])
    y = int(crop["y"])
    w = int(crop["width"])
    h = int(crop["height"])
    rooms = rooms[y : y + h, x : x + w]
    icons = icons[y : y + h, x : x + w]
    height, width = target_shape
    rooms = cv2.resize(rooms, (width, height), interpolation=cv2.INTER_NEAREST)
    icons = cv2.resize(icons, (width, height), interpolation=cv2.INTER_NEAREST)

    masks = {
        "wall": class_mask(rooms, 2, np),
        "kitchen": class_mask(rooms, 3, np),
        "living": class_mask(rooms, 4, np),
        "bedroom": class_mask(rooms, 5, np),
        "bath": class_mask(rooms, 6, np),
        "corridor": class_mask(rooms, 7, np),
        "storage": class_mask(rooms, 9, np),
        "room": np.isin(rooms, [3, 4, 5, 6, 7, 8, 9, 10, 11]).astype(np.uint8) * 255,
        "window": class_mask(icons, 1, np),
        "door": class_mask(icons, 2, np),
        "fixture": np.isin(icons, [3, 4, 5, 6, 7, 8, 9, 10]).astype(np.uint8) * 255,
        "toilet": class_mask(icons, 5, np),
        "sink": class_mask(icons, 6, np),
        "bathtub": class_mask(icons, 9, np),
    }
    return ensure_semantic_masks(masks, target_shape, cv2, np)


def class_mask(labels, value, np):
    return (labels == value).astype(np.uint8) * 255


def select_segmentation_output(outputs):
    arrays = [item for item in outputs if hasattr(item, "ndim")]
    arrays.sort(key=lambda item: item.size, reverse=True)
    if not arrays:
        raise RuntimeError("Model returned no tensor outputs")
    return arrays[0]


def masks_from_logits(logits, target_shape, path, cv2, np):
    if logits.ndim == 4:
        logits = logits[0]
    if logits.ndim == 2:
        logits = logits[None, ...]
    if logits.ndim != 3:
        raise RuntimeError(f"Unsupported segmentation output shape: {logits.shape}")
    class_names = model_class_names(path, logits.shape[0])
    if logits.shape[0] == 1:
        wall = logits[0] > (0.5 if logits.max() <= 1.0 else 0)
        masks = {"wall": wall.astype(np.uint8) * 255}
    else:
        labels = np.argmax(logits, axis=0)
        masks = {}
        for class_index, name in enumerate(class_names[: logits.shape[0]]):
            if name == "background":
                continue
            masks[name] = (labels == class_index).astype(np.uint8) * 255
    return ensure_semantic_masks(masks, target_shape, cv2, np)


def model_class_names(path, channel_count):
    metadata_path = path.with_suffix(path.suffix + ".json")
    if metadata_path.exists():
        try:
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            classes = data.get("classes")
            if isinstance(classes, list) and classes:
                return classes
        except Exception as exc:
            print(f"Unable to read model metadata {metadata_path}: {exc}")
    defaults = ["background", "wall", "door", "window", "room", "fixture"]
    if channel_count <= len(defaults):
        return defaults[:channel_count]
    return defaults + [f"class_{index}" for index in range(len(defaults), channel_count)]


def ensure_semantic_masks(masks, target_shape, cv2, np):
    height, width = target_shape
    normalized_masks = {}
    for name, mask in masks.items():
        if mask is None:
            continue
        key = normalize_class_name(name)
        if mask.shape[:2] != (height, width):
            mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_NEAREST)
        normalized_masks[key] = (mask > 0).astype(np.uint8) * 255

    result = {}
    for name in ("wall", "door", "window", "room", "fixture"):
        result[name] = merge_named_masks(normalized_masks, GENERIC_CLASS_ALIASES[name], target_shape, np)
    if not result["wall"].any():
        result["wall"] = normalized_masks.get("walls", result["wall"])
    room_types = {}
    for room_type, aliases in ROOM_CLASS_ALIASES.items():
        mask = merge_named_masks(normalized_masks, aliases, target_shape, np)
        if mask.any():
            room_types[room_type] = mask
            result["room"] = cv2.bitwise_or(result["room"], mask)
    fixture_types = {}
    for fixture_type, aliases in FIXTURE_CLASS_ALIASES.items():
        mask = merge_named_masks(normalized_masks, aliases, target_shape, np)
        if mask.any():
            fixture_types[fixture_type] = mask
            result["fixture"] = cv2.bitwise_or(result["fixture"], mask)
    result["roomTypes"] = room_types
    result["fixtureTypes"] = fixture_types
    result["rawClasses"] = normalized_masks
    return result


def normalize_class_name(name):
    return re.sub(r"[^a-z0-9]+", "_", str(name or "").strip().lower()).strip("_")


def merge_named_masks(masks, names, target_shape, np):
    height, width = target_shape
    merged = np.zeros((height, width), dtype=np.uint8)
    for name in names:
        mask = masks.get(normalize_class_name(name))
        if mask is not None:
            merged = np.maximum(merged, mask)
    return merged


def fallback_recognition_masks(image, cv2, np):
    wall = infer_cv_mask(image, cv2)
    empty = np.zeros(wall.shape, dtype=np.uint8)
    return {
        "wall": wall,
        "door": empty.copy(),
        "window": empty.copy(),
        "room": free_space_mask_from_walls(wall, cv2, np),
        "fixture": empty.copy(),
        "roomTypes": {},
        "fixtureTypes": {},
        "rawClasses": {},
    }


def free_space_mask_from_walls(wall_mask, cv2, np):
    barrier = cv2.dilate(wall_mask, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)), iterations=1)
    return cv2.bitwise_not(barrier)


def recognition_walls(lines, scale, mode):
    output = []
    for index, line in enumerate(lines[:160], start=1):
        output.append(
            {
                "id": f"{mode}-wall-{index}",
                "line": {
                    "x1": round(line["x1"] / scale, 2),
                    "y1": round(line["y1"] / scale, 2),
                    "x2": round(line["x2"] / scale, 2),
                    "y2": round(line["y2"] / scale, 2),
                },
                "thickness": round(line["thickness"] / scale, 2),
                "confidence": wall_line_confidence(line, mode),
                "source": mode,
                "topology": line.get("topology", "vectorized"),
            }
        )
    return output


def wall_line_confidence(line, mode):
    model_base = 0.76 if "onnx" in mode or "torch" in mode else 0.54
    length_bonus = min(0.18, (line.get("length", 0) or 0) / 900)
    topology_bonus = 0.08 if line.get("topology") in {"snapped", "merged"} else 0
    return round(min(0.92, model_base + length_bonus + topology_bonus), 2)


def recognition_rooms(masks, wall_mask, cv2, np, scale, mode, wall_lines=None):
    typed_rooms = []
    occupied = np.zeros(wall_mask.shape, dtype=np.uint8)
    for room_type, mask in (masks.get("roomTypes") or {}).items():
        typed_rooms.extend(recognition_room_components(mask, room_type, room_label(room_type), cv2, scale, mode))
        occupied = cv2.bitwise_or(occupied, mask)

    generic_mask = masks.get("room")
    if generic_mask is None or not generic_mask.any():
        generic_mask = free_space_mask_from_walls(wall_mask, cv2, np)
    if occupied.any():
        occupied = cv2.dilate(occupied, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)), iterations=1)
        generic_mask = cv2.bitwise_and(generic_mask, cv2.bitwise_not(occupied))

    wall_rooms = recognition_rooms_from_wall_network(wall_lines or [], wall_mask.shape, scale, mode)
    generic_rooms = recognition_room_components(generic_mask, "unknown", "空间", cv2, scale, mode)
    rooms = dedupe_rooms(typed_rooms + wall_rooms + generic_rooms)
    rooms.sort(key=lambda item: item["bounds"]["width"] * item["bounds"]["height"], reverse=True)
    return rooms[:24]


def recognition_room_components(mask, room_type, label_prefix, cv2, scale, mode):
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    image_area = mask.shape[0] * mask.shape[1]
    rooms = []
    for label in range(1, count):
        area = int(stats[label, cv2.CC_STAT_AREA])
        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        w = int(stats[label, cv2.CC_STAT_WIDTH])
        h = int(stats[label, cv2.CC_STAT_HEIGHT])
        if area < max(400, image_area * 0.006):
            continue
        if area > image_area * 0.58:
            continue
        if w < 24 or h < 24:
            continue
        bounds = scale_bounds({"x": x, "y": y, "width": w, "height": h}, scale)
        rooms.append(
            {
                "id": f"{mode}-room-{len(rooms) + 1}",
                "type": room_type,
                "label": f"{label_prefix}{len(rooms) + 1}",
                "bounds": bounds,
                "polygon": rectangle_polygon(bounds),
                "confidence": 0.66 if "onnx" in mode or "torch" in mode else 0.42,
                "source": mode,
                "maskClass": room_type,
            }
        )
    return rooms


def recognition_rooms_from_wall_network(lines, mask_shape, scale, mode):
    if not lines:
        return []
    height, width = mask_shape[:2]
    horizontals = [line for line in lines if line["orientation"] == "horizontal"]
    verticals = [line for line in lines if line["orientation"] == "vertical"]
    if len(horizontals) < 2 or len(verticals) < 2:
        return []
    xs = room_axis_values([line["x1"] for line in verticals], width)
    ys = room_axis_values([line["y1"] for line in horizontals], height)
    rooms = []
    image_area = width * height
    for left, right in zip(xs, xs[1:]):
        for top, bottom in zip(ys, ys[1:]):
            cell_width = right - left
            cell_height = bottom - top
            area = cell_width * cell_height
            if cell_width < 36 or cell_height < 36:
                continue
            if area < image_area * 0.004 or area > image_area * 0.45:
                continue
            top_wall = best_covering_line(horizontals, top, left, right, "horizontal")
            bottom_wall = best_covering_line(horizontals, bottom, left, right, "horizontal")
            left_wall = best_covering_line(verticals, left, top, bottom, "vertical")
            right_wall = best_covering_line(verticals, right, top, bottom, "vertical")
            coverage = min(top_wall, bottom_wall, left_wall, right_wall)
            if coverage < 0.68:
                continue
            inset = max(2, min(10, round(min(cell_width, cell_height) * 0.04)))
            bounds = scale_bounds(
                {
                    "x": left + inset,
                    "y": top + inset,
                    "width": max(1, cell_width - inset * 2),
                    "height": max(1, cell_height - inset * 2),
                },
                scale,
            )
            room_type = infer_room_type_from_bounds(bounds, width / scale, height / scale)
            rooms.append(
                {
                    "id": f"{mode}-wall-room-{len(rooms) + 1}",
                    "type": room_type,
                    "label": f"{room_label(room_type)}{len(rooms) + 1}",
                    "bounds": bounds,
                    "polygon": rectangle_polygon(bounds),
                    "confidence": round(min(0.78, 0.5 + coverage * 0.28), 2),
                    "source": f"{mode}-wall-network",
                    "maskClass": "wall-network",
                }
            )
    rooms.sort(key=lambda item: item["bounds"]["width"] * item["bounds"]["height"], reverse=True)
    return rooms[:18]


def room_axis_values(values, image_limit):
    values = [0, image_limit] + [round(value) for value in values if 0 <= value <= image_limit]
    clusters = cluster_axis_values(values, max(8, round(image_limit * 0.012)))
    return sorted(set(max(0, min(image_limit, value)) for value in clusters))


def best_covering_line(lines, axis_value, start, end, orientation):
    tolerance = max(8, round((end - start) * 0.05))
    required = max(1, end - start)
    best = 0
    for line in lines:
        if orientation == "horizontal":
            if abs(line["y1"] - axis_value) > tolerance:
                continue
            overlap = interval_overlap(line["x1"], line["x2"], start, end)
        else:
            if abs(line["x1"] - axis_value) > tolerance:
                continue
            overlap = interval_overlap(line["y1"], line["y2"], start, end)
        best = max(best, overlap / required)
    return best


def interval_overlap(a1, a2, b1, b2):
    return max(0, min(max(a1, a2), max(b1, b2)) - max(min(a1, a2), min(b1, b2)))


def infer_room_type_from_bounds(bounds, image_width, image_height):
    area_ratio = (bounds["width"] * bounds["height"]) / max(1, image_width * image_height)
    aspect = bounds["width"] / max(1, bounds["height"])
    center_x = bounds["x"] + bounds["width"] / 2
    center_y = bounds["y"] + bounds["height"] / 2
    if area_ratio < 0.035 and aspect < 1.25:
        return "bath"
    if area_ratio < 0.055 and center_y < image_height * 0.45:
        return "kitchen"
    if area_ratio > 0.16:
        return "living"
    if center_y > image_height * 0.72 and aspect > 2.2:
        return "balcony"
    return "bedroom"


def dedupe_rooms(rooms):
    output = []
    for room in sorted(rooms, key=lambda item: room_priority(item), reverse=True):
        if any(room_overlap_ratio(room["bounds"], kept["bounds"]) > 0.62 for kept in output):
            continue
        output.append(room)
    return output


def room_priority(room):
    source_bonus = 2 if room.get("maskClass") not in {"unknown", "wall-network"} else 1 if room.get("maskClass") == "wall-network" else 0
    area = room["bounds"]["width"] * room["bounds"]["height"]
    return source_bonus * 10_000_000 + area


def room_overlap_ratio(a, b):
    overlap_x = interval_overlap(a["x"], a["x"] + a["width"], b["x"], b["x"] + b["width"])
    overlap_y = interval_overlap(a["y"], a["y"] + a["height"], b["y"], b["y"] + b["height"])
    overlap = overlap_x * overlap_y
    smaller = min(a["width"] * a["height"], b["width"] * b["height"])
    return overlap / max(1, smaller)


def recognition_openings(mask, kind, cv2, scale, mode):
    if mask is None or not mask.any():
        return []
    settings = {"minLength": 18, "mergeGap": 8, "maxThickness": 28, "minWallThickness": 2}
    lines = vectorize_mask(mask, settings, cv2)
    return [
        {
            "id": f"{mode}-{kind}-{index}",
            "line": {
                "x1": round(line["x1"] / scale, 2),
                "y1": round(line["y1"] / scale, 2),
                "x2": round(line["x2"] / scale, 2),
                "y2": round(line["y2"] / scale, 2),
            },
            "confidence": 0.62,
            "source": mode,
        }
        for index, line in enumerate(lines[:80], start=1)
    ]


def estimate_openings_from_wall_network(lines, scale, mode):
    doors = estimate_door_gaps(lines, scale, mode)
    windows = estimate_exterior_windows(lines, scale, mode, doors)
    return {"doors": doors[:16], "windows": windows[:24]}


def estimate_door_gaps(lines, scale, mode):
    doors = []
    for orientation in ("horizontal", "vertical"):
        oriented = sorted(
            [line for line in lines if line["orientation"] == orientation],
            key=lambda item: (item["y1"], item["x1"]) if orientation == "horizontal" else (item["x1"], item["y1"]),
        )
        for left, right in zip(oriented, oriented[1:]):
            if not same_wall_axis(left, right, tolerance=12):
                continue
            if orientation == "horizontal":
                gap = right["x1"] - left["x2"]
                if not 18 <= gap <= 110:
                    continue
                y = (left["y1"] + right["y1"]) / 2
                line = {"x1": left["x2"], "y1": y, "x2": right["x1"], "y2": y}
            else:
                gap = right["y1"] - left["y2"]
                if not 18 <= gap <= 110:
                    continue
                x = (left["x1"] + right["x1"]) / 2
                line = {"x1": x, "y1": left["y2"], "x2": x, "y2": right["y1"]}
            doors.append(
                {
                    "id": f"{mode}-estimated-door-{len(doors) + 1}",
                    "line": scale_line(line, scale),
                    "confidence": 0.42,
                    "source": f"{mode}-gap-estimate",
                }
            )
    return doors


def estimate_exterior_windows(lines, scale, mode, doors):
    if not lines:
        return []
    min_x = min(min(line["x1"], line["x2"]) for line in lines)
    max_x = max(max(line["x1"], line["x2"]) for line in lines)
    min_y = min(min(line["y1"], line["y2"]) for line in lines)
    max_y = max(max(line["y1"], line["y2"]) for line in lines)
    width = max(1, max_x - min_x)
    height = max(1, max_y - min_y)
    exterior = []
    for line in lines:
        length = line.get("length", 0)
        if length < min(width, height) * 0.18:
            continue
        if line["orientation"] == "horizontal" and (abs(line["y1"] - min_y) < 18 or abs(line["y1"] - max_y) < 18):
            exterior.append(line)
        elif line["orientation"] == "vertical" and (abs(line["x1"] - min_x) < 18 or abs(line["x1"] - max_x) < 18):
            exterior.append(line)
    exterior.sort(key=lambda item: item.get("length", 0), reverse=True)
    windows = []
    for line in exterior[:8]:
        candidate = centered_opening_on_line(line, ratio=0.34)
        if opening_too_close_to_doors(candidate, doors, scale):
            continue
        windows.append(
            {
                "id": f"{mode}-estimated-window-{len(windows) + 1}",
                "line": scale_line(candidate, scale),
                "confidence": 0.36,
                "source": f"{mode}-exterior-window-estimate",
            }
        )
    return windows


def same_wall_axis(a, b, tolerance):
    if a["orientation"] != b["orientation"]:
        return False
    if a["orientation"] == "horizontal":
        return abs(a["y1"] - b["y1"]) <= tolerance and b["x1"] >= a["x2"]
    return abs(a["x1"] - b["x1"]) <= tolerance and b["y1"] >= a["y2"]


def close_wall_axis(a, b, tolerance):
    if a["orientation"] != b["orientation"]:
        return False
    if a["orientation"] == "horizontal":
        return abs(a["y1"] - b["y1"]) <= tolerance
    return abs(a["x1"] - b["x1"]) <= tolerance


def centered_opening_on_line(line, ratio=0.32):
    if line["orientation"] == "horizontal":
        length = max(1, line["x2"] - line["x1"])
        opening = max(24, min(180, length * ratio))
        center = (line["x1"] + line["x2"]) / 2
        return {"x1": center - opening / 2, "y1": line["y1"], "x2": center + opening / 2, "y2": line["y1"]}
    length = max(1, line["y2"] - line["y1"])
    opening = max(24, min(180, length * ratio))
    center = (line["y1"] + line["y2"]) / 2
    return {"x1": line["x1"], "y1": center - opening / 2, "x2": line["x1"], "y2": center + opening / 2}


def opening_too_close_to_doors(candidate, doors, scale):
    scaled = scale_line(candidate, scale)
    cx = (scaled["x1"] + scaled["x2"]) / 2
    cy = (scaled["y1"] + scaled["y2"]) / 2
    for door in doors:
        line = door["line"]
        dx = cx - (line["x1"] + line["x2"]) / 2
        dy = cy - (line["y1"] + line["y2"]) / 2
        if (dx * dx + dy * dy) ** 0.5 < 48:
            return True
    return False


def scale_line(line, scale):
    return {
        "x1": round(line["x1"] / scale, 2),
        "y1": round(line["y1"] / scale, 2),
        "x2": round(line["x2"] / scale, 2),
        "y2": round(line["y2"] / scale, 2),
    }


def recognition_fixtures(masks, cv2, scale, mode):
    fixtures = []
    for fixture_type, mask in (masks.get("fixtureTypes") or {}).items():
        fixtures.extend(recognition_fixture_components(mask, fixture_type, fixture_label(fixture_type), cv2, scale, mode))
    if fixtures:
        return fixtures[:80]
    return recognition_fixture_components(masks.get("fixture"), "fixture", "??", cv2, scale, mode)[:80]


def recognition_fixture_components(mask, fixture_type, label_text, cv2, scale, mode):
    if mask is None or not mask.any():
        return []
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    fixtures = []
    for label in range(1, count):
        area = int(stats[label, cv2.CC_STAT_AREA])
        if area < 80:
            continue
        bounds = scale_bounds(
            {
                "x": int(stats[label, cv2.CC_STAT_LEFT]),
                "y": int(stats[label, cv2.CC_STAT_TOP]),
                "width": int(stats[label, cv2.CC_STAT_WIDTH]),
                "height": int(stats[label, cv2.CC_STAT_HEIGHT]),
            },
            scale,
        )
        fixtures.append(
            {
                "id": f"{mode}-fixture-{len(fixtures) + 1}",
                "type": fixture_type,
                "label": label_text,
                "bounds": bounds,
                "confidence": 0.55,
                "source": mode,
                "maskClass": fixture_type,
            }
        )
    return fixtures


def room_label(room_type):
    return {
        "living": "\u5ba2\u9910\u5385",
        "bedroom": "\u5367\u5ba4",
        "kitchen": "\u53a8\u623f",
        "bath": "\u536b\u751f\u95f4",
        "balcony": "\u9633\u53f0",
        "study": "\u4e66\u623f",
        "storage": "\u50a8\u7269\u95f4",
        "corridor": "\u8d70\u5eca",
    }.get(room_type, "\u7a7a\u95f4")


def fixture_label(fixture_type):
    return {
        "toilet": "\u9a6c\u6876",
        "sink": "\u53f0\u76c6",
        "shower": "\u6dcb\u6d74",
        "bathtub": "\u6d74\u7f38",
        "stove": "\u7076\u53f0",
        "counter": "\u6a71\u67dc",
    }.get(fixture_type, "\u6784\u4ef6")


def encode_semantic_masks(masks, cv2):
    return {
        "coordinateSystem": "image-pixels",
        "wall": encode_mask_png(masks["wall"], cv2),
        "door": encode_mask_png(masks["door"], cv2),
        "window": encode_mask_png(masks["window"], cv2),
        "room": encode_mask_png(masks["room"], cv2),
        "fixture": encode_mask_png(masks["fixture"], cv2),
        "roomTypes": {name: encode_mask_png(mask, cv2) for name, mask in (masks.get("roomTypes") or {}).items()},
        "fixtureTypes": {name: encode_mask_png(mask, cv2) for name, mask in (masks.get("fixtureTypes") or {}).items()},
    }


def scale_bounds(bounds, scale):
    return {
        "x": round(bounds["x"] / scale, 2),
        "y": round(bounds["y"] / scale, 2),
        "width": round(bounds["width"] / scale, 2),
        "height": round(bounds["height"] / scale, 2),
    }


def rectangle_polygon(bounds):
    x = bounds["x"]
    y = bounds["y"]
    w = bounds["width"]
    h = bounds["height"]
    return f"{x},{y} {x + w},{y} {x + w},{y + h} {x},{y + h}"


def recognition_confidence(mode, rooms, walls, doors, windows, quality=None):
    model_bonus = 0.24 if "onnx" in mode or "torch" in mode else 0
    average_wall_confidence = average_confidence(walls, 0.42)
    average_room_confidence = average_confidence(rooms, 0.38)
    topology_ratio = (quality or {}).get("snappedWallLines", 0) / max(1, (quality or {}).get("rawWallLines", 1))
    topology_bonus = min(0.14, topology_ratio * 0.08 + (quality or {}).get("junctionExtensions", 0) / 180)
    wall_score = max(min(0.78, len(walls) / 44), average_wall_confidence * 0.86) + model_bonus * 0.8 + topology_bonus
    room_score = max(min(0.72, len(rooms) / 10), average_room_confidence * 0.82) + model_bonus * 0.65
    opening_score = min(0.64, (len(doors) + len(windows)) / 14) + model_bonus * 0.35
    overall = max(0.24, min(0.94, wall_score * 0.48 + room_score * 0.34 + opening_score * 0.18))
    return {
        "overall": round(overall, 2),
        "rooms": round(min(0.92, room_score), 2),
        "walls": round(min(0.92, wall_score), 2),
        "openings": round(min(0.9, opening_score), 2),
    }


def average_confidence(items, fallback):
    values = [float(item.get("confidence", fallback)) for item in items if isinstance(item, dict)]
    return sum(values) / len(values) if values else fallback


def decode_image(data_url, cv2, np):
    media_type = ""
    if "," in data_url:
        header, data_url = data_url.split(",", 1)
        media_type = header.lower()
    raw = base64.b64decode(data_url)
    encoded = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None and ("image/svg+xml" in media_type or raw.lstrip().startswith(b"<svg")):
        image = rasterize_svg_floorplan(raw, cv2, np)
    if image is None:
        raise ValueError("Unable to decode floor-plan image")
    return image


def rasterize_svg_floorplan(raw, cv2, np):
    root = ET.fromstring(raw.decode("utf-8", errors="replace"))
    width, height, view_box = svg_canvas_size(root)
    image = np.full((height, width, 3), 255, dtype=np.uint8)

    def visit(node, inherited):
        style = dict(inherited)
        style.update(svg_node_style(node))
        tag = strip_namespace(node.tag)
        if tag == "rect":
            draw_svg_rect(image, node, style, view_box, cv2)
        elif tag == "path":
            draw_svg_path(image, node, style, view_box, cv2)
        elif tag in {"line", "polyline", "polygon"}:
            draw_svg_polyline(image, node, style, view_box, cv2, closed=tag == "polygon")
        for child in list(node):
            visit(child, style)

    visit(root, {"fill": "#ffffff", "stroke": "none", "stroke-width": "1"})
    return image


def svg_canvas_size(root):
    width = parse_svg_number(root.get("width"), 1000)
    height = parse_svg_number(root.get("height"), 1000)
    view_box_text = root.get("viewBox")
    if view_box_text:
        parts = [float(part) for part in re.split(r"[,\s]+", view_box_text.strip()) if part]
        if len(parts) == 4:
            width = int(round(width or parts[2]))
            height = int(round(height or parts[3]))
            return max(1, width), max(1, height), tuple(parts)
    return max(1, int(round(width))), max(1, int(round(height))), (0.0, 0.0, float(width), float(height))


def strip_namespace(tag):
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def parse_svg_number(value, default=0.0):
    if value is None:
        return float(default)
    match = re.search(r"-?\d+(?:\.\d+)?", str(value))
    return float(match.group(0)) if match else float(default)


def svg_node_style(node):
    style = {}
    style_text = node.get("style") or ""
    for part in style_text.split(";"):
        if ":" in part:
            key, value = part.split(":", 1)
            style[key.strip()] = value.strip()
    for key in ("fill", "stroke", "stroke-width"):
        if node.get(key) is not None:
            style[key] = node.get(key)
    return style


def svg_color(value, fallback=(255, 255, 255)):
    value = (value or "").strip().lower()
    if value in {"", "none", "transparent"}:
        return None
    if value.startswith("#"):
        hex_value = value[1:]
        if len(hex_value) == 3:
            hex_value = "".join(char * 2 for char in hex_value)
        if len(hex_value) == 6:
            r = int(hex_value[0:2], 16)
            g = int(hex_value[2:4], 16)
            b = int(hex_value[4:6], 16)
            return (b, g, r)
    named = {
        "black": (0, 0, 0),
        "white": (255, 255, 255),
        "gray": (128, 128, 128),
        "grey": (128, 128, 128),
    }
    return named.get(value, fallback)


def svg_point(x, y, view_box, image):
    min_x, min_y, view_width, view_height = view_box
    height, width = image.shape[:2]
    px = (float(x) - min_x) / max(1.0, view_width) * width
    py = (float(y) - min_y) / max(1.0, view_height) * height
    return int(round(px)), int(round(py))


def draw_svg_rect(image, node, style, view_box, cv2):
    fill = svg_color(style.get("fill"))
    stroke = svg_color(style.get("stroke"))
    x = parse_svg_number(node.get("x"), 0)
    y = parse_svg_number(node.get("y"), 0)
    width = parse_svg_number(node.get("width"), 0)
    height = parse_svg_number(node.get("height"), 0)
    p1 = svg_point(x, y, view_box, image)
    p2 = svg_point(x + width, y + height, view_box, image)
    if fill is not None:
        cv2.rectangle(image, p1, p2, fill, thickness=-1)
    if stroke is not None:
        cv2.rectangle(image, p1, p2, stroke, thickness=svg_stroke_width(style, view_box, image))


def draw_svg_polyline(image, node, style, view_box, cv2, closed=False):
    stroke = svg_color(style.get("stroke"))
    if stroke is None:
        return
    if strip_namespace(node.tag) == "line":
        points = [
            (parse_svg_number(node.get("x1")), parse_svg_number(node.get("y1"))),
            (parse_svg_number(node.get("x2")), parse_svg_number(node.get("y2"))),
        ]
    else:
        values = [float(part) for part in re.split(r"[,\s]+", (node.get("points") or "").strip()) if part]
        points = list(zip(values[0::2], values[1::2]))
    draw_svg_segments(image, points, stroke, svg_stroke_width(style, view_box, image), view_box, cv2, closed=closed)


def draw_svg_path(image, node, style, view_box, cv2):
    stroke = svg_color(style.get("stroke"))
    fill = svg_color(style.get("fill"))
    commands = svg_path_commands(node.get("d") or "")
    subpath = []
    current = (0.0, 0.0)
    start = None
    all_points = []
    for command, values in commands:
        if command == "M":
            if subpath and stroke is not None:
                draw_svg_segments(image, subpath, stroke, svg_stroke_width(style, view_box, image), view_box, cv2)
            subpath = []
            current = (values[0], values[1])
            start = current
            subpath.append(current)
            all_points.append(current)
        elif command == "L":
            current = (values[0], values[1])
            subpath.append(current)
            all_points.append(current)
        elif command == "H":
            current = (values[0], current[1])
            subpath.append(current)
            all_points.append(current)
        elif command == "V":
            current = (current[0], values[0])
            subpath.append(current)
            all_points.append(current)
        elif command == "A":
            current = (values[-2], values[-1])
            subpath.append(current)
            all_points.append(current)
        elif command == "Z" and start is not None:
            subpath.append(start)
            all_points.append(start)
    if fill is not None and all_points:
        pts = np.array([svg_point(x, y, view_box, image) for x, y in all_points], dtype=np.int32)
        cv2.fillPoly(image, [pts], fill)
    if subpath and stroke is not None:
        draw_svg_segments(image, subpath, stroke, svg_stroke_width(style, view_box, image), view_box, cv2)


def svg_path_commands(path_data):
    tokens = re.findall(r"[MmLlHhVvAaZz]|-?\d+(?:\.\d+)?", path_data)
    index = 0
    command = None
    current = (0.0, 0.0)
    while index < len(tokens):
        token = tokens[index]
        if re.match(r"[A-Za-z]", token):
            command = token
            index += 1
        if command is None:
            break
        upper = command.upper()
        relative = command.islower()
        if upper == "Z":
            yield "Z", []
            command = None
            continue
        arity = {"M": 2, "L": 2, "H": 1, "V": 1, "A": 7}.get(upper)
        if arity is None or index + arity > len(tokens):
            break
        values = [float(value) for value in tokens[index : index + arity]]
        index += arity
        if relative and upper in {"M", "L"}:
            values[0] += current[0]
            values[1] += current[1]
        elif relative and upper == "H":
            values[0] += current[0]
        elif relative and upper == "V":
            values[0] += current[1]
        elif relative and upper == "A":
            values[-2] += current[0]
            values[-1] += current[1]
        if upper == "M":
            current = (values[0], values[1])
            yield "M", values
            command = "l" if relative else "L"
        elif upper == "L":
            current = (values[0], values[1])
            yield "L", values
        elif upper == "H":
            current = (values[0], current[1])
            yield "H", values
        elif upper == "V":
            current = (current[0], values[0])
            yield "V", values
        elif upper == "A":
            current = (values[-2], values[-1])
            yield "A", values


def svg_stroke_width(style, view_box, image):
    raw = parse_svg_number(style.get("stroke-width"), 1)
    _, _, view_width, view_height = view_box
    height, width = image.shape[:2]
    scale = (width / max(1.0, view_width) + height / max(1.0, view_height)) / 2
    return max(1, int(round(raw * scale)))


def draw_svg_segments(image, points, color, thickness, view_box, cv2, closed=False):
    if len(points) < 2:
        return
    if closed:
        points = list(points) + [points[0]]
    for start, end in zip(points, points[1:]):
        cv2.line(image, svg_point(*start, view_box, image), svg_point(*end, view_box, image), color, thickness=thickness)


def resize_to_limit(image, max_size, cv2):
    height, width = image.shape[:2]
    scale = min(1.0, max_size / max(height, width))
    if scale == 1.0:
        return image, scale
    return cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA), scale


def scale_vector_settings(settings, scale):
    if scale == 1.0:
        return settings
    scaled = dict(settings)
    for key in ("minLength", "mergeGap", "maxThickness", "minWallThickness"):
        if key in scaled:
            scaled[key] = max(1, int(round(float(scaled[key]) * scale)))
    if "minNoiseArea" in scaled:
        scaled["minNoiseArea"] = max(1, int(round(float(scaled["minNoiseArea"]) * scale * scale)))
    return scaled


def model_path():
    return next((path for path in MODEL_CANDIDATES if path.exists()), None)


def infer_wall_mask(image, cv2, np):
    path = model_path()
    if path:
        try:
            return infer_onnx_mask(image, path, cv2, np), "onnx-wall-segmentation"
        except Exception as exc:
            print(f"ONNX wall model failed, falling back to OpenCV: {exc}")
    return infer_cv_mask(image, cv2), "opencv-fallback"


def infer_onnx_mask(image, path, cv2, np):
    import onnxruntime as ort

    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    target_h = int(input_shape[2]) if isinstance(input_shape[2], int) else 512
    target_w = int(input_shape[3]) if isinstance(input_shape[3], int) else 512
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)
    tensor = resized.astype(np.float32) / 255.0
    tensor = np.transpose(tensor, (2, 0, 1))[None, ...]
    output = session.run(None, {input_name: tensor})[0]
    mask = output[0]
    if mask.ndim == 3:
        mask = mask[0] if mask.shape[0] == 1 else np.argmax(mask, axis=0)
    mask = mask > (0.5 if mask.max() <= 1.0 else 0)
    mask = mask.astype(np.uint8) * 255
    return cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)


def infer_cv_mask(image, cv2):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    _, otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        9,
    )
    mask = cv2.bitwise_or(otsu, adaptive)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 3))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 21))
    horizontal = cv2.morphologyEx(mask, cv2.MORPH_OPEN, horizontal_kernel)
    vertical = cv2.morphologyEx(mask, cv2.MORPH_OPEN, vertical_kernel)
    mask = cv2.bitwise_or(horizontal, vertical)
    close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, close_kernel, iterations=1)


def postprocess_mask(mask, settings, cv2, np):
    min_area = int(settings.get("minNoiseArea", 96))
    min_thickness = int(settings.get("minWallThickness", 4))
    min_length = int(settings.get("minLength", 72))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    cleaned = np.zeros(mask.shape, dtype=np.uint8)
    for label in range(1, count):
        area = stats[label, cv2.CC_STAT_AREA]
        width = stats[label, cv2.CC_STAT_WIDTH]
        height = stats[label, cv2.CC_STAT_HEIGHT]
        longest = max(width, height)
        shortest = min(width, height)
        if area < min_area:
            continue
        if shortest < min_thickness and longest < min_length * 2:
            continue
        cleaned[labels == label] = 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    return cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=1)


def vectorize_wall_network(mask, settings, cv2):
    raw_lines = vectorize_mask(mask, settings, cv2, optimize=False)
    snap_tolerance = int(settings.get("junctionSnap", max(8, int(settings.get("mergeGap", 10)) * 2)))
    axis_tolerance = int(settings.get("axisSnap", max(5, int(settings.get("mergeGap", 10)))))
    min_length = int(settings.get("minLength", 72))
    snapped = snap_wall_axes(raw_lines, axis_tolerance)
    extended, extension_count = extend_wall_endpoints_to_junctions(snapped, snap_tolerance)
    merged = merge_wall_network(extended, axis_tolerance, snap_tolerance)
    centered, centerline_count = centerline_double_wall_lines(merged, settings)
    deduped, dedupe_count = dedupe_wall_centerlines(centered, settings)
    polished = [line for line in deduped if line.get("length", 0) >= min_length]
    polished.sort(key=lambda item: (item.get("topology") == "merged", item["length"]), reverse=True)
    for index, line in enumerate(polished, start=1):
        line["id"] = f"wall-{index}"
        line["bounds"] = bounds_from_line(line["orientation"], line["x1"], line["y1"], line["x2"], line["y2"], line["thickness"])
    return polished, {
        "rawWallLines": len(raw_lines),
        "snappedWallLines": len(polished),
        "junctionExtensions": extension_count,
        "doubleWallCenterlines": centerline_count,
        "dedupedWallLines": dedupe_count,
        "axisTolerance": axis_tolerance,
        "junctionTolerance": snap_tolerance,
    }


def snap_wall_axes(lines, tolerance):
    output = [dict(line) for line in lines]
    for orientation in ("horizontal", "vertical"):
        axis_key = "y1" if orientation == "horizontal" else "x1"
        same_axis = [line for line in output if line["orientation"] == orientation]
        clusters = cluster_axis_values([line[axis_key] for line in same_axis], tolerance)
        for line in same_axis:
            axis = nearest_cluster_value(line[axis_key], clusters)
            if axis is None:
                continue
            if orientation == "horizontal":
                line["y1"] = line["y2"] = axis
            else:
                line["x1"] = line["x2"] = axis
            line["topology"] = "snapped"
            normalize_line(line)
    return output


def cluster_axis_values(values, tolerance):
    clusters = []
    for value in sorted(values):
        if not clusters or abs(value - clusters[-1]["mean"]) > tolerance:
            clusters.append({"values": [value], "mean": float(value)})
            continue
        clusters[-1]["values"].append(value)
        clusters[-1]["mean"] = sum(clusters[-1]["values"]) / len(clusters[-1]["values"])
    return [round(cluster["mean"]) for cluster in clusters]


def nearest_cluster_value(value, clusters):
    if not clusters:
        return None
    return min(clusters, key=lambda item: abs(item - value))


def extend_wall_endpoints_to_junctions(lines, tolerance):
    output = [dict(line) for line in lines]
    extension_count = 0
    horizontals = [line for line in output if line["orientation"] == "horizontal"]
    verticals = [line for line in output if line["orientation"] == "vertical"]
    for horizontal in horizontals:
        for vertical in verticals:
            x = vertical["x1"]
            y = horizontal["y1"]
            if not ranges_nearly_overlap(horizontal["x1"], horizontal["x2"], x, x, tolerance):
                continue
            if not ranges_nearly_overlap(vertical["y1"], vertical["y2"], y, y, tolerance):
                continue
            if maybe_extend_horizontal_to_x(horizontal, x, tolerance):
                extension_count += 1
            if maybe_extend_vertical_to_y(vertical, y, tolerance):
                extension_count += 1
    for line in output:
        normalize_line(line)
        line["bounds"] = bounds_from_line(line["orientation"], line["x1"], line["y1"], line["x2"], line["y2"], line["thickness"])
    return output, extension_count


def maybe_extend_horizontal_to_x(line, x, tolerance):
    if line["x1"] - tolerance <= x < line["x1"]:
        line["x1"] = x
        line["topology"] = "snapped"
        return True
    if line["x2"] < x <= line["x2"] + tolerance:
        line["x2"] = x
        line["topology"] = "snapped"
        return True
    return False


def maybe_extend_vertical_to_y(line, y, tolerance):
    if line["y1"] - tolerance <= y < line["y1"]:
        line["y1"] = y
        line["topology"] = "snapped"
        return True
    if line["y2"] < y <= line["y2"] + tolerance:
        line["y2"] = y
        line["topology"] = "snapped"
        return True
    return False


def merge_wall_network(lines, axis_tolerance, gap_tolerance):
    merged = []
    for orientation in ("horizontal", "vertical"):
        oriented = [dict(line) for line in lines if line["orientation"] == orientation]
        previous_count = -1
        while previous_count != len(oriented):
            previous_count = len(oriented)
            oriented = merge_lines(oriented, orientation, max(axis_tolerance, gap_tolerance))
        for line in oriented:
            line["topology"] = "merged" if line.get("topology") == "snapped" else line.get("topology", "vectorized")
        merged.extend(oriented)
    return merged


def wall_side_gap_range(orientation, settings):
    max_dimension = max(int(settings.get("imageWidth", 0) or 0), int(settings.get("imageHeight", 0) or 0), 1)
    min_gap = max(3, int(settings.get("minWallThickness", 3)) * 2)
    max_gap = max(min_gap + 2, int(settings.get("maxThickness", 42)))
    if max_dimension > 1:
        max_gap = min(max_gap, max(8, round(max_dimension * 0.08)))
    return min_gap, max_gap


def can_centerline_pair(first, second, settings):
    if first["orientation"] != second["orientation"]:
        return False
    min_gap, max_gap = wall_side_gap_range(first["orientation"], settings)
    axis_gap = abs(line_axis(first) - line_axis(second))
    if axis_gap < min_gap or axis_gap > max_gap:
        return False
    overlap = line_overlap(first, second)
    shortest = min(first.get("length", 0), second.get("length", 0))
    longest = max(first.get("length", 0), second.get("length", 0))
    if shortest <= 0 or longest <= 0:
        return False
    overlap_ratio = overlap / shortest
    similar_span = shortest / longest >= 0.28
    endpoint_tolerance = max(axis_gap * 1.8, min_gap * 2.2)
    endpoints_close = abs(line_start(first) - line_start(second)) <= endpoint_tolerance and abs(line_end(first) - line_end(second)) <= endpoint_tolerance
    return overlap_ratio >= 0.48 and (similar_span or endpoints_close)


def collapse_line_pair(first, second):
    first_length = max(1, first.get("length", 0))
    second_length = max(1, second.get("length", 0))
    weight = first_length + second_length
    axis_gap = abs(line_axis(first) - line_axis(second))
    use_union = abs(line_start(first) - line_start(second)) <= axis_gap * 2.2 and abs(line_end(first) - line_end(second)) <= axis_gap * 2.2
    start = min(line_start(first), line_start(second)) if use_union else max(line_start(first), line_start(second))
    end = max(line_end(first), line_end(second)) if use_union else min(line_end(first), line_end(second))
    axis = (line_axis(first) * first_length + line_axis(second) * second_length) / weight
    thickness = max(first.get("thickness", 3), second.get("thickness", 3), axis_gap)
    collapsed = make_line(first["orientation"], start, axis, end, axis, thickness) if first["orientation"] == "horizontal" else make_line("vertical", axis, start, axis, end, thickness)
    collapsed["topology"] = "double-wall-centerline"
    collapsed["collapsedCount"] = int(first.get("collapsedCount", 1)) + int(second.get("collapsedCount", 1))
    return collapsed


def centerline_double_wall_lines(lines, settings):
    output = []
    consumed = set()
    ordered = sorted([dict(line) for line in lines], key=lambda item: (item["orientation"], line_axis(item), line_start(item)))
    collapse_count = 0
    for index, line in enumerate(ordered):
        if index in consumed:
            continue
        best_index = None
        best_score = 0
        _, max_gap = wall_side_gap_range(line["orientation"], settings)
        for cursor in range(index + 1, len(ordered)):
            if cursor in consumed:
                continue
            candidate = ordered[cursor]
            if candidate["orientation"] != line["orientation"]:
                if best_index is not None:
                    break
                continue
            if abs(line_axis(candidate) - line_axis(line)) > max_gap * 1.2:
                break
            if not can_centerline_pair(line, candidate, settings):
                continue
            score = line_overlap(line, candidate) / max(1, min(line.get("length", 0), candidate.get("length", 0)))
            if score > best_score:
                best_score = score
                best_index = cursor
        if best_index is None:
            output.append(line)
            continue
        consumed.add(index)
        consumed.add(best_index)
        collapsed = collapse_line_pair(line, ordered[best_index])
        if collapsed.get("length", 0) > 0:
            output.append(collapsed)
            collapse_count += 1
    return output, collapse_count


def dedupe_wall_centerlines(lines, settings):
    axis_tolerance = max(4, int(settings.get("mergeGap", 10)) // 2)
    deduped = []
    removed = 0
    for line in sorted([dict(item) for item in lines], key=lambda item: (item["orientation"], line_axis(item), -item.get("length", 0))):
        existing = next(
            (
                item
                for item in deduped
                if item["orientation"] == line["orientation"]
                and abs(line_axis(item) - line_axis(line)) <= max(axis_tolerance, item.get("thickness", 3), line.get("thickness", 3))
                and line_overlap(item, line) >= min(item.get("length", 0), line.get("length", 0)) * 0.72
            ),
            None,
        )
        if existing is None:
            deduped.append(line)
            continue
        if line["orientation"] == "horizontal":
            existing["x1"] = min(existing["x1"], line["x1"])
            existing["x2"] = max(existing["x2"], line["x2"])
            existing["y1"] = existing["y2"] = round((existing["y1"] + line["y1"]) / 2)
        else:
            existing["y1"] = min(existing["y1"], line["y1"])
            existing["y2"] = max(existing["y2"], line["y2"])
            existing["x1"] = existing["x2"] = round((existing["x1"] + line["x1"]) / 2)
        existing["thickness"] = max(existing.get("thickness", 3), line.get("thickness", 3))
        existing["topology"] = "deduped-centerline"
        existing["collapsedCount"] = max(int(existing.get("collapsedCount", 1)), int(line.get("collapsedCount", 1)))
        normalize_line(existing)
        removed += 1
    return deduped, removed


def line_axis(line):
    return line["y1"] if line["orientation"] == "horizontal" else line["x1"]


def line_start(line):
    return min(line["x1"], line["x2"]) if line["orientation"] == "horizontal" else min(line["y1"], line["y2"])


def line_end(line):
    return max(line["x1"], line["x2"]) if line["orientation"] == "horizontal" else max(line["y1"], line["y2"])


def line_overlap(first, second):
    return max(0, min(line_end(first), line_end(second)) - max(line_start(first), line_start(second)))


def normalize_line(line):
    if line["orientation"] == "horizontal":
        if line["x2"] < line["x1"]:
            line["x1"], line["x2"] = line["x2"], line["x1"]
        line["y2"] = line["y1"]
        line["length"] = abs(line["x2"] - line["x1"])
    else:
        if line["y2"] < line["y1"]:
            line["y1"], line["y2"] = line["y2"], line["y1"]
        line["x2"] = line["x1"]
        line["length"] = abs(line["y2"] - line["y1"])


def ranges_nearly_overlap(a1, a2, b1, b2, tolerance=0):
    start = max(min(a1, a2), min(b1, b2))
    end = min(max(a1, a2), max(b1, b2))
    return start <= end + tolerance


def vectorize_mask(mask, settings, cv2, optimize=True):
    min_length = int(settings.get("minLength", 72))
    merge_gap = int(settings.get("mergeGap", 10))
    max_thickness = int(settings.get("maxThickness", 34))
    min_thickness = int(settings.get("minWallThickness", 4))
    horizontal = extract_runs(mask, "horizontal", min_length, max_thickness, min_thickness, cv2)
    vertical = extract_runs(mask, "vertical", min_length, max_thickness, min_thickness, cv2)
    run_lines = merge_lines(horizontal, "horizontal", merge_gap) + merge_lines(vertical, "vertical", merge_gap)
    hough = filter_hough_supplements(extract_hough_wall_lines(mask, min_length, merge_gap, min_thickness, cv2), run_lines)
    lines = run_lines + hough
    lines = [line for line in lines if line["length"] >= min_length]
    if optimize:
        lines, _ = vectorize_wall_network(mask, settings, cv2)
    lines.sort(key=lambda item: item["length"], reverse=True)
    for index, line in enumerate(lines, start=1):
        line["id"] = f"wall-{index}"
    return lines


def filter_hough_supplements(hough_lines, existing_lines):
    supplements = []
    for line in hough_lines:
        duplicate_coverage = 0
        for existing in existing_lines:
            if existing["orientation"] != line["orientation"] or not close_wall_axis(existing, line, tolerance=10):
                continue
            if line["orientation"] == "horizontal":
                duplicate_coverage += interval_overlap(existing["x1"], existing["x2"], line["x1"], line["x2"])
            else:
                duplicate_coverage += interval_overlap(existing["y1"], existing["y2"], line["y1"], line["y2"])
        if duplicate_coverage / max(1, line.get("length", 1)) < 0.42:
            supplements.append(line)
    return supplements


def extract_hough_wall_lines(mask, min_length, merge_gap, min_thickness, cv2):
    detected = cv2.HoughLinesP(
        mask,
        1,
        3.141592653589793 / 180,
        threshold=max(24, min_length // 3),
        minLineLength=max(24, int(min_length * 0.58)),
        maxLineGap=max(6, merge_gap * 2),
    )
    if detected is None:
        return []
    axis_tolerance = max(4, min_thickness * 3)
    lines = []
    for raw in detected[:, 0, :]:
        x1, y1, x2, y2 = [float(value) for value in raw]
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        if dx >= dy and dy <= axis_tolerance and dx >= min_length * 0.58:
            y = round((y1 + y2) / 2)
            start = min(x1, x2)
            end = max(x1, x2)
            lines.append(make_line("horizontal", start, y, end, y, max(min_thickness, 3)))
        elif dy > dx and dx <= axis_tolerance and dy >= min_length * 0.58:
            x = round((x1 + x2) / 2)
            start = min(y1, y2)
            end = max(y1, y2)
            lines.append(make_line("vertical", x, start, x, end, max(min_thickness, 3)))
    for line in lines:
        line["topology"] = "hough"
    return lines


def extract_runs(mask, orientation, min_length, max_thickness, min_thickness, cv2):
    lines = []
    kernel_size = max(min_thickness, 3)
    if orientation == "horizontal":
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(min_length // 2, 15), kernel_size))
    else:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, max(min_length // 2, 15)))
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(opened, connectivity=8)
    for label in range(1, count):
        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        w = int(stats[label, cv2.CC_STAT_WIDTH])
        h = int(stats[label, cv2.CC_STAT_HEIGHT])
        if orientation == "horizontal":
            if w < min_length or h > max_thickness or h < min_thickness:
                continue
            cy = int(round(centroids[label][1]))
            lines.append(make_line("horizontal", x, cy, x + w, cy, h))
        else:
            if h < min_length or w > max_thickness or w < min_thickness:
                continue
            cx = int(round(centroids[label][0]))
            lines.append(make_line("vertical", cx, y, cx, y + h, w))
    return lines


def make_line(orientation, x1, y1, x2, y2, thickness):
    length = abs(x2 - x1) if orientation == "horizontal" else abs(y2 - y1)
    return {
        "orientation": orientation,
        "x1": float(x1),
        "y1": float(y1),
        "x2": float(x2),
        "y2": float(y2),
        "thickness": float(thickness),
        "length": float(length),
        "bounds": bounds_from_line(orientation, x1, y1, x2, y2, thickness),
    }


def bounds_from_line(orientation, x1, y1, x2, y2, thickness):
    if orientation == "horizontal":
        return {"x": float(x1), "y": float(y1 - thickness / 2), "width": float(x2 - x1), "height": float(thickness)}
    return {"x": float(x1 - thickness / 2), "y": float(y1), "width": float(thickness), "height": float(y2 - y1)}


def merge_lines(lines, orientation, gap):
    key = (lambda item: (item["y1"], item["x1"])) if orientation == "horizontal" else (lambda item: (item["x1"], item["y1"]))
    merged = []
    for line in sorted(lines, key=key):
        prev = merged[-1] if merged else None
        if prev is None or not can_merge(prev, line, orientation, gap):
            merged.append(dict(line))
            continue
        if orientation == "horizontal":
            prev["x1"] = min(prev["x1"], line["x1"])
            prev["x2"] = max(prev["x2"], line["x2"])
            prev["y1"] = prev["y2"] = round((prev["y1"] + line["y1"]) / 2)
            prev["length"] = prev["x2"] - prev["x1"]
        else:
            prev["y1"] = min(prev["y1"], line["y1"])
            prev["y2"] = max(prev["y2"], line["y2"])
            prev["x1"] = prev["x2"] = round((prev["x1"] + line["x1"]) / 2)
            prev["length"] = prev["y2"] - prev["y1"]
        prev["thickness"] = round((prev["thickness"] + line["thickness"]) / 2)
        prev["bounds"] = bounds_from_line(prev["orientation"], prev["x1"], prev["y1"], prev["x2"], prev["y2"], prev["thickness"])
    return merged


def can_merge(a, b, orientation, gap):
    if orientation == "horizontal":
        return abs(a["y1"] - b["y1"]) <= gap and b["x1"] <= a["x2"] + gap
    return abs(a["x1"] - b["x1"]) <= gap and b["y1"] <= a["y2"] + gap


def encode_mask_png(mask, cv2):
    ok, encoded = cv2.imencode(".png", mask)
    if not ok:
        raise ValueError("Unable to encode mask")
    return "data:image/png;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")


def main():
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FloorPlanHandler)
    print(f"GewuZhizao floor-plan service: http://127.0.0.1:{port}/index.html")
    print(f"Furniture-layout test page: http://127.0.0.1:{port}/%E6%B5%8B%E8%AF%95%E7%94%9F%E6%88%90%E5%B9%B3%E9%9D%A2%E5%B8%83%E7%BD%AE%E5%9B%BE/index.html")
    print("POST /api/segment enabled")
    print("POST /api/floorplan/recognize enabled")
    server.serve_forever()


if __name__ == "__main__":
    main()
