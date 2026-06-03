const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml";
const MIN_CANVAS_ZOOM = 0.35;
const MAX_CANVAS_ZOOM = 5;

const elements = {
  fileInput: document.querySelector("#fileInput"),
  nativeFileInput: document.querySelector("#nativeFileInput"),
  uploadButton: document.querySelector("#uploadButton"),
  demoButton: document.querySelector("#demoButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  processButton: document.querySelector("#processButton"),
  thresholdRange: document.querySelector("#thresholdRange"),
  thresholdValue: document.querySelector("#thresholdValue"),
  recognitionModeSelect: document.querySelector("#recognitionModeSelect"),
  minLengthRange: document.querySelector("#minLengthRange"),
  minLengthValue: document.querySelector("#minLengthValue"),
  mergeGapRange: document.querySelector("#mergeGapRange"),
  mergeGapValue: document.querySelector("#mergeGapValue"),
  maxThicknessRange: document.querySelector("#maxThicknessRange"),
  maxThicknessValue: document.querySelector("#maxThicknessValue"),
  denoiseToggle: document.querySelector("#denoiseToggle"),
  minNoiseAreaRange: document.querySelector("#minNoiseAreaRange"),
  minNoiseAreaValue: document.querySelector("#minNoiseAreaValue"),
  minWallThicknessRange: document.querySelector("#minWallThicknessRange"),
  minWallThicknessValue: document.querySelector("#minWallThicknessValue"),
  openingMinWidthRange: document.querySelector("#openingMinWidthRange"),
  openingMinWidthValue: document.querySelector("#openingMinWidthValue"),
  openingMaxWidthRange: document.querySelector("#openingMaxWidthRange"),
  openingMaxWidthValue: document.querySelector("#openingMaxWidthValue"),
  imageStat: document.querySelector("#imageStat"),
  lineStat: document.querySelector("#lineStat"),
  horizontalStat: document.querySelector("#horizontalStat"),
  verticalStat: document.querySelector("#verticalStat"),
  noiseStat: document.querySelector("#noiseStat"),
  intersectionStat: document.querySelector("#intersectionStat"),
  breakStat: document.querySelector("#breakStat"),
  openingStat: document.querySelector("#openingStat"),
  pierStat: document.querySelector("#pierStat"),
  roomStat: document.querySelector("#roomStat"),
  modeStat: document.querySelector("#modeStat"),
  statusPill: document.querySelector("#statusPill"),
  previewCanvas: document.querySelector("#previewCanvas"),
  canvasWrap: document.querySelector("#canvasWrap"),
  emptyState: document.querySelector("#emptyState"),
  overlayTab: document.querySelector("#overlayTab"),
  vectorTab: document.querySelector("#vectorTab"),
};

const state = {
  analysisCanvas: null,
  maskImage: null,
  lines: [],
  topology: createEmptyTopology(),
  selectedLineIndex: null,
  draggedEndpoint: null,
  hoveredEndpoint: null,
  removedPixels: 0,
  recognitionMode: "-",
  view: "overlay",
  sourceName: "floor-plan",
  zoom: 1,
};

const ctx = elements.previewCanvas.getContext("2d");

for (const [name, element] of Object.entries(elements)) {
  if (!element) throw new Error(`页面元素缺失: ${name}`);
}

function getSettings() {
  return {
    threshold: Number(elements.thresholdRange.value),
    minLength: Number(elements.minLengthRange.value),
    mergeGap: Number(elements.mergeGapRange.value),
    maxThickness: Number(elements.maxThicknessRange.value),
    recognitionMode: elements.recognitionModeSelect.value,
    denoiseEnabled: elements.denoiseToggle.checked,
    minNoiseArea: Number(elements.minNoiseAreaRange.value),
    minWallThickness: Number(elements.minWallThicknessRange.value),
    openingMinWidth: Number(elements.openingMinWidthRange.value),
    openingMaxWidth: Number(elements.openingMaxWidthRange.value),
  };
}

function syncControlLabels() {
  const settings = getSettings();
  elements.thresholdValue.value = String(settings.threshold);
  elements.minLengthValue.value = `${settings.minLength} px`;
  elements.mergeGapValue.value = `${settings.mergeGap} px`;
  elements.maxThicknessValue.value = `${settings.maxThickness} px`;
  elements.minNoiseAreaValue.value = `${settings.minNoiseArea} px`;
  elements.minWallThicknessValue.value = `${settings.minWallThickness} px`;
  elements.openingMinWidthValue.value = `${settings.openingMinWidth} px`;
  elements.openingMaxWidthValue.value = `${settings.openingMaxWidth} px`;
}

function setStatus(text) {
  elements.statusPill.textContent = text;
}

function fitCanvasToImage(canvas) {
  const maxWidth = 1500;
  const scale = Math.min(1, maxWidth / canvas.width);
  elements.previewCanvas.width = Math.round(canvas.width * scale);
  elements.previewCanvas.height = Math.round(canvas.height * scale);
  applyCanvasZoom(1);
}

function applyCanvasZoom(zoom) {
  state.zoom = clamp(zoom, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
  elements.previewCanvas.style.width = `${Math.round(elements.previewCanvas.width * state.zoom)}px`;
  elements.previewCanvas.style.height = `${Math.round(elements.previewCanvas.height * state.zoom)}px`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function loadImageFromFile(file) {
  try {
    setStatus("读取中");
    const canvas = await fileToCanvas(file);
    state.analysisCanvas = createScaledCanvas(canvas);
    state.maskImage = null;
    state.lines = [];
    state.topology = createEmptyTopology();
    state.selectedLineIndex = null;
    state.draggedEndpoint = null;
    state.hoveredEndpoint = null;
    state.sourceName = file.name.replace(/\.[^.]+$/, "") || "floor-plan";
    fitCanvasToImage(state.analysisCanvas);
    elements.emptyState.hidden = true;
    elements.imageStat.textContent = `${state.analysisCanvas.width} x ${state.analysisCanvas.height}`;
    renderSourceImageOnly();
    runRecognition();
  } catch (error) {
    setStatus(error.message || "读取失败");
  } finally {
    elements.fileInput.value = "";
    elements.nativeFileInput.value = "";
  }
}

function createScaledCanvas(source, maxSize = 1400) {
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    image.src = url;
  });
}

async function loadDemoPlan() {
  const response = await fetch("./tests/sample-floor-plan.svg");
  const blob = await response.blob();
  const file = new File([blob], "sample-floor-plan.svg", { type: "image/svg+xml" });
  loadImageFromFile(file);
}

function runRecognition() {
  if (!state.analysisCanvas) return;
  syncControlLabels();
  setStatus("生成中");
  state.selectedLineIndex = null;
  state.draggedEndpoint = null;
  state.hoveredEndpoint = null;
  const settings = getSettings();
  if (settings.recognitionMode === "ai-cv") {
    runBackendRecognition(settings).catch(() => runBrowserRecognition(settings, "browser-fallback"));
  } else {
    runBrowserRecognition(settings, "browser-rules");
  }
}

async function runBackendRecognition(settings) {
  const response = await fetch("/api/segment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: state.analysisCanvas.toDataURL("image/png"), settings }),
  });
  if (!response.ok) throw new Error(`分割服务返回 ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  state.maskImage = result.mask ? await loadImage(result.mask) : null;
  finishRecognition(result.walls || [], settings, result.mode || "ai-cv");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function runBrowserRecognition(settings, mode) {
  const imageData = state.analysisCanvas
    .getContext("2d")
    .getImageData(0, 0, state.analysisCanvas.width, state.analysisCanvas.height);
  let mask = buildDarkPixelMask(imageData, settings.threshold);
  if (settings.denoiseEnabled) mask = denoiseMask(mask, settings);
  state.removedPixels = mask.removedPixels || 0;
  state.maskImage = null;
  finishRecognition(detectAndMergeWalls(mask, settings), settings, mode);
}

function finishRecognition(lines, settings, mode) {
  state.lines = lines
    .filter((line) => line.length >= settings.minLength)
    .sort((a, b) => b.length - a.length)
    .map((line, index) => ({ ...line, id: line.id || `wall-${index + 1}` }));
  state.selectedLineIndex = null;
  state.draggedEndpoint = null;
  state.hoveredEndpoint = null;
  state.topology = analyzeTopology(state.lines, settings);
  state.recognitionMode = mode;
  updateStats();
  renderPreview();
  elements.exportJsonButton.disabled = !state.lines.length;
  elements.processButton.disabled = !state.analysisCanvas;
  setStatus("已生成");
}

function buildDarkPixelMask(imageData, threshold) {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const lightness = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      mask[y * width + x] = data[index + 3] > 20 && lightness < threshold ? 1 : 0;
    }
  }
  return { width, height, mask, removedPixels: 0 };
}

function denoiseMask(source, settings) {
  const { width, height, mask } = source;
  const filtered = mask.slice();
  const visited = new Uint8Array(width * height);
  const stack = [];
  let removedPixels = 0;

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    const pixels = [];
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    stack.push(start);
    visited[start] = 1;
    while (stack.length) {
      const index = stack.pop();
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      addNeighbor(index - 1, x > 0);
      addNeighbor(index + 1, x < width - 1);
      addNeighbor(index - width, y > 0);
      addNeighbor(index + width, y < height - 1);
    }
    const longest = Math.max(maxX - minX + 1, maxY - minY + 1);
    if (pixels.length < settings.minNoiseArea || longest < settings.minLength * 0.55) {
      for (const index of pixels) filtered[index] = 0;
      removedPixels += pixels.length;
    }
    function addNeighbor(index, allowed) {
      if (allowed && !visited[index] && mask[index]) {
        visited[index] = 1;
        stack.push(index);
      }
    }
  }
  return { width, height, mask: filtered, removedPixels };
}

function detectAndMergeWalls(mask, settings) {
  const horizontal = detectHorizontalWalls(mask, settings);
  const vertical = detectVerticalWalls(mask, settings);
  return [...mergeCollinear(horizontal, "horizontal", settings.mergeGap), ...mergeCollinear(vertical, "vertical", settings.mergeGap)];
}

function detectHorizontalWalls(source, settings) {
  const groups = [];
  const { width, height, mask } = source;
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      while (x < width && !mask[y * width + x]) x += 1;
      const start = x;
      while (x < width && mask[y * width + x]) x += 1;
      const end = x - 1;
      if (end - start + 1 >= settings.minLength) addRun(groups, { start, end, axis: y }, "horizontal", settings);
    }
  }
  return finalizeGroups(groups, "horizontal", settings);
}

function detectVerticalWalls(source, settings) {
  const groups = [];
  const { width, height, mask } = source;
  for (let x = 0; x < width; x += 1) {
    let y = 0;
    while (y < height) {
      while (y < height && !mask[y * width + x]) y += 1;
      const start = y;
      while (y < height && mask[y * width + x]) y += 1;
      const end = y - 1;
      if (end - start + 1 >= settings.minLength) addRun(groups, { start, end, axis: x }, "vertical", settings);
    }
  }
  return finalizeGroups(groups, "vertical", settings);
}

function addRun(groups, run, orientation, settings) {
  let best = null;
  let bestScore = 0;
  for (const group of groups) {
    if (Math.abs(run.axis - group.axisEnd) > settings.maxThickness) continue;
    const overlap = Math.min(run.end, group.end) - Math.max(run.start, group.start);
    const span = Math.min(run.end - run.start, group.end - group.start);
    const score = overlap / Math.max(1, span);
    if (score > bestScore && score > 0.35) {
      best = group;
      bestScore = score;
    }
  }
  if (!best) {
    groups.push({ start: run.start, end: run.end, axisStart: run.axis, axisEnd: run.axis });
    return;
  }
  best.start = Math.min(best.start, run.start);
  best.end = Math.max(best.end, run.end);
  best.axisEnd = run.axis;
}

function finalizeGroups(groups, orientation, settings) {
  return groups
    .map((group) => {
      const thickness = group.axisEnd - group.axisStart + 1;
      const axis = Math.round((group.axisStart + group.axisEnd) / 2);
      if (orientation === "horizontal") {
        return makeLine("horizontal", group.start, axis, group.end, axis, thickness);
      }
      return makeLine("vertical", axis, group.start, axis, group.end, thickness);
    })
    .filter((line) => line.thickness >= settings.minWallThickness && line.thickness <= settings.maxThickness);
}

function makeLine(orientation, x1, y1, x2, y2, thickness) {
  return { orientation, x1, y1, x2, y2, thickness, length: orientation === "horizontal" ? x2 - x1 : y2 - y1 };
}

function mergeCollinear(lines, orientation, gap) {
  const sorted = [...lines].sort((a, b) => {
    const axis = orientation === "horizontal" ? a.y1 - b.y1 : a.x1 - b.x1;
    if (Math.abs(axis) > gap) return axis;
    return orientation === "horizontal" ? a.x1 - b.x1 : a.y1 - b.y1;
  });
  const merged = [];
  for (const line of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || !canMerge(previous, line, orientation, gap)) {
      merged.push({ ...line });
      continue;
    }
    if (orientation === "horizontal") {
      previous.x1 = Math.min(previous.x1, line.x1);
      previous.x2 = Math.max(previous.x2, line.x2);
      previous.y1 = previous.y2 = Math.round((previous.y1 + line.y1) / 2);
      previous.length = previous.x2 - previous.x1;
    } else {
      previous.y1 = Math.min(previous.y1, line.y1);
      previous.y2 = Math.max(previous.y2, line.y2);
      previous.x1 = previous.x2 = Math.round((previous.x1 + line.x1) / 2);
      previous.length = previous.y2 - previous.y1;
    }
    previous.thickness = Math.round((previous.thickness + line.thickness) / 2);
  }
  return merged;
}

function canMerge(a, b, orientation, gap) {
  if (orientation === "horizontal") return Math.abs(a.y1 - b.y1) <= gap && b.x1 <= a.x2 + gap;
  return Math.abs(a.x1 - b.x1) <= gap && b.y1 <= a.y2 + gap;
}

function analyzeTopology(lines, settings) {
  const tolerance = Math.max(8, settings.mergeGap + settings.minWallThickness);
  const closedLines = autoCloseLineIntersections(lines, settings, tolerance);
  const horizontal = closedLines.filter((line) => line.orientation === "horizontal");
  const vertical = closedLines.filter((line) => line.orientation === "vertical");
  const intersections = findIntersections(horizontal, vertical, tolerance);
  const openings = findOpenings(horizontal, vertical, settings, tolerance);
  const endPiers = findEndPiers(lines, intersections, openings, settings, tolerance);
  const pierIds = new Set(endPiers.filter((pier) => pier.excludeFromRooms).map((pier) => pier.wall));
  const roomLines = closedLines.filter((line) => !pierIds.has(line.id));
  const rooms = findClosedRooms(
    roomLines.filter((line) => line.orientation === "horizontal"),
    roomLines.filter((line) => line.orientation === "vertical"),
    settings,
    tolerance,
  );
  const breaks = findBreaks(roomLines, intersections, openings, tolerance);
  return { intersections, breaks, openings, endPiers, rooms };
}

function autoCloseLineIntersections(lines, settings, tolerance) {
  const snapTolerance = closureTolerance(settings, tolerance);
  const closed = lines.map((line) => ({ ...line }));
  const horizontal = closed.filter((line) => line.orientation === "horizontal");
  const vertical = closed.filter((line) => line.orientation === "vertical");

  for (const hLine of horizontal) {
    for (const vLine of vertical) {
      const missX = perpendicularMiss(vLine.x1, hLine.x1, hLine.x2);
      const missY = perpendicularMiss(hLine.y1, vLine.y1, vLine.y2);
      if (missX > snapTolerance || missY > snapTolerance) continue;
      snapLineEndToPoint(hLine, { x: vLine.x1, y: hLine.y1 }, snapTolerance);
      snapLineEndToPoint(vLine, { x: vLine.x1, y: hLine.y1 }, snapTolerance);
    }
  }

  for (const line of closed) normalizeEditedLine(line);
  return closed;
}

function closureTolerance(settings, tolerance) {
  return Math.max(tolerance * 1.8, settings.mergeGap * 2 + settings.minWallThickness);
}

function perpendicularMiss(value, start, end) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

function snapLineEndToPoint(line, point, tolerance) {
  if (line.orientation === "horizontal") {
    if (point.x < line.x1 && line.x1 - point.x <= tolerance) line.x1 = point.x;
    if (point.x > line.x2 && point.x - line.x2 <= tolerance) line.x2 = point.x;
    line.y2 = line.y1;
    return;
  }
  if (point.y < line.y1 && line.y1 - point.y <= tolerance) line.y1 = point.y;
  if (point.y > line.y2 && point.y - line.y2 <= tolerance) line.y2 = point.y;
  line.x2 = line.x1;
}

function findIntersections(horizontal, vertical, tolerance) {
  const points = [];
  for (const hLine of horizontal) {
    for (const vLine of vertical) {
      if (vLine.x1 < hLine.x1 - tolerance || vLine.x1 > hLine.x2 + tolerance) continue;
      if (hLine.y1 < vLine.y1 - tolerance || hLine.y1 > vLine.y2 + tolerance) continue;
      points.push({ id: `node-${points.length + 1}`, x: vLine.x1, y: hLine.y1, walls: [hLine.id, vLine.id] });
    }
  }
  return dedupePoints(points, tolerance, "node");
}

function findOpenings(horizontal, vertical, settings, tolerance) {
  return [
    ...findGaps(horizontal, "horizontal", settings, tolerance),
    ...findGaps(vertical, "vertical", settings, tolerance),
  ].map((opening, index) => ({ ...opening, id: `opening-${index + 1}` }));
}

function findGaps(lines, orientation, settings, tolerance) {
  const openings = [];
  const groups = groupByAxis(lines, orientation, tolerance);
  for (const group of groups) {
    const sorted = group.lines.sort((a, b) => getLineStart(a, orientation) - getLineStart(b, orientation));
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const left = sorted[index];
      const right = sorted[index + 1];
      const gap = getLineStart(right, orientation) - getLineEnd(left, orientation);
      if (gap < settings.openingMinWidth || gap > settings.openingMaxWidth) continue;
      const axis = getLineAxis(left, orientation);
      openings.push(
        orientation === "horizontal"
          ? { orientation, x1: getLineEnd(left, orientation), y1: axis, x2: getLineStart(right, orientation), y2: axis, width: gap }
          : { orientation, x1: axis, y1: getLineEnd(left, orientation), x2: axis, y2: getLineStart(right, orientation), width: gap },
      );
    }
  }
  return openings;
}

function findEndPiers(lines, intersections, openings, settings, tolerance) {
  const maxLength = Math.max(settings.minLength * 0.9, settings.minWallThickness * 8);
  const piers = [];
  for (const line of lines) {
    if (line.length > maxLength || line.length < settings.minWallThickness * 1.5) continue;
    const start = findPierConnection(line, "start", lines, intersections, openings, settings, tolerance);
    const end = findPierConnection(line, "end", lines, intersections, openings, settings, tolerance);
    if (Number(Boolean(start)) + Number(Boolean(end)) !== 1) continue;
    const connection = start || end;
    const confidence = round(Math.min(0.98, 0.62 + (connection.nearOpening ? 0.18 : 0) + (connection.nearIntersection ? 0.12 : 0)));
    piers.push({
      id: `pier-${piers.length + 1}`,
      wall: line.id,
      hostWall: connection.hostWall,
      x1: line.x1,
      y1: line.y1,
      x2: line.x2,
      y2: line.y2,
      confidence,
      excludeFromRooms: connection.nearOpening && line.length <= settings.openingMaxWidth * 0.75,
    });
  }
  return piers;
}

function findPierConnection(line, end, lines, intersections, openings, settings, tolerance) {
  const endpoint = end === "start" ? { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
  const host = lines.find((candidate) => {
    if (candidate.id === line.id || candidate.orientation === line.orientation || candidate.length <= line.length * 1.2) return false;
    if (Math.abs(candidate.thickness - line.thickness) > Math.max(6, line.thickness * 0.5)) return false;
    return distanceToSegment(endpoint, candidate) <= tolerance * 1.4;
  });
  if (!host) return null;
  return {
    hostWall: host.id,
    nearIntersection: intersections.some((point) => point.walls.includes(line.id) && distance(point, endpoint) <= tolerance * 1.5),
    nearOpening: openings.some((opening) => distanceToSegment(endpoint, opening) <= tolerance * 1.4),
  };
}

function findBreaks(lines, intersections, openings, tolerance) {
  const breaks = [];
  for (const line of lines) {
    for (const endpoint of [
      { x: line.x1, y: line.y1, wall: line.id },
      { x: line.x2, y: line.y2, wall: line.id },
    ]) {
      const hasNode = intersections.some((point) => distance(point, endpoint) <= tolerance * 1.4);
      const hasOpening = openings.some((opening) => distanceToSegment(endpoint, opening) <= tolerance * 1.2);
      if (!hasNode && !hasOpening) breaks.push({ id: `break-${breaks.length + 1}`, ...endpoint });
    }
  }
  return dedupePoints(breaks, tolerance, "break");
}

function findClosedRooms(horizontal, vertical, settings, tolerance) {
  const rooms = [];
  const minSide = Math.max(36, settings.minLength * 0.62);
  const hBands = groupByAxis(horizontal, "horizontal", tolerance);
  const vBands = groupByAxis(vertical, "vertical", tolerance);
  for (let topIndex = 0; topIndex < hBands.length - 1; topIndex += 1) {
    for (let bottomIndex = topIndex + 1; bottomIndex < hBands.length; bottomIndex += 1) {
      const top = hBands[topIndex];
      const bottom = hBands[bottomIndex];
      if (bottom.axis - top.axis < minSide) continue;
      const bridges = vBands.filter((band) => bandCovers(band, top.axis, bottom.axis, tolerance)).sort((a, b) => a.axis - b.axis);
      for (let index = 0; index < bridges.length - 1; index += 1) {
        const left = bridges[index];
        const right = bridges[index + 1];
        if (right.axis - left.axis < minSide) continue;
        if (!bandCovers(top, left.axis, right.axis, tolerance) || !bandCovers(bottom, left.axis, right.axis, tolerance)) continue;
        const room = { id: `room-${rooms.length + 1}`, x: left.axis, y: top.axis, width: right.axis - left.axis, height: bottom.axis - top.axis };
        room.area = room.width * room.height;
        if (!rooms.some((existing) => rectanglesOverlapStrongly(existing, room))) rooms.push(room);
      }
    }
  }
  return rooms;
}

function groupByAxis(lines, orientation, tolerance) {
  const groups = [];
  for (const line of lines) {
    const axis = getLineAxis(line, orientation);
    let group = groups.find((item) => Math.abs(item.axis - axis) <= tolerance);
    if (!group) {
      group = { axis, lines: [] };
      groups.push(group);
    }
    group.lines.push(line);
    group.axis = Math.round(group.lines.reduce((sum, item) => sum + getLineAxis(item, orientation), 0) / group.lines.length);
  }
  groups.sort((a, b) => a.axis - b.axis);
  return groups;
}

function bandCovers(band, start, end, tolerance) {
  return band.lines.some((line) => getLineStart(line, band.lines[0].orientation) <= start + tolerance && getLineEnd(line, band.lines[0].orientation) >= end - tolerance);
}

function getLineAxis(line, orientation) {
  return orientation === "horizontal" ? line.y1 : line.x1;
}

function getLineStart(line, orientation) {
  return orientation === "horizontal" ? Math.min(line.x1, line.x2) : Math.min(line.y1, line.y2);
}

function getLineEnd(line, orientation) {
  return orientation === "horizontal" ? Math.max(line.x1, line.x2) : Math.max(line.y1, line.y2);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return distance(point, segment);
  const t = Math.max(0, Math.min(1, ((point.x - segment.x1) * dx + (point.y - segment.y1) * dy) / lengthSquared));
  return Math.hypot(point.x - (segment.x1 + t * dx), point.y - (segment.y1 + t * dy));
}

function dedupePoints(points, tolerance, prefix) {
  const deduped = [];
  for (const point of points) {
    if (!deduped.some((candidate) => distance(candidate, point) <= tolerance)) deduped.push({ ...point, id: `${prefix}-${deduped.length + 1}` });
  }
  return deduped;
}

function rectanglesOverlapStrongly(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const overlap = Math.max(0, right - left) * Math.max(0, bottom - top);
  return overlap / Math.max(1, Math.min(a.area, b.area)) > 0.82;
}

function updateStats() {
  const horizontal = state.lines.filter((line) => line.orientation === "horizontal").length;
  const vertical = state.lines.filter((line) => line.orientation === "vertical").length;
  elements.lineStat.textContent = String(state.lines.length);
  elements.horizontalStat.textContent = String(horizontal);
  elements.verticalStat.textContent = String(vertical);
  elements.noiseStat.textContent = String(state.removedPixels);
  elements.intersectionStat.textContent = String(state.topology.intersections.length);
  elements.breakStat.textContent = String(state.topology.breaks.length);
  elements.openingStat.textContent = String(state.topology.openings.length);
  elements.pierStat.textContent = String(state.topology.endPiers.length);
  elements.roomStat.textContent = String(state.topology.rooms.length);
  elements.modeStat.textContent = state.recognitionMode;
}

function renderSourceImageOnly() {
  const canvas = elements.previewCanvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.analysisCanvas, 0, 0, canvas.width, canvas.height);
}

function renderPreview() {
  const canvas = elements.previewCanvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / state.analysisCanvas.width, canvas.height / state.analysisCanvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, state.analysisCanvas.width, state.analysisCanvas.height);
  if (state.view === "overlay") {
    ctx.globalAlpha = 0.42;
    ctx.filter = "blur(3px) grayscale(25%) brightness(1.08)";
    ctx.drawImage(state.analysisCanvas, 0, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(215,71,50,0.22)";
  for (const line of state.lines) {
    const bounds = boundsFromLine(line);
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }
  ctx.strokeStyle = "#276fbf";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const line of state.lines) {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }
  drawSelectedLine(ctx);
  drawTopology(ctx);
  drawEndpointHandles(ctx);
  ctx.restore();
}

function boundsFromLine(line) {
  if (line.orientation === "horizontal") return { x: line.x1, y: line.y1 - line.thickness / 2, width: line.x2 - line.x1, height: line.thickness };
  return { x: line.x1 - line.thickness / 2, y: line.y1, width: line.thickness, height: line.y2 - line.y1 };
}

function drawTopology(context) {
  const { rooms, openings, intersections, breaks, endPiers } = state.topology;
  context.fillStyle = "rgba(31,122,107,0.16)";
  context.strokeStyle = "rgba(31,122,107,0.8)";
  context.lineWidth = 2;
  for (const room of rooms) {
    context.fillRect(room.x, room.y, room.width, room.height);
    context.strokeRect(room.x, room.y, room.width, room.height);
  }
  drawSegments(context, openings, "#e8bf25", 5);
  drawSegments(context, endPiers, "#8b5cf6", 6);
  for (const point of intersections) drawPoint(context, point.x, point.y, "#12a6a6", 5);
  for (const point of breaks) drawPoint(context, point.x, point.y, "#f28c28", 5);
}

function drawSelectedLine(context) {
  const line = selectedLine();
  if (!line) return;

  context.save();
  context.strokeStyle = "#ffb14a";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(line.x1, line.y1);
  context.lineTo(line.x2, line.y2);
  context.stroke();
  context.restore();
}

function drawEndpointHandles(context) {
  const line = selectedLine();
  if (!line) return;

  context.save();
  drawEditableEndpoint(context, line.x1, line.y1, isEndpointActive("start"));
  drawEditableEndpoint(context, line.x2, line.y2, isEndpointActive("end"));
  context.restore();
}

function drawEditableEndpoint(context, x, y, active) {
  context.save();
  context.fillStyle = active ? "#ffb14a" : "#f28c28";
  context.strokeStyle = "#fff";
  context.lineWidth = active ? 4 : 3;
  context.beginPath();
  context.arc(x, y, active ? 7 : 6, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function isEndpointActive(end) {
  const active = state.draggedEndpoint || state.hoveredEndpoint;
  return active && active.end === end;
}

function drawSegments(context, segments, color, width) {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  for (const segment of segments) {
    context.beginPath();
    context.moveTo(segment.x1, segment.y1);
    context.lineTo(segment.x2, segment.y2);
    context.stroke();
  }
}

function drawPoint(context, x, y, color, radius) {
  context.fillStyle = color;
  context.strokeStyle = "#fff";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function createEmptyTopology() {
  return { intersections: [], breaks: [], openings: [], endPiers: [], rooms: [] };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function setView(view) {
  state.view = view;
  elements.overlayTab.classList.toggle("active", view === "overlay");
  elements.vectorTab.classList.toggle("active", view === "vector");
  if (state.analysisCanvas) renderPreview();
}

function selectedLine() {
  if (state.selectedLineIndex === null) return null;
  return state.lines[state.selectedLineIndex] || null;
}

function canvasPointFromEvent(event) {
  const rect = elements.previewCanvas.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) * elements.previewCanvas.width) / rect.width, 0, elements.previewCanvas.width),
    y: clamp(((event.clientY - rect.top) * elements.previewCanvas.height) / rect.height, 0, elements.previewCanvas.height),
  };
}

function findNearestLineIndex(point) {
  const radius = lineHitRadius();
  let nearest = null;

  for (let index = 0; index < state.lines.length; index += 1) {
    const line = state.lines[index];
    const hitDistance = distanceToSegment(point, line);
    const lineRadius = Math.max(radius, line.thickness / 2 + 10);
    if (hitDistance > lineRadius) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { index, distance: hitDistance };
  }

  return nearest ? nearest.index : null;
}

function lineHitRadius() {
  const rect = elements.previewCanvas.getBoundingClientRect();
  const scale = Math.max(0.2, Math.min(rect.width / elements.previewCanvas.width, rect.height / elements.previewCanvas.height));
  return Math.max(10, 10 / scale);
}

function findNearestSelectedEndpoint(point) {
  const line = selectedLine();
  if (!line) return null;

  const radius = editableHitRadius();
  const endpoints = [
    { end: "start", x: line.x1, y: line.y1 },
    { end: "end", x: line.x2, y: line.y2 },
  ];
  let nearest = null;

  for (const endpoint of endpoints) {
    const hitDistance = distance(point, endpoint);
    if (hitDistance > radius) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { ...endpoint, distance: hitDistance };
  }

  return nearest;
}

function editableHitRadius() {
  const rect = elements.previewCanvas.getBoundingClientRect();
  const scale = Math.max(0.2, Math.min(rect.width / elements.previewCanvas.width, rect.height / elements.previewCanvas.height));
  return Math.max(18, 18 / scale);
}

function moveSelectedEndpoint(selection, point) {
  const line = selectedLine();
  if (!line) return;

  const minLength = 6;
  if (line.orientation === "horizontal") {
    if (selection.end === "start") {
      line.x1 = Math.min(point.x, line.x2 - minLength);
    } else {
      line.x2 = Math.max(point.x, line.x1 + minLength);
    }
    line.y2 = line.y1;
  } else {
    if (selection.end === "start") {
      line.y1 = Math.min(point.y, line.y2 - minLength);
    } else {
      line.y2 = Math.max(point.y, line.y1 + minLength);
    }
    line.x2 = line.x1;
  }

  normalizeEditedLine(line);
}

function normalizeEditedLine(line) {
  if (line.orientation === "horizontal") {
    if (line.x1 > line.x2) [line.x1, line.x2] = [line.x2, line.x1];
    line.y2 = line.y1;
    line.length = Math.abs(line.x2 - line.x1);
    return;
  }
  if (line.y1 > line.y2) [line.y1, line.y2] = [line.y2, line.y1];
  line.x2 = line.x1;
  line.length = Math.abs(line.y2 - line.y1);
}

function refreshAfterEdit() {
  state.topology = analyzeTopology(state.lines, getSettings());
  updateStats();
  renderPreview();
  setStatus("已编辑");
}

function snapDraggedEndpointToNearbyWall(selection) {
  const line = selectedLine();
  if (!line || !selection) return;

  const settings = getSettings();
  const tolerance = closureTolerance(settings, Math.max(8, settings.mergeGap + settings.minWallThickness));
  const endpoint = selection.end === "start" ? { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
  let best = null;

  for (const candidate of state.lines) {
    if (candidate.id === line.id || candidate.orientation === line.orientation) continue;
    let axisMiss = 0;
    let spanMiss = 0;
    if (line.orientation === "horizontal") {
      axisMiss = Math.abs(endpoint.x - candidate.x1);
      spanMiss = perpendicularMiss(endpoint.y, candidate.y1, candidate.y2);
    } else {
      axisMiss = Math.abs(endpoint.y - candidate.y1);
      spanMiss = perpendicularMiss(endpoint.x, candidate.x1, candidate.x2);
    }
    if (axisMiss > tolerance || spanMiss > tolerance) continue;
    const score = axisMiss + spanMiss * 0.6;
    if (!best || score < best.score) best = { candidate, score };
  }

  if (!best) return;
  if (line.orientation === "horizontal") {
    if (selection.end === "start") line.x1 = best.candidate.x1;
    else line.x2 = best.candidate.x1;
  } else if (selection.end === "start") {
    line.y1 = best.candidate.y1;
  } else {
    line.y2 = best.candidate.y1;
  }
  normalizeEditedLine(line);
}

function handleCanvasPointerDown(event) {
  if (!state.lines.length) return;
  const point = canvasPointFromEvent(event);
  const endpoint = findNearestSelectedEndpoint(point);
  if (endpoint) {
    state.draggedEndpoint = endpoint;
    elements.previewCanvas.setPointerCapture(event.pointerId);
    elements.previewCanvas.style.cursor = "grabbing";
    event.preventDefault();
    return;
  }

  state.selectedLineIndex = findNearestLineIndex(point);
  state.hoveredEndpoint = null;
  elements.previewCanvas.style.cursor = state.selectedLineIndex === null ? "default" : "pointer";
  renderPreview();
}

function handleCanvasPointerMove(event) {
  if (!state.lines.length) return;
  const point = canvasPointFromEvent(event);

  if (state.draggedEndpoint) {
    moveSelectedEndpoint(state.draggedEndpoint, point);
    state.topology = analyzeTopology(state.lines, getSettings());
    updateStats();
    renderPreview();
    event.preventDefault();
    return;
  }

  state.hoveredEndpoint = findNearestSelectedEndpoint(point);
  if (state.hoveredEndpoint) {
    elements.previewCanvas.style.cursor = "grab";
  } else {
    elements.previewCanvas.style.cursor = findNearestLineIndex(point) === null ? "default" : "pointer";
  }
  renderPreview();
}

function handleCanvasPointerUp(event) {
  if (!state.draggedEndpoint) return;
  snapDraggedEndpointToNearbyWall(state.draggedEndpoint);
  state.draggedEndpoint = null;
  state.hoveredEndpoint = null;
  if (elements.previewCanvas.hasPointerCapture(event.pointerId)) {
    elements.previewCanvas.releasePointerCapture(event.pointerId);
  }
  elements.previewCanvas.style.cursor = "default";
  refreshAfterEdit();
}

function handleCanvasWheel(event) {
  if (!state.analysisCanvas) return;
  event.preventDefault();
  const rect = elements.previewCanvas.getBoundingClientRect();
  const point = {
    x: clamp(((event.clientX - rect.left) * elements.previewCanvas.width) / rect.width, 0, elements.previewCanvas.width),
    y: clamp(((event.clientY - rect.top) * elements.previewCanvas.height) / rect.height, 0, elements.previewCanvas.height),
  };
  const previousZoom = state.zoom;
  const nextZoom = clamp(previousZoom * Math.exp(-event.deltaY * 0.0015), MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
  const wrapRect = elements.canvasWrap.getBoundingClientRect();
  const pointerX = event.clientX - wrapRect.left;
  const pointerY = event.clientY - wrapRect.top;
  applyCanvasZoom(nextZoom);
  elements.canvasWrap.scrollLeft = point.x * state.zoom - pointerX;
  elements.canvasWrap.scrollTop = point.y * state.zoom - pointerY;
}

function exportJson() {
  const payload = { source: state.sourceName, walls: state.lines, topology: state.topology, settings: getSettings() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${state.sourceName}-walls.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function openImagePicker() {
  elements.fileInput.click();
}

elements.uploadButton.addEventListener("click", openImagePicker);
elements.fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) loadImageFromFile(file);
});
elements.nativeFileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) loadImageFromFile(file);
});
elements.demoButton.addEventListener("click", loadDemoPlan);
elements.processButton.addEventListener("click", runRecognition);
elements.exportJsonButton.addEventListener("click", exportJson);
elements.overlayTab.addEventListener("click", () => setView("overlay"));
elements.vectorTab.addEventListener("click", () => setView("vector"));
elements.recognitionModeSelect.addEventListener("change", () => state.analysisCanvas && runRecognition());
elements.previewCanvas.addEventListener("pointerdown", handleCanvasPointerDown);
elements.previewCanvas.addEventListener("pointermove", handleCanvasPointerMove);
elements.previewCanvas.addEventListener("pointerup", handleCanvasPointerUp);
elements.previewCanvas.addEventListener("pointercancel", handleCanvasPointerUp);
elements.previewCanvas.addEventListener("pointerleave", () => {
  if (state.draggedEndpoint) return;
  state.hoveredEndpoint = null;
  elements.previewCanvas.style.cursor = "default";
  if (state.analysisCanvas && state.lines.length) renderPreview();
});
elements.canvasWrap.addEventListener("wheel", handleCanvasWheel, { passive: false });

for (const range of [
  elements.thresholdRange,
  elements.minLengthRange,
  elements.mergeGapRange,
  elements.maxThicknessRange,
  elements.minNoiseAreaRange,
  elements.minWallThicknessRange,
  elements.openingMinWidthRange,
  elements.openingMaxWidthRange,
]) {
  range.addEventListener("input", () => {
    syncControlLabels();
    if (state.analysisCanvas) runRecognition();
  });
}

elements.denoiseToggle.addEventListener("change", () => state.analysisCanvas && runRecognition());
elements.canvasWrap.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.canvasWrap.classList.add("is-dragover");
});
elements.canvasWrap.addEventListener("dragleave", () => elements.canvasWrap.classList.remove("is-dragover"));
elements.canvasWrap.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.canvasWrap.classList.remove("is-dragover");
  const [file] = event.dataTransfer.files;
  if (file) loadImageFromFile(file);
});

syncControlLabels();
