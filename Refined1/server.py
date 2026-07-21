import base64
import importlib.util
import json
import mimetypes
import os
import platform
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
DEFAULT_CUBICASA_ONNX_CANDIDATES = [
    ROOT / "models" / "cubicasa5k-20260711-30epoch.onnx",
]
CONFIGURED_ONNX_MODEL = os.environ.get("FLOORPLAN_ONNX_MODEL")
CUBICASA_ONNX_CANDIDATES = (
    [Path(CONFIGURED_ONNX_MODEL).expanduser().resolve()] if CONFIGURED_ONNX_MODEL else []
) + DEFAULT_CUBICASA_ONNX_CANDIDATES
MAX_IMAGE_SIZE = 1400
CUBICASA_IMAGE_SIZE = 256
CUBICASA_INPUT_SLICE = (21, 12, 11)
CUBICASA_WALL_ROOM_CLASSES = (2, 8)
CUBICASA_WALL_PROB_THRESHOLD = 0.40
CUBICASA_ONNX_SESSION = None
CUBICASA_ONNX_PATH = None
CUBICASA_ONNX_ERROR = None


class FloorPlanHandler(BaseHTTPRequestHandler):
    server_version = "GewuZhizaoFloorPlanHTTP/0.1"

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.write_json(200, health_payload())
            return
        path = unquote(parsed.path).lstrip("/") or "index.html"
        file_path = (ROOT / path).resolve()
        if not file_path.is_relative_to(ROOT) or not file_path.exists() or file_path.is_dir():
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
        route = urlparse(self.path).path
        handlers = {
            "/api/segment": segment_payload,
            "/api/floorplan/recognize": recognize_payload,
        }
        handler = handlers.get(route)
        if handler is None:
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self.write_json(200, handler(payload))
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


def dependency_available(module_name):
    return importlib.util.find_spec(module_name) is not None


def selected_onnx_path():
    return next((path for path in CUBICASA_ONNX_CANDIDATES if path.is_file()), None)


def health_payload():
    model = selected_onnx_path()
    dependencies = {
        "numpy": dependency_available("numpy"),
        "opencv": dependency_available("cv2"),
        "onnxruntime": dependency_available("onnxruntime"),
    }
    core_ready = dependencies["numpy"] and dependencies["opencv"] and dependencies["onnxruntime"] and model is not None
    return {
        "status": "ok" if core_ready else "degraded",
        "service": "gewu-floorplan-refined1",
        "schemaVersion": "floorplan-ai-v1",
        "python": platform.python_version(),
        "coreReady": core_ready,
        "activeModel": model.name if model else None,
        "activeModelPath": str(model) if model else None,
        "configuredModel": CONFIGURED_ONNX_MODEL,
        "dependencies": dependencies,
    }


def prepare_recognition(payload):
    cv2, np = require_cv()
    image = decode_image(payload["image"], cv2, np)
    settings = payload.get("settings", {})
    image, scale = resize_to_limit(image, MAX_IMAGE_SIZE, cv2)
    settings = scale_vector_settings(settings, scale)
    mask, mode = infer_wall_mask(image, cv2, np)
    mask = postprocess_mask(mask, settings, cv2, np)
    walls = vectorize_mask(mask, settings, cv2)
    return cv2, image, settings, mask, mode, walls


def segment_payload(payload):
    cv2, image, settings, mask, mode, walls = prepare_recognition(payload)
    return {
        "mode": mode,
        "image": {"width": int(image.shape[1]), "height": int(image.shape[0])},
        "mask": encode_mask_png(mask, cv2),
        "walls": walls,
    }


def recognize_payload(payload):
    cv2, image, settings, mask, mode, walls = prepare_recognition(payload)
    openings = detect_opening_candidates(walls, settings)
    rooms = detect_rectangular_rooms(walls, settings)
    mask_data_url = encode_mask_png(mask, cv2)
    model = recognition_model_info(mode)
    return {
        "schemaVersion": "floorplan-ai-v1",
        "status": "fallback" if mode == "opencv-fallback" else "ok",
        "provider": model["provider"],
        "mode": mode,
        "model": model["name"],
        "image": {"width": int(image.shape[1]), "height": int(image.shape[0])},
        "walls": walls,
        "doors": [],
        "windows": [],
        "openings": openings,
        "rooms": rooms,
        "fixtures": [],
        "confidence": {"overall": None, "source": "not-calibrated"},
        "debug": {
            "wallMask": mask_data_url,
            "model": {**model, "active": mode != "opencv-fallback"},
        },
    }


def recognition_model_info(mode):
    if mode.startswith("cubicasa5k") and CUBICASA_ONNX_PATH:
        providers = CUBICASA_ONNX_SESSION.get_providers() if CUBICASA_ONNX_SESSION else []
        return {"name": CUBICASA_ONNX_PATH.name, "provider": "cubicasa", "runtime": "onnxruntime", "executionProviders": providers}
    return {"name": "opencv-fallback", "provider": "opencv", "runtime": "opencv"}


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
    for key in ("minLength", "mergeGap", "maxThickness", "minWallThickness", "openingMinWidth", "openingMaxWidth"):
        if key in scaled:
            scaled[key] = max(1, int(round(float(scaled[key]) * scale)))
    if "minNoiseArea" in scaled:
        scaled["minNoiseArea"] = max(1, int(round(float(scaled["minNoiseArea"]) * scale * scale)))
    return scaled


def cubicasa_onnx_path():
    return selected_onnx_path()


def infer_wall_mask(image, cv2, np):
    cubicasa_onnx = infer_cubicasa_onnx_mask(image, cv2, np)
    if cubicasa_onnx is not None:
        mode = "cubicasa5k-web-annotations-combined-57-onnx" if CUBICASA_ONNX_PATH and "combined-57" in CUBICASA_ONNX_PATH.name else "cubicasa5k-web-annotations-onnx" if CUBICASA_ONNX_PATH and "web-annotations" in CUBICASA_ONNX_PATH.name else "cubicasa5k-onnx"
        return cubicasa_onnx, mode
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
        CUBICASA_ONNX_SESSION = ort.InferenceSession(str(path), providers=providers)
        CUBICASA_ONNX_PATH = path
        print(f"CubiCasa5k ONNX model loaded from {path} with {providers}")
        return CUBICASA_ONNX_SESSION
    except Exception as exc:
        CUBICASA_ONNX_ERROR = str(exc)
        return None


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


def line_axis(line):
    return line["y1"] if line["orientation"] == "horizontal" else line["x1"]


def line_start(line):
    return line["x1"] if line["orientation"] == "horizontal" else line["y1"]


def line_end(line):
    return line["x2"] if line["orientation"] == "horizontal" else line["y2"]


def group_lines_by_axis(lines, orientation, tolerance):
    groups = []
    selected = sorted((line for line in lines if line["orientation"] == orientation), key=lambda line: (line_axis(line), line_start(line)))
    for line in selected:
        group = next((item for item in groups if abs(item["axis"] - line_axis(line)) <= tolerance), None)
        if group is None:
            groups.append({"axis": line_axis(line), "lines": [line]})
            continue
        group["lines"].append(line)
        group["axis"] = sum(line_axis(item) for item in group["lines"]) / len(group["lines"])
    return groups


def detect_opening_candidates(lines, settings):
    tolerance = max(8, int(settings.get("mergeGap", 6)) + int(settings.get("minWallThickness", 4)))
    min_width = max(1, int(settings.get("openingMinWidth", 22)))
    max_width = max(min_width, int(settings.get("openingMaxWidth", 96)) + int(settings.get("maxThickness", 42)))
    openings = []
    for orientation in ("horizontal", "vertical"):
        for group in group_lines_by_axis(lines, orientation, tolerance):
            ordered = sorted(group["lines"], key=line_start)
            for left, right in zip(ordered, ordered[1:]):
                gap = line_start(right) - line_end(left)
                if gap < min_width or gap > max_width:
                    continue
                axis = group["axis"]
                opening = {
                    "id": f"opening-{len(openings) + 1}",
                    "kind": "opening",
                    "orientation": orientation,
                    "width": float(gap),
                    "leftWall": left.get("id"),
                    "rightWall": right.get("id"),
                    "source": "geometry-gap",
                    "confidence": None,
                }
                if orientation == "horizontal":
                    opening.update({"x1": float(line_end(left)), "y1": float(axis), "x2": float(line_start(right)), "y2": float(axis)})
                else:
                    opening.update({"x1": float(axis), "y1": float(line_end(left)), "x2": float(axis), "y2": float(line_start(right))})
                openings.append(opening)
    return openings


def group_covers(group, start, end, tolerance):
    ordered = sorted(group["lines"], key=line_start)
    cursor = start
    for line in ordered:
        if line_end(line) < cursor - tolerance:
            continue
        if line_start(line) > cursor + tolerance:
            return False
        cursor = max(cursor, line_end(line))
        if cursor >= end - tolerance:
            return True
    return False


def detect_rectangular_rooms(lines, settings):
    tolerance = max(8, int(settings.get("mergeGap", 6)) + int(settings.get("minWallThickness", 4)))
    min_span = max(10, int(settings.get("minLength", 84)))
    horizontal = group_lines_by_axis(lines, "horizontal", tolerance)
    vertical = group_lines_by_axis(lines, "vertical", tolerance)
    rooms = []
    for top_index, top in enumerate(horizontal):
        for bottom in horizontal[top_index + 1:]:
            y1, y2 = sorted((top["axis"], bottom["axis"]))
            if y2 - y1 < min_span:
                continue
            for left_index, left in enumerate(vertical):
                for right in vertical[left_index + 1:]:
                    x1, x2 = sorted((left["axis"], right["axis"]))
                    if x2 - x1 < min_span:
                        continue
                    if not group_covers(top, x1, x2, tolerance) or not group_covers(bottom, x1, x2, tolerance):
                        continue
                    if not group_covers(left, y1, y2, tolerance) or not group_covers(right, y1, y2, tolerance):
                        continue
                    rooms.append({
                        "id": f"room-{len(rooms) + 1}",
                        "x": float(x1),
                        "y": float(y1),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "area": float((x2 - x1) * (y2 - y1)),
                        "polygon": [
                            {"x": float(x1), "y": float(y1)},
                            {"x": float(x2), "y": float(y1)},
                            {"x": float(x2), "y": float(y2)},
                            {"x": float(x1), "y": float(y2)},
                        ],
                        "source": "wall-topology",
                    })
    return rooms


def encode_mask_png(mask, cv2):
    ok, encoded = cv2.imencode(".png", mask)
    if not ok:
        raise ValueError("Unable to encode mask")
    return "data:image/png;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")


def main():
    port = int(os.environ.get("PORT", "8010"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FloorPlanHandler)
    print(f"GewuZhizao floor-plan service: http://127.0.0.1:{port}/index.html")
    print("GET /api/health enabled")
    print("POST /api/floorplan/recognize enabled")
    print("POST /api/segment enabled (compatibility)")
    server.serve_forever()


if __name__ == "__main__":
    main()
