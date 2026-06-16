const els = {
  datasetRoot: document.querySelector("#datasetRoot"),
  folderFilter: document.querySelector("#folderFilter"),
  onlyUnlabeled: document.querySelector("#onlyUnlabeled"),
  caseList: document.querySelector("#caseList"),
  caseTitle: document.querySelector("#caseTitle"),
  caseStatus: document.querySelector("#caseStatus"),
  sourceImage: document.querySelector("#sourceImage"),
  overlay: document.querySelector("#overlaySvg"),
  stage: document.querySelector("#stage"),
  emptyState: document.querySelector("#emptyState"),
  selectionInfo: document.querySelector("#selectionInfo"),
  caseQuickSelect: document.querySelector("#caseQuickSelect"),
  roomTypeSelect: document.querySelector("#roomTypeSelect"),
  deleteSelected: document.querySelector("#deleteSelected"),
  saveAnnotation: document.querySelector("#saveAnnotation"),
  tools: [...document.querySelectorAll("[data-tool]")],
};

const SVG_NS = "http://www.w3.org/2000/svg";
const LOCAL_SERVER_ORIGIN = "http://127.0.0.1:8000";
const state = {
  cases: [],
  currentCase: null,
  annotation: null,
  prediction: null,
  tool: "select",
  selected: null,
  pendingPoint: null,
  draftPoints: [],
  dragging: null,
  dirty: false,
};

const lineKinds = new Set(["walls", "doors", "windows"]);

init();

function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = window.location.protocol === "file:" ? `${LOCAL_SERVER_ORIGIN}${path}` : path;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}_=${Date.now()}`;
}

async function init() {
  bindEvents();
  try {
    await loadCases();
  } catch (error) {
    showLoadError(error);
  }
}

function bindEvents() {
  els.folderFilter.addEventListener("change", renderCaseList);
  els.onlyUnlabeled.addEventListener("change", renderCaseList);
  els.caseQuickSelect?.addEventListener("change", () => {
    if (els.caseQuickSelect.value) loadCase(els.caseQuickSelect.value);
  });
  els.tools.forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
  els.overlay.addEventListener("pointerdown", onOverlayPointerDown);
  els.overlay.addEventListener("dblclick", (event) => {
    if (state.tool === "room") {
      event.preventDefault();
      finishRoomDraft();
    }
  });
  document.addEventListener("pointermove", onDocumentPointerMove);
  document.addEventListener("pointerup", () => {
    state.dragging = null;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
    if (event.key === "Enter" && state.tool === "room") finishRoomDraft();
    if (event.key === "Escape") clearDraft();
  });
  els.roomTypeSelect.addEventListener("change", () => {
    const room = selectedItem("rooms");
    if (!room) return;
    room.type = els.roomTypeSelect.value;
    markDirty();
    renderOverlay();
  });
  els.deleteSelected.addEventListener("click", deleteSelected);
  els.saveAnnotation.addEventListener("click", saveAnnotation);
}

async function loadCases() {
  const response = await fetch(apiUrl("/api/annotation/cases"));
  if (!response.ok) {
    throw new Error(`/api/annotation/cases 返回 ${response.status}，请确认 ${LOCAL_SERVER_ORIGIN} 的 floorplan_server.py 正在运行`);
  }
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  state.cases = payload.cases ?? [];
  els.datasetRoot.textContent = payload.root ?? "";
  const folders = ["全部", ...new Set(state.cases.map((item) => item.folder))];
  els.folderFilter.innerHTML = folders.map((folder) => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`).join("");
  renderCaseQuickSelect();
  renderCaseList();
  if (!state.currentCase && state.cases.length > 0) {
    await loadCase(state.cases[0].id);
  }
}

function showLoadError(error) {
  console.error(error);
  const message = error?.message ?? "未知错误";
  els.datasetRoot.textContent = `读取训练目录失败：${message}`;
  els.caseList.innerHTML = `<div class="case-error">没有读到图纸列表。请确认当前页面是通过 floorplan_server.py 打开的，并刷新页面。</div>`;
  if (els.caseQuickSelect) {
    els.caseQuickSelect.innerHTML = `<option value="">未读到图纸</option>`;
  }
  els.emptyState.textContent = `未读到训练图纸：${message}`;
}

function renderCaseQuickSelect() {
  if (!els.caseQuickSelect) return;
  els.caseQuickSelect.innerHTML = [
    `<option value="">选择图纸</option>`,
    ...state.cases.map((item) => {
      const label = `${item.fileName} · ${item.labelExists ? "已标注" : "未标注"}`;
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  if (state.currentCase) els.caseQuickSelect.value = state.currentCase.id;
}

function renderCaseList() {
  const folder = els.folderFilter.value;
  const onlyUnlabeled = els.onlyUnlabeled.checked;
  const filtered = state.cases.filter((item) => {
    if (folder && folder !== "全部" && item.folder !== folder) return false;
    if (onlyUnlabeled && item.labelExists) return false;
    return true;
  });
  els.caseList.innerHTML = "";
  filtered.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `case-card${state.currentCase?.id === item.id ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(item.fileName)}</strong>
      <span>${escapeHtml(item.folder)}</span>
      <span>${escapeHtml(item.predictionName ?? "无跑1结果")}</span>
      <span class="tag ${item.labelExists ? "done" : ""}">${item.labelExists ? "已标注" : "未标注"}</span>
    `;
    button.addEventListener("click", () => loadCase(item.id));
    els.caseList.appendChild(button);
  });
}

async function loadCase(id) {
  const response = await fetch(apiUrl(`/api/annotation/case?id=${encodeURIComponent(id)}`));
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  state.currentCase = payload.case;
  state.prediction = payload.prediction;
  state.annotation = normalizeAnnotation(payload.annotation ?? predictionToAnnotation(payload.prediction, payload.case));
  state.selected = null;
  clearDraft();
  state.dirty = false;
  if (els.caseQuickSelect) els.caseQuickSelect.value = state.currentCase.id;
  els.caseTitle.textContent = state.currentCase.fileName;
  els.caseStatus.textContent = state.currentCase.labelExists ? "已加载人工标注" : "已用跑1结果作为初稿";
  els.sourceImage.onload = () => {
    const width = els.sourceImage.naturalWidth || 1000;
    const height = els.sourceImage.naturalHeight || 1000;
    els.stage.style.display = "block";
    els.emptyState.style.display = "none";
    els.stage.style.aspectRatio = `${width} / ${height}`;
    els.overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    renderOverlay();
  };
  els.sourceImage.src = apiUrl(state.currentCase.imageUrl);
  renderCaseList();
}

function predictionToAnnotation(prediction, currentCase) {
  const source = prediction ?? {};
  return {
    schemaVersion: "floorplan-annotation-v1",
    image: currentCase.fileName,
    sourcePrediction: currentCase.predictionName,
    rooms: (source.rooms ?? []).map((room, index) => ({
      id: room.id ?? `room_${index + 1}`,
      type: room.type ?? room.maskClass ?? "unknown",
      polygon: roomPolygon(room),
      source: room.source ?? "prediction",
    })),
    walls: (source.walls ?? []).map((line, index) => normalizeLine(line, `wall_${index + 1}`)),
    doors: (source.doors ?? []).map((line, index) => normalizeLine(line, `door_${index + 1}`)),
    windows: (source.windows ?? []).map((line, index) => normalizeLine(line, `window_${index + 1}`)),
    fixtures: (source.fixtures ?? []).map((fixture, index) => ({
      id: fixture.id ?? `fixture_${index + 1}`,
      type: fixture.type ?? "fixture",
      bounds: normalizeBounds(fixture.bounds),
      source: fixture.source ?? "prediction",
    })),
  };
}

function normalizeAnnotation(annotation) {
  return {
    schemaVersion: "floorplan-annotation-v1",
    image: annotation?.image ?? state.currentCase?.fileName ?? "",
    sourcePrediction: annotation?.sourcePrediction ?? state.currentCase?.predictionName ?? "",
    rooms: (annotation?.rooms ?? []).map((room, index) => ({
      id: room.id ?? `room_${index + 1}`,
      type: room.type ?? "unknown",
      polygon: (room.polygon ?? []).map((point) => ({ x: Number(point.x ?? point[0]), y: Number(point.y ?? point[1]) })).filter(validPoint),
    })),
    walls: (annotation?.walls ?? []).map((line, index) => normalizeLine(line, `wall_${index + 1}`)),
    doors: (annotation?.doors ?? []).map((line, index) => normalizeLine(line, `door_${index + 1}`)),
    windows: (annotation?.windows ?? []).map((line, index) => normalizeLine(line, `window_${index + 1}`)),
    fixtures: (annotation?.fixtures ?? []).map((fixture, index) => ({
      id: fixture.id ?? `fixture_${index + 1}`,
      type: fixture.type ?? "fixture",
      bounds: normalizeBounds(fixture.bounds ?? fixture),
    })),
  };
}

function normalizeLine(item, fallbackId) {
  const source = item?.line ?? item ?? {};
  return {
    id: item?.id ?? fallbackId,
    x1: Number(source.x1 ?? 0),
    y1: Number(source.y1 ?? 0),
    x2: Number(source.x2 ?? 0),
    y2: Number(source.y2 ?? 0),
    thickness: Number(item?.thickness ?? source.thickness ?? 6),
  };
}

function normalizeBounds(bounds = {}) {
  return {
    x: Number(bounds.x ?? 0),
    y: Number(bounds.y ?? 0),
    width: Number(bounds.width ?? Math.max(1, Number(bounds.maxX ?? 0) - Number(bounds.x ?? bounds.minX ?? 0))),
    height: Number(bounds.height ?? Math.max(1, Number(bounds.maxY ?? 0) - Number(bounds.y ?? bounds.minY ?? 0))),
  };
}

function roomPolygon(room) {
  if (Array.isArray(room.polygon)) {
    return room.polygon.map((point) => ({ x: Number(point.x ?? point[0]), y: Number(point.y ?? point[1]) })).filter(validPoint);
  }
  if (typeof room.polygon === "string") {
    const points = room.polygon
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x, y };
      })
      .filter(validPoint);
    if (points.length >= 3) return points;
  }
  const b = normalizeBounds(room.bounds);
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ];
}

function validPoint(point) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function setTool(tool) {
  state.tool = tool;
  clearDraft();
  els.tools.forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
}

function onOverlayPointerDown(event) {
  if (!state.annotation || event.target.classList.contains("handle")) return;
  if (event.target !== els.overlay && state.tool === "select") return;
  const point = svgPoint(event);
  if (state.tool === "select") {
    state.selected = null;
    renderOverlay();
    return;
  }
  if (state.tool === "room") {
    state.draftPoints.push(point);
    renderOverlay();
    return;
  }
  if (["wall", "door", "window"].includes(state.tool)) {
    addTwoPointLine(point);
    return;
  }
  if (state.tool === "fixture") {
    addTwoPointFixture(point);
  }
}

function addTwoPointLine(point) {
  if (!state.pendingPoint) {
    state.pendingPoint = point;
    renderOverlay();
    return;
  }
  const map = { wall: "walls", door: "doors", window: "windows" };
  const collection = state.annotation[map[state.tool]];
  collection.push({
    id: `${state.tool}_${collection.length + 1}`,
    x1: state.pendingPoint.x,
    y1: state.pendingPoint.y,
    x2: point.x,
    y2: point.y,
    thickness: state.tool === "wall" ? 8 : 5,
  });
  state.pendingPoint = null;
  markDirty();
  renderOverlay();
}

function addTwoPointFixture(point) {
  if (!state.pendingPoint) {
    state.pendingPoint = point;
    renderOverlay();
    return;
  }
  const x = Math.min(state.pendingPoint.x, point.x);
  const y = Math.min(state.pendingPoint.y, point.y);
  const width = Math.abs(state.pendingPoint.x - point.x);
  const height = Math.abs(state.pendingPoint.y - point.y);
  if (width > 2 && height > 2) {
    state.annotation.fixtures.push({ id: `fixture_${state.annotation.fixtures.length + 1}`, type: "fixture", bounds: { x, y, width, height } });
    markDirty();
  }
  state.pendingPoint = null;
  renderOverlay();
}

function finishRoomDraft() {
  if (!state.annotation || state.draftPoints.length < 3) return;
  state.annotation.rooms.push({
    id: `room_${state.annotation.rooms.length + 1}`,
    type: els.roomTypeSelect.value,
    polygon: state.draftPoints.map((point) => ({ ...point })),
  });
  clearDraft();
  markDirty();
  renderOverlay();
}

function clearDraft() {
  state.pendingPoint = null;
  state.draftPoints = [];
  renderOverlay();
}

function renderOverlay() {
  els.overlay.replaceChildren();
  if (!state.annotation) return;
  state.annotation.rooms.forEach((room, index) => {
    const polygon = svgEl("polygon", {
      points: room.polygon.map((point) => `${point.x},${point.y}`).join(" "),
      class: `room-shape${isSelected("rooms", index) ? " selected" : ""}`,
      "data-kind": "rooms",
      "data-index": index,
    });
    polygon.addEventListener("pointerdown", selectFromEvent);
    els.overlay.appendChild(polygon);
  });
  renderLines("walls", "wall-line");
  renderLines("doors", "door-line");
  renderLines("windows", "window-line");
  state.annotation.fixtures.forEach((fixture, index) => {
    const b = fixture.bounds;
    const rect = svgEl("rect", {
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      class: `fixture-rect${isSelected("fixtures", index) ? " selected" : ""}`,
      "data-kind": "fixtures",
      "data-index": index,
    });
    rect.addEventListener("pointerdown", selectFromEvent);
    els.overlay.appendChild(rect);
  });
  renderDraft();
  renderHandles();
  updateSelectionInfo();
}

function renderLines(kind, className) {
  state.annotation[kind].forEach((line, index) => {
    const item = svgEl("line", {
      x1: line.x1,
      y1: line.y1,
      x2: line.x2,
      y2: line.y2,
      class: `${className}${isSelected(kind, index) ? " selected" : ""}`,
      "data-kind": kind,
      "data-index": index,
    });
    item.addEventListener("pointerdown", selectFromEvent);
    els.overlay.appendChild(item);
  });
}

function renderDraft() {
  if (state.pendingPoint) {
    els.overlay.appendChild(svgEl("circle", { cx: state.pendingPoint.x, cy: state.pendingPoint.y, r: 5, class: "handle" }));
  }
  if (state.draftPoints.length > 0) {
    els.overlay.appendChild(svgEl("polyline", { points: state.draftPoints.map((p) => `${p.x},${p.y}`).join(" "), class: "draft-line" }));
    state.draftPoints.forEach((point) => {
      els.overlay.appendChild(svgEl("circle", { cx: point.x, cy: point.y, r: 4, class: "handle" }));
    });
  }
}

function renderHandles() {
  const selected = state.selected;
  if (!selected) return;
  if (selected.kind === "rooms") {
    selectedItem("rooms")?.polygon.forEach((point, index) => addHandle(point.x, point.y, { pointIndex: index }));
  } else if (lineKinds.has(selected.kind)) {
    const line = selectedItem(selected.kind);
    if (!line) return;
    addHandle(line.x1, line.y1, { endpoint: "start" });
    addHandle(line.x2, line.y2, { endpoint: "end" });
  } else if (selected.kind === "fixtures") {
    const b = selectedItem("fixtures")?.bounds;
    if (!b) return;
    [
      [b.x, b.y, "nw"],
      [b.x + b.width, b.y, "ne"],
      [b.x + b.width, b.y + b.height, "se"],
      [b.x, b.y + b.height, "sw"],
    ].forEach(([x, y, corner]) => addHandle(x, y, { corner }));
  }
}

function addHandle(x, y, meta) {
  const handle = svgEl("circle", { cx: x, cy: y, r: 6, class: "handle" });
  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    state.dragging = { ...state.selected, ...meta };
  });
  els.overlay.appendChild(handle);
}

function selectFromEvent(event) {
  event.stopPropagation();
  state.selected = {
    kind: event.currentTarget.dataset.kind,
    index: Number(event.currentTarget.dataset.index),
  };
  const room = selectedItem("rooms");
  if (room) els.roomTypeSelect.value = room.type ?? "unknown";
  renderOverlay();
}

function onDocumentPointerMove(event) {
  if (!state.dragging || !state.annotation) return;
  const point = svgPoint(event);
  const selected = state.dragging;
  if (selected.kind === "rooms") {
    const room = state.annotation.rooms[selected.index];
    if (room?.polygon?.[selected.pointIndex]) room.polygon[selected.pointIndex] = point;
  } else if (lineKinds.has(selected.kind)) {
    const line = state.annotation[selected.kind][selected.index];
    if (line && selected.endpoint === "start") {
      line.x1 = point.x;
      line.y1 = point.y;
    } else if (line) {
      line.x2 = point.x;
      line.y2 = point.y;
    }
  } else if (selected.kind === "fixtures") {
    moveFixtureCorner(state.annotation.fixtures[selected.index], selected.corner, point);
  }
  markDirty();
  renderOverlay();
}

function moveFixtureCorner(fixture, corner, point) {
  if (!fixture) return;
  const b = fixture.bounds;
  const x2 = b.x + b.width;
  const y2 = b.y + b.height;
  const anchors = {
    nw: [x2, y2],
    ne: [b.x, y2],
    se: [b.x, b.y],
    sw: [x2, b.y],
  };
  const [ax, ay] = anchors[corner] ?? [b.x, b.y];
  b.x = Math.min(ax, point.x);
  b.y = Math.min(ay, point.y);
  b.width = Math.abs(ax - point.x);
  b.height = Math.abs(ay - point.y);
}

function deleteSelected() {
  if (!state.selected || !state.annotation) return;
  const list = state.annotation[state.selected.kind];
  if (!Array.isArray(list)) return;
  list.splice(state.selected.index, 1);
  state.selected = null;
  markDirty();
  renderOverlay();
}

async function saveAnnotation() {
  if (!state.currentCase || !state.annotation) return;
  const response = await fetch(apiUrl("/api/annotation/save"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: state.currentCase.id,
      savedAt: new Date().toISOString(),
      annotation: exportAnnotation(),
    }),
  });
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  state.currentCase = payload.case;
  const index = state.cases.findIndex((item) => item.id === state.currentCase.id);
  if (index >= 0) state.cases[index] = state.currentCase;
  state.dirty = false;
  els.caseStatus.textContent = `已保存：${state.currentCase.labelName}`;
  renderCaseQuickSelect();
  renderCaseList();
}

function exportAnnotation() {
  return {
    ...state.annotation,
    rooms: state.annotation.rooms.map((room) => ({ ...room, polygon: room.polygon.map((point) => [round(point.x), round(point.y)]) })),
    walls: state.annotation.walls.map(exportLine),
    doors: state.annotation.doors.map(exportLine),
    windows: state.annotation.windows.map(exportLine),
    fixtures: state.annotation.fixtures.map((fixture) => ({
      ...fixture,
      bounds: {
        x: round(fixture.bounds.x),
        y: round(fixture.bounds.y),
        width: round(fixture.bounds.width),
        height: round(fixture.bounds.height),
      },
    })),
  };
}

function exportLine(line) {
  return {
    ...line,
    x1: round(line.x1),
    y1: round(line.y1),
    x2: round(line.x2),
    y2: round(line.y2),
    thickness: round(line.thickness ?? 6),
  };
}

function selectedItem(kind) {
  if (!state.selected || state.selected.kind !== kind) return null;
  return state.annotation?.[kind]?.[state.selected.index] ?? null;
}

function isSelected(kind, index) {
  return state.selected?.kind === kind && state.selected?.index === index;
}

function updateSelectionInfo() {
  if (!state.selected) {
    els.selectionInfo.textContent = state.dirty ? "未选择元素，有未保存修改" : "未选择元素";
    return;
  }
  const item = state.annotation[state.selected.kind]?.[state.selected.index];
  els.selectionInfo.textContent = `${state.selected.kind} #${state.selected.index + 1}${item?.type ? ` · ${item.type}` : ""}`;
}

function markDirty() {
  state.dirty = true;
  els.caseStatus.textContent = "有未保存修改";
}

function svgPoint(event) {
  const point = els.overlay.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const converted = point.matrixTransform(els.overlay.getScreenCTM().inverse());
  return { x: round(converted.x), y: round(converted.y) };
}

function svgEl(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function round(value) {
  return Math.round(Number(value) * 10) / 10;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
