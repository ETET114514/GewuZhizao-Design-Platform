import base64
import json
import mimetypes
import os
import re
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
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
        ROOT / "floorplan_models" / "cubicasa5k.onnx",
        ROOT / "models" / "cubicasa5k.pt",
    ],
}
MAX_IMAGE_SIZE = 1400
RECOGNITION_MAX_IMAGE_SIZE = 1024


class FloorPlanHandler(BaseHTTPRequestHandler):
    server_version = "GewuZhizaoFloorPlanHTTP/0.1"

    def do_GET(self):
        parsed = urlparse(self.path)
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
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

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
    masks, mode, model_info = infer_recognition_masks(image, provider, cv2, np)
    wall_mask = postprocess_mask(masks["wall"], settings, cv2, np)
    walls = recognition_walls(wall_mask, settings, cv2, scale, mode)
    rooms = recognition_rooms(masks.get("room"), wall_mask, cv2, np, scale, mode)
    doors = recognition_openings(masks.get("door"), "door", cv2, scale, mode)
    windows = recognition_openings(masks.get("window"), "window", cv2, scale, mode)
    fixtures = recognition_fixtures(masks.get("fixture"), cv2, scale, mode)
    return {
        "schemaVersion": "floorplan-ai-v1",
        "provider": provider,
        "model": model_info.get("name", mode),
        "mode": mode,
        "status": "ok" if model_info.get("path") else "fallback",
        "coordinateSystem": "image-pixels",
        "image": {
            "width": int(original.shape[1]),
            "height": int(original.shape[0]),
            "analysisWidth": int(image.shape[1]),
            "analysisHeight": int(image.shape[0]),
            "analysisScale": round(scale, 4),
        },
        "confidence": recognition_confidence(mode, rooms, walls, doors, windows),
        "rooms": rooms,
        "walls": walls,
        "doors": doors,
        "windows": windows,
        "fixtures": fixtures,
        "debug": {
            "model": model_info,
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
                return infer_onnx_semantic_masks(image, path, cv2, np), "onnx-semantic-segmentation", {"path": str(path), "name": path.stem}
            if path.suffix.lower() in {".pt", ".pth"}:
                return infer_torch_semantic_masks(image, path, cv2, np), "torch-semantic-segmentation", {"path": str(path), "name": path.stem}
        except Exception as exc:
            print(f"{provider} model failed, falling back to OpenCV: {exc}")
            masks = fallback_recognition_masks(image, cv2, np)
            return masks, "opencv-fallback", {"path": str(path), "name": path.stem, "error": str(exc)}
    masks = fallback_recognition_masks(image, cv2, np)
    return masks, "opencv-fallback", {"path": None, "name": "opencv-fallback"}


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
    result = {}
    for name in ("wall", "door", "window", "room", "fixture"):
        mask = masks.get(name)
        if mask is None:
            result[name] = np.zeros((height, width), dtype=np.uint8)
            continue
        if mask.shape[:2] != (height, width):
            mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_NEAREST)
        result[name] = (mask > 0).astype(np.uint8) * 255
    if not result["wall"].any():
        result["wall"] = masks.get("walls", result["wall"])
    return result


def fallback_recognition_masks(image, cv2, np):
    wall = infer_cv_mask(image, cv2)
    empty = np.zeros(wall.shape, dtype=np.uint8)
    return {
        "wall": wall,
        "door": empty.copy(),
        "window": empty.copy(),
        "room": free_space_mask_from_walls(wall, cv2, np),
        "fixture": empty.copy(),
    }


def free_space_mask_from_walls(wall_mask, cv2, np):
    barrier = cv2.dilate(wall_mask, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)), iterations=1)
    return cv2.bitwise_not(barrier)


def recognition_walls(wall_mask, settings, cv2, scale, mode):
    lines = vectorize_mask(wall_mask, settings, cv2)
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
                "confidence": 0.74 if "onnx" in mode or "torch" in mode else 0.46,
                "source": mode,
            }
        )
    return output


def recognition_rooms(room_mask, wall_mask, cv2, np, scale, mode):
    mask = room_mask if room_mask is not None and room_mask.any() else free_space_mask_from_walls(wall_mask, cv2, np)
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
                "type": "unknown",
                "label": f"空间{len(rooms) + 1}",
                "bounds": bounds,
                "polygon": rectangle_polygon(bounds),
                "confidence": 0.66 if "onnx" in mode or "torch" in mode else 0.42,
                "source": mode,
            }
        )
    rooms.sort(key=lambda item: item["bounds"]["width"] * item["bounds"]["height"], reverse=True)
    return rooms[:24]


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


def recognition_fixtures(mask, cv2, scale, mode):
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
                "type": "fixture",
                "label": "构件",
                "bounds": bounds,
                "confidence": 0.55,
                "source": mode,
            }
        )
    return fixtures[:80]


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


def recognition_confidence(mode, rooms, walls, doors, windows):
    model_bonus = 0.24 if "onnx" in mode or "torch" in mode else 0
    wall_score = min(0.78, len(walls) / 80) + model_bonus
    room_score = min(0.72, len(rooms) / 18) + model_bonus * 0.7
    opening_score = min(0.62, (len(doors) + len(windows)) / 28) + model_bonus * 0.4
    overall = max(0.22, min(0.92, wall_score * 0.45 + room_score * 0.4 + opening_score * 0.15))
    return {
        "overall": round(overall, 2),
        "rooms": round(min(0.92, room_score), 2),
        "walls": round(min(0.92, wall_score), 2),
        "openings": round(min(0.9, opening_score), 2),
    }


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


def vectorize_mask(mask, settings, cv2):
    min_length = int(settings.get("minLength", 72))
    merge_gap = int(settings.get("mergeGap", 10))
    max_thickness = int(settings.get("maxThickness", 34))
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
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FloorPlanHandler)
    print(f"GewuZhizao floor-plan service: http://127.0.0.1:{port}/index.html")
    print(f"Furniture-layout test page: http://127.0.0.1:{port}/%E6%B5%8B%E8%AF%95%E7%94%9F%E6%88%90%E5%B9%B3%E9%9D%A2%E5%B8%83%E7%BD%AE%E5%9B%BE/index.html")
    print("POST /api/segment enabled")
    print("POST /api/floorplan/recognize enabled")
    server.serve_forever()


if __name__ == "__main__":
    main()
