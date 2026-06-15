import base64
import json
import mimetypes
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parent
CUBICASA_ROOT = REPO_ROOT / "third_party" / "CubiCasa5k"
CUBICASA_CHECKPOINT = (
    CUBICASA_ROOT
    / "runs_cubi"
    / "finetune_20epoch_lr1e-4"
    / "2026-06-14-14-53-24"
    / "model_best_val_loss_var.pkl"
)
CUBICASA_ONNX_CANDIDATES = [
    ROOT / "models" / "cubicasa5k-web-annotations-5epoch.onnx",
    ROOT / "models" / "cubicasa5k-floorplan.onnx",
    ROOT / "models" / "cubicasa5k.onnx",
    ROOT / "floorplan_models" / "cubicasa5k-floorplan.onnx",
]
MODEL_CANDIDATES = [
    ROOT / "models" / "wall-segmentation.onnx",
    ROOT / "floorplan_models" / "wall-segmentation.onnx",
]
MAX_IMAGE_SIZE = 1400
CUBICASA_IMAGE_SIZE = 256
CUBICASA_INPUT_SLICE = (21, 12, 11)
CUBICASA_WALL_ROOM_CLASSES = (2, 8)
CUBICASA_WALL_PROB_THRESHOLD = 0.40
CUBICASA_ONNX_SESSION = None
CUBICASA_ONNX_PATH = None
CUBICASA_ONNX_ERROR = None
CUBICASA_MODEL = None
CUBICASA_DEVICE = None
CUBICASA_LOAD_ERROR = None


class FloorPlanHandler(BaseHTTPRequestHandler):
    server_version = "GewuZhizaoFloorPlanHTTP/0.1"

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path).lstrip("/") or "index.html"
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
        if urlparse(self.path).path != "/api/segment":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self.write_json(200, segment_payload(payload))
        except Exception as exc:
            self.write_json(500, {"error": str(exc), "mode": "error"})

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))

    def write_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def require_cv():
    try:
        import cv2
        import numpy as np
    except Exception as exc:
        raise RuntimeError("OpenCV unavailable. Install opencv-python and numpy.") from exc
    return cv2, np


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


def decode_image(data_url, cv2, np):
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    encoded = np.frombuffer(base64.b64decode(data_url), dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode floor-plan image")
    return image


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


def cubicasa_onnx_path():
    return next((path for path in CUBICASA_ONNX_CANDIDATES if path.exists()), None)


def infer_wall_mask(image, cv2, np):
    cubicasa_onnx = infer_cubicasa_onnx_mask(image, cv2, np)
    if cubicasa_onnx is not None:
        mode = "cubicasa5k-web-annotations-onnx" if CUBICASA_ONNX_PATH and "web-annotations" in CUBICASA_ONNX_PATH.name else "cubicasa5k-onnx"
        return cubicasa_onnx, mode
    cubicasa = infer_cubicasa_mask(image, cv2, np)
    if cubicasa is not None:
        return cubicasa, "cubicasa5k-rtx5080"
    path = model_path()
    if path:
        try:
            return infer_onnx_mask(image, path, cv2, np), "onnx-wall-segmentation"
        except Exception as exc:
            print(f"ONNX wall model failed, falling back to OpenCV: {exc}")
    return infer_cv_mask(image, cv2), "opencv-fallback"


def infer_cubicasa_onnx_mask(image, cv2, np):
    session = load_cubicasa_onnx_session()
    if session is None:
        if CUBICASA_ONNX_ERROR:
            print(f"CubiCasa ONNX unavailable, falling back: {CUBICASA_ONNX_ERROR}")
        return None

    height, width = image.shape[:2]
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (CUBICASA_IMAGE_SIZE, CUBICASA_IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    tensor = resized.astype(np.float32)
    tensor = 2 * (tensor / 255.0) - 1
    tensor = np.transpose(tensor, (2, 0, 1))[None, ...]

    input_name = session.get_inputs()[0].name
    output = session.run(None, {input_name: tensor})[0]
    room_logits = output[
        :,
        CUBICASA_INPUT_SLICE[0]:CUBICASA_INPUT_SLICE[0] + CUBICASA_INPUT_SLICE[1],
    ][0].astype(np.float32)
    room_logits = room_logits - room_logits.max(axis=0, keepdims=True)
    room_probs = np.exp(room_logits)
    room_probs = room_probs / np.maximum(room_probs.sum(axis=0, keepdims=True), 1e-6)
    room_pred = np.argmax(room_probs, axis=0).astype(np.uint8)
    wall_score = room_probs[list(CUBICASA_WALL_ROOM_CLASSES)].sum(axis=0)

    wall_mask = (
        np.isin(room_pred, CUBICASA_WALL_ROOM_CLASSES)
        | (wall_score >= CUBICASA_WALL_PROB_THRESHOLD)
    ).astype(np.uint8) * 255
    wall_mask = cv2.resize(wall_mask, (width, height), interpolation=cv2.INTER_NEAREST)
    wall_mask = cv2.bitwise_or(wall_mask, infer_cv_mask(image, cv2))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    return cv2.morphologyEx(wall_mask, cv2.MORPH_CLOSE, kernel, iterations=1)


def load_cubicasa_onnx_session():
    global CUBICASA_ONNX_SESSION, CUBICASA_ONNX_PATH, CUBICASA_ONNX_ERROR
    if CUBICASA_ONNX_SESSION is not None:
        return CUBICASA_ONNX_SESSION
    if CUBICASA_ONNX_ERROR is not None:
        return None

    path = cubicasa_onnx_path()
    if path is None:
        CUBICASA_ONNX_ERROR = "CubiCasa ONNX model not found"
        return None

    try:
        import onnxruntime as ort

        available = ort.get_available_providers()
        providers = [
            provider
            for provider in ("CUDAExecutionProvider", "CPUExecutionProvider")
            if provider in available
        ] or available
        CUBICASA_ONNX_SESSION = ort.InferenceSession(path.read_bytes(), providers=providers)
        CUBICASA_ONNX_PATH = path
        print(f"CubiCasa5k ONNX model loaded from {path} with {providers}")
        return CUBICASA_ONNX_SESSION
    except Exception as exc:
        CUBICASA_ONNX_ERROR = str(exc)
        return None


def infer_cubicasa_mask(image, cv2, np):
    model = load_cubicasa_model()
    if model is None:
        if CUBICASA_LOAD_ERROR:
            print(f"CubiCasa model unavailable, falling back: {CUBICASA_LOAD_ERROR}")
        return None

    import torch

    height, width = image.shape[:2]
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (CUBICASA_IMAGE_SIZE, CUBICASA_IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    tensor = resized.astype(np.float32)
    tensor = 2 * (tensor / 255.0) - 1
    tensor = np.transpose(tensor, (2, 0, 1))[None, ...]
    with torch.no_grad():
        x = torch.from_numpy(tensor).to(CUBICASA_DEVICE)
        output = model(x)
        room_logits = output[:, CUBICASA_INPUT_SLICE[0]:CUBICASA_INPUT_SLICE[0] + CUBICASA_INPUT_SLICE[1]]
        room_probs = torch.softmax(room_logits, dim=1)[0]
        room_pred = torch.argmax(room_probs, dim=0).detach().cpu().numpy().astype(np.uint8)
        wall_score = room_probs[list(CUBICASA_WALL_ROOM_CLASSES)].sum(dim=0).detach().cpu().numpy()

    wall_mask = (
        np.isin(room_pred, CUBICASA_WALL_ROOM_CLASSES)
        | (wall_score >= CUBICASA_WALL_PROB_THRESHOLD)
    ).astype(np.uint8) * 255
    wall_mask = cv2.resize(wall_mask, (width, height), interpolation=cv2.INTER_NEAREST)
    wall_mask = cv2.bitwise_or(wall_mask, infer_cv_mask(image, cv2))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    return cv2.morphologyEx(wall_mask, cv2.MORPH_CLOSE, kernel, iterations=1)


def load_cubicasa_model():
    global CUBICASA_MODEL, CUBICASA_DEVICE, CUBICASA_LOAD_ERROR
    if CUBICASA_MODEL is not None:
        return CUBICASA_MODEL
    if CUBICASA_LOAD_ERROR is not None:
        return None
    if not CUBICASA_CHECKPOINT.exists():
        CUBICASA_LOAD_ERROR = f"checkpoint not found: {CUBICASA_CHECKPOINT}"
        return None
    if not (CUBICASA_ROOT / "floortrans").exists():
        CUBICASA_LOAD_ERROR = f"CubiCasa source not found: {CUBICASA_ROOT}"
        return None

    try:
        import PIL.Image  # noqa: F401 - initialize Pillow before torchvision/torch stack on Windows.
        import torch

        sys.path.insert(0, str(CUBICASA_ROOT))
        cwd = os.getcwd()
        os.chdir(CUBICASA_ROOT)
        try:
            from floortrans.models import get_model

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            checkpoint = torch.load(CUBICASA_CHECKPOINT, map_location=device, weights_only=False)
            model = get_model("hg_furukawa_original", 51)
            model.conv4_ = torch.nn.Conv2d(256, 44, bias=True, kernel_size=1)
            model.upsample = torch.nn.ConvTranspose2d(44, 44, kernel_size=4, stride=4)
            model.load_state_dict(checkpoint["model_state"])
            model.to(device)
            model.eval()
        finally:
            os.chdir(cwd)

        CUBICASA_MODEL = model
        CUBICASA_DEVICE = device
        print(f"CubiCasa5k model loaded from {CUBICASA_CHECKPOINT} on {device}")
        return CUBICASA_MODEL
    except Exception as exc:
        CUBICASA_LOAD_ERROR = str(exc)
        return None


def infer_onnx_mask(image, path, cv2, np):
    import onnxruntime as ort

    session = ort.InferenceSession(path.read_bytes(), providers=["CPUExecutionProvider"])
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
    min_area = int(settings.get("minNoiseArea", 220))
    min_thickness = int(settings.get("minWallThickness", 4))
    min_length = int(settings.get("minLength", 84))
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


def vectorize_mask(mask, settings, cv2):
    min_length = int(settings.get("minLength", 84))
    merge_gap = int(settings.get("mergeGap", 6))
    max_thickness = int(settings.get("maxThickness", 42))
    min_thickness = int(settings.get("minWallThickness", 4))
    horizontal = extract_runs(mask, "horizontal", min_length, max_thickness, min_thickness, cv2)
    vertical = extract_runs(mask, "vertical", min_length, max_thickness, min_thickness, cv2)
    lines = merge_lines(horizontal, "horizontal", merge_gap) + merge_lines(vertical, "vertical", merge_gap)
    lines = [line for line in lines if line["length"] >= min_length]
    lines.sort(key=lambda item: item["length"], reverse=True)
    for index, line in enumerate(lines, start=1):
        line["id"] = f"wall-{index}"
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
    port = int(os.environ.get("PORT", "8010"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FloorPlanHandler)
    print(f"GewuZhizao floor-plan service: http://127.0.0.1:{port}/index.html")
    print("POST /api/segment enabled")
    server.serve_forever()


if __name__ == "__main__":
    main()
