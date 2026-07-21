const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml";
const MIN_CANVAS_ZOOM = 0.35;
const MAX_CANVAS_ZOOM = 5;
const THREE_MODULE_URL = "./vendor/three/three.module.js";
const GLTF_LOADER_MODULE_URL = "./vendor/three/examples/jsm/loaders/GLTFLoader.js";
const INTERIOR_CATALOG_URL = "./assets/interiors/catalog.json";
const WALL_HEIGHT_METERS = 2.8;
const DEFAULT_POINT_LIGHT_LUMENS = 800;
const DEFAULT_LINE_LIGHT_LUMENS = 1800;
const DEFAULT_LIGHT_TEMPERATURE_KELVIN = 3000;
const DEFAULT_LIGHT_HEIGHT_MILLIMETERS = 2400;
const THREE_RENDER_DEFAULTS = Object.freeze({
  exposure: 1.08,
  environmentIntensity: 0.72,
  backgroundIntensity: 0.88,
  backgroundBlurriness: 0.22,
  exportScale: 2,
  maxExportDimension: 4096,
  shadowMapSize: 2048,
});
const OUTER_WALL_MIN_MM = 100;
const OUTER_WALL_MAX_MM = 240;
const SNAP_POINT_DISTANCE_MM = 50;
const MANUAL_WALL_MIN_LENGTH_MM = 20;
const RAILING_DEFAULT_HEIGHT_MM = 1100;
const RAILING_DEFAULT_THICKNESS_MM = 50;
const FLOOR_PLAN_AI_PROVIDER = "cubicasa";
const FLOOR_PLAN_AI_PROVIDER_LABELS = {
  cubicasa: "CubiCasa5K 深度学习",
  deepfloorplan: "DeepFloorPlan 深度学习",
  unet: "U-Net 深度学习",
};
const PRODUCT_ROTATE_STEP_DEGREES = 90;
const INTERIOR_CATALOG_SCHEMA = "gewu-interior-catalog-v1";
const INTERIOR_CATEGORY_DEFINITIONS = Object.freeze({
  furniture: { label: "家具", size: [1200, 800, 850], mount: "floor" },
  seating: { label: "座椅沙发", size: [1800, 850, 850], mount: "floor" },
  tables: { label: "桌台", size: [1200, 700, 750], mount: "floor" },
  beds: { label: "床具", size: [1800, 2100, 600], mount: "floor" },
  storage: { label: "柜体收纳", size: [1600, 600, 2200], mount: "floor" },
  kitchen: { label: "厨房设施", size: [1200, 650, 900], mount: "floor" },
  sanitary: { label: "卫浴洁具", size: [800, 600, 800], mount: "floor" },
  appliance: { label: "家用电器", size: [700, 700, 1000], mount: "floor" },
  lighting: { label: "灯具照明", size: [500, 500, 300], mount: "ceiling", elevation: 2500 },
  electronics: { label: "智能影音", size: [1000, 180, 650], mount: "wall", elevation: 1200 },
  textile: { label: "软装织物", size: [1600, 2300, 30], mount: "floor" },
  decor: { label: "装饰陈设", size: [500, 300, 600], mount: "floor" },
  greenery: { label: "绿植", size: [500, 500, 1200], mount: "floor" },
  office: { label: "办公用品", size: [1400, 700, 800], mount: "floor" },
  fitness: { label: "健身器材", size: [1600, 800, 1400], mount: "floor" },
  children: { label: "儿童用品", size: [1000, 700, 900], mount: "floor" },
  pet: { label: "宠物用品", size: [700, 600, 700], mount: "floor" },
  hvac: { label: "暖通设备", size: [900, 300, 350], mount: "wall", elevation: 2200 },
  hardware: { label: "五金配件", size: [350, 180, 350], mount: "wall", elevation: 900 },
  window: { label: "门窗构件", size: [1200, 160, 1500], mount: "wall", elevation: 900 },
  custom: { label: "其他内饰", size: [1000, 800, 1000], mount: "floor" },
});
const OPENING_VARIANTS = {
  door: { kind: "door", label: "门", sill: 0, height: 2100 },
  window: { kind: "window", label: "窗", sill: 900, height: 1200 },
  "high-window": { kind: "window", label: "高窗", sill: 1700, height: 600 },
  "floor-window": { kind: "window", label: "落地窗", sill: 0, height: 2400 },
  "bay-window": { kind: "window", label: "飘窗", sill: 550, height: 1400, projection: 450 },
  opening: { kind: "opening", label: "开口", sill: 0, height: 2100 },
};

const elements = {
  fileInput: document.querySelector("#fileInput"),
  nativeFileInput: document.querySelector("#nativeFileInput"),
  projectFileInput: document.querySelector("#projectFileInput"),
  uploadButton: document.querySelector("#uploadButton"),
  demoButton: document.querySelector("#demoButton"),
  saveProjectButton: document.querySelector("#saveProjectButton"),
  openProjectButton: document.querySelector("#openProjectButton"),
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
  scaleValue: document.querySelector("#scaleValue"),
  calibrationLengthInput: document.querySelector("#calibrationLengthInput"),
  calibrateScaleButton: document.querySelector("#calibrateScaleButton"),
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
  selectedComponentCard: document.querySelector("#selectedComponentCard"),
  selectedComponentTitle: document.querySelector("#selectedComponentTitle"),
  selectedComponentType: document.querySelector("#selectedComponentType"),
  selectedOpeningVariantSelect: document.querySelector("#selectedOpeningVariantSelect"),
  selectedComponentOrientation: document.querySelector("#selectedComponentOrientation"),
  selectedComponentLengthLabel: document.querySelector("#selectedComponentLengthLabel"),
  selectedComponentThicknessLabel: document.querySelector("#selectedComponentThicknessLabel"),
  selectedComponentHeightLabel: document.querySelector("#selectedComponentHeightLabel"),
  selectedComponentLengthInput: document.querySelector("#selectedComponentLengthInput"),
  selectedComponentThicknessInput: document.querySelector("#selectedComponentThicknessInput"),
  selectedComponentHeightInput: document.querySelector("#selectedComponentHeightInput"),
  selectedComponentCoords: document.querySelector("#selectedComponentCoords"),
  selectedDeleteComponentButton: document.querySelector("#selectedDeleteComponentButton"),
  statusPill: document.querySelector("#statusPill"),
  previewCanvas: document.querySelector("#previewCanvas"),
  canvasWrap: document.querySelector("#canvasWrap"),
  emptyState: document.querySelector("#emptyState"),
  overlayTab: document.querySelector("#overlayTab"),
  vectorTab: document.querySelector("#vectorTab"),
  drawWallButton: document.querySelector("#drawWallButton"),
  drawDoorButton: document.querySelector("#drawDoorButton"),
  drawWindowButton: document.querySelector("#drawWindowButton"),
  drawRailingButton: document.querySelector("#drawRailingButton"),
  openInteriorLibraryButton: document.querySelector("#openInteriorLibraryButton"),
  productModelInput: document.querySelector("#productModelInput"),
  interiorCatalogInput: document.querySelector("#interiorCatalogInput"),
  interiorLibraryModal: document.querySelector("#interiorLibraryModal"),
  interiorLibraryCloseButton: document.querySelector("#interiorLibraryCloseButton"),
  interiorCategorySelect: document.querySelector("#interiorCategorySelect"),
  interiorAssetSelect: document.querySelector("#interiorAssetSelect"),
  interiorLibraryStatus: document.querySelector("#interiorLibraryStatus"),
  addInteriorAssetButton: document.querySelector("#addInteriorAssetButton"),
  addInteriorPlaceholderButton: document.querySelector("#addInteriorPlaceholderButton"),
  importInteriorModelButton: document.querySelector("#importInteriorModelButton"),
  importInteriorCatalogButton: document.querySelector("#importInteriorCatalogButton"),
  calibrateToolButton: document.querySelector("#calibrateToolButton"),
  measureToolButton: document.querySelector("#measureToolButton"),
  threeViewport: document.querySelector("#threeViewport"),
  threeStat: document.querySelector("#threeStat"),
  threeRoamButton: document.querySelector("#threeRoamButton"),
  threeLightingButton: document.querySelector("#threeLightingButton"),
  threeRenderButton: document.querySelector("#threeRenderButton"),
  threeResetButton: document.querySelector("#threeResetButton"),
  threeComponentCard: document.querySelector("#threeComponentCard"),
  threeComponentTitle: document.querySelector("#threeComponentTitle"),
  threeComponentType: document.querySelector("#threeComponentType"),
  threeOpeningVariantSelect: document.querySelector("#threeOpeningVariantSelect"),
  threeComponentOrientation: document.querySelector("#threeComponentOrientation"),
  threeComponentLengthLabel: document.querySelector("#threeComponentLengthLabel"),
  threeComponentThicknessLabel: document.querySelector("#threeComponentThicknessLabel"),
  threeComponentHeightLabel: document.querySelector("#threeComponentHeightLabel"),
  threeComponentLengthInput: document.querySelector("#threeComponentLengthInput"),
  threeComponentThicknessInput: document.querySelector("#threeComponentThicknessInput"),
  threeComponentHeightInput: document.querySelector("#threeComponentHeightInput"),
  threeComponentCoords: document.querySelector("#threeComponentCoords"),
  threeDeleteComponentButton: document.querySelector("#threeDeleteComponentButton"),
  threeRenderModal: document.querySelector("#threeRenderModal"),
  threeRenderImage: document.querySelector("#threeRenderImage"),
  threeRenderSaveButton: document.querySelector("#threeRenderSaveButton"),
  threeRenderCloseButton: document.querySelector("#threeRenderCloseButton"),
  lightingModal: document.querySelector("#lightingModal"),
  lightingCloseButton: document.querySelector("#lightingCloseButton"),
  lightingSourceSelect: document.querySelector("#lightingSourceSelect"),
  addPointLightButton: document.querySelector("#addPointLightButton"),
  addLineLightButton: document.querySelector("#addLineLightButton"),
  lightingNameInput: document.querySelector("#lightingNameInput"),
  lightingEnabledInput: document.querySelector("#lightingEnabledInput"),
  lightingColorInput: document.querySelector("#lightingColorInput"),
  lightingTemperatureInput: document.querySelector("#lightingTemperatureInput"),
  lightingBrightnessInput: document.querySelector("#lightingBrightnessInput"),
  lightingHeightInput: document.querySelector("#lightingHeightInput"),
  lightingXInput: document.querySelector("#lightingXInput"),
  lightingYInput: document.querySelector("#lightingYInput"),
  lightingLengthField: document.querySelector("#lightingLengthField"),
  lightingLengthInput: document.querySelector("#lightingLengthInput"),
  lightingRotationField: document.querySelector("#lightingRotationField"),
  lightingRotationInput: document.querySelector("#lightingRotationInput"),
  lightingShadowInput: document.querySelector("#lightingShadowInput"),
  lightingAttachedNote: document.querySelector("#lightingAttachedNote"),
  lightingDeleteButton: document.querySelector("#lightingDeleteButton"),
};

const state = {
  analysisCanvas: null,
  maskImage: null,
  lines: [],
  topology: createEmptyTopology(),
  selectedLineIndex: null,
  selectedOpeningIndex: null,
  selectedOpeningId: null,
  selectedRailingId: null,
  selectedProductId: null,
  selectedCardManualPosition: null,
  selectedCardDrag: null,
  draggedEndpoint: null,
  draggedLine: null,
  draggedOpening: null,
  draggedRailing: null,
  draggedProduct: null,
  draggedProductResize: null,
  hoveredEndpoint: null,
  removedPixels: 0,
  recognitionMode: "-",
  deepLearningInfo: null,
  view: "overlay",
  tool: "select",
  drawingLine: null,
  openingDraft: null,
  railingDraft: null,
  calibrationLine: null,
  measurementLine: null,
  measurements: [],
  manualOpenings: [],
  manualRailings: [],
  productModels: [],
  lightSources: [],
  selectedLightSourceId: null,
  pendingProductCategory: "furniture",
  interiorAssets: new Map(),
  interiorCategoryLabels: new Map(),
  interiorCatalogSources: [],
  interiorCatalogReadyPromise: null,
  hiddenOpeningKeys: [],
  manualMillimetersPerPixel: null,
  beginnerLastResultKey: "",
  beginnerPhonePreviewMode: "plan",
  beginnerPhonePreview: {
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    activeEdit: false,
  },
  beginnerPhoneLayout: {
    resizing: false,
    pointerId: null,
    startY: 0,
    startPreviewHeight: 0,
  },
  beginnerVoice: {
    enabled: false,
    listening: false,
    recognition: null,
    restartTimer: null,
    lastError: "",
    uploadFallbackTimer: null,
    uploadAttemptId: 0,
  },
  undoStack: [],
  clipboard: null,
  sourceName: "floor-plan",
  projectFileHandle: null,
  zoom: 1,
  three: {
    module: null,
    renderer: null,
    scene: null,
    camera: null,
    wallsGroup: null,
    productsGroup: null,
    lightSourcesGroup: null,
    gltfLoaderClass: null,
    readyPromise: null,
    floor: null,
    yaw: -0.72,
    pitch: 0.72,
    radius: 10,
    center: null,
    mode: "orbit",
    roamPosition: null,
    roamYaw: 0,
    roamPitch: 0,
    roamSpeed: 0.35,
    roamBounds: null,
    raycaster: null,
    pointer: null,
    dragging: false,
    dragDistance: 0,
    resizeHandlesGroup: null,
    resizeDrag: null,
    productMoveDrag: null,
    productTransformMode: "move",
    lastX: 0,
    lastY: 0,
    cardX: 16,
    cardY: 16,
    renderBlob: null,
    renderUrl: null,
    renderFileName: "floor-plan-3d-render.png",
    environmentTexture: null,
    keyLight: null,
    fillLight: null,
    hemisphereLight: null,
  },
};

window.__floorPlanState = state;
window.__floorPlanElements = elements;

const ctx = elements.previewCanvas.getContext("2d");

const beginnerUi = {
  launcher: document.querySelector("#modeLauncher"),
  beginnerModeButton: document.querySelector("#beginnerModeButton"),
  advancedModeButton: document.querySelector("#advancedModeButton"),
  modeSwitchButton: document.querySelector("#modeSwitchButton"),
  chatBackButton: document.querySelector("#chatBackButton"),
  chatAdvancedButton: document.querySelector("#chatAdvancedButton"),
  chatUploadButton: document.querySelector("#chatUploadButton"),
  chatDemoButton: document.querySelector("#chatDemoButton"),
  chatAiButton: document.querySelector("#chatAiButton"),
  chatBrowserButton: document.querySelector("#chatBrowserButton"),
  chatRegenerateButton: document.querySelector("#chatRegenerateButton"),
  chatExportButton: document.querySelector("#chatExportButton"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  voiceToggleButton: document.querySelector("#voiceToggleButton"),
  chatMessages: document.querySelector("#chatMessages"),
  beginnerChat: document.querySelector("#beginnerChat"),
  phonePreview: document.querySelector(".phone-preview"),
  phonePreviewCanvas: document.querySelector("#phonePreviewCanvas"),
  phonePreviewLabel: document.querySelector("#phonePreviewLabel"),
  phoneChatResizer: document.querySelector("#phoneChatResizer"),
  chatStatusText: document.querySelector("#chatStatusText"),
  chatImageText: document.querySelector("#chatImageText"),
  chatWallText: document.querySelector("#chatWallText"),
  chatRoomText: document.querySelector("#chatRoomText"),
  chatOpeningText: document.querySelector("#chatOpeningText"),
  chatModeText: document.querySelector("#chatModeText"),
};

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

function getMillimetersPerPixel(settings) {
  if (state.manualMillimetersPerPixel) return state.manualMillimetersPerPixel;
  return OUTER_WALL_MAX_MM / Math.max(1, settings.maxThickness);
}

function pxToMillimeters(value, settings) {
  return value * getMillimetersPerPixel(settings);
}

function millimetersToPixels(value, settings) {
  return value / Math.max(0.0001, getMillimetersPerPixel(settings));
}

function pxAreaToSquareMillimeters(value, settings) {
  const millimetersPerPixel = getMillimetersPerPixel(settings);
  return value * millimetersPerPixel * millimetersPerPixel;
}

function formatMillimeters(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} m`;
  return `${Math.round(value)} mm`;
}

function formatSquareMillimeters(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)} m2`;
  return `${Math.round(value)} mm2`;
}

function formatPhysicalLength(pixels, settings) {
  return formatMillimeters(pxToMillimeters(pixels, settings));
}

function physicalWallThicknessMillimeters(pixels, settings) {
  return clamp(pxToMillimeters(pixels, settings), OUTER_WALL_MIN_MM, OUTER_WALL_MAX_MM);
}

function visualWallThicknessPixels(line, settings) {
  return millimetersToPixels(physicalWallThicknessMillimeters(line.thickness, settings), settings);
}

function snapPointDistancePixels(settings) {
  return Math.max(1, millimetersToPixels(SNAP_POINT_DISTANCE_MM, settings));
}

function manualWallMinLengthPixels(settings) {
  return Math.max(2, millimetersToPixels(MANUAL_WALL_MIN_LENGTH_MM, settings));
}

function lineHeightMillimeters(line) {
  return Math.max(100, Number(line && line.heightMillimeters) || WALL_HEIGHT_METERS * 1000);
}

function lineHeightMeters(line) {
  return lineHeightMillimeters(line) / 1000;
}

function syncControlLabels() {
  const settings = getSettings();
  const millimetersPerPixel = getMillimetersPerPixel(settings);
  elements.thresholdValue.value = String(settings.threshold);
  elements.minLengthValue.value = formatPhysicalLength(settings.minLength, settings);
  elements.mergeGapValue.value = formatPhysicalLength(settings.mergeGap, settings);
  elements.maxThicknessValue.value = formatMillimeters(physicalWallThicknessMillimeters(settings.maxThickness, settings));
  const scaleMode = state.manualMillimetersPerPixel ? "已标定" : "比例估算";
  elements.scaleValue.textContent = `${scaleMode}：1 px ≈ ${millimetersPerPixel.toFixed(1)} mm，外墙 ${OUTER_WALL_MIN_MM}-${OUTER_WALL_MAX_MM} mm`;
  elements.minNoiseAreaValue.value = formatSquareMillimeters(pxAreaToSquareMillimeters(settings.minNoiseArea, settings));
  elements.minWallThicknessValue.value = formatMillimeters(physicalWallThicknessMillimeters(settings.minWallThickness, settings));
  elements.openingMinWidthValue.value = formatPhysicalLength(settings.openingMinWidth, settings);
  elements.openingMaxWidthValue.value = formatPhysicalLength(settings.openingMaxWidth, settings);
  updateSelectedComponentInfo();
}

function setStatus(text) {
  elements.statusPill.textContent = text;
  updateBeginnerSummary();
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
  updateSelectedComponentInfo();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneLine(line) {
  return { ...line };
}

function cloneMeasurement(measurement) {
  return { ...measurement, start: { ...measurement.start }, end: { ...measurement.end } };
}

function cloneOpening(opening) {
  return { ...opening };
}

function cloneRailing(railing) {
  return { ...railing };
}

function cloneProductMeta(product) {
  const { object, restoringModel, assetRestorePromise, collisionBlocked, ...meta } = product;
  return { ...meta };
}

function cloneLightSource(source) {
  return { ...source };
}

function pushUndoSnapshot(label) {
  state.undoStack.push({
    label,
    lines: state.lines.map(cloneLine),
    measurements: state.measurements.map(cloneMeasurement),
    manualOpenings: state.manualOpenings.map(cloneOpening),
    manualRailings: state.manualRailings.map(cloneRailing),
    productModels: state.productModels.map(cloneProductMeta),
    lightSources: state.lightSources.map(cloneLightSource),
    hiddenOpeningKeys: [...state.hiddenOpeningKeys],
    selectedLineIndex: state.selectedLineIndex,
    selectedOpeningIndex: state.selectedOpeningIndex,
    selectedOpeningId: state.selectedOpeningId,
    selectedRailingId: state.selectedRailingId,
    selectedProductId: state.selectedProductId,
    selectedLightSourceId: state.selectedLightSourceId,
    recognitionMode: state.recognitionMode,
    manualMillimetersPerPixel: state.manualMillimetersPerPixel,
  });
  if (state.undoStack.length > 40) state.undoStack.shift();
}

function undoLastEdit() {
  const snapshot = state.undoStack.pop();
  if (!snapshot) {
    setStatus("没有可撤回");
    return;
  }
  state.lines = snapshot.lines.map(cloneLine);
  state.measurements = (snapshot.measurements || []).map(cloneMeasurement);
  state.manualOpenings = (snapshot.manualOpenings || []).map(cloneOpening);
  state.manualRailings = (snapshot.manualRailings || []).map(cloneRailing);
  clearProductModels();
  state.productModels = (snapshot.productModels || []).map((product) => normalizeProductMetadata({ ...product, object: null }));
  clearLightSources();
  state.lightSources = (snapshot.lightSources || []).map(normalizeLightSource);
  state.hiddenOpeningKeys = [...(snapshot.hiddenOpeningKeys || [])];
  state.selectedLineIndex = snapshot.selectedLineIndex;
  state.selectedOpeningIndex = snapshot.selectedOpeningIndex ?? null;
  state.selectedOpeningId = snapshot.selectedOpeningId || null;
  state.selectedRailingId = snapshot.selectedRailingId || null;
  state.selectedProductId = snapshot.selectedProductId || null;
  state.selectedLightSourceId = snapshot.selectedLightSourceId || null;
  if (state.selectedProductId && !state.productModels.some((product) => product.id === state.selectedProductId)) state.selectedProductId = null;
  if (state.selectedLightSourceId && !state.lightSources.some((source) => source.id === state.selectedLightSourceId)) state.selectedLightSourceId = null;
  state.manualMillimetersPerPixel = snapshot.manualMillimetersPerPixel;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.draggedProduct = null;
  state.draggedProductResize = null;
  state.three.productMoveDrag = null;
  state.hoveredEndpoint = null;
  state.drawingLine = null;
  state.openingDraft = null;
  state.railingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  state.recognitionMode = snapshot.recognitionMode;
  state.deepLearningInfo = null;
  state.topology = analyzeTopology(state.lines, getSettings());
  syncControlLabels();
  updateStats();
  renderPreview();
  updateThreeModel(false);
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus("已撤回");
}

function ensureDrawingCanvas() {
  if (state.analysisCanvas) return true;
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 620;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  state.analysisCanvas = canvas;
  state.maskImage = null;
  state.lines = [];
  state.topology = createEmptyTopology();
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.draggedProduct = null;
  state.draggedProductResize = null;
  state.three.productMoveDrag = null;
  state.hoveredEndpoint = null;
  state.drawingLine = null;
  state.openingDraft = null;
  state.railingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  state.measurements = [];
  state.manualOpenings = [];
  state.manualRailings = [];
  clearProductModels();
  clearLightSources();
  state.hiddenOpeningKeys = [];
  state.manualMillimetersPerPixel = null;
  state.undoStack = [];
  state.removedPixels = 0;
  state.recognitionMode = "manual";
  state.deepLearningInfo = null;
  state.sourceName = "manual-floor-plan";
  state.projectFileHandle = null;
  fitCanvasToImage(state.analysisCanvas);
  elements.emptyState.hidden = true;
  elements.imageStat.textContent = `${state.analysisCanvas.width} x ${state.analysisCanvas.height}`;
  elements.processButton.disabled = false;
  elements.saveProjectButton.disabled = false;
  updateStats();
  renderPreview();
  updateThreeModel(true);
  return true;
}

async function loadImageFromFile(file) {
  try {
    setStatus("读取中");
    const canvas = await fileToCanvas(file);
    state.analysisCanvas = createScaledCanvas(canvas);
    state.maskImage = null;
    state.deepLearningInfo = null;
    state.lines = [];
    state.topology = createEmptyTopology();
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.selectedProductId = null;
    state.draggedEndpoint = null;
    state.draggedLine = null;
    state.draggedOpening = null;
    state.draggedRailing = null;
    state.draggedProduct = null;
    state.draggedProductResize = null;
    state.three.productMoveDrag = null;
    state.hoveredEndpoint = null;
    state.drawingLine = null;
    state.openingDraft = null;
    state.railingDraft = null;
    state.calibrationLine = null;
    state.measurementLine = null;
    state.measurements = [];
    state.manualOpenings = [];
    state.manualRailings = [];
    clearProductModels();
    clearLightSources();
    state.hiddenOpeningKeys = [];
    state.manualMillimetersPerPixel = null;
    state.undoStack = [];
    state.sourceName = file.name.replace(/\.[^.]+$/, "") || "floor-plan";
    state.projectFileHandle = null;
    announceBeginnerImageLoaded(file.name);
    fitCanvasToImage(state.analysisCanvas);
    elements.emptyState.hidden = true;
    elements.imageStat.textContent = `${state.analysisCanvas.width} x ${state.analysisCanvas.height}`;
    elements.saveProjectButton.disabled = false;
    renderSourceImageOnly();
    updateThreeModel(true);
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
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.hoveredEndpoint = null;
  state.drawingLine = null;
  state.openingDraft = null;
  state.railingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  state.measurements = [];
  state.manualOpenings = [];
  state.manualRailings = [];
  state.hiddenOpeningKeys = [];
  state.undoStack = [];
  const settings = getSettings();
  if (settings.recognitionMode === "deep-learning") {
    runDeepLearningRecognition(settings).catch((error) => {
      console.warn("Floor-plan deep learning recognition unavailable, falling back to AI/CV segmentation.", error);
      runBackendRecognition(settings, "deep-learning-fallback").catch(() => runBrowserRecognition(settings, "browser-fallback"));
    });
  } else if (settings.recognitionMode === "ai-cv") {
    runBackendRecognition(settings).catch(() => runBrowserRecognition(settings, "browser-fallback"));
  } else {
    runBrowserRecognition(settings, "browser-rules");
  }
}

async function runBackendRecognition(settings, fallbackMode = null) {
  const response = await fetch("/api/segment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: state.analysisCanvas.toDataURL("image/png"), settings }),
  });
  if (!response.ok) throw new Error(`分割服务返回 ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  state.maskImage = result.mask ? await loadImage(result.mask) : null;
  finishRecognition(result.walls || [], settings, fallbackMode || result.mode || "ai-cv");
}

async function runDeepLearningRecognition(settings) {
  const response = await fetch(floorPlanDeepLearningEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schemaVersion: "floorplan-ai-v1",
      provider: FLOOR_PLAN_AI_PROVIDER,
      image: state.analysisCanvas.toDataURL("image/png"),
      imageMeta: {
        width: state.analysisCanvas.width,
        height: state.analysisCanvas.height,
      },
      settings,
    }),
  });
  if (!response.ok) throw new Error(`深度学习读图服务返回 ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  state.maskImage = result.debug?.wallMask ? await loadImage(result.debug.wallMask) : result.masks?.wall ? await loadImage(result.masks.wall) : null;
  const converted = convertDeepLearningRecognitionResult(result, settings);
  finishRecognition(converted.lines, settings, result.mode || "deep-learning", {
    openings: converted.openings,
    deepLearning: {
      provider: result.provider || FLOOR_PLAN_AI_PROVIDER,
      model: result.model || result.debug?.model?.name || result.mode || "deep-learning",
      status: result.status || "unknown",
      active: typeof result.debug?.model?.active === "boolean" ? result.debug.model.active : result.status === "ok",
      confidence: result.confidence?.overall,
      rooms: result.rooms?.length || 0,
      fixtures: result.fixtures?.length || 0,
    },
  });
}

function floorPlanDeepLearningEndpoint() {
  return window.location.protocol === "file:"
    ? "http://127.0.0.1:8010/api/floorplan/recognize"
    : "/api/floorplan/recognize";
}

function floorPlanAiProviderLabel(provider = FLOOR_PLAN_AI_PROVIDER) {
  return FLOOR_PLAN_AI_PROVIDER_LABELS[provider] || `${provider} 深度学习`;
}

function floorPlanAiCoordinateScale(payload) {
  const image = payload?.image || {};
  return {
    x: state.analysisCanvas.width / Math.max(1, Number(image.width) || state.analysisCanvas.width),
    y: state.analysisCanvas.height / Math.max(1, Number(image.height) || state.analysisCanvas.height),
  };
}

function scaleDeepLearningLine(item, scale) {
  const source = item?.line || item;
  return {
    x1: Number(source?.x1 || 0) * scale.x,
    y1: Number(source?.y1 || 0) * scale.y,
    x2: Number(source?.x2 || 0) * scale.x,
    y2: Number(source?.y2 || 0) * scale.y,
  };
}

function deepLearningWallToLine(item, scale, index) {
  const line = scaleDeepLearningLine(item, scale);
  if (![line.x1, line.y1, line.x2, line.y2].every(Number.isFinite)) return null;
  const horizontal = Math.abs(line.x2 - line.x1) >= Math.abs(line.y2 - line.y1);
  const thickness = Math.max(3, Number(item?.thickness || 0) * (horizontal ? scale.y : scale.x) || 5);
  const wall = horizontal
    ? makeLine("horizontal", Math.min(line.x1, line.x2), (line.y1 + line.y2) / 2, Math.max(line.x1, line.x2), (line.y1 + line.y2) / 2, thickness)
    : makeLine("vertical", (line.x1 + line.x2) / 2, Math.min(line.y1, line.y2), (line.x1 + line.x2) / 2, Math.max(line.y1, line.y2), thickness);
  wall.id = item?.id || `deep-wall-${index + 1}`;
  wall.confidence = Number(item?.confidence || 0.72);
  wall.source = item?.source || "deep-learning";
  return wall;
}

function deepLearningOpeningToManualOpening(item, scale, kind, index, lines, settings) {
  const line = scaleDeepLearningLine(item, scale);
  if (![line.x1, line.y1, line.x2, line.y2].every(Number.isFinite)) return null;
  const horizontal = Math.abs(line.x2 - line.x1) >= Math.abs(line.y2 - line.y1);
  const orientation = horizontal ? "horizontal" : "vertical";
  const opening = horizontal
    ? {
        orientation,
        x1: Math.min(line.x1, line.x2),
        y1: (line.y1 + line.y2) / 2,
        x2: Math.max(line.x1, line.x2),
        y2: (line.y1 + line.y2) / 2,
      }
    : {
        orientation,
        x1: (line.x1 + line.x2) / 2,
        y1: Math.min(line.y1, line.y2),
        x2: (line.x1 + line.x2) / 2,
        y2: Math.max(line.y1, line.y2),
      };
  opening.width = Math.max(1, getLineEnd(opening, orientation) - getLineStart(opening, orientation));
  if (opening.width < Math.max(8, settings.minWallThickness * 3)) return null;
  const hostWall = nearestLineForOpening(opening, lines, settings);
  const variant = defaultOpeningVariant(kind);
  return {
    ...opening,
    id: item?.id || `deep-${kind}-${index + 1}`,
    kind,
    variant,
    hostWall: hostWall?.id || null,
    leftWall: null,
    rightWall: null,
    leftThickness: hostWall?.thickness || settings.maxThickness,
    rightThickness: hostWall?.thickness || settings.maxThickness,
    sillHeightMillimeters: OPENING_VARIANTS[variant].sill,
    openingHeightMillimeters: OPENING_VARIANTS[variant].height,
    confidence: Number(item?.confidence || 0.62),
    widthMm: round(pxToMillimeters(opening.width, settings)),
    source: item?.source || "deep-learning",
  };
}

function nearestLineForOpening(opening, lines, settings) {
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness) * 1.4;
  let best = null;
  for (const line of lines) {
    if (line.orientation !== opening.orientation) continue;
    const axisDelta = opening.orientation === "horizontal" ? Math.abs(opening.y1 - line.y1) : Math.abs(opening.x1 - line.x1);
    if (axisDelta > tolerance) continue;
    const overlap = Math.min(getLineEnd(line, line.orientation), getLineEnd(opening, opening.orientation)) - Math.max(getLineStart(line, line.orientation), getLineStart(opening, opening.orientation));
    if (overlap <= 0) continue;
    const score = overlap - axisDelta;
    if (!best || score > best.score) best = { line, score };
  }
  return best?.line || null;
}

function convertDeepLearningRecognitionResult(payload, settings) {
  const scale = floorPlanAiCoordinateScale(payload);
  const lines = (payload?.walls || [])
    .map((wall, index) => deepLearningWallToLine(wall, scale, index))
    .filter(Boolean)
    .filter((line) => line.length >= recognitionSupportMinLength(settings));
  const openings = [
    ...(payload?.doors || []).map((door, index) => deepLearningOpeningToManualOpening(door, scale, "door", index, lines, settings)),
    ...(payload?.windows || []).map((windowItem, index) => deepLearningOpeningToManualOpening(windowItem, scale, "window", index, lines, settings)),
    ...(payload?.openings || []).map((opening, index) => deepLearningOpeningToManualOpening(opening, scale, opening?.kind || "opening", index, lines, settings)),
  ].filter(Boolean);
  return { lines, openings };
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

function finishRecognition(lines, settings, mode, options = {}) {
  const supportMinLength = recognitionSupportMinLength(settings);
  state.lines = lines
    .filter((line) => line.length >= supportMinLength)
    .sort((a, b) => b.length - a.length)
    .map((line, index) => ({ ...line, id: line.id || `wall-${index + 1}` }));
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.hoveredEndpoint = null;
  state.drawingLine = null;
  state.openingDraft = null;
  state.railingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  state.measurements = [];
  state.manualOpenings = (options.openings || []).map(cloneOpening);
  state.manualRailings = [];
  state.hiddenOpeningKeys = [];
  state.undoStack = [];
  state.topology = analyzeTopology(state.lines, settings);
  state.recognitionMode = mode;
  state.deepLearningInfo = options.deepLearning || null;
  updateStats();
  renderPreview();
  updateThreeModel(true);
  elements.exportJsonButton.disabled = !state.lines.length;
  elements.processButton.disabled = !state.analysisCanvas;
  elements.saveProjectButton.disabled = !state.analysisCanvas;
  setStatus("已生成");
  announceBeginnerRecognition();
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

function recognitionSupportMinLength(settings) {
  return Math.max(settings.minWallThickness * 8, settings.minLength * 0.55, 24);
}

function detectHorizontalWalls(source, settings) {
  const groups = [];
  const { width, height, mask } = source;
  const minRunLength = recognitionSupportMinLength(settings);
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      while (x < width && !mask[y * width + x]) x += 1;
      const start = x;
      while (x < width && mask[y * width + x]) x += 1;
      const end = x - 1;
      if (end - start + 1 >= minRunLength) addRun(groups, { start, end, axis: y }, "horizontal", settings);
    }
  }
  return finalizeGroups(groups, "horizontal", settings);
}

function detectVerticalWalls(source, settings) {
  const groups = [];
  const { width, height, mask } = source;
  const minRunLength = recognitionSupportMinLength(settings);
  for (let x = 0; x < width; x += 1) {
    let y = 0;
    while (y < height) {
      while (y < height && !mask[y * width + x]) y += 1;
      const start = y;
      while (y < height && mask[y * width + x]) y += 1;
      const end = y - 1;
      if (end - start + 1 >= minRunLength) addRun(groups, { start, end, axis: x }, "vertical", settings);
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
  const openingCandidates = findOpenings(horizontal, vertical, settings, tolerance);
  const endPiers = findEndPiers(lines, intersections, openingCandidates, settings, tolerance);
  const openings = applyOpeningOverrides(scoreOpenings(openingCandidates, closedLines, intersections, endPiers, settings, tolerance));
  const constructibleOpenings = openings.filter(isConstructibleOpening);
  const pierIds = new Set(endPiers.filter((pier) => pier.excludeFromRooms).map((pier) => pier.wall));
  const roomLines = closedLines.filter((line) => !pierIds.has(line.id));
  const rooms = findClosedRooms(
    roomLines.filter((line) => line.orientation === "horizontal"),
    roomLines.filter((line) => line.orientation === "vertical"),
    settings,
    tolerance,
  );
  const breaks = findBreaks(roomLines, intersections, constructibleOpenings, tolerance);
  return { intersections, breaks, openings, endPiers, rooms };
}

function getClosedWallLines(settings = getSettings()) {
  if (!state.lines.length) return [];
  const tolerance = Math.max(8, settings.mergeGap + settings.minWallThickness);
  return autoCloseLineIntersections(state.lines, settings, tolerance);
}

function autoCloseLineIntersections(lines, settings, tolerance, options = {}) {
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

  snapNearbyLineEndpoints(closed, snapTolerance, options);
  for (const line of closed) normalizeEditedLine(line);
  return closed;
}

function closureTolerance(settings, tolerance) {
  return snapPointDistancePixels(settings);
}

function snapNearbyLineEndpoints(lines, tolerance, options = {}) {
  for (let leftIndex = 0; leftIndex < lines.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < lines.length; rightIndex += 1) {
      const leftLine = lines[leftIndex];
      const rightLine = lines[rightIndex];
      if (options.skipEndpointSnapLineId && (leftLine.id === options.skipEndpointSnapLineId || rightLine.id === options.skipEndpointSnapLineId)) continue;
      for (const leftEnd of ["start", "end"]) {
        for (const rightEnd of ["start", "end"]) {
          const leftPoint = lineEndpoint(leftLine, leftEnd);
          const rightPoint = lineEndpoint(rightLine, rightEnd);
          if (distance(leftPoint, rightPoint) > tolerance) continue;
          const snapPoint = { x: Math.round((leftPoint.x + rightPoint.x) / 2), y: Math.round((leftPoint.y + rightPoint.y) / 2) };
          setLineEndpoint(leftLine, leftEnd, snapPoint);
          setLineEndpoint(rightLine, rightEnd, snapPoint);
        }
      }
    }
  }
}

function lineEndpoint(line, end) {
  return end === "start" ? { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
}

function setLineEndpoint(line, end, point) {
  if (line.orientation === "horizontal") {
    line.y1 = point.y;
    line.y2 = point.y;
    if (end === "start") line.x1 = point.x;
    else line.x2 = point.x;
    return;
  }
  line.x1 = point.x;
  line.x2 = point.x;
  if (end === "start") line.y1 = point.y;
  else line.y2 = point.y;
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
  return dedupeOpenings([
    ...findGaps(horizontal, "horizontal", settings, tolerance),
    ...findGaps(vertical, "vertical", settings, tolerance),
  ], tolerance).map((opening, index) => ({ ...opening, id: `opening-${index + 1}` }));
}

function findGaps(lines, orientation, settings, tolerance) {
  const openings = [];
  const groups = groupByAxis(lines, orientation, tolerance);
  const maxWidth = openingCandidateMaxWidth(settings);
  for (const group of groups) {
    const sorted = group.lines.sort((a, b) => getLineStart(a, orientation) - getLineStart(b, orientation));
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const left = sorted[index];
      const right = sorted[index + 1];
      const gap = getLineStart(right, orientation) - getLineEnd(left, orientation);
      if (gap < settings.openingMinWidth || gap > maxWidth) continue;
      const axis = getLineAxis(left, orientation);
      const axisDelta = Math.abs(getLineAxis(left, orientation) - getLineAxis(right, orientation));
      const base = {
        leftWall: left.id,
        rightWall: right.id,
        leftThickness: left.thickness,
        rightThickness: right.thickness,
        axisDelta,
      };
      openings.push(
        orientation === "horizontal"
          ? { ...base, orientation, x1: getLineEnd(left, orientation), y1: axis, x2: getLineStart(right, orientation), y2: axis, width: gap }
          : { ...base, orientation, x1: axis, y1: getLineEnd(left, orientation), x2: axis, y2: getLineStart(right, orientation), width: gap },
      );
    }
  }
  return openings;
}

function openingCandidateMaxWidth(settings) {
  return settings.openingMaxWidth + settings.maxThickness;
}

function dedupeOpenings(openings, tolerance) {
  const unique = [];
  for (const opening of openings) {
    const duplicate = unique.some((candidate) => {
      if (candidate.orientation !== opening.orientation) return false;
      const axisDelta = opening.orientation === "horizontal" ? Math.abs(candidate.y1 - opening.y1) : Math.abs(candidate.x1 - opening.x1);
      if (axisDelta > tolerance) return false;
      const startDelta = opening.orientation === "horizontal" ? Math.abs(candidate.x1 - opening.x1) : Math.abs(candidate.y1 - opening.y1);
      const endDelta = opening.orientation === "horizontal" ? Math.abs(candidate.x2 - opening.x2) : Math.abs(candidate.y2 - opening.y2);
      return startDelta <= tolerance && endDelta <= tolerance;
    });
    if (!duplicate) unique.push(opening);
  }
  return unique;
}

function scoreOpenings(openings, lines, intersections, endPiers, settings, tolerance) {
  return openings.map((opening) => {
    const widthMm = round(pxToMillimeters(opening.width, settings));
    const thicknessMatch = opening.leftThickness && opening.rightThickness
      ? clamp(1 - Math.abs(opening.leftThickness - opening.rightThickness) / Math.max(opening.leftThickness, opening.rightThickness, 1), 0, 1)
      : 0.5;
    const axisAlignment = clamp(1 - (opening.axisDelta || 0) / Math.max(1, tolerance), 0, 1);
    const jambEvidence = openingJambEvidence(opening, lines, settings, tolerance);
    const doorArcEvidence = openingDoorArcEvidence(opening, settings);
    const nearEndPier = openingNearEndPier(opening, endPiers, tolerance);
    const widthDoorScore = doorWidthScore(widthMm);
    const doorDefinition = scoreDoorDefinition({
      widthMm,
      widthDoorScore,
      thicknessMatch,
      axisAlignment,
      jambEvidence,
      doorArcEvidence,
      nearEndPier,
    });
    const confidence = clamp(
      0.22 * widthDoorScore +
        0.2 * thicknessMatch +
        0.18 * axisAlignment +
        0.2 * jambEvidence +
        0.16 * doorArcEvidence +
        0.04 * Number(nearEndPier),
      0,
      0.98,
    );
    const kind = classifyOpening({
      widthMm,
      confidence,
      widthDoorScore,
      jambEvidence,
      doorArcEvidence,
      nearEndPier,
      axisAlignment,
      thicknessMatch,
      doorDefinitionScore: doorDefinition.score,
      doorGeometryMatch: doorDefinition.geometryMatch,
      doorEvidenceMatch: doorDefinition.evidenceMatch,
    });
    return {
      ...opening,
      kind,
      variant: defaultOpeningVariant(kind),
      sillHeightMillimeters: OPENING_VARIANTS[defaultOpeningVariant(kind)].sill,
      openingHeightMillimeters: OPENING_VARIANTS[defaultOpeningVariant(kind)].height,
      confidence: round(confidence),
      widthMm,
      wallThicknessMatch: round(thicknessMatch),
      axisAlignment: round(axisAlignment),
      jambEvidence: round(jambEvidence),
      doorArcEvidence: round(doorArcEvidence),
      nearEndPier,
      doorDefinitionScore: round(doorDefinition.score),
      doorGeometryMatch: doorDefinition.geometryMatch,
      doorEvidenceMatch: doorDefinition.evidenceMatch,
    };
  });
}

function doorWidthScore(widthMm) {
  if (widthMm >= 600 && widthMm <= 1200) return 1;
  if (widthMm >= 500 && widthMm <= 1400) return 0.68;
  if (widthMm >= 350 && widthMm <= 1800) return 0.34;
  return 0.12;
}

function scoreDoorDefinition(evidence) {
  const geometryMatch = evidence.widthDoorScore >= 0.68 && evidence.axisAlignment >= 0.72 && evidence.thicknessMatch >= 0.72;
  const evidenceMatch = evidence.doorArcEvidence >= 0.34 || evidence.jambEvidence >= 0.45 || (evidence.nearEndPier && (evidence.doorArcEvidence >= 0.22 || evidence.jambEvidence >= 0.25));
  const score = clamp(
    0.28 * evidence.widthDoorScore +
      0.22 * evidence.axisAlignment +
      0.2 * evidence.thicknessMatch +
      0.16 * evidence.doorArcEvidence +
      0.1 * evidence.jambEvidence +
      0.04 * Number(evidence.nearEndPier),
    0,
    0.98,
  );
  return { score, geometryMatch, evidenceMatch };
}

function classifyOpening(evidence) {
  const hasDoorEvidence = evidence.doorEvidenceMatch;
  const hasOpeningEvidence = hasDoorEvidence || evidence.nearEndPier || evidence.doorArcEvidence >= 0.22 || evidence.jambEvidence >= 0.25;
  if (!hasOpeningEvidence) return "uncertain";
  if (evidence.widthMm >= 900 && evidence.doorArcEvidence < 0.22 && evidence.jambEvidence < 0.45 && evidence.confidence < 0.64) return "window";
  if (evidence.doorGeometryMatch && evidence.doorDefinitionScore >= 0.68 && evidence.confidence >= 0.66 && hasDoorEvidence) return "door";
  if (evidence.confidence >= 0.52) return "opening";
  return "uncertain";
}

function openingJambEvidence(opening, lines, settings, tolerance) {
  const perpendicular = opening.orientation === "horizontal" ? "vertical" : "horizontal";
  const endpoints = [
    { x: opening.x1, y: opening.y1 },
    { x: opening.x2, y: opening.y2 },
  ];
  let matched = 0;
  for (const endpoint of endpoints) {
    const hasJamb = lines.some((line) => {
      if (line.orientation !== perpendicular) return false;
      if (line.id === opening.leftWall || line.id === opening.rightWall) return false;
      if (line.length < manualWallMinLengthPixels(settings) || line.length > settings.openingMaxWidth * 1.4) return false;
      return distanceToSegment(endpoint, line) <= tolerance * 1.1 || endpointDistanceToLine(line, endpoint) <= tolerance;
    });
    if (hasJamb) matched += 1;
  }
  return matched / endpoints.length;
}

function endpointDistanceToLine(line, point) {
  return Math.min(distance(point, { x: line.x1, y: line.y1 }), distance(point, { x: line.x2, y: line.y2 }));
}

function openingNearEndPier(opening, endPiers, tolerance) {
  return endPiers.some((pier) => {
    const endpoints = [
      { x: opening.x1, y: opening.y1 },
      { x: opening.x2, y: opening.y2 },
    ];
    return endpoints.some((point) => distanceToSegment(point, pier) <= tolerance * 1.3 || endpointDistanceToLine(pier, point) <= tolerance * 1.3);
  });
}

function openingDoorArcEvidence(opening, settings) {
  if (!state.analysisCanvas) return 0;
  const context = state.analysisCanvas.getContext("2d");
  const width = state.analysisCanvas.width;
  const height = state.analysisCanvas.height;
  const scanRadius = Math.max(8, opening.width * 0.8);
  const wallBand = Math.max(3, visualOpeningWallBand(opening, settings));
  let darkPixels = 0;
  let samples = 0;
  const minX = clamp(Math.floor(Math.min(opening.x1, opening.x2) - scanRadius), 0, width - 1);
  const maxX = clamp(Math.ceil(Math.max(opening.x1, opening.x2) + scanRadius), 0, width - 1);
  const minY = clamp(Math.floor(Math.min(opening.y1, opening.y2) - scanRadius), 0, height - 1);
  const maxY = clamp(Math.ceil(Math.max(opening.y1, opening.y2) + scanRadius), 0, height - 1);
  const image = context.getImageData(minX, minY, Math.max(1, maxX - minX + 1), Math.max(1, maxY - minY + 1));
  for (let y = 0; y < image.height; y += 2) {
    for (let x = 0; x < image.width; x += 2) {
      const px = minX + x;
      const py = minY + y;
      if (opening.orientation === "horizontal" && Math.abs(py - opening.y1) <= wallBand) continue;
      if (opening.orientation === "vertical" && Math.abs(px - opening.x1) <= wallBand) continue;
      const nearStart = Math.hypot(px - opening.x1, py - opening.y1) <= scanRadius;
      const nearEnd = Math.hypot(px - opening.x2, py - opening.y2) <= scanRadius;
      if (!nearStart && !nearEnd) continue;
      const index = (y * image.width + x) * 4;
      const lightness = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      samples += 1;
      if (image.data[index + 3] > 20 && lightness < settings.threshold) darkPixels += 1;
    }
  }
  if (!samples) return 0;
  return clamp((darkPixels / samples) * 8, 0, 1);
}

function visualOpeningWallBand(opening, settings) {
  const left = Number(opening.leftThickness) || settings.maxThickness;
  const right = Number(opening.rightThickness) || settings.maxThickness;
  return visualWallThicknessPixels({ thickness: (left + right) / 2 }, settings) * 0.62;
}

function applyOpeningOverrides(openings) {
  const hidden = new Set(state.hiddenOpeningKeys);
  const visible = openings.filter((opening) => !hidden.has(openingKey(opening)));
  return [...visible, ...state.manualOpenings.map(cloneOpening)];
}

function openingKey(opening) {
  const x1 = Math.round(opening.x1);
  const y1 = Math.round(opening.y1);
  const x2 = Math.round(opening.x2);
  const y2 = Math.round(opening.y2);
  return [opening.leftWall || "-", opening.rightWall || "-", opening.kind || "opening", opening.orientation, x1, y1, x2, y2].join(":");
}

function selectedOpening() {
  if (state.selectedOpeningId) {
    return state.topology.openings.find((opening) => opening.id === state.selectedOpeningId) || state.manualOpenings.find((opening) => opening.id === state.selectedOpeningId) || null;
  }
  if (state.selectedOpeningIndex === null) return null;
  return state.topology.openings[state.selectedOpeningIndex] || null;
}

function isConstructibleOpening(opening) {
  return opening && opening.kind !== "uncertain";
}

function constructibleOpenings(openings = state.topology.openings || []) {
  return openings.filter(isConstructibleOpening);
}

function defaultOpeningVariant(kind) {
  if (kind === "door") return "door";
  if (kind === "window") return "window";
  if (kind === "opening") return "opening";
  return "opening";
}

function openingVariant(opening) {
  const variant = opening && opening.variant;
  if (variant && OPENING_VARIANTS[variant]) return variant;
  return defaultOpeningVariant(opening && opening.kind);
}

function openingVariantDefinition(opening) {
  return OPENING_VARIANTS[openingVariant(opening)] || OPENING_VARIANTS.opening;
}

function syncOpeningKindFromVariant(opening) {
  const definition = openingVariantDefinition(opening);
  opening.kind = definition.kind;
  return opening;
}

function openingProfileMillimeters(opening) {
  const definition = openingVariantDefinition(opening);
  const sill = Number(opening && opening.sillHeightMillimeters);
  const height = Number(opening && opening.openingHeightMillimeters);
  const projection = Number(opening && opening.projectionMillimeters);
  return {
    sill: Math.max(0, Number.isFinite(sill) ? sill : definition.sill),
    height: Math.max(100, Number.isFinite(height) ? height : definition.height),
    projection: Math.max(0, Number.isFinite(projection) ? projection : definition.projection || 0),
  };
}

function findEndPiers(lines, intersections, openings, settings, tolerance) {
  const maxLength = Math.max(settings.minLength * 0.9, settings.minWallThickness * 8);
  const minLength = manualWallMinLengthPixels(settings);
  const piers = [];
  for (const line of lines) {
    if (line.length > maxLength || line.length < minLength) continue;
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
  elements.openingStat.textContent = String(constructibleOpenings().length);
  elements.pierStat.textContent = String(state.topology.endPiers.length);
  elements.roomStat.textContent = String(state.topology.rooms.length);
  elements.modeStat.textContent = recognitionModeLabel();
  updateSelectedComponentInfo();
  updateBeginnerSummary();
}

function updateSelectedComponentInfo() {
  const line = selectedLine();
  const opening = selectedOpening();
  const railing = selectedRailing();
  const product = selectedProduct();
  if (!line) {
    if (opening) {
      updateSelectedOpeningInfo(opening);
    } else if (railing) {
      updateSelectedRailingInfo(railing);
    } else if (product) {
      updateSelectedProductInfo(product);
    } else {
      clearComponentCard("selected");
      clearComponentCard("three");
    }
    return;
  }

  elements.selectedComponentCard.hidden = false;
  const settings = getSettings();
  const isPier = (state.topology.endPiers || []).some((pier) => pier.wall === line.id);
  const startX = formatMillimeters(pxToMillimeters(line.x1, settings));
  const startY = formatMillimeters(pxToMillimeters(line.y1, settings));
  const endX = formatMillimeters(pxToMillimeters(line.x2, settings));
  const endY = formatMillimeters(pxToMillimeters(line.y2, settings));
  const values = {
    title: line.id || `墙体 ${state.selectedLineIndex + 1}`,
    type: isPier ? "端头墙垛" : "墙体",
    orientation: line.orientation === "horizontal" ? "水平" : "垂直",
    length: Math.round(pxToMillimeters(line.length, settings)),
    thickness: Math.round(physicalWallThicknessMillimeters(line.thickness, settings)),
    height: Math.round(lineHeightMillimeters(line)),
    coords: `${startX},${startY} → ${endX},${endY}`,
  };
  fillComponentCard("selected", values);
  if (!elements.threeComponentCard.hidden) fillComponentCard("three", values);
  positionSelectedComponentCard(line);
  positionThreeComponentCard();
}

function updateSelectedProductInfo(product) {
  normalizeProductMetadata(product);
  elements.selectedComponentCard.hidden = false;
  const settings = getSettings();
  const footprint = productFootprintMeters(product);
  const values = {
    title: product.name || product.id || "产品模型",
    type: productSubtypeLabel(product),
    orientation: `旋转 ${Math.round(product.rotationDegrees || 0)}°`,
    lengthLabel: "宽度",
    thicknessLabel: "深度",
    heightLabel: "高度",
    length: Math.round(footprint.width * 1000),
    thickness: Math.round(footprint.depth * 1000),
    height: Math.round(product.heightMillimeters || productDefaultHeightMeters(product.category, product.productSubtype) * 1000),
    coords: `${formatMillimeters(pxToMillimeters(product.planX, settings))},${formatMillimeters(pxToMillimeters(product.planY, settings))}`,
  };
  fillComponentCard("selected", values);
  if (!elements.threeComponentCard.hidden) fillComponentCard("three", values);
  positionSelectedProductCard(product);
  positionThreeComponentCard();
}

function updateSelectedRailingInfo(railing) {
  elements.selectedComponentCard.hidden = false;
  const settings = getSettings();
  const values = {
    title: railing.id || "栏杆",
    type: "栏杆",
    orientation: railing.orientation === "horizontal" ? "水平" : "垂直",
    length: Math.round(pxToMillimeters(railing.length, settings)),
    thickness: Math.round(railing.thicknessMillimeters || RAILING_DEFAULT_THICKNESS_MM),
    height: Math.round(railing.heightMillimeters || RAILING_DEFAULT_HEIGHT_MM),
    coords: `${formatMillimeters(pxToMillimeters(railing.x1, settings))},${formatMillimeters(pxToMillimeters(railing.y1, settings))} -> ${formatMillimeters(pxToMillimeters(railing.x2, settings))},${formatMillimeters(pxToMillimeters(railing.y2, settings))}`,
  };
  fillComponentCard("selected", values);
  if (!elements.threeComponentCard.hidden) fillComponentCard("three", values);
  positionSelectedRailingCard(railing);
  positionThreeComponentCard();
}

function updateSelectedOpeningInfo(opening) {
  if (!isConstructibleOpening(opening)) {
    clearComponentCard("selected");
    clearComponentCard("three");
    return;
  }
  elements.selectedComponentCard.hidden = false;
  const settings = getSettings();
  const variant = openingVariant(opening);
  const kindLabel = openingKindLabel(opening);
  const profile = openingProfileMillimeters(opening);
  const values = {
    title: opening.id || kindLabel,
    type: kindLabel,
    variant,
    orientation: opening.orientation === "horizontal" ? "水平" : "垂直",
    lengthLabel: "宽度",
    thicknessLabel: "底边",
    heightLabel: "洞口高",
    length: Math.round(opening.widthMm || pxToMillimeters(opening.width || distance({ x: opening.x1, y: opening.y1 }, { x: opening.x2, y: opening.y2 }), settings)),
    thickness: Math.round(profile.sill),
    height: Math.round(profile.height),
    coords: `${formatMillimeters(pxToMillimeters(opening.x1, settings))},${formatMillimeters(pxToMillimeters(opening.y1, settings))} -> ${formatMillimeters(pxToMillimeters(opening.x2, settings))},${formatMillimeters(pxToMillimeters(opening.y2, settings))}`,
  };
  fillComponentCard("selected", values);
  if (!elements.threeComponentCard.hidden) fillComponentCard("three", values);
  positionSelectedOpeningCard(opening);
  positionThreeComponentCard();
}

function openingKindLabel(openingOrKind) {
  const opening = typeof openingOrKind === "string" ? { kind: openingOrKind } : openingOrKind;
  if (opening && opening.variant && OPENING_VARIANTS[opening.variant]) return OPENING_VARIANTS[opening.variant].label;
  if (opening.kind === "door") return "门";
  if (opening.kind === "window") return "窗";
  if (opening.kind === "opening") return "开口";
  return "疑似构件";
}

function componentElements(prefix) {
  if (prefix === "three") {
    return {
      card: elements.threeComponentCard,
      title: elements.threeComponentTitle,
      type: elements.threeComponentType,
      variantSelect: elements.threeOpeningVariantSelect,
      orientation: elements.threeComponentOrientation,
      lengthLabel: elements.threeComponentLengthLabel,
      thicknessLabel: elements.threeComponentThicknessLabel,
      heightLabel: elements.threeComponentHeightLabel,
      lengthInput: elements.threeComponentLengthInput,
      thicknessInput: elements.threeComponentThicknessInput,
      heightInput: elements.threeComponentHeightInput,
      coords: elements.threeComponentCoords,
    };
  }
  return {
    card: elements.selectedComponentCard,
    title: elements.selectedComponentTitle,
    type: elements.selectedComponentType,
    variantSelect: elements.selectedOpeningVariantSelect,
    orientation: elements.selectedComponentOrientation,
    lengthLabel: elements.selectedComponentLengthLabel,
    thicknessLabel: elements.selectedComponentThicknessLabel,
    heightLabel: elements.selectedComponentHeightLabel,
    lengthInput: elements.selectedComponentLengthInput,
    thicknessInput: elements.selectedComponentThicknessInput,
    heightInput: elements.selectedComponentHeightInput,
    coords: elements.selectedComponentCoords,
  };
}

function clearComponentCard(prefix) {
  const card = componentElements(prefix);
  if (prefix === "selected") {
    state.selectedCardDrag = null;
    card.card.classList.remove("is-dragging");
  }
  card.card.hidden = true;
  card.title.textContent = "未选择";
  card.type.textContent = "-";
  card.type.hidden = false;
  card.variantSelect.hidden = true;
  card.variantSelect.disabled = true;
  card.orientation.textContent = "-";
  card.lengthLabel.textContent = "长度";
  card.thicknessLabel.textContent = "厚度";
  card.heightLabel.textContent = "高度";
  card.lengthInput.value = "";
  card.thicknessInput.value = "";
  card.heightInput.value = "";
  card.lengthInput.disabled = true;
  card.thicknessInput.disabled = true;
  card.heightInput.disabled = true;
  card.coords.textContent = "-";
}

function fillComponentCard(prefix, values) {
  const card = componentElements(prefix);
  card.card.hidden = false;
  card.title.textContent = values.title;
  card.type.textContent = values.type;
  card.type.hidden = Boolean(values.variant);
  card.variantSelect.hidden = !values.variant;
  card.variantSelect.disabled = !values.variant;
  if (values.variant && document.activeElement !== card.variantSelect) card.variantSelect.value = values.variant;
  card.orientation.textContent = values.orientation;
  card.lengthLabel.textContent = values.lengthLabel || "长度";
  card.thicknessLabel.textContent = values.thicknessLabel || "厚度";
  card.heightLabel.textContent = values.heightLabel || "高度";
  card.lengthInput.disabled = false;
  card.thicknessInput.disabled = false;
  card.heightInput.disabled = false;
  if (document.activeElement !== card.lengthInput) card.lengthInput.value = String(values.length);
  if (document.activeElement !== card.thicknessInput) card.thicknessInput.value = String(values.thickness);
  if (document.activeElement !== card.heightInput) card.heightInput.value = String(values.height);
  card.coords.textContent = values.coords;
}

function commitSelectedComponentParameter(parameter, prefix = "selected") {
  const line = selectedLine();
  const opening = selectedOpening();
  const railing = selectedRailing();
  const product = selectedProduct();
  if (!line && opening) {
    commitSelectedOpeningParameter(parameter, prefix);
    return;
  }
  if (!line && railing) {
    commitSelectedRailingParameter(parameter, prefix);
    return;
  }
  if (!line && product) {
    commitSelectedProductParameter(parameter, prefix);
    return;
  }
  if (!line) return;
  const settings = getSettings();
  const card = componentElements(prefix);
  const inputByParameter = { length: card.lengthInput, thickness: card.thicknessInput, height: card.heightInput };
  const input = inputByParameter[parameter];
  if (!input) return;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    updateSelectedComponentInfo();
    return;
  }

  pushUndoSnapshot(`edit-${parameter}`);
  if (parameter === "length") {
    const pixelLength = Math.max(6, millimetersToPixels(value, settings));
    if (line.orientation === "horizontal") {
      const direction = line.x2 >= line.x1 ? 1 : -1;
      line.x2 = line.x1 + pixelLength * direction;
    } else {
      const direction = line.y2 >= line.y1 ? 1 : -1;
      line.y2 = line.y1 + pixelLength * direction;
    }
    normalizeEditedLine(line);
  } else if (parameter === "thickness") {
    line.thickness = Math.max(1, millimetersToPixels(value, settings));
  } else if (parameter === "height") {
    line.heightMillimeters = Math.max(100, value);
  }

  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length;
  setStatus("参数已更新");
}

function commitSelectedOpeningParameter(parameter, prefix = "selected") {
  const selected = selectedOpening();
  if (!selected || !isConstructibleOpening(selected)) return;
  const card = componentElements(prefix);
  const inputByParameter = { length: card.lengthInput, thickness: card.thicknessInput, height: card.heightInput };
  const input = inputByParameter[parameter];
  if (!input) return;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0 || (parameter !== "thickness" && value <= 0)) {
    updateSelectedComponentInfo();
    return;
  }

  pushUndoSnapshot(`edit-opening-${parameter}`);
  const opening = materializeSelectedOpeningForEdit();
  if (!opening) return;
  const settings = getSettings();
  if (parameter === "length") {
    const pixelLength = Math.max(2, millimetersToPixels(value, settings));
    const center = { x: (opening.x1 + opening.x2) / 2, y: (opening.y1 + opening.y2) / 2 };
    if (opening.orientation === "horizontal") {
      opening.x1 = center.x - pixelLength / 2;
      opening.x2 = center.x + pixelLength / 2;
      opening.y2 = opening.y1;
    } else {
      opening.y1 = center.y - pixelLength / 2;
      opening.y2 = center.y + pixelLength / 2;
      opening.x2 = opening.x1;
    }
  } else if (parameter === "thickness") {
    opening.sillHeightMillimeters = Math.max(0, value);
  } else if (parameter === "height") {
    opening.openingHeightMillimeters = Math.max(100, value);
  }
  normalizeOpeningComponent(opening);
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length;
  setStatus("构件参数已更新");
}

function commitSelectedOpeningVariant(prefix = "selected") {
  const selected = selectedOpening();
  if (!selected || !isConstructibleOpening(selected)) return;
  const card = componentElements(prefix);
  const variant = card.variantSelect.value;
  if (!OPENING_VARIANTS[variant]) {
    updateSelectedComponentInfo();
    return;
  }
  pushUndoSnapshot("edit-opening-type");
  const opening = materializeSelectedOpeningForEdit();
  if (!opening) return;
  const definition = OPENING_VARIANTS[variant];
  opening.variant = variant;
  opening.kind = definition.kind;
  opening.sillHeightMillimeters = definition.sill;
  opening.openingHeightMillimeters = definition.height;
  opening.projectionMillimeters = definition.projection || 0;
  normalizeOpeningComponent(opening);
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length;
  setStatus("构件类型已更新");
}

function commitSelectedRailingParameter(parameter, prefix = "selected") {
  const railing = selectedRailing();
  if (!railing) return;
  const card = componentElements(prefix);
  const inputByParameter = { length: card.lengthInput, thickness: card.thicknessInput, height: card.heightInput };
  const input = inputByParameter[parameter];
  if (!input) return;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    updateSelectedComponentInfo();
    return;
  }

  pushUndoSnapshot(`edit-railing-${parameter}`);
  if (parameter === "length") {
    const pixelLength = Math.max(2, millimetersToPixels(value, getSettings()));
    if (railing.orientation === "horizontal") {
      railing.x2 = railing.x1 + pixelLength;
    } else {
      railing.y2 = railing.y1 + pixelLength;
    }
  } else if (parameter === "thickness") {
    railing.thicknessMillimeters = Math.max(10, value);
  } else if (parameter === "height") {
    railing.heightMillimeters = Math.max(100, value);
  }
  normalizeRailing(railing);
  if (parameter === "length") snapRailingToNearbyGeometry(railing);
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length && !state.manualRailings.length;
  setStatus("栏杆参数已更新");
}

function commitSelectedProductParameter(parameter, prefix = "selected") {
  const product = selectedProduct();
  if (!product) return;
  const card = componentElements(prefix);
  const inputByParameter = { length: card.lengthInput, thickness: card.thicknessInput, height: card.heightInput };
  const input = inputByParameter[parameter];
  if (!input) return;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    updateSelectedComponentInfo();
    return;
  }

  const proposed = { ...product };
  if (parameter === "length") proposed.widthMillimeters = clampProductDimensionMillimeters(product, parameter, value);
  else if (parameter === "thickness") proposed.depthMillimeters = clampProductDimensionMillimeters(product, parameter, value);
  else if (parameter === "height") proposed.heightMillimeters = clampProductDimensionMillimeters(product, parameter, value);
  const collision = findProductCollision(proposed);
  if (collision) {
    product.collisionBlocked = collision;
    updateSelectedComponentInfo();
    updateThreeModel(false);
    setStatus(productCollisionStatusMessage(collision));
    return;
  }
  pushUndoSnapshot(`edit-product-${parameter}`);
  product.widthMillimeters = proposed.widthMillimeters;
  product.depthMillimeters = proposed.depthMillimeters;
  product.heightMillimeters = proposed.heightMillimeters;
  product.collisionBlocked = null;
  syncProductObjectScale(product);
  renderPreview();
  updateSelectedComponentInfo();
  updateThreeModel(false);
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus("产品参数已更新");
}

function positionSelectedComponentCard(line) {
  if (!state.analysisCanvas || !line || elements.selectedComponentCard.hidden) return;
  const canvasX = ((line.x1 + line.x2) / 2) * (elements.previewCanvas.width / state.analysisCanvas.width);
  const canvasY = ((line.y1 + line.y2) / 2) * (elements.previewCanvas.height / state.analysisCanvas.height);
  const displayX = canvasX * state.zoom;
  const displayY = canvasY * state.zoom;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const clampedX = displayX + cardWidth + 28 > canvasDisplayWidth ? Math.max(8, displayX - cardWidth - 28) : displayX;
  elements.selectedComponentCard.style.left = `${Math.round(clampedX)}px`;
  elements.selectedComponentCard.style.top = `${Math.round(displayY)}px`;
  elements.selectedComponentCard.style.transform = displayX + cardWidth + 28 > canvasDisplayWidth ? "translate(0, -50%)" : "translate(16px, -50%)";
}

function positionSelectedOpeningCard(opening) {
  if (!state.analysisCanvas || !opening || elements.selectedComponentCard.hidden) return;
  const canvasX = ((opening.x1 + opening.x2) / 2) * (elements.previewCanvas.width / state.analysisCanvas.width);
  const canvasY = ((opening.y1 + opening.y2) / 2) * (elements.previewCanvas.height / state.analysisCanvas.height);
  const displayX = canvasX * state.zoom;
  const displayY = canvasY * state.zoom;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const clampedX = displayX + cardWidth + 28 > canvasDisplayWidth ? Math.max(8, displayX - cardWidth - 28) : displayX;
  elements.selectedComponentCard.style.left = `${Math.round(clampedX)}px`;
  elements.selectedComponentCard.style.top = `${Math.round(displayY)}px`;
  elements.selectedComponentCard.style.transform = displayX + cardWidth + 28 > canvasDisplayWidth ? "translate(0, -50%)" : "translate(16px, -50%)";
}

function positionSelectedRailingCard(railing) {
  if (!state.analysisCanvas || !railing || elements.selectedComponentCard.hidden) return;
  const canvasX = ((railing.x1 + railing.x2) / 2) * (elements.previewCanvas.width / state.analysisCanvas.width);
  const canvasY = ((railing.y1 + railing.y2) / 2) * (elements.previewCanvas.height / state.analysisCanvas.height);
  const displayX = canvasX * state.zoom;
  const displayY = canvasY * state.zoom;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const cardHeight = elements.selectedComponentCard.offsetHeight || 190;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const canvasDisplayHeight = elements.previewCanvas.height * state.zoom;
  let x;
  let y;
  if (railing.orientation === "horizontal") {
    x = clamp(displayX - cardWidth / 2, 8, Math.max(8, canvasDisplayWidth - cardWidth - 8));
    y = displayY - cardHeight - 22 >= 8 ? displayY - cardHeight - 22 : displayY + 22;
  } else {
    const placeRight = displayX + cardWidth + 24 <= canvasDisplayWidth;
    x = placeRight ? displayX + 22 : displayX - cardWidth - 22;
    y = displayY - cardHeight / 2;
  }
  elements.selectedComponentCard.style.left = `${Math.round(clamp(x, 8, Math.max(8, canvasDisplayWidth - cardWidth - 8)))}px`;
  elements.selectedComponentCard.style.top = `${Math.round(clamp(y, 8, Math.max(8, canvasDisplayHeight - cardHeight - 8)))}px`;
  elements.selectedComponentCard.style.transform = "none";
}

function positionSelectedProductCard(product) {
  if (!state.analysisCanvas || !product || elements.selectedComponentCard.hidden) return;
  const manualKey = selectedComponentCardKey();
  if (applySelectedCardManualPosition(manualKey)) return;
  const canvasX = product.planX * (elements.previewCanvas.width / state.analysisCanvas.width);
  const canvasY = product.planY * (elements.previewCanvas.height / state.analysisCanvas.height);
  const displayX = canvasX * state.zoom;
  const displayY = canvasY * state.zoom;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const cardHeight = elements.selectedComponentCard.offsetHeight || 190;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const canvasDisplayHeight = elements.previewCanvas.height * state.zoom;
  const bounds = selectedProductDisplayBounds(product);
  const gap = 22;
  let x = bounds.maxX + gap;
  let y = bounds.minY + Math.max(0, (bounds.height - cardHeight) / 2);
  if (x + cardWidth + 8 > canvasDisplayWidth) x = bounds.minX - cardWidth - gap;
  if (x < 8) {
    x = bounds.minX + Math.max(0, (bounds.width - cardWidth) / 2);
    y = bounds.maxY + gap;
    if (y + cardHeight + 8 > canvasDisplayHeight) y = bounds.minY - cardHeight - gap;
  }
  elements.selectedComponentCard.style.left = `${Math.round(clamp(x, 8, Math.max(8, canvasDisplayWidth - cardWidth - 8)))}px`;
  elements.selectedComponentCard.style.top = `${Math.round(clamp(y, 8, Math.max(8, canvasDisplayHeight - cardHeight - 8)))}px`;
  elements.selectedComponentCard.style.transform = "none";
}

function selectedProductDisplayBounds(product) {
  const { width, depth } = productFootprintPixels(product, getSettings());
  const angle = ((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
  const corners = [
    { x: -width / 2, y: -depth / 2 },
    { x: width / 2, y: -depth / 2 },
    { x: width / 2, y: depth / 2 },
    { x: -width / 2, y: depth / 2 },
  ].map((corner) => {
    const planX = product.planX + corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
    const planY = product.planY + corner.x * Math.sin(angle) + corner.y * Math.cos(angle);
    return {
      x: planX * (elements.previewCanvas.width / state.analysisCanvas.width) * state.zoom,
      y: planY * (elements.previewCanvas.height / state.analysisCanvas.height) * state.zoom,
    };
  });
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function selectedComponentCardKey() {
  const product = selectedProduct();
  if (product) return `product:${product.id}`;
  const line = selectedLine();
  if (line) return `line:${line.id || state.selectedLineIndex}`;
  const railing = selectedRailing();
  if (railing) return `railing:${railing.id}`;
  const opening = selectedOpening();
  if (opening) return `opening:${opening.id || state.selectedOpeningIndex}`;
  return null;
}

function applySelectedCardManualPosition(key) {
  if (!key || !state.selectedCardManualPosition || state.selectedCardManualPosition.key !== key) return false;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const cardHeight = elements.selectedComponentCard.offsetHeight || 190;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const canvasDisplayHeight = elements.previewCanvas.height * state.zoom;
  const x = clamp(state.selectedCardManualPosition.x, 8, Math.max(8, canvasDisplayWidth - cardWidth - 8));
  const y = clamp(state.selectedCardManualPosition.y, 8, Math.max(8, canvasDisplayHeight - cardHeight - 8));
  elements.selectedComponentCard.style.left = `${Math.round(x)}px`;
  elements.selectedComponentCard.style.top = `${Math.round(y)}px`;
  elements.selectedComponentCard.style.transform = "none";
  return true;
}

function positionThreeComponentCard() {
  if (elements.threeComponentCard.hidden) return;
  const viewport = elements.threeViewport.getBoundingClientRect();
  const cardWidth = elements.threeComponentCard.offsetWidth || 260;
  const cardHeight = elements.threeComponentCard.offsetHeight || 190;
  const x = clamp(state.three.cardX + 14, 10, Math.max(10, viewport.width - cardWidth - 10));
  const y = clamp(state.three.cardY + 14, 10, Math.max(10, viewport.height - cardHeight - 10));
  elements.threeComponentCard.style.left = `${Math.round(x)}px`;
  elements.threeComponentCard.style.top = `${Math.round(y)}px`;
  elements.threeComponentCard.style.transform = "none";
}

function isComponentCardControl(target) {
  return Boolean(target && target.closest("input, select, button"));
}

function beginSelectedCardDrag(event) {
  if (event.button !== 0 || elements.selectedComponentCard.hidden || isComponentCardControl(event.target)) return;
  const key = selectedComponentCardKey();
  if (!key) return;
  const left = parseFloat(elements.selectedComponentCard.style.left) || 0;
  const top = parseFloat(elements.selectedComponentCard.style.top) || 0;
  state.selectedCardDrag = {
    key,
    startX: event.clientX,
    startY: event.clientY,
    left,
    top,
  };
  elements.selectedComponentCard.setPointerCapture(event.pointerId);
  elements.selectedComponentCard.classList.add("is-dragging");
  event.preventDefault();
  event.stopPropagation();
}

function moveSelectedCard(event) {
  if (!state.selectedCardDrag) return;
  const cardWidth = elements.selectedComponentCard.offsetWidth || 260;
  const cardHeight = elements.selectedComponentCard.offsetHeight || 190;
  const canvasDisplayWidth = elements.previewCanvas.width * state.zoom;
  const canvasDisplayHeight = elements.previewCanvas.height * state.zoom;
  const x = clamp(state.selectedCardDrag.left + event.clientX - state.selectedCardDrag.startX, 8, Math.max(8, canvasDisplayWidth - cardWidth - 8));
  const y = clamp(state.selectedCardDrag.top + event.clientY - state.selectedCardDrag.startY, 8, Math.max(8, canvasDisplayHeight - cardHeight - 8));
  state.selectedCardManualPosition = { key: state.selectedCardDrag.key, x, y };
  elements.selectedComponentCard.style.left = `${Math.round(x)}px`;
  elements.selectedComponentCard.style.top = `${Math.round(y)}px`;
  elements.selectedComponentCard.style.transform = "none";
  event.preventDefault();
  event.stopPropagation();
}

function endSelectedCardDrag(event) {
  if (!state.selectedCardDrag) return;
  state.selectedCardDrag = null;
  elements.selectedComponentCard.classList.remove("is-dragging");
  if (elements.selectedComponentCard.hasPointerCapture(event.pointerId)) {
    elements.selectedComponentCard.releasePointerCapture(event.pointerId);
  }
  event.preventDefault();
  event.stopPropagation();
}

function renderSourceImageOnly() {
  const canvas = elements.previewCanvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.analysisCanvas, 0, 0, canvas.width, canvas.height);
  updateBeginnerPhonePreview();
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
  const settings = getSettings();
  const displayWalls = buildContinuousWallModels(getClosedWallLines(settings), constructibleOpenings(), settings).map((model) => model.line);
  for (const line of displayWalls) {
    const bounds = boundsFromLine(line, settings);
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }
  ctx.strokeStyle = "#276fbf";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const line of displayWalls) {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }
  drawOpeningCuts(ctx);
  drawOpeningContinuity(ctx);
  drawSelectedLine(ctx);
  drawTopology(ctx);
  drawRailings(ctx);
  drawProductModels(ctx);
  drawLightSources(ctx);
  drawSelectedOpening(ctx);
  drawSelectedRailing(ctx);
  drawWallDraft(ctx);
  drawOpeningDraft(ctx);
  drawRailingDraft(ctx);
  drawCalibrationDraft(ctx);
  drawMeasurements(ctx);
  drawMeasurementDraft(ctx);
  drawEndpointHandles(ctx);
  ctx.restore();
  updateBeginnerPhonePreview();
}

function setBeginnerPhonePreviewMode(mode) {
  state.beginnerPhonePreviewMode = mode === "three" ? "three" : "plan";
  state.beginnerPhonePreview.zoom = 1;
  state.beginnerPhonePreview.panX = 0;
  state.beginnerPhonePreview.panY = 0;
  updateBeginnerPhonePreview();
}

function updateBeginnerPhonePreview() {
  const canvas = beginnerUi.phonePreviewCanvas;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const source = state.beginnerPhonePreviewMode === "three" && state.three.renderer
    ? state.three.renderer.domElement
    : elements.previewCanvas;
  const hasImage = state.beginnerPhonePreviewMode === "three"
    ? Boolean(state.three.renderer)
    : Boolean(state.analysisCanvas);
  canvas.classList.toggle("is-three-control", state.beginnerPhonePreviewMode === "three");
  canvas.parentElement?.classList.toggle("is-three-preview", state.beginnerPhonePreviewMode === "three");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#17191c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (hasImage && source && source.width && source.height) {
    drawPhonePreviewImage(context, source, canvas.width, canvas.height);
    beginnerUi.phonePreviewLabel.textContent = state.beginnerPhonePreviewMode === "three" ? "3D 画面" : "平面画布";
    beginnerUi.phonePreviewCanvas.parentElement.classList.add("has-image");
    return;
  }
  context.fillStyle = "#25313a";
  context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.lineWidth = 1;
  for (let x = 18; x <= canvas.width - 18; x += 24) {
    context.beginPath();
    context.moveTo(x, 18);
    context.lineTo(x, canvas.height - 18);
    context.stroke();
  }
  for (let y = 18; y <= canvas.height - 18; y += 24) {
    context.beginPath();
    context.moveTo(18, y);
    context.lineTo(canvas.width - 18, y);
    context.stroke();
  }
  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "600 15px Microsoft YaHei, sans-serif";
  context.textAlign = "center";
  const emptyText = state.beginnerPhonePreviewMode === "three" ? "等待 3D 画面" : "等待图纸";
  context.fillText(emptyText, canvas.width / 2, canvas.height / 2);
  beginnerUi.phonePreviewLabel.textContent = emptyText;
  beginnerUi.phonePreviewCanvas.parentElement.classList.remove("has-image");
}

function drawContainedImage(context, source, x, y, width, height) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(source, drawX, drawY, drawWidth, drawHeight);
}

function phonePreviewBaseTransform(source, width, height) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) return null;
  const fitScale = state.beginnerPhonePreviewMode === "three" ? Math.max : Math.min;
  const scale = fitScale(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return {
    sourceWidth,
    sourceHeight,
    scale,
    drawWidth,
    drawHeight,
    drawX: (width - drawWidth) / 2,
    drawY: (height - drawHeight) / 2,
  };
}

function drawPhonePreviewImage(context, source, width, height) {
  const transform = phonePreviewBaseTransform(source, width, height);
  if (!transform) return;
  const preview = state.beginnerPhonePreview;
  const zoom = clamp(Number(preview.zoom) || 1, 0.45, 8);
  preview.zoom = zoom;
  const drawWidth = transform.drawWidth * zoom;
  const drawHeight = transform.drawHeight * zoom;
  const drawX = transform.drawX + preview.panX;
  const drawY = transform.drawY + preview.panY;
  context.drawImage(source, drawX, drawY, drawWidth, drawHeight);
}

function phonePreviewSource() {
  if (state.beginnerPhonePreviewMode === "three" && state.three.renderer) return state.three.renderer.domElement;
  return elements.previewCanvas;
}

function phonePreviewCanvasPointFromEvent(event) {
  const canvas = beginnerUi.phonePreviewCanvas;
  const source = phonePreviewSource();
  if (!canvas || !source) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const px = ((event.clientX - rect.left) * canvas.width) / Math.max(1, rect.width);
  const py = ((event.clientY - rect.top) * canvas.height) / Math.max(1, rect.height);
  const transform = phonePreviewBaseTransform(source, canvas.width, canvas.height);
  if (!transform) return { x: 0, y: 0 };
  const zoom = clamp(Number(state.beginnerPhonePreview.zoom) || 1, 0.45, 8);
  return {
    x: clamp((px - transform.drawX - state.beginnerPhonePreview.panX) / (transform.scale * zoom), 0, source.width),
    y: clamp((py - transform.drawY - state.beginnerPhonePreview.panY) / (transform.scale * zoom), 0, source.height),
  };
}

function phonePreviewLocalPoint(event) {
  const canvas = beginnerUi.phonePreviewCanvas;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / Math.max(1, rect.width),
    y: ((event.clientY - rect.top) * canvas.height) / Math.max(1, rect.height),
  };
}

function phonePreviewProxyEvent(event) {
  return {
    phonePreviewProxy: true,
    phoneCanvasPoint: phonePreviewCanvasPointFromEvent(event),
    pointerId: event.pointerId,
    button: event.button,
    clientX: event.clientX,
    clientY: event.clientY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    preventDefault: () => event.preventDefault(),
  };
}

function handlePhonePreviewWheel(event) {
  const canvas = beginnerUi.phonePreviewCanvas;
  const source = phonePreviewSource();
  if (!canvas || !source) return;
  event.preventDefault();
  if (state.beginnerPhonePreviewMode === "three") {
    handlePhoneThreeWheel(event);
    return;
  }
  const local = phonePreviewLocalPoint(event);
  const sourcePoint = phonePreviewCanvasPointFromEvent(event);
  const transform = phonePreviewBaseTransform(source, canvas.width, canvas.height);
  if (!transform) return;
  const previousZoom = clamp(Number(state.beginnerPhonePreview.zoom) || 1, 0.45, 8);
  const nextZoom = clamp(previousZoom * Math.exp(-event.deltaY * 0.0018), 0.45, 8);
  state.beginnerPhonePreview.zoom = nextZoom;
  state.beginnerPhonePreview.panX = local.x - transform.drawX - sourcePoint.x * transform.scale * nextZoom;
  state.beginnerPhonePreview.panY = local.y - transform.drawY - sourcePoint.y * transform.scale * nextZoom;
  updateBeginnerPhonePreview();
}

function handlePhonePreviewPointerDown(event) {
  if (!beginnerUi.phonePreviewCanvas) return;
  beginnerUi.phonePreviewCanvas.focus({ preventScroll: true });
  if (state.beginnerPhonePreviewMode !== "plan" || event.altKey || event.button === 1 || event.button === 2) {
    state.beginnerPhonePreview.dragging = true;
    state.beginnerPhonePreview.activeEdit = false;
    state.beginnerPhonePreview.pointerId = event.pointerId;
    state.beginnerPhonePreview.lastX = event.clientX;
    state.beginnerPhonePreview.lastY = event.clientY;
    capturePhonePreviewPointer(event);
    event.preventDefault();
    return;
  }
  state.beginnerPhonePreview.activeEdit = true;
  state.beginnerPhonePreview.pointerId = event.pointerId;
  capturePhonePreviewPointer(event);
  handleCanvasPointerDown(phonePreviewProxyEvent(event));
}

function handlePhonePreviewPointerMove(event) {
  const preview = state.beginnerPhonePreview;
  if (preview.dragging && preview.pointerId === event.pointerId) {
    if (state.beginnerPhonePreviewMode === "three") {
      handlePhoneThreePointerMove(event);
      return;
    }
    const canvas = beginnerUi.phonePreviewCanvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    preview.panX += (event.clientX - preview.lastX) * scaleX;
    preview.panY += (event.clientY - preview.lastY) * scaleY;
    preview.lastX = event.clientX;
    preview.lastY = event.clientY;
    updateBeginnerPhonePreview();
    event.preventDefault();
    return;
  }
  if (preview.activeEdit && preview.pointerId === event.pointerId) {
    handleCanvasPointerMove(phonePreviewProxyEvent(event));
  }
}

function handlePhoneThreeWheel(event) {
  if (!state.three.renderer) return;
  if (state.three.mode === "roam") {
    const step = state.three.roamSpeed * (event.shiftKey ? 2.2 : 1);
    moveThreeRoam(event.deltaY < 0 ? step : -step);
    return;
  }
  state.three.radius = clamp(state.three.radius * Math.exp(event.deltaY * 0.0012), 3.8, 48);
  updateThreeCamera();
}

function handlePhoneThreePointerMove(event) {
  const preview = state.beginnerPhonePreview;
  const dx = event.clientX - preview.lastX;
  const dy = event.clientY - preview.lastY;
  preview.lastX = event.clientX;
  preview.lastY = event.clientY;
  if (!state.three.renderer) return;
  if (state.three.mode === "roam") {
    state.three.roamYaw -= dx * 0.006;
    state.three.roamPitch = clamp(state.three.roamPitch - dy * 0.0045, -0.75, 0.75);
    updateThreeRoamCamera();
  } else {
    state.three.yaw -= dx * 0.008;
    state.three.pitch = clamp(state.three.pitch + dy * 0.006, 0.22, 1.28);
    updateThreeCamera();
  }
  event.preventDefault();
}

function handlePhonePreviewKeyDown(event) {
  if (state.beginnerPhonePreviewMode !== "three" || state.three.mode !== "roam") return;
  handleThreeKeyDown(event);
}

function phonePreviewHeightBounds() {
  const phone = beginnerUi.beginnerChat;
  const preview = beginnerUi.phonePreview;
  if (!phone || !preview) return { min: 150, max: 320 };
  const phoneHeight = phone.getBoundingClientRect().height;
  const headerHeight = phone.querySelector(".chat-top")?.getBoundingClientRect().height || 0;
  const resizerHeight = beginnerUi.phoneChatResizer?.getBoundingClientRect().height || 0;
  const composerHeight = beginnerUi.chatForm?.getBoundingClientRect().height || 0;
  const minimumChatHeight = 118;
  const min = Math.min(190, Math.max(140, phoneHeight * 0.22));
  const max = Math.max(min, phoneHeight - headerHeight - resizerHeight - composerHeight - minimumChatHeight);
  return { min, max };
}

function setPhonePreviewHeight(height) {
  const preview = beginnerUi.phonePreview;
  if (!preview) return;
  const { min, max } = phonePreviewHeightBounds();
  const nextHeight = clamp(height, min, max);
  preview.style.flexBasis = `${nextHeight}px`;
  updateBeginnerPhonePreview();
}

function handlePhoneChatResizePointerDown(event) {
  if (!beginnerUi.phoneChatResizer || !beginnerUi.phonePreview) return;
  state.beginnerPhoneLayout.resizing = true;
  state.beginnerPhoneLayout.pointerId = event.pointerId;
  state.beginnerPhoneLayout.startY = event.clientY;
  state.beginnerPhoneLayout.startPreviewHeight = beginnerUi.phonePreview.getBoundingClientRect().height;
  beginnerUi.phoneChatResizer.classList.add("is-dragging");
  try {
    beginnerUi.phoneChatResizer.setPointerCapture(event.pointerId);
  } catch (error) {
    // Programmatic events may not own an active pointer.
  }
  event.preventDefault();
}

function handlePhoneChatResizePointerMove(event) {
  const layout = state.beginnerPhoneLayout;
  if (!layout.resizing || layout.pointerId !== event.pointerId) return;
  setPhonePreviewHeight(layout.startPreviewHeight + event.clientY - layout.startY);
  event.preventDefault();
}

function handlePhoneChatResizePointerUp(event) {
  const layout = state.beginnerPhoneLayout;
  if (!layout.resizing || layout.pointerId !== event.pointerId) return;
  layout.resizing = false;
  layout.pointerId = null;
  beginnerUi.phoneChatResizer?.classList.remove("is-dragging");
  try {
    if (beginnerUi.phoneChatResizer?.hasPointerCapture(event.pointerId)) {
      beginnerUi.phoneChatResizer.releasePointerCapture(event.pointerId);
    }
  } catch (error) {
    // Ignore missing pointer capture.
  }
  event.preventDefault();
}

function handlePhoneChatResizeKeyDown(event) {
  if (!beginnerUi.phonePreview) return;
  const currentHeight = beginnerUi.phonePreview.getBoundingClientRect().height;
  const step = event.shiftKey ? 48 : 18;
  if (event.key === "ArrowDown") {
    setPhonePreviewHeight(currentHeight + step);
  } else if (event.key === "ArrowUp") {
    setPhonePreviewHeight(currentHeight - step);
  } else if (event.key === "End") {
    setPhonePreviewHeight(phonePreviewHeightBounds().max);
  } else if (event.key === "Home") {
    setPhonePreviewHeight(phonePreviewHeightBounds().min);
  } else {
    return;
  }
  event.preventDefault();
}

function handlePhonePreviewPointerUp(event) {
  const preview = state.beginnerPhonePreview;
  if (preview.activeEdit && preview.pointerId === event.pointerId) handleCanvasPointerUp(phonePreviewProxyEvent(event));
  preview.dragging = false;
  preview.activeEdit = false;
  preview.pointerId = null;
  releasePhonePreviewPointer(event);
  event.preventDefault();
}

function capturePhonePreviewPointer(event) {
  try {
    beginnerUi.phonePreviewCanvas.setPointerCapture(event.pointerId);
  } catch (error) {
    // Programmatic pointer events in tests may not own an active pointer.
  }
}

function releasePhonePreviewPointer(event) {
  try {
    if (beginnerUi.phonePreviewCanvas && beginnerUi.phonePreviewCanvas.hasPointerCapture(event.pointerId)) {
      beginnerUi.phonePreviewCanvas.releasePointerCapture(event.pointerId);
    }
  } catch (error) {
    // Ignore missing pointer capture.
  }
}

function boundsFromLine(line, settings = getSettings()) {
  const thickness = visualWallThicknessPixels(line, settings);
  if (line.orientation === "horizontal") return { x: line.x1, y: line.y1 - thickness / 2, width: line.x2 - line.x1, height: thickness };
  return { x: line.x1 - thickness / 2, y: line.y1, width: thickness, height: line.y2 - line.y1 };
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
  drawOpenings(context, openings);
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

function drawOpeningContinuity(context) {
  const openings = constructibleOpenings();
  if (!openings.length) return;
  const settings = getSettings();
  context.save();
  for (const opening of openings) {
    const bridge = openingBridgeLine(opening, settings);
    if (!bridge) continue;
    const bounds = boundsFromLine(bridge, settings);
    context.fillStyle = "rgba(215,71,50,0.22)";
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    context.strokeStyle = "#276fbf";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(bridge.x1, bridge.y1);
    context.lineTo(bridge.x2, bridge.y2);
    context.stroke();
  }
  context.restore();
}

function drawOpeningCuts(context) {
  const openings = constructibleOpenings();
  if (!openings.length) return;
  const settings = getSettings();
  context.save();
  context.fillStyle = state.view === "overlay" ? "rgba(255,255,255,0.82)" : "#fff";
  for (const opening of openings) {
    const bridge = openingBridgeLine(opening, settings);
    if (!bridge) continue;
    const bounds = boundsFromLine(bridge, settings);
    const pad = Math.max(2, visualOpeningWallBand(opening, settings) * 0.16);
    context.fillRect(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2);
  }
  context.restore();
}

function openingBridgeLine(opening, settings) {
  const thickness = Math.max(settings.minWallThickness, Math.round(((Number(opening.leftThickness) || settings.maxThickness) + (Number(opening.rightThickness) || settings.maxThickness)) / 2));
  const line = opening.orientation === "horizontal"
    ? makeLine("horizontal", opening.x1, opening.y1, opening.x2, opening.y2, thickness)
    : makeLine("vertical", opening.x1, opening.y1, opening.x2, opening.y2, thickness);
  line.id = `bridge-${opening.id || "opening"}`;
  return line;
}

function drawSelectedOpening(context) {
  const opening = selectedOpening();
  if (!opening) return;
  context.save();
  context.strokeStyle = "#ffb14a";
  context.lineWidth = 10;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(opening.x1, opening.y1);
  context.lineTo(opening.x2, opening.y2);
  context.stroke();
  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(opening.x1, opening.y1);
  context.lineTo(opening.x2, opening.y2);
  context.stroke();
  context.restore();
}

function drawRailings(context) {
  if (!state.manualRailings.length) return;
  context.save();
  context.lineCap = "round";
  for (const railing of state.manualRailings) {
    context.strokeStyle = railing.id === state.selectedRailingId ? "#ffb14a" : "#455a64";
    context.lineWidth = Math.max(4, millimetersToPixels(railing.thicknessMillimeters || RAILING_DEFAULT_THICKNESS_MM, getSettings()));
    context.beginPath();
    context.moveTo(railing.x1, railing.y1);
    context.lineTo(railing.x2, railing.y2);
    context.stroke();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(railing.x1, railing.y1);
    context.lineTo(railing.x2, railing.y2);
    context.stroke();
  }
  context.restore();
}

function drawSelectedRailing(context) {
  const railing = selectedRailing();
  if (!railing) return;
  context.save();
  drawEditableEndpoint(context, railing.x1, railing.y1, true);
  drawEditableEndpoint(context, railing.x2, railing.y2, true);
  context.restore();
}

function drawProductModels(context) {
  if (!state.productModels.length) return;
  const settings = getSettings();
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const product of state.productModels) {
    const { width, depth } = productFootprintPixels(product, settings);
    const selected = product.id === state.selectedProductId;
    context.save();
    context.translate(product.planX, product.planY);
    context.rotate(((Number(product.rotationDegrees) || 0) * Math.PI) / 180);
    context.fillStyle = product.collisionBlocked ? "rgba(229,72,77,0.28)" : selected ? "rgba(255,177,74,0.34)" : `${productColor(product.category)}55`;
    context.strokeStyle = product.collisionBlocked ? "#e5484d" : selected ? "#ff9f1a" : productColor(product.category);
    context.lineWidth = selected ? 3 : 2;
    context.setLineDash(product.collisionBlocked ? [8, 5] : []);
    context.beginPath();
    context.rect(-width / 2, -depth / 2, width, depth);
    context.fill();
    context.stroke();
    context.fillStyle = selected ? "#1f2328" : "#ffffff";
    context.strokeStyle = selected ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.28)";
    context.lineWidth = 3;
    const label = productCategoryLabel(product.category);
    context.font = `${Math.max(11, Math.min(18, depth * 0.28))}px Microsoft YaHei, sans-serif`;
    context.strokeText(label, 0, 0);
    context.fillText(label, 0, 0);
    context.setLineDash([]);
    if (selected) {
      for (const handle of productResizeHandleDefinitions(width, depth)) {
        drawEditableEndpoint(context, handle.x, handle.y, true);
      }
      drawProductRotationHandle(context, width, depth);
    }
    context.restore();
  }
  context.restore();
}

function productResizeHandleDefinitions(width, depth) {
  return [
    { key: "nw", x: -width / 2, y: -depth / 2, sideX: -1, sideY: -1, resizeAxis: "both" },
    { key: "n", x: 0, y: -depth / 2, sideX: 0, sideY: -1, resizeAxis: "depth" },
    { key: "ne", x: width / 2, y: -depth / 2, sideX: 1, sideY: -1, resizeAxis: "both" },
    { key: "e", x: width / 2, y: 0, sideX: 1, sideY: 0, resizeAxis: "width" },
    { key: "se", x: width / 2, y: depth / 2, sideX: 1, sideY: 1, resizeAxis: "both" },
    { key: "s", x: 0, y: depth / 2, sideX: 0, sideY: 1, resizeAxis: "depth" },
    { key: "sw", x: -width / 2, y: depth / 2, sideX: -1, sideY: 1, resizeAxis: "both" },
    { key: "w", x: -width / 2, y: 0, sideX: -1, sideY: 0, resizeAxis: "width" },
  ];
}

function productResizeCursor(handle) {
  if (!handle) return "nwse-resize";
  if (handle.resizeAxis === "width") return "ew-resize";
  if (handle.resizeAxis === "depth") return "ns-resize";
  const sideX = Number(handle.sideX) || 0;
  const sideY = Number(handle.sideY) || 0;
  return sideX * sideY > 0 ? "nwse-resize" : "nesw-resize";
}

function drawProductRotationHandle(context, width, depth) {
  const x = width / 2 + 26;
  const y = -depth / 2 - 26;
  context.save();
  context.strokeStyle = "rgba(31,35,40,0.42)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width / 2, -depth / 2);
  context.lineTo(x, y);
  context.stroke();

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ff9f1a";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(x, y, 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "#1f2328";
  context.lineWidth = 2.2;
  context.lineCap = "round";
  context.beginPath();
  context.arc(x, y, 6.5, -Math.PI * 0.15, Math.PI * 1.25);
  context.stroke();
  context.fillStyle = "#1f2328";
  context.beginPath();
  context.moveTo(x + 7.5, y - 1.5);
  context.lineTo(x + 13, y - 2.5);
  context.lineTo(x + 9.5, y + 2.5);
  context.closePath();
  context.fill();
  context.restore();
}

function drawWallDraft(context) {
  if (!state.drawingLine) return;
  const line = lineFromDrawingDraft(state.drawingLine.start, state.drawingLine.end, getSettings());
  if (!line) return;
  const bounds = boundsFromLine(line, getSettings());

  context.save();
  context.fillStyle = "rgba(47,128,111,0.18)";
  context.strokeStyle = "#2f806f";
  context.lineWidth = 3;
  context.setLineDash([8, 6]);
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.beginPath();
  context.moveTo(line.x1, line.y1);
  context.lineTo(line.x2, line.y2);
  context.stroke();
  drawEditableEndpoint(context, line.x1, line.y1, true);
  drawEditableEndpoint(context, line.x2, line.y2, true);
  context.restore();
}

function drawOpeningDraft(context) {
  if (!state.openingDraft) return;
  const opening = openingFromDraft(state.openingDraft.start, state.openingDraft.end, state.openingDraft.variant);
  if (!opening) return;

  context.save();
  context.strokeStyle = openingColor(opening);
  context.fillStyle = openingColor(opening);
  context.lineWidth = opening.kind === "door" ? 6 : 5;
  context.lineCap = "round";
  context.setLineDash([7, 5]);
  context.beginPath();
  context.moveTo(opening.x1, opening.y1);
  context.lineTo(opening.x2, opening.y2);
  context.stroke();
  context.setLineDash([]);
  drawEditableEndpoint(context, opening.x1, opening.y1, true);
  drawEditableEndpoint(context, opening.x2, opening.y2, true);
  const midX = (opening.x1 + opening.x2) / 2;
  const midY = (opening.y1 + opening.y2) / 2;
  context.font = "16px Microsoft YaHei, sans-serif";
  context.fillText(openingKindLabel(opening), midX + 8, midY - 8);
  context.restore();
}

function drawRailingDraft(context) {
  if (!state.railingDraft) return;
  const railing = railingFromDraft(state.railingDraft.start, state.railingDraft.end);
  if (!railing) return;
  context.save();
  context.strokeStyle = "#455a64";
  context.fillStyle = "#455a64";
  context.lineWidth = Math.max(4, millimetersToPixels(railing.thicknessMillimeters, getSettings()));
  context.lineCap = "round";
  context.setLineDash([7, 5]);
  context.beginPath();
  context.moveTo(railing.x1, railing.y1);
  context.lineTo(railing.x2, railing.y2);
  context.stroke();
  context.setLineDash([]);
  drawEditableEndpoint(context, railing.x1, railing.y1, true);
  drawEditableEndpoint(context, railing.x2, railing.y2, true);
  context.font = "16px Microsoft YaHei, sans-serif";
  context.fillText("栏杆", (railing.x1 + railing.x2) / 2 + 8, (railing.y1 + railing.y2) / 2 - 8);
  context.restore();
}

function drawCalibrationDraft(context) {
  if (!state.calibrationLine) return;
  const { start, end } = state.calibrationLine;
  const length = distance(start, end);
  const actualLength = getCalibrationLengthMillimeters();

  context.save();
  context.strokeStyle = "#12a6a6";
  context.fillStyle = "#12a6a6";
  context.lineWidth = 3;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.setLineDash([]);
  drawEditableEndpoint(context, start.x, start.y, true);
  drawEditableEndpoint(context, end.x, end.y, true);
  context.font = "18px Microsoft YaHei, sans-serif";
  context.fillText(`${formatMillimeters(actualLength)} / ${Math.round(length)} px`, (start.x + end.x) / 2 + 8, (start.y + end.y) / 2 - 8);
  context.restore();
}

function drawMeasurements(context) {
  for (const measurement of state.measurements) drawMeasurementLine(context, measurement, false);
}

function drawMeasurementDraft(context) {
  if (!state.measurementLine) return;
  drawMeasurementLine(context, state.measurementLine, true);
}

function drawMeasurementLine(context, measurement, isDraft) {
  const { start, end } = measurement;
  const settings = getSettings();
  const length = distance(start, end);
  const label = formatPhysicalLength(length, settings);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  context.save();
  context.strokeStyle = isDraft ? "#276fbf" : "#1f7a6b";
  context.fillStyle = isDraft ? "#276fbf" : "#1f7a6b";
  context.lineWidth = isDraft ? 3 : 2.5;
  if (isDraft) context.setLineDash([7, 5]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.setLineDash([]);
  drawDimensionTick(context, start, end);
  drawDimensionTick(context, end, start);
  drawEditableEndpoint(context, start.x, start.y, isDraft);
  drawEditableEndpoint(context, end.x, end.y, isDraft);
  drawMeasurementLabel(context, label, midX, midY);
  context.restore();
}

function drawDimensionTick(context, point, other) {
  const angle = Math.atan2(other.y - point.y, other.x - point.x) + Math.PI / 2;
  const length = 9;
  context.beginPath();
  context.moveTo(point.x - Math.cos(angle) * length, point.y - Math.sin(angle) * length);
  context.lineTo(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length);
  context.stroke();
}

function drawMeasurementLabel(context, label, x, y) {
  context.font = "18px Microsoft YaHei, sans-serif";
  const metrics = context.measureText(label);
  const width = metrics.width + 14;
  const height = 26;
  context.save();
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.strokeStyle = "rgba(31,122,107,0.55)";
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(x + 8, y - height - 8, width, height, 6);
  context.fill();
  context.stroke();
  context.fillStyle = "#1f7a6b";
  context.fillText(label, x + 15, y - 16);
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
  context.lineWidth = active ? 2 : 1.5;
  context.beginPath();
  context.arc(x, y, active ? 4.5 : 3.5, 0, Math.PI * 2);
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

function drawOpenings(context, openings) {
  for (const opening of openings) {
    context.strokeStyle = openingColor(opening);
    context.lineWidth = opening.kind === "door" ? 6 : opening.kind === "uncertain" ? 3 : 5;
    context.lineCap = "round";
    context.globalAlpha = opening.kind === "uncertain" ? 0.42 : 1;
    context.setLineDash(opening.kind === "uncertain" ? [5, 5] : []);
    context.beginPath();
    context.moveTo(opening.x1, opening.y1);
    context.lineTo(opening.x2, opening.y2);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
  }
}

function openingColor(kind) {
  if (kind && typeof kind === "object") {
    const variant = openingVariant(kind);
    if (variant === "high-window") return "#66bfd0";
    if (variant === "floor-window") return "#1c95a8";
    if (variant === "bay-window") return "#49b8c8";
    kind = kind.kind;
  }
  if (kind === "door") return "#e8bf25";
  if (kind === "window") return "#35a7b7";
  if (kind === "opening") return "#f28c28";
  return "#9aa3ad";
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

function initThreeViewer() {
  if (state.three.module && state.three.productsGroup && state.three.lightSourcesGroup) return Promise.resolve(state.three.module);
  if (state.three.readyPromise) return state.three.readyPromise;
  elements.threeStat.textContent = "3D 加载中";
  state.three.readyPromise = import(THREE_MODULE_URL)
    .then((module) => {
      state.three.module = module;
      setupThreeScene();
      updateThreeModel(true);
      return module;
    })
    .catch((error) => {
      state.three.readyPromise = null;
      elements.threeStat.textContent = "3D 加载失败";
      elements.threeViewport.classList.add("is-unavailable");
      throw error;
    });
  return state.three.readyPromise;
}

async function ensureThreeViewerReady() {
  if (state.three.module && state.three.productsGroup && state.three.lightSourcesGroup) return true;
  try {
    await initThreeViewer();
    return Boolean(state.three.module && state.three.productsGroup && state.three.lightSourcesGroup);
  } catch (error) {
    console.warn(error);
    return false;
  }
}

function setupThreeScene() {
  const three = state.three.module;
  state.three.scene = new three.Scene();
  state.three.camera = new three.PerspectiveCamera(42, 1, 0.1, 1000);
  state.three.renderer = new three.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  state.three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.three.renderer.outputColorSpace = three.SRGBColorSpace;
  state.three.renderer.toneMapping = three.ACESFilmicToneMapping;
  state.three.renderer.toneMappingExposure = THREE_RENDER_DEFAULTS.exposure;
  state.three.renderer.shadowMap.enabled = true;
  state.three.renderer.shadowMap.type = three.PCFSoftShadowMap;
  state.three.renderer.domElement.setAttribute("aria-label", "3D 模型预览");
  elements.threeViewport.appendChild(state.three.renderer.domElement);

  setupThreeEnvironment(three);
  setupThreeLighting(three);

  state.three.wallsGroup = new three.Group();
  state.three.scene.add(state.three.wallsGroup);
  state.three.productsGroup = new three.Group();
  state.three.scene.add(state.three.productsGroup);
  state.three.lightSourcesGroup = new three.Group();
  state.three.scene.add(state.three.lightSourcesGroup);
  state.three.center = new three.Vector3(0, WALL_HEIGHT_METERS * 0.42, 0);
  state.three.roamPosition = new three.Vector3(0, 1.55, 0);
  state.three.raycaster = new three.Raycaster();
  state.three.pointer = new three.Vector2();

  bindThreeViewportEvents();
  resizeThreeViewer();
  resetThreeCamera();
}

function lightPreviewColor(source) {
  const temperature = kelvinToSrgb(source.temperatureKelvin);
  const tint = String(source.color || "#ffffff").replace("#", "");
  const tintValue = Number.parseInt(tint, 16);
  const red = Number.isFinite(tintValue) ? (tintValue >> 16) & 255 : 255;
  const green = Number.isFinite(tintValue) ? (tintValue >> 8) & 255 : 255;
  const blue = Number.isFinite(tintValue) ? tintValue & 255 : 255;
  return `rgb(${Math.round(temperature.r * red)} ${Math.round(temperature.g * green)} ${Math.round(temperature.b * blue)})`;
}

function drawLightSources(context) {
  if (!state.lightSources.length) return;
  const settings = getSettings();
  context.save();
  for (const source of state.lightSources) {
    const position = lightSourcePosition(source);
    const color = lightPreviewColor(source);
    const selected = source.id === state.selectedLightSourceId;
    context.save();
    context.translate(position.planX, position.planY);
    context.rotate(((Number(source.rotationDegrees) || 0) * Math.PI) / 180);
    context.globalAlpha = source.enabled ? 1 : 0.36;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = selected ? 4 : 2.5;
    context.shadowColor = color;
    context.shadowBlur = source.enabled ? 9 : 0;
    if (source.type === "line") {
      const halfLength = millimetersToPixels(source.lengthMillimeters, settings) / 2;
      context.beginPath();
      context.moveTo(-halfLength, 0);
      context.lineTo(halfLength, 0);
      context.stroke();
      context.shadowBlur = 0;
      context.fillRect(-halfLength, -2, halfLength * 2, 4);
    } else {
      context.beginPath();
      context.arc(0, 0, selected ? 9 : 7, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.beginPath();
      context.arc(0, 0, selected ? 15 : 12, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }
  context.restore();
}

function setupThreeEnvironment(three) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#93acc0");
  sky.addColorStop(0.44, "#d9e4e8");
  sky.addColorStop(0.58, "#f3eee5");
  sky.addColorStop(1, "#b6afa2");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawEnvironmentGlow(context, 760, 185, 180, "rgba(255, 244, 220, 0.92)");
  drawEnvironmentGlow(context, 180, 230, 150, "rgba(215, 232, 246, 0.66)");

  const texture = new three.CanvasTexture(canvas);
  texture.mapping = three.EquirectangularReflectionMapping;
  texture.colorSpace = three.SRGBColorSpace;
  texture.needsUpdate = true;
  state.three.environmentTexture = texture;
  state.three.scene.background = texture;
  state.three.scene.environment = texture;
  state.three.scene.backgroundBlurriness = THREE_RENDER_DEFAULTS.backgroundBlurriness;
  state.three.scene.backgroundIntensity = THREE_RENDER_DEFAULTS.backgroundIntensity;
  state.three.scene.environmentIntensity = THREE_RENDER_DEFAULTS.environmentIntensity;
}

function drawEnvironmentGlow(context, x, y, radius, color) {
  const glow = context.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(0.3, color.replace(/[\d.]+\)$/, "0.46)"));
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function setupThreeLighting(three) {
  const ambient = new three.HemisphereLight(0xeaf5ff, 0x8f8172, 0.82);
  const key = new three.DirectionalLight(0xfff2dc, 3.1);
  key.position.set(7, 11, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(THREE_RENDER_DEFAULTS.shadowMapSize, THREE_RENDER_DEFAULTS.shadowMapSize);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 3;

  const fill = new three.DirectionalLight(0xc9deee, 0.72);
  fill.position.set(-7, 5, -5);

  state.three.hemisphereLight = ambient;
  state.three.keyLight = key;
  state.three.fillLight = fill;
  state.three.scene.add(ambient, key, key.target, fill);
}

function updateThreeLightingBounds(width, depth) {
  const { keyLight } = state.three;
  if (!keyLight) return;
  const span = Math.max(width, depth, 6);
  const halfSpan = Math.max(4, span * 0.64);
  keyLight.position.set(span * 0.48, Math.max(9, span * 0.78), span * 0.55);
  keyLight.target.position.set(0, WALL_HEIGHT_METERS * 0.35, 0);
  keyLight.target.updateMatrixWorld();
  keyLight.shadow.camera.left = -halfSpan;
  keyLight.shadow.camera.right = halfSpan;
  keyLight.shadow.camera.top = halfSpan;
  keyLight.shadow.camera.bottom = -halfSpan;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = Math.max(30, span * 3);
  keyLight.shadow.camera.updateProjectionMatrix();
}

function normalizeLightSource(source) {
  const light = source || {};
  light.id = String(light.id || `light-${Date.now()}-${state.lightSources.length + 1}`);
  light.type = light.type === "line" ? "line" : "point";
  light.name = String(light.name || (light.type === "line" ? "线光源" : "点光源"));
  light.enabled = light.enabled !== false;
  light.color = /^#[0-9a-f]{6}$/i.test(String(light.color || "")) ? String(light.color).toLowerCase() : "#ffffff";
  light.temperatureKelvin = clamp(Number(light.temperatureKelvin) || DEFAULT_LIGHT_TEMPERATURE_KELVIN, 1000, 20000);
  const brightness = Number(light.brightnessLumens);
  light.brightnessLumens = clamp(
    Number.isFinite(brightness) ? brightness : light.type === "line" ? DEFAULT_LINE_LIGHT_LUMENS : DEFAULT_POINT_LIGHT_LUMENS,
    0,
    100000,
  );
  light.heightMillimeters = clamp(Number(light.heightMillimeters) || DEFAULT_LIGHT_HEIGHT_MILLIMETERS, 50, 20000);
  light.planX = Number.isFinite(Number(light.planX)) ? Number(light.planX) : defaultProductPlanPoint().x;
  light.planY = Number.isFinite(Number(light.planY)) ? Number(light.planY) : defaultProductPlanPoint().y;
  light.lengthMillimeters = clamp(Number(light.lengthMillimeters) || 1200, 100, 20000);
  light.rotationDegrees = normalizeDegrees(Number(light.rotationDegrees) || 0);
  light.castShadow = light.castShadow === true;
  light.ownerProductId = light.ownerProductId ? String(light.ownerProductId) : null;
  return light;
}

function selectedLightSource() {
  return state.lightSources.find((source) => source.id === state.selectedLightSourceId) || null;
}

function createLightSource(type = "point", options = {}) {
  const point = options.point || defaultProductPlanPoint();
  return normalizeLightSource({
    id: options.id,
    type,
    name: options.name,
    enabled: options.enabled,
    color: options.color,
    temperatureKelvin: options.temperatureKelvin,
    brightnessLumens: options.brightnessLumens,
    heightMillimeters: options.heightMillimeters,
    planX: options.planX ?? point.x,
    planY: options.planY ?? point.y,
    lengthMillimeters: options.lengthMillimeters,
    rotationDegrees: options.rotationDegrees,
    castShadow: options.castShadow,
    ownerProductId: options.ownerProductId,
  });
}

function addManualLightSource(type = "point") {
  if (!state.analysisCanvas) ensureDrawingCanvas();
  pushUndoSnapshot(type === "line" ? "add-line-light" : "add-point-light");
  const source = createLightSource(type, {
    name: `${type === "line" ? "线光源" : "点光源"} ${state.lightSources.filter((light) => light.type === type).length + 1}`,
  });
  state.lightSources.push(source);
  state.selectedLightSourceId = source.id;
  updateThreeModel(false);
  renderPreview();
  renderLightingEditor();
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus(`${source.name}已添加`);
  return source;
}

function ensureLightingProductSources() {
  const productIds = new Set(state.productModels.map((product) => product.id));
  state.lightSources = state.lightSources
    .map(normalizeLightSource)
    .filter((source) => !source.ownerProductId || productIds.has(source.ownerProductId));
  for (const product of state.productModels) {
    if (product.category !== "lighting") continue;
    let source = state.lightSources.find((candidate) => candidate.ownerProductId === product.id);
    if (!source) {
      source = createLightSource("point", {
        name: `${product.name || "灯具"} · 默认点光`,
        ownerProductId: product.id,
        planX: product.planX,
        planY: product.planY,
        heightMillimeters: Math.max(100, (Number(product.elevationMeters) || 2.4) * 1000),
        brightnessLumens: DEFAULT_POINT_LIGHT_LUMENS,
      });
      state.lightSources.push(source);
    }
    product.lightSourceId = source.id;
  }
  if (state.selectedLightSourceId && !state.lightSources.some((source) => source.id === state.selectedLightSourceId)) {
    state.selectedLightSourceId = null;
  }
}

function removeLightSourcesForProduct(productId) {
  const removedIds = new Set(state.lightSources.filter((source) => source.ownerProductId === productId).map((source) => source.id));
  state.lightSources = state.lightSources.filter((source) => source.ownerProductId !== productId);
  if (removedIds.has(state.selectedLightSourceId)) state.selectedLightSourceId = null;
}

function clearLightSources() {
  if (state.three.lightSourcesGroup) clearThreeObject(state.three.lightSourcesGroup);
  state.lightSources = [];
  state.selectedLightSourceId = null;
}

function lightSourcePosition(source) {
  const owner = source.ownerProductId ? state.productModels.find((product) => product.id === source.ownerProductId) : null;
  if (!owner) {
    return {
      planX: source.planX,
      planY: source.planY,
      heightMeters: source.heightMillimeters / 1000,
    };
  }
  const heightMeters = Math.max(0.05, Number(owner.elevationMeters) || source.heightMillimeters / 1000);
  return { planX: owner.planX, planY: owner.planY, heightMeters };
}

function kelvinToSrgb(temperatureKelvin) {
  const temperature = clamp(Number(temperatureKelvin) || 6500, 1000, 20000) / 100;
  let red;
  let green;
  let blue;
  if (temperature <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(temperature) - 161.1195681661;
    blue = temperature <= 19 ? 0 : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * ((temperature - 60) ** -0.1332047592);
    green = 288.1221695283 * ((temperature - 60) ** -0.0755148492);
    blue = 255;
  }
  return {
    r: clamp(red, 0, 255) / 255,
    g: clamp(green, 0, 255) / 255,
    b: clamp(blue, 0, 255) / 255,
  };
}

function effectiveLightColor(three, source) {
  const temperature = kelvinToSrgb(source.temperatureKelvin);
  const color = new three.Color().setRGB(temperature.r, temperature.g, temperature.b, three.SRGBColorSpace);
  color.multiply(new three.Color(source.color));
  return color;
}

function configureLocalPointLightShadow(light) {
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.035;
  light.shadow.camera.near = 0.08;
  light.shadow.camera.far = 16;
}

function createLightEditorMarker(three, source, color, lengthMeters = 0) {
  const isLine = source.type === "line";
  const geometry = isLine
    ? new three.BoxGeometry(Math.max(0.12, lengthMeters), 0.055, 0.075)
    : new three.SphereGeometry(0.09, 18, 12);
  const material = new three.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: source.enabled ? 2.4 : 0.18,
    roughness: 0.34,
    metalness: 0.04,
    transparent: true,
    opacity: source.enabled ? 0.96 : 0.38,
  });
  const marker = new three.Mesh(geometry, material);
  marker.userData.lightSourceId = source.id;
  marker.userData.renderHelper = true;
  marker.renderOrder = 14;
  return marker;
}

function createThreeLightSourceObject(three, source, unit, bounds, shadowBudget) {
  const group = new three.Group();
  const position = lightSourcePosition(source);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  group.position.set((position.planX - centerX) * unit, position.heightMeters, (position.planY - centerY) * unit);
  group.rotation.y = ((Number(source.rotationDegrees) || 0) * Math.PI) / 180;
  group.userData.lightSourceId = source.id;

  const color = effectiveLightColor(three, source);
  if (source.type === "line") {
    const lengthMeters = source.lengthMillimeters / 1000;
    const count = clamp(Math.ceil(lengthMeters / 0.55), 2, 7);
    for (let index = 0; index < count; index += 1) {
      const light = new three.PointLight(color, 0, 12, 2);
      light.power = source.brightnessLumens / count;
      light.position.x = count === 1 ? 0 : (index / (count - 1) - 0.5) * lengthMeters;
      light.visible = source.enabled;
      if (source.castShadow && shadowBudget.remaining > 0 && index === Math.floor(count / 2)) {
        configureLocalPointLightShadow(light);
        shadowBudget.remaining -= 1;
      }
      group.add(light);
    }
    group.add(createLightEditorMarker(three, source, color, lengthMeters));
  } else {
    const light = new three.PointLight(color, 0, 14, 2);
    light.power = source.brightnessLumens;
    light.visible = source.enabled;
    if (source.castShadow && shadowBudget.remaining > 0) {
      configureLocalPointLightShadow(light);
      shadowBudget.remaining -= 1;
    }
    group.add(light, createLightEditorMarker(three, source, color));
  }
  return group;
}

function updateThreeLightSources(unit = state.three.unit, bounds = state.three.planBounds) {
  const { module: three, lightSourcesGroup } = state.three;
  if (!three || !lightSourcesGroup || !bounds || !Number.isFinite(unit)) return;
  ensureLightingProductSources();
  clearThreeObject(lightSourcesGroup);
  const shadowBudget = { remaining: 4 };
  for (const source of state.lightSources) {
    lightSourcesGroup.add(createThreeLightSourceObject(three, normalizeLightSource(source), unit, bounds, shadowBudget));
  }
  renderLightingEditor();
}

function openLightingEditor() {
  ensureLightingProductSources();
  if (!state.selectedLightSourceId && state.lightSources.length) state.selectedLightSourceId = state.lightSources[0].id;
  renderLightingEditor();
  elements.lightingModal.hidden = false;
  (state.lightSources.length ? elements.lightingSourceSelect : elements.addPointLightButton).focus({ preventScroll: true });
}

function closeLightingEditor() {
  elements.lightingModal.hidden = true;
}

function lightingEditorInputs() {
  return [
    elements.lightingNameInput,
    elements.lightingEnabledInput,
    elements.lightingColorInput,
    elements.lightingTemperatureInput,
    elements.lightingBrightnessInput,
    elements.lightingHeightInput,
    elements.lightingXInput,
    elements.lightingYInput,
    elements.lightingLengthInput,
    elements.lightingRotationInput,
    elements.lightingShadowInput,
  ];
}

function renderLightingEditor() {
  if (!elements.lightingSourceSelect) return;
  const previous = state.selectedLightSourceId;
  elements.lightingSourceSelect.replaceChildren();
  if (!state.lightSources.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "还没有光源";
    elements.lightingSourceSelect.appendChild(option);
    state.selectedLightSourceId = null;
  } else {
    for (const source of state.lightSources) {
      const option = document.createElement("option");
      option.value = source.id;
      option.textContent = `${source.type === "line" ? "线光" : "点光"} · ${source.name}${source.ownerProductId ? "（灯具绑定）" : ""}`;
      elements.lightingSourceSelect.appendChild(option);
    }
    state.selectedLightSourceId = state.lightSources.some((source) => source.id === previous) ? previous : state.lightSources[0].id;
    elements.lightingSourceSelect.value = state.selectedLightSourceId;
  }

  const source = selectedLightSource();
  for (const input of lightingEditorInputs()) input.disabled = !source;
  elements.lightingDeleteButton.disabled = !source || Boolean(source.ownerProductId);
  elements.lightingAttachedNote.hidden = !source?.ownerProductId;
  elements.lightingLengthField.hidden = !source || source.type !== "line";
  elements.lightingRotationField.hidden = !source || source.type !== "line";
  if (!source) return;

  const settings = getSettings();
  const position = lightSourcePosition(source);
  elements.lightingNameInput.value = source.name;
  elements.lightingEnabledInput.checked = source.enabled;
  elements.lightingColorInput.value = source.color;
  elements.lightingTemperatureInput.value = String(Math.round(source.temperatureKelvin));
  elements.lightingBrightnessInput.value = String(Math.round(source.brightnessLumens));
  elements.lightingHeightInput.value = String(Math.round(position.heightMeters * 1000));
  elements.lightingXInput.value = String(Math.round(pxToMillimeters(position.planX, settings)));
  elements.lightingYInput.value = String(Math.round(pxToMillimeters(position.planY, settings)));
  elements.lightingLengthInput.value = String(Math.round(source.lengthMillimeters));
  elements.lightingRotationInput.value = String(Math.round(source.rotationDegrees));
  elements.lightingShadowInput.checked = source.castShadow;
  elements.lightingHeightInput.disabled = Boolean(source.ownerProductId);
  elements.lightingXInput.disabled = Boolean(source.ownerProductId);
  elements.lightingYInput.disabled = Boolean(source.ownerProductId);
}

function applyLightingEditorChanges() {
  const source = selectedLightSource();
  if (!source) return;
  const settings = getSettings();
  source.name = elements.lightingNameInput.value.trim() || (source.type === "line" ? "线光源" : "点光源");
  source.enabled = elements.lightingEnabledInput.checked;
  source.color = elements.lightingColorInput.value;
  source.temperatureKelvin = Number(elements.lightingTemperatureInput.value);
  source.brightnessLumens = Number(elements.lightingBrightnessInput.value);
  source.lengthMillimeters = Number(elements.lightingLengthInput.value);
  source.rotationDegrees = Number(elements.lightingRotationInput.value);
  source.castShadow = elements.lightingShadowInput.checked;
  if (!source.ownerProductId) {
    source.heightMillimeters = Number(elements.lightingHeightInput.value);
    source.planX = millimetersToPixels(Number(elements.lightingXInput.value), settings);
    source.planY = millimetersToPixels(Number(elements.lightingYInput.value), settings);
    if (state.analysisCanvas) {
      source.planX = clamp(source.planX, 0, state.analysisCanvas.width);
      source.planY = clamp(source.planY, 0, state.analysisCanvas.height);
    }
  }
  normalizeLightSource(source);
  updateThreeLightSources();
  renderPreview();
  renderThreeScene();
  elements.saveProjectButton.disabled = false;
}

function deleteSelectedLightSource() {
  const source = selectedLightSource();
  if (!source || source.ownerProductId) return false;
  pushUndoSnapshot("delete-light");
  state.lightSources = state.lightSources.filter((candidate) => candidate.id !== source.id);
  state.selectedLightSourceId = state.lightSources[0]?.id || null;
  updateThreeModel(false);
  renderPreview();
  renderLightingEditor();
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus("光源已删除");
  return true;
}

function bindThreeViewportEvents() {
  elements.threeViewport.addEventListener("pointerdown", handleThreePointerDown);
  elements.threeViewport.addEventListener("pointermove", handleThreePointerMove);
  elements.threeViewport.addEventListener("pointerup", handleThreePointerUp);
  elements.threeViewport.addEventListener("pointercancel", handleThreePointerUp);
  elements.threeViewport.addEventListener("dblclick", handleThreeDoubleClick);
  elements.threeViewport.addEventListener("wheel", handleThreeWheel, { passive: false });
  elements.threeViewport.addEventListener("keydown", handleThreeKeyDown);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeThreeViewer).observe(elements.threeViewport);
  } else {
    window.addEventListener("resize", resizeThreeViewer);
  }
}

function resizeThreeViewer() {
  const { renderer, camera } = state.three;
  if (!renderer || !camera) return;
  const rect = elements.threeViewport.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  positionThreeComponentCard();
  renderThreeScene();
}

function updateThreeModel(resetCamera) {
  updateThreeStat();
  const { module: three, renderer, scene, wallsGroup } = state.three;
  if (!three || !renderer || !scene || !wallsGroup) return;

  clearThreeObject(wallsGroup);
  if (state.three.floor) {
    scene.remove(state.three.floor);
    disposeThreeObject(state.three.floor);
    state.three.floor = null;
  }

  const settings = getSettings();
  const closedWallLines = getClosedWallLines(settings);
  const bounds = getPlanBounds(closedWallLines.length ? closedWallLines : state.lines);
  const sourceWidth = state.analysisCanvas ? state.analysisCanvas.width : 0;
  const sourceHeight = state.analysisCanvas ? state.analysisCanvas.height : 0;
  const maxSpan = Math.max(bounds.width, bounds.height, sourceWidth, sourceHeight, 1);
  const unit = 12 / maxSpan;
  state.three.planBounds = bounds;
  state.three.unit = unit;
  const floorWidth = Math.max(5, bounds.width * unit + 1.4, sourceWidth * unit + 0.6);
  const floorDepth = Math.max(5, bounds.height * unit + 1.4, sourceHeight * unit + 0.6);
  state.three.roamBounds = { width: floorWidth, depth: floorDepth };
  updateThreeLightingBounds(floorWidth, floorDepth);
  const floor = createThreeFloor(three, floorWidth, floorDepth, bounds, unit);
  state.three.floor = floor;
  scene.add(floor);

  const pierIds = new Set((state.topology.endPiers || []).map((pier) => pier.wall));
  const openings = constructibleOpenings();
  const wallModels = buildContinuousWallModels(closedWallLines, openings, settings);
  let maxWallHeight = WALL_HEIGHT_METERS;
  const renderedWallSegments = [];
  for (const model of wallModels) {
    for (const segment of splitWallModelByOpenings(model, openings, settings)) {
      const { line, index } = segment;
      maxWallHeight = Math.max(maxWallHeight, lineHeightMeters(line));
      const wall = createThreeWall(three, line, index, unit, bounds, pierIds.has(line.id), closedWallLines);
      wallsGroup.add(wall);
      renderedWallSegments.push({ line: lineWithJointExtensions(line, closedWallLines, settings), sourceLine: line, index });
    }
  }
  for (const cap of createThreeWallJointCaps(three, renderedWallSegments, unit, bounds, settings)) {
    wallsGroup.add(cap);
  }
  (state.topology.openings || []).forEach((opening, index) => {
    if (!isConstructibleOpening(opening)) return;
    wallsGroup.add(createThreeOpeningComponent(three, opening, index, unit, bounds));
  });
  state.manualRailings.forEach((railing) => {
    wallsGroup.add(createThreeRailing(three, railing, unit, bounds));
  });
  updateProductModelTransforms(unit, bounds);
  updateThreeLightSources(unit, bounds);

  state.three.center.set(0, maxWallHeight * 0.45, 0);
  state.three.radius = Math.max(7.5, Math.max(floorWidth, floorDepth) * 0.9);
  if (resetCamera) resetThreeCamera();
  else updateThreeCamera();
}

function updateThreeStat() {
  const rooms = state.topology && state.topology.rooms ? state.topology.rooms.length : 0;
  const openings = state.topology && state.topology.openings ? constructibleOpenings().length : 0;
  elements.threeStat.textContent = `${state.lines.length} 墙体 / ${openings} 洞口 / ${state.manualRailings.length} 栏杆 / ${state.productModels.length} 产品 / ${state.lightSources.length} 光源 / ${rooms} 房间`;
}

function createThreeFloor(three, width, depth, bounds, unit) {
  const group = new three.Group();
  const geometry = new three.PlaneGeometry(width, depth);
  const material = new three.MeshStandardMaterial({
    color: 0xe8e3da,
    roughness: 0.72,
    metalness: 0,
    side: three.DoubleSide,
  });
  const plane = new three.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  group.add(plane);

  const planPlane = createThreePlanImagePlane(three, bounds, unit);
  if (planPlane) group.add(planPlane);

  const grid = new three.GridHelper(Math.max(width, depth), 16, 0x9db2b7, 0xc9d6d9);
  grid.position.y = 0.018;
  grid.userData.renderHelper = true;
  group.add(grid);
  return group;
}

function createThreePlanImagePlane(three, bounds, unit) {
  if (!state.analysisCanvas) return null;
  const texture = createBlurredPlanTexture(three);
  if (!texture) return null;
  const imageWidth = state.analysisCanvas.width * unit;
  const imageDepth = state.analysisCanvas.height * unit;
  const geometry = new three.PlaneGeometry(imageWidth, imageDepth);
  const material = new three.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.38,
    side: three.DoubleSide,
    depthWrite: false,
  });
  const plane = new three.Mesh(geometry, material);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set((state.analysisCanvas.width / 2 - centerX) * unit, 0.007, (state.analysisCanvas.height / 2 - centerY) * unit);
  plane.renderOrder = -2;
  plane.userData.renderHelper = true;
  return plane;
}

function createBlurredPlanTexture(three) {
  if (!state.analysisCanvas) return null;
  const source = state.analysisCanvas;
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = "blur(2.8px) grayscale(18%) brightness(1.12)";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  context.filter = "none";
  const texture = new three.CanvasTexture(canvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.anisotropy = state.three.renderer ? Math.min(4, state.three.renderer.capabilities.getMaxAnisotropy()) : 1;
  texture.needsUpdate = true;
  return texture;
}

function lineWithJointExtensions(line, hostLines, settings) {
  const renderLine = cloneLine(line);
  const center = {
    x: (line.x1 + line.x2) / 2,
    y: (line.y1 + line.y2) / 2,
  };

  ["start", "end"].forEach((end) => {
    if (shouldSkipJointExtension(renderLine, end)) return;
    const point = lineEndpoint(line, end);
    const host = nearestPerpendicularWallAtEndpoint(line, point, hostLines, settings);
    if (!host) return;
    if (line.orientation === "horizontal") {
      setLineEndpoint(renderLine, end, { x: perpendicularHostOuterAxis(line, point, host, settings), y: point.y });
    } else {
      setLineEndpoint(renderLine, end, { x: point.x, y: perpendicularHostOuterAxis(line, point, host, settings) });
    }
    normalizeEditedLine(renderLine);
  });

  return renderLine;
}

function perpendicularHostOuterAxis(line, point, host, settings) {
  return line.orientation === "horizontal" ? host.x1 : host.y1;
}

function shouldSkipJointExtension(line, end) {
  const skipEnds = line.skipJointExtensionEnds;
  if (line.skipJointExtensions && !skipEnds) return true;
  return Boolean(skipEnds && skipEnds[end]);
}

function createThreeWall(three, line, index, unit, bounds, isPier, hostLines = state.lines) {
  const settings = getSettings();
  const renderLine = lineWithJointExtensions(line, hostLines, settings);
  const length = Math.max(renderLine.length * unit, 0.08);
  const thickness = Math.max(visualWallThicknessPixels(line, settings) * unit, 0.08);
  const width = renderLine.orientation === "horizontal" ? length : thickness;
  const depth = renderLine.orientation === "horizontal" ? thickness : length;
  const height = lineHeightMeters(line);
  const base = Math.max(0, Number(line.baseMeters) || 0);
  const geometry = new three.BoxGeometry(width, height, depth);
  const material = new three.MeshStandardMaterial({
    color: index === state.selectedLineIndex ? 0xf2a13a : 0xf7f5ef,
    roughness: 0.82,
    metalness: 0,
    transparent: index === state.selectedLineIndex,
    opacity: index === state.selectedLineIndex ? 0.86 : 1,
  });
  const mesh = new three.Mesh(geometry, material);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  mesh.position.set(((renderLine.x1 + renderLine.x2) / 2 - centerX) * unit, base + height / 2, ((renderLine.y1 + renderLine.y2) / 2 - centerY) * unit);
  mesh.userData.lineIndex = index;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new three.Group();
  group.userData.lineIndex = index;
  group.add(mesh);
  const edge = new three.LineSegments(
    new three.EdgesGeometry(geometry),
    new three.LineBasicMaterial({
      color: index === state.selectedLineIndex ? 0x8d4c0c : 0xd8d3c8,
      transparent: true,
      opacity: index === state.selectedLineIndex ? 0.54 : 0.24,
    }),
  );
  edge.position.copy(mesh.position);
  edge.userData.lineIndex = index;
  edge.userData.renderHelper = true;
  group.add(edge);
  return group;
}

function createThreeWallJointCaps(three, segments, unit, bounds, settings) {
  const horizontal = segments.filter((segment) => segment.line.orientation === "horizontal" && shouldWallSegmentReceiveJointCaps(segment.sourceLine));
  const vertical = segments.filter((segment) => segment.line.orientation === "vertical" && shouldWallSegmentReceiveJointCaps(segment.sourceLine));
  const eligible = [...horizontal, ...vertical];
  const caps = [];
  const seen = new Set();
  const addCap = (h, v) => {
    const key = wallJointCapKey(h, v);
    if (seen.has(key)) return;
    seen.add(key);
    caps.push(createThreeWallJointCap(three, h, v, unit, bounds, settings));
  };
  for (const h of horizontal) {
    for (const v of vertical) {
      if (!wallSegmentsIntersectForCap(h.line, v.line, settings)) continue;
      addCap(h, v);
    }
  }
  for (const segment of eligible) {
    for (const end of ["start", "end"]) {
      const host = nearestPerpendicularSegmentAtEndpoint(segment, lineEndpoint(segment.line, end), eligible, settings);
      if (!host) continue;
      const h = segment.line.orientation === "horizontal" ? segment : host;
      const v = segment.line.orientation === "vertical" ? segment : host;
      addCap(h, v);
    }
  }
  return caps;
}

function shouldWallSegmentReceiveJointCaps(line) {
  return (Number(line.baseMeters) || 0) <= 0.05;
}

function wallJointCapKey(horizontal, vertical) {
  return `${Math.round(vertical.line.x1)}:${Math.round(horizontal.line.y1)}:${Math.round(Math.min(lineHeightMeters(horizontal.sourceLine), lineHeightMeters(vertical.sourceLine)) * 1000)}`;
}

function wallSegmentsIntersectForCap(horizontal, vertical, settings) {
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness);
  const x = vertical.x1;
  const y = horizontal.y1;
  if (x < horizontal.x1 - tolerance || x > horizontal.x2 + tolerance) return false;
  if (y < vertical.y1 - tolerance || y > vertical.y2 + tolerance) return false;
  return true;
}

function nearestPerpendicularSegmentAtEndpoint(segment, point, candidates, settings) {
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness, segment.sourceLine.thickness || 1);
  const targetOrientation = segment.line.orientation === "horizontal" ? "vertical" : "horizontal";
  let best = null;
  for (const candidate of candidates) {
    if (candidate === segment || candidate.line.orientation !== targetOrientation) continue;
    const axisMiss = segment.line.orientation === "horizontal" ? Math.abs(candidate.line.x1 - point.x) : Math.abs(candidate.line.y1 - point.y);
    const spanMiss = segment.line.orientation === "horizontal"
      ? perpendicularMiss(point.y, candidate.line.y1, candidate.line.y2)
      : perpendicularMiss(point.x, candidate.line.x1, candidate.line.x2);
    if (axisMiss > tolerance || spanMiss > tolerance) continue;
    const score = axisMiss + spanMiss * 0.5;
    if (!best || score < best.score) best = { segment: candidate, score };
  }
  return best ? best.segment : null;
}

function createThreeWallJointCap(three, horizontal, vertical, unit, bounds, settings) {
  const hThickness = Math.max(visualWallThicknessPixels(horizontal.sourceLine, settings) * unit, 0.08);
  const vThickness = Math.max(visualWallThicknessPixels(vertical.sourceLine, settings) * unit, 0.08);
  const height = Math.min(lineHeightMeters(horizontal.sourceLine), lineHeightMeters(vertical.sourceLine));
  const base = Math.max(Number(horizontal.sourceLine.baseMeters) || 0, Number(vertical.sourceLine.baseMeters) || 0);
  const geometry = new three.BoxGeometry(vThickness, height, hThickness);
  const material = new three.MeshStandardMaterial({
    color: 0xf7f5ef,
    roughness: 0.82,
    metalness: 0,
  });
  const mesh = new three.Mesh(geometry, material);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  mesh.position.set((vertical.line.x1 - centerX) * unit, base + height / 2, (horizontal.line.y1 - centerY) * unit);
  mesh.userData.wallJointCap = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new three.Group();
  group.userData.wallJointCap = true;
  group.add(mesh);
  const edge = new three.LineSegments(
    new three.EdgesGeometry(geometry),
    new three.LineBasicMaterial({ color: 0xd8d3c8, transparent: true, opacity: 0.16 }),
  );
  edge.position.copy(mesh.position);
  edge.userData.wallJointCap = true;
  edge.userData.renderHelper = true;
  group.add(edge);
  return group;
}

function nearestPerpendicularWallAtEndpoint(line, point, candidates, settings) {
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness, line.thickness || 1);
  const targetOrientation = line.orientation === "horizontal" ? "vertical" : "horizontal";
  return candidates
    .filter((candidate) => candidate.orientation === targetOrientation)
    .filter((candidate) => {
      if (line.orientation === "horizontal") {
        const endpointNearAxis = Math.abs(candidate.x1 - point.x) <= tolerance;
        const crossesAxis = point.y >= Math.min(candidate.y1, candidate.y2) - tolerance && point.y <= Math.max(candidate.y1, candidate.y2) + tolerance;
        return endpointNearAxis && crossesAxis;
      }
      const endpointNearAxis = Math.abs(candidate.y1 - point.y) <= tolerance;
      const crossesAxis = point.x >= Math.min(candidate.x1, candidate.x2) - tolerance && point.x <= Math.max(candidate.x1, candidate.x2) + tolerance;
      return endpointNearAxis && crossesAxis;
    })
    .sort((a, b) => {
      const aDistance = line.orientation === "horizontal" ? Math.abs(a.x1 - point.x) : Math.abs(a.y1 - point.y);
      const bDistance = line.orientation === "horizontal" ? Math.abs(b.x1 - point.x) : Math.abs(b.y1 - point.y);
      return aDistance - bDistance;
    })[0];
}

function createThreeRailing(three, railing, unit, bounds) {
  const settings = getSettings();
  const length = Math.max(railing.length * unit, 0.08);
  const thickness = Math.max(millimetersToPixels(railing.thicknessMillimeters || RAILING_DEFAULT_THICKNESS_MM, settings) * unit, 0.04);
  const height = Math.max(0.1, (railing.heightMillimeters || RAILING_DEFAULT_HEIGHT_MM) / 1000);
  const width = railing.orientation === "horizontal" ? length : thickness;
  const depth = railing.orientation === "horizontal" ? thickness : length;
  const geometry = new three.BoxGeometry(width, height, depth);
  const isSelected = railing.id === state.selectedRailingId;
  const material = new three.MeshStandardMaterial({
    color: isSelected ? 0xffb14a : 0x455a64,
    roughness: 0.55,
    metalness: 0.02,
  });
  const mesh = new three.Mesh(geometry, material);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  mesh.position.set(((railing.x1 + railing.x2) / 2 - centerX) * unit, height / 2, ((railing.y1 + railing.y2) / 2 - centerY) * unit);
  mesh.userData.railingId = railing.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new three.Group();
  group.userData.railingId = railing.id;
  group.add(mesh);
  if (isSelected) {
    const edge = new three.LineSegments(
      new three.EdgesGeometry(geometry),
      new three.LineBasicMaterial({ color: 0x8d4c0c, transparent: true, opacity: 0.62 }),
    );
    edge.position.copy(mesh.position);
    edge.userData.railingId = railing.id;
    group.add(edge);
  }
  return group;
}

function interiorCategoryDefinition(category) {
  return INTERIOR_CATEGORY_DEFINITIONS[category] || INTERIOR_CATEGORY_DEFINITIONS.custom;
}

function productCategoryLabel(category) {
  return state.interiorCategoryLabels.get(category) || interiorCategoryDefinition(category).label || category || "其他内饰";
}

function normalizeDimensionRecord(value, fallback) {
  const source = value || {};
  const list = Array.isArray(source) ? source : null;
  return {
    width: Math.max(1, Number(list ? list[0] : source.width) || fallback[0]),
    depth: Math.max(1, Number(list ? list[1] : source.depth) || fallback[1]),
    height: Math.max(1, Number(list ? list[2] : source.height) || fallback[2]),
  };
}

function normalizeCenterRecord(value, height) {
  const source = value || {};
  const list = Array.isArray(source) ? source : null;
  return {
    x: Number(list ? list[0] : source.x) || 0,
    y: Number.isFinite(Number(list ? list[1] : source.y)) ? Number(list ? list[1] : source.y) : height / 2,
    z: Number(list ? list[2] : source.z) || 0,
  };
}

function normalizeInteriorAssetEntry(rawAsset, baseUrl = document.baseURI) {
  if (!rawAsset || typeof rawAsset !== "object") throw new Error("资产条目必须是对象");
  const id = String(rawAsset.id || "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) throw new Error(`无效资产 id: ${id || "(empty)"}`);
  const category = String(rawAsset.category || "custom").trim() || "custom";
  const definition = interiorCategoryDefinition(category);
  const dimensionsMillimeters = normalizeDimensionRecord(rawAsset.dimensionsMillimeters, definition.size);
  const collisionInput = rawAsset.collision || {};
  if (collisionInput.type && collisionInput.type !== "box") throw new Error(`资产 ${id} 目前仅支持 box 碰撞箱`);
  const collisionSize = normalizeDimensionRecord(collisionInput.sizeMillimeters, [
    dimensionsMillimeters.width,
    dimensionsMillimeters.depth,
    dimensionsMillimeters.height,
  ]);
  const modelUri = String(rawAsset.model?.uri || rawAsset.modelUri || "").trim();
  let modelUrl = "";
  if (modelUri) {
    modelUrl = new URL(modelUri, rawAsset.baseUrl ? new URL(rawAsset.baseUrl, baseUrl) : baseUrl).href;
    if (!/\.(glb|gltf)(?:[?#].*)?$/i.test(modelUrl)) throw new Error(`资产 ${id} 的模型必须是 GLB/GLTF`);
  }
  const placement = rawAsset.placement || {};
  return {
    id,
    name: String(rawAsset.name || id),
    category,
    categoryLabel: String(rawAsset.categoryLabel || ""),
    subcategory: String(rawAsset.subcategory || category),
    tags: Array.isArray(rawAsset.tags) ? rawAsset.tags.map(String) : [],
    modelUrl,
    modelFormat: String(rawAsset.model?.format || (modelUrl.toLowerCase().includes(".gltf") ? "gltf" : "glb")),
    dimensionsMillimeters,
    collision: {
      type: "box",
      sizeMillimeters: collisionSize,
      centerMillimeters: normalizeCenterRecord(collisionInput.centerMillimeters, collisionSize.height),
      clearanceMillimeters: Math.max(0, Number(collisionInput.clearanceMillimeters) || 0),
      scaleWithModel: collisionInput.scaleWithModel !== false,
    },
    placement: {
      mount: String(placement.mount || definition.mount || "floor"),
      defaultElevationMillimeters: Math.max(0, Number.isFinite(Number(placement.defaultElevationMillimeters)) ? Number(placement.defaultElevationMillimeters) : definition.elevation || 0),
      rotationStepDegrees: Math.max(1, Number(placement.rotationStepDegrees) || PRODUCT_ROTATE_STEP_DEGREES),
      allowWallOverlap: placement.allowWallOverlap === true || ["wall", "ceiling"].includes(placement.mount || definition.mount),
    },
    source: rawAsset,
  };
}

function registerInteriorCatalog(catalog, options = {}) {
  if (!catalog || catalog.schemaVersion !== INTERIOR_CATALOG_SCHEMA || !Array.isArray(catalog.assets)) {
    throw new Error(`内饰目录必须使用 ${INTERIOR_CATALOG_SCHEMA}，并包含 assets 数组`);
  }
  if (catalog.units && catalog.units !== "millimeters") throw new Error("内饰目录 dimensions/collision 当前只接受 millimeters");
  const baseUrl = options.baseUrl || document.baseURI;
  for (const category of Array.isArray(catalog.categories) ? catalog.categories : []) {
    if (category?.id && category?.label) state.interiorCategoryLabels.set(String(category.id), String(category.label));
  }
  let registered = 0;
  for (const rawAsset of catalog.assets) {
    const asset = normalizeInteriorAssetEntry(rawAsset, baseUrl);
    if (asset.categoryLabel) state.interiorCategoryLabels.set(asset.category, asset.categoryLabel);
    state.interiorAssets.set(asset.id, asset);
    registered += 1;
  }
  const source = options.source || catalog.name || "catalog";
  if (!state.interiorCatalogSources.includes(source)) state.interiorCatalogSources.push(source);
  renderInteriorLibraryControls();
  return registered;
}

async function ensureInteriorCatalogReady() {
  if (state.interiorCatalogReadyPromise) return state.interiorCatalogReadyPromise;
  state.interiorCatalogReadyPromise = fetch(INTERIOR_CATALOG_URL, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const catalog = await response.json();
      const count = registerInteriorCatalog(catalog, { source: INTERIOR_CATALOG_URL, baseUrl: new URL(INTERIOR_CATALOG_URL, document.baseURI) });
      setInteriorLibraryStatus(count ? `已加载 ${count} 个目录资产` : "接口已就绪，等待添加 GLB 资产");
      return count;
    })
    .catch((error) => {
      console.warn("内饰目录加载失败", error);
      setInteriorLibraryStatus("内饰目录未加载，可导入目录 JSON 或单个 GLB");
      return 0;
    });
  return state.interiorCatalogReadyPromise;
}

function setInteriorLibraryStatus(message) {
  if (elements.interiorLibraryStatus) elements.interiorLibraryStatus.textContent = message;
}

function renderInteriorLibraryControls() {
  if (!elements.interiorCategorySelect || !elements.interiorAssetSelect) return;
  const selectedCategory = elements.interiorCategorySelect.value || state.pendingProductCategory || "furniture";
  const categories = new Map(Object.entries(INTERIOR_CATEGORY_DEFINITIONS).map(([id, definition]) => [id, definition.label]));
  for (const [id, label] of state.interiorCategoryLabels) categories.set(id, label);
  for (const asset of state.interiorAssets.values()) categories.set(asset.category, asset.categoryLabel || productCategoryLabel(asset.category));
  elements.interiorCategorySelect.replaceChildren(...[...categories.entries()].map(([id, label]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    return option;
  }));
  elements.interiorCategorySelect.value = categories.has(selectedCategory) ? selectedCategory : "furniture";
  state.pendingProductCategory = elements.interiorCategorySelect.value;

  const assets = [...state.interiorAssets.values()].filter((asset) => asset.category === state.pendingProductCategory);
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = assets.length ? "请选择资产" : "该分类暂无模型";
  elements.interiorAssetSelect.replaceChildren(empty, ...assets.map((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = `${asset.name}${asset.modelUrl ? "" : "（占位）"}`;
    return option;
  }));
  elements.addInteriorAssetButton.disabled = !assets.length;
}

async function openInteriorLibrary() {
  await ensureInteriorCatalogReady();
  renderInteriorLibraryControls();
  elements.interiorLibraryModal.hidden = false;
}

function closeInteriorLibrary() {
  elements.interiorLibraryModal.hidden = true;
}

async function importInteriorCatalogFromFile(file) {
  if (!file) return;
  try {
    const catalog = JSON.parse(await file.text());
    const count = registerInteriorCatalog(catalog, { source: file.name, baseUrl: document.baseURI });
    setInteriorLibraryStatus(`已从 ${file.name} 注册 ${count} 个资产`);
    setStatus(`内饰目录已导入：${count} 个资产`);
  } catch (error) {
    console.error(error);
    setInteriorLibraryStatus(`目录导入失败：${error.message}`);
    setStatus("内饰目录导入失败");
  } finally {
    elements.interiorCatalogInput.value = "";
  }
}

function inferProductSubtype(name, category) {
  if (category === "window") {
    const text = String(name || "").toLowerCase();
    if (/louver|shutter|blind|百叶|百页/.test(text)) return "louver-window";
    if (/door|门/.test(text)) return "door-window";
    return "window";
  }
  if (category !== "furniture") return category || "product";
  const text = String(name || "").toLowerCase();
  if (/coffee[_\-\s]*table|table[_\-\s]*coffee|茶几/.test(text)) return "coffee-table";
  if (/wardrobe|closet|cabinet|衣柜|柜/.test(text)) return "wardrobe";
  if (/chair|餐椅|椅/.test(text)) return "chair";
  if (/bed|床/.test(text)) return "bed";
  if (/sofa|couch|沙发/.test(text)) return "sofa";
  return "furniture";
}

function normalizeProductMetadata(product) {
  if (!product) return product;
  if (product.category === "window" && /louver|shutter|blind|百叶|百页/.test(String(product.name || "").toLowerCase())) {
    product.productSubtype = "louver-window";
  }
  product.productSubtype = product.productSubtype || inferProductSubtype(product.name, product.category);
  const definition = interiorCategoryDefinition(product.category);
  product.widthMillimeters = Math.max(1, Number(product.widthMillimeters) || definition.size[0]);
  product.depthMillimeters = Math.max(1, Number(product.depthMillimeters) || definition.size[1]);
  product.heightMillimeters = Math.max(1, Number(product.heightMillimeters) || definition.size[2]);
  product.assetDimensionsMillimeters = normalizeDimensionRecord(product.assetDimensionsMillimeters, [
    product.widthMillimeters,
    product.depthMillimeters,
    product.heightMillimeters,
  ]);
  const collision = product.collision || {};
  const collisionSize = normalizeDimensionRecord(collision.sizeMillimeters, [
    product.assetDimensionsMillimeters.width,
    product.assetDimensionsMillimeters.depth,
    product.assetDimensionsMillimeters.height,
  ]);
  product.collision = {
    type: "box",
    sizeMillimeters: collisionSize,
    centerMillimeters: normalizeCenterRecord(collision.centerMillimeters, collisionSize.height),
    clearanceMillimeters: Math.max(0, Number(collision.clearanceMillimeters) || 0),
    scaleWithModel: collision.scaleWithModel !== false,
  };
  const placement = product.placement || {};
  product.placement = {
    mount: String(placement.mount || definition.mount || "floor"),
    defaultElevationMillimeters: Math.max(0, Number.isFinite(Number(placement.defaultElevationMillimeters)) ? Number(placement.defaultElevationMillimeters) : definition.elevation || 0),
    rotationStepDegrees: Math.max(1, Number(placement.rotationStepDegrees) || PRODUCT_ROTATE_STEP_DEGREES),
    allowWallOverlap: placement.allowWallOverlap === true || ["wall", "ceiling"].includes(placement.mount || definition.mount),
  };
  if (!Number.isFinite(Number(product.elevationMeters))) product.elevationMeters = product.placement.defaultElevationMillimeters / 1000;
  return product;
}

function productSubtypeLabel(product) {
  const subtype = product && (product.productSubtype || inferProductSubtype(product.name, product.category));
  if (subtype === "louver-window") return "百叶窗";
  if (subtype === "door-window") return "门窗";
  if (subtype === "window") return "窗";
  if (subtype === "coffee-table") return "茶几";
  if (subtype === "wardrobe") return "衣柜";
  if (subtype === "chair") return "餐椅";
  if (subtype === "bed") return "床";
  if (subtype === "sofa") return "沙发";
  return productCategoryLabel(product ? product.category : "furniture");
}

function productDefaultSizeMeters(category, subtype = null) {
  if (category === "window") return subtype === "door-window" ? 0.9 : 1.2;
  if (subtype === "coffee-table") return 1.0;
  if (subtype === "wardrobe") return 1.6;
  if (subtype === "chair") return 0.55;
  if (subtype === "bed") return 2.0;
  if (subtype === "sofa") return 1.8;
  return interiorCategoryDefinition(category).size[0] / 1000;
}

function productDefaultDepthMeters(category, subtype = null) {
  if (category === "window") return subtype === "door-window" ? 0.12 : 0.16;
  if (subtype === "coffee-table") return 0.6;
  if (subtype === "wardrobe") return 0.6;
  if (subtype === "chair") return 0.55;
  if (subtype === "bed") return 1.5;
  if (subtype === "sofa") return 0.85;
  return interiorCategoryDefinition(category).size[1] / 1000;
}

function productDefaultHeightMeters(category, subtype = null) {
  if (category === "window") return subtype === "door-window" ? 2.1 : 1.5;
  if (subtype === "coffee-table") return 0.45;
  if (subtype === "wardrobe") return 2.2;
  if (subtype === "chair") return 0.85;
  if (subtype === "bed") return 0.55;
  if (subtype === "sofa") return 0.85;
  return interiorCategoryDefinition(category).size[2] / 1000;
}

function productMinimumSizeMeters(category, subtype = null) {
  return 0.02;
}

function productMinimumDepthMeters(category, subtype = null) {
  return 0.02;
}

function productMinimumHeightMeters(category, subtype = null) {
  return 0.05;
}

function clampProductDimensionMillimeters(product, parameter, value) {
  normalizeProductMetadata(product);
  if (parameter === "length") return Math.max(Math.round(productMinimumSizeMeters(product.category, product.productSubtype) * 1000), Math.round(value));
  if (parameter === "thickness") return Math.max(Math.round(productMinimumDepthMeters(product.category, product.productSubtype) * 1000), Math.round(value));
  if (parameter === "height") return Math.max(Math.round(productMinimumHeightMeters(product.category, product.productSubtype) * 1000), Math.round(value));
  return Math.max(50, Math.round(value));
}

function selectedProduct() {
  if (!state.selectedProductId) return null;
  return state.productModels.find((product) => product.id === state.selectedProductId) || null;
}

function productFootprintPixels(product, settings = getSettings()) {
  normalizeProductMetadata(product);
  const footprint = productFootprintMeters(product);
  const width = millimetersToPixels(footprint.width * 1000, settings);
  const depth = millimetersToPixels(footprint.depth * 1000, settings);
  return { width: Math.max(10, width), depth: Math.max(10, depth) };
}

function productFootprintMeters(product) {
  normalizeProductMetadata(product);
  const base = productDefaultSizeMeters(product.category, product.productSubtype);
  const fallback = {
    width: Math.max(0.05, (product.widthMillimeters || base * 1000) / 1000),
    depth: Math.max(0.05, (product.depthMillimeters || productDefaultDepthMeters(product.category, product.productSubtype) * 1000) / 1000),
  };
  if (Number(product.widthMillimeters) > 0 || Number(product.depthMillimeters) > 0) return fallback;
  const modelRoot = product.object ? findProductScenePart(product.object, "productModelRoot") : null;
  const normalizedSize = modelRoot && modelRoot.userData && modelRoot.userData.productNormalizedSize;
  if (!modelRoot || !normalizedSize) return fallback;
  return {
    width: Math.max(0.05, normalizedSize.x * modelRoot.scale.x),
    depth: Math.max(0.05, normalizedSize.z * modelRoot.scale.z),
  };
}

function productRotationHandlePoint(product, settings = getSettings()) {
  const { width, depth } = productFootprintPixels(product, settings);
  const localX = width / 2 + 26;
  const localY = -depth / 2 - 26;
  const angle = ((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
  return {
    x: product.planX + localX * Math.cos(angle) - localY * Math.sin(angle),
    y: product.planY + localX * Math.sin(angle) + localY * Math.cos(angle),
  };
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function productColor(category) {
  const colors = {
    window: "#c49a33", sanitary: "#2aa7b6", hardware: "#455a64", kitchen: "#c76b3d",
    appliance: "#697b8c", lighting: "#d69f25", electronics: "#495a9c", textile: "#9b6ca6",
    decor: "#bd6680", greenery: "#4d9862", office: "#517ca8", fitness: "#a85b51",
    children: "#dc7d54", pet: "#8b765d", hvac: "#4f8e9a", storage: "#79664f",
  };
  return colors[category] || "#5578c8";
}

function productCollisionDimensionsMillimeters(product) {
  normalizeProductMetadata(product);
  const collision = product.collision;
  const base = product.assetDimensionsMillimeters;
  const scale = collision.scaleWithModel ? {
    width: product.widthMillimeters / Math.max(1, base.width),
    depth: product.depthMillimeters / Math.max(1, base.depth),
    height: product.heightMillimeters / Math.max(1, base.height),
  } : { width: 1, depth: 1, height: 1 };
  return {
    width: collision.sizeMillimeters.width * scale.width,
    depth: collision.sizeMillimeters.depth * scale.depth,
    height: collision.sizeMillimeters.height * scale.height,
    center: {
      x: collision.centerMillimeters.x * scale.width,
      y: collision.centerMillimeters.y * scale.height,
      z: collision.centerMillimeters.z * scale.depth,
    },
    clearance: collision.clearanceMillimeters,
  };
}

function productCollisionObb(product, settings = getSettings()) {
  const dimensions = productCollisionDimensionsMillimeters(product);
  const angle = ((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
  const offsetX = millimetersToPixels(dimensions.center.x, settings);
  const offsetZ = millimetersToPixels(dimensions.center.z, settings);
  const clearance = millimetersToPixels(dimensions.clearance, settings);
  const center = {
    x: product.planX + offsetX * Math.cos(angle) - offsetZ * Math.sin(angle),
    y: product.planY + offsetX * Math.sin(angle) + offsetZ * Math.cos(angle),
  };
  const elevation = Math.max(0, Number(product.elevationMeters) || 0) * 1000;
  return {
    id: product.id,
    kind: "product",
    center,
    angle,
    halfWidth: millimetersToPixels(dimensions.width, settings) / 2 + clearance,
    halfDepth: millimetersToPixels(dimensions.depth, settings) / 2 + clearance,
    minHeightMillimeters: elevation + dimensions.center.y - dimensions.height / 2 - dimensions.clearance,
    maxHeightMillimeters: elevation + dimensions.center.y + dimensions.height / 2 + dimensions.clearance,
  };
}

function obbAxes(box) {
  const cosine = Math.cos(box.angle);
  const sine = Math.sin(box.angle);
  return [
    { x: cosine, y: sine },
    { x: -sine, y: cosine },
  ];
}

function obbProjectionRadius(box, axis) {
  const [widthAxis, depthAxis] = obbAxes(box);
  return box.halfWidth * Math.abs(widthAxis.x * axis.x + widthAxis.y * axis.y)
    + box.halfDepth * Math.abs(depthAxis.x * axis.x + depthAxis.y * axis.y);
}

function orientedBoxesOverlap(first, second) {
  const delta = { x: second.center.x - first.center.x, y: second.center.y - first.center.y };
  for (const axis of [...obbAxes(first), ...obbAxes(second)]) {
    const distanceOnAxis = Math.abs(delta.x * axis.x + delta.y * axis.y);
    if (distanceOnAxis >= obbProjectionRadius(first, axis) + obbProjectionRadius(second, axis) - 0.01) return false;
  }
  return true;
}

function verticalCollisionRangesOverlap(first, second) {
  return first.minHeightMillimeters < second.maxHeightMillimeters - 1
    && second.minHeightMillimeters < first.maxHeightMillimeters - 1;
}

function productCollisionCorners(box) {
  const [widthAxis, depthAxis] = obbAxes(box);
  const corners = [];
  for (const widthSign of [-1, 1]) {
    for (const depthSign of [-1, 1]) {
      corners.push({
        x: box.center.x + widthAxis.x * box.halfWidth * widthSign + depthAxis.x * box.halfDepth * depthSign,
        y: box.center.y + widthAxis.y * box.halfWidth * widthSign + depthAxis.y * box.halfDepth * depthSign,
      });
    }
  }
  return corners;
}

function wallCollisionObb(line, settings = getSettings()) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  return {
    id: line.id,
    kind: "wall",
    center: { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 },
    angle: Math.atan2(dy, dx),
    halfWidth: Math.max(0.5, Math.hypot(dx, dy) / 2),
    halfDepth: Math.max(0.5, visualWallThicknessPixels(line, settings) / 2),
    minHeightMillimeters: 0,
    maxHeightMillimeters: lineHeightMillimeters(line),
  };
}

function railingCollisionObb(railing, settings = getSettings()) {
  const dx = railing.x2 - railing.x1;
  const dy = railing.y2 - railing.y1;
  return {
    id: railing.id,
    kind: "railing",
    center: { x: (railing.x1 + railing.x2) / 2, y: (railing.y1 + railing.y2) / 2 },
    angle: Math.atan2(dy, dx),
    halfWidth: Math.max(0.5, Math.hypot(dx, dy) / 2),
    halfDepth: Math.max(0.5, millimetersToPixels(railing.thicknessMillimeters || RAILING_DEFAULT_THICKNESS_MM, settings) / 2),
    minHeightMillimeters: 0,
    maxHeightMillimeters: railing.heightMillimeters || RAILING_DEFAULT_HEIGHT_MM,
  };
}

function findProductCollision(product, options = {}) {
  if (!product) return null;
  const settings = options.settings || getSettings();
  const box = productCollisionObb(product, settings);
  if (state.analysisCanvas) {
    const outside = productCollisionCorners(box).some((corner) => corner.x < 0 || corner.y < 0 || corner.x > state.analysisCanvas.width || corner.y > state.analysisCanvas.height);
    if (outside) return { kind: "boundary", label: "图纸边界" };
  }
  for (const other of state.productModels) {
    if (other === product || other.id === product.id || other.id === options.ignoreProductId) continue;
    const otherBox = productCollisionObb(other, settings);
    if (verticalCollisionRangesOverlap(box, otherBox) && orientedBoxesOverlap(box, otherBox)) {
      return { kind: "product", id: other.id, label: other.name || productCategoryLabel(other.category) };
    }
  }
  normalizeProductMetadata(product);
  if (!product.placement.allowWallOverlap) {
    for (const line of state.lines) {
      const wallBox = wallCollisionObb(line, settings);
      if (verticalCollisionRangesOverlap(box, wallBox) && orientedBoxesOverlap(box, wallBox)) {
        return { kind: "wall", id: line.id, label: "墙体" };
      }
    }
  }
  for (const railing of state.manualRailings) {
    const railingBox = railingCollisionObb(railing, settings);
    if (verticalCollisionRangesOverlap(box, railingBox) && orientedBoxesOverlap(box, railingBox)) {
      return { kind: "railing", id: railing.id, label: "栏杆" };
    }
  }
  return null;
}

function findAvailableProductPlacement(product, desiredPoint = defaultProductPlanPoint()) {
  const settings = getSettings();
  const original = { x: product.planX, y: product.planY };
  const step = Math.max(10, millimetersToPixels(Math.max(150, Math.min(product.widthMillimeters, product.depthMillimeters) / 3), settings));
  const candidates = [desiredPoint];
  for (let ring = 1; ring <= 16; ring += 1) {
    const count = Math.max(8, ring * 8);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      candidates.push({ x: desiredPoint.x + Math.cos(angle) * ring * step, y: desiredPoint.y + Math.sin(angle) * ring * step });
    }
  }
  for (const point of candidates) {
    product.planX = point.x;
    product.planY = point.y;
    if (!findProductCollision(product)) return { x: point.x, y: point.y };
  }
  product.planX = original.x;
  product.planY = original.y;
  return null;
}

function productCollisionStatusMessage(collision) {
  if (!collision) return "";
  return `无法放置：与${collision.label || "其他构件"}重叠`;
}

function productThreeColor(category) {
  return Number.parseInt(productColor(category).slice(1), 16);
}

function hasExportableContent() {
  return Boolean(state.lines.length || state.manualRailings.length || state.productModels.length || state.lightSources.length);
}

function defaultProductPlanPoint() {
  const settings = getSettings();
  const lines = getClosedWallLines(settings);
  const bounds = getPlanBounds(lines.length ? lines : state.lines);
  if (bounds.width && bounds.height) {
    return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  }
  if (state.analysisCanvas) return { x: state.analysisCanvas.width / 2, y: state.analysisCanvas.height / 2 };
  return { x: 0, y: 0 };
}

function createInteriorProductMetadata(options = {}) {
  const category = options.category || "custom";
  const definition = interiorCategoryDefinition(category);
  const dimensions = normalizeDimensionRecord(options.dimensionsMillimeters, definition.size);
  const point = options.point || defaultProductPlanPoint();
  return normalizeProductMetadata({
    id: options.id || `product-${Date.now()}-${state.productModels.length + 1}`,
    assetId: options.assetId || null,
    assetModelUrl: options.assetModelUrl || "",
    name: options.name || productCategoryLabel(category),
    category,
    productSubtype: options.productSubtype || options.subcategory || inferProductSubtype(options.name, category),
    modelData: options.modelData || null,
    planX: Number(point.x) || 0,
    planY: Number(point.y) || 0,
    widthMillimeters: dimensions.width,
    depthMillimeters: dimensions.depth,
    heightMillimeters: dimensions.height,
    assetDimensionsMillimeters: { ...dimensions },
    collision: options.collision ? structuredClone(options.collision) : null,
    placement: options.placement ? { ...options.placement } : { mount: definition.mount },
    elevationMeters: Number.isFinite(Number(options.elevationMeters)) ? Number(options.elevationMeters) : undefined,
    rotationDegrees: normalizeDegrees(Number(options.rotationDegrees) || 0),
    rotationY: 0,
    object: options.object || null,
  });
}

function selectNewInteriorProduct(product) {
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = product.id;
  state.hoveredEndpoint = null;
}

function commitInteriorProduct(product, desiredPoint = defaultProductPlanPoint()) {
  const placement = findAvailableProductPlacement(product, desiredPoint);
  if (!placement) return false;
  product.planX = placement.x;
  product.planY = placement.y;
  pushUndoSnapshot("add-interior-product");
  state.productModels.push(product);
  selectNewInteriorProduct(product);
  if (product.object && state.three.productsGroup) {
    product.object.userData.productId = product.id;
    state.three.productsGroup.add(product.object);
  }
  updateThreeModel(false);
  renderPreview();
  updateSelectedComponentInfo();
  elements.exportJsonButton.disabled = !hasExportableContent();
  return true;
}

async function addInteriorPlaceholderToPlan(category = state.pendingProductCategory) {
  if (!state.analysisCanvas) {
    setStatus("请先上传或加载平面图");
    return null;
  }
  const product = createInteriorProductMetadata({ category, name: `${productCategoryLabel(category)}占位件` });
  if (!commitInteriorProduct(product)) {
    setStatus("没有可用空间：占位件会与墙体或其他内饰重叠");
    return null;
  }
  setStatus(`${productCategoryLabel(category)}占位件已添加，碰撞箱已启用`);
  return product;
}

async function addInteriorAssetToPlan(assetId, placement = {}) {
  const asset = state.interiorAssets.get(String(assetId));
  if (!asset) throw new Error(`未注册内饰资产：${assetId}`);
  if (!state.analysisCanvas) {
    setStatus("请先上传或加载平面图");
    return null;
  }
  const point = Number.isFinite(Number(placement.planX)) && Number.isFinite(Number(placement.planY))
    ? { x: Number(placement.planX), y: Number(placement.planY) }
    : defaultProductPlanPoint();
  const product = createInteriorProductMetadata({
    assetId: asset.id,
    assetModelUrl: asset.modelUrl,
    name: asset.name,
    category: asset.category,
    subcategory: asset.subcategory,
    dimensionsMillimeters: asset.dimensionsMillimeters,
    collision: asset.collision,
    placement: asset.placement,
    point,
    elevationMeters: Number.isFinite(Number(placement.elevationMeters)) ? placement.elevationMeters : asset.placement.defaultElevationMillimeters / 1000,
    rotationDegrees: placement.rotationDegrees || 0,
  });
  if (!commitInteriorProduct(product, point)) {
    setStatus("没有可用空间：资产会与墙体或其他内饰重叠");
    return null;
  }
  if (asset.modelUrl) {
    setStatus(`${asset.name} 已放置，模型加载中`);
    await restoreProductAssetObject(product);
    updateThreeModel(false);
    setStatus(product.modelLoadError ? `${asset.name} 模型加载失败，已保留占位件` : `${asset.name} 已导入，碰撞箱已启用`);
  } else {
    setStatus(`${asset.name} 占位资产已添加`);
  }
  return product;
}

async function addSelectedInteriorAsset() {
  const assetId = elements.interiorAssetSelect.value;
  if (!assetId) {
    setInteriorLibraryStatus("该分类还没有目录资产，可先添加占位件或导入 GLB");
    return;
  }
  try {
    const product = await addInteriorAssetToPlan(assetId);
    if (product) setInteriorLibraryStatus(`${product.name} 已加入平面图`);
  } catch (error) {
    console.error(error);
    setInteriorLibraryStatus(`资产添加失败：${error.message}`);
  }
}

function openProductModelPicker(category) {
  state.pendingProductCategory = category;
  elements.productModelInput.value = "";
  setStatus(`请选择${productCategoryLabel(category)}模型 GLB/GLTF`);
  elements.productModelInput.click();
}

function openWindowModelPicker(event) {
  if (event && event.shiftKey) {
    toggleDrawWindowTool();
    return;
  }
  setTool("select");
  openProductModelPicker("window");
}

async function importProductModelFromFile(file) {
  if (!file) return;
  if (!state.three.module || !state.three.productsGroup) {
    setStatus("3D loading...");
    await ensureThreeViewerReady();
  }
  if (!state.analysisCanvas) {
    setStatus("请先上传或加载平面图");
    return;
  }
  if (!state.three.module || !state.three.productsGroup) {
    setStatus("3D 模型尚未加载完成");
    return;
  }
  try {
    const productSubtype = inferProductSubtype(file.name, state.pendingProductCategory);
    setStatus(`导入${productSubtypeLabel({ category: state.pendingProductCategory, productSubtype })}模型中`);
    const three = state.three.module;
    const loaderClass = await ensureGltfLoader();
    const loader = new loaderClass();
    const buffer = await file.arrayBuffer();
    const gltf = await new Promise((resolve, reject) => loader.parse(buffer, "", resolve, reject));
    const object = createProductModelObject(three, gltf.scene, state.pendingProductCategory, productSubtype);
    const modelData = await arrayBufferToDataUrl(buffer, file.type || "model/gltf-binary");
    const product = createInteriorProductMetadata({
      name: file.name || productCategoryLabel(state.pendingProductCategory),
      category: state.pendingProductCategory,
      productSubtype,
      modelData,
      object,
    });
    if (!commitInteriorProduct(product)) {
      disposeThreeObject(object);
      setStatus("没有可用空间：模型会与墙体或其他内饰重叠");
      return;
    }
    syncProductObjectScale(product);
    closeInteriorLibrary();
    setStatus(`${productSubtypeLabel(product)}模型已导入，碰撞箱已启用`);
  } catch (error) {
    console.error(error);
    setStatus("模型导入失败，请使用 GLB/GLTF 文件");
  }
}
async function ensureGltfLoader() {
  if (state.three.gltfLoaderClass) return state.three.gltfLoaderClass;
  const module = await import(GLTF_LOADER_MODULE_URL);
  state.three.gltfLoaderClass = module.GLTFLoader;
  return state.three.gltfLoaderClass;
}

function arrayBufferToDataUrl(buffer, mimeType = "model/gltf-binary") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(new Blob([buffer], { type: mimeType }));
  });
}

function dataUrlToArrayBuffer(dataUrl) {
  const [header, base64] = String(dataUrl || "").split(",");
  if (!header || !base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function restoreStoredProductModelObjects() {
  const products = state.productModels.filter((product) => product.modelData || product.assetId || product.assetModelUrl);
  if (!products.length) return;
  await ensureThreeViewerReady();
  for (const product of products) {
    if (product.modelData) await restoreProductModelObject(product);
    else await restoreProductAssetObject(product);
  }
}

async function restoreProductModelObject(product) {
  if (!product || !product.modelData || !state.three.module || !state.three.productsGroup) return false;
  if (product.object && product.object.userData && product.object.userData.productHasSourceModel) return true;
  if (product.restoringModel) return false;
  const buffer = dataUrlToArrayBuffer(product.modelData);
  if (!buffer) return false;
  try {
    product.restoringModel = true;
    normalizeProductMetadata(product);
    const three = state.three.module;
    const loaderClass = await ensureGltfLoader();
    const loader = new loaderClass();
    const gltf = await new Promise((resolve, reject) => loader.parse(buffer, "", resolve, reject));
    const object = createProductModelObject(three, gltf.scene, product.category, product.productSubtype);
    object.userData.productId = product.id;
    if (product.object) {
      state.three.productsGroup.remove(product.object);
      disposeThreeObject(product.object);
    }
    product.object = object;
    state.three.productsGroup.add(object);
    syncProductObjectScale(product);
    return true;
  } catch (error) {
    console.warn("产品模型恢复失败", error);
    return false;
  } finally {
    product.restoringModel = false;
  }
}

function loadGltfFromUrl(loader, url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}

async function restoreProductAssetObject(product) {
  if (!product || !state.three.module || !state.three.productsGroup) return false;
  if (product.object?.userData?.productHasSourceModel) return true;
  if (product.assetRestorePromise) return product.assetRestorePromise;
  const asset = product.assetId ? state.interiorAssets.get(product.assetId) : null;
  const modelUrl = asset?.modelUrl || product.assetModelUrl;
  if (!modelUrl) return false;
  product.assetRestorePromise = (async () => {
    try {
      normalizeProductMetadata(product);
      const loaderClass = await ensureGltfLoader();
      const loader = new loaderClass();
      const gltf = await loadGltfFromUrl(loader, modelUrl);
      const object = createProductModelObject(state.three.module, gltf.scene, product.category, product.productSubtype);
      object.userData.productId = product.id;
      if (product.object) {
        state.three.productsGroup.remove(product.object);
        disposeThreeObject(product.object);
      }
      product.object = object;
      product.assetModelUrl = modelUrl;
      product.modelLoadError = "";
      state.three.productsGroup.add(object);
      syncProductObjectScale(product);
      return true;
    } catch (error) {
      console.warn("目录资产模型恢复失败", error);
      product.modelLoadError = String(error?.message || error);
      return false;
    } finally {
      product.assetRestorePromise = null;
    }
  })();
  return product.assetRestorePromise;
}

function createProductModelObject(three, source, category, subtype = null) {
  const container = new three.Group();
  const modelRoot = new three.Group();
  modelRoot.userData.productModelRoot = true;
  modelRoot.add(source);
  container.userData.productHasSourceModel = true;
  container.add(modelRoot);
  normalizeProductModelObject(three, modelRoot, source, category, subtype);
  container.add(createProductFootprintProxyObject(three, category, subtype));
  container.add(createProductCollisionBoxObject(three));
  return container;
}

function createProductPlaceholderObject(three, category, subtype = null) {
  const container = new three.Group();
  container.userData.placeholderProduct = true;
  container.add(createProductProxyObject(three, category, subtype));
  container.add(createProductCollisionBoxObject(three));
  return container;
}

function createProductCollisionBoxObject(three) {
  const geometry = new three.BoxGeometry(1, 1, 1);
  const material = new three.MeshBasicMaterial({
    color: 0x36a269,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
  });
  const box = new three.Mesh(geometry, material);
  box.userData.productCollisionBox = true;
  box.renderOrder = 20;
  box.visible = false;
  return box;
}

function syncProductCollisionBoxObject(product) {
  if (!product?.object) return;
  const box = findProductScenePart(product.object, "productCollisionBox");
  if (!box) return;
  const dimensions = productCollisionDimensionsMillimeters(product);
  const clearanceMeters = dimensions.clearance / 1000;
  box.scale.set(
    Math.max(0.001, dimensions.width / 1000 + clearanceMeters * 2),
    Math.max(0.001, dimensions.height / 1000 + clearanceMeters * 2),
    Math.max(0.001, dimensions.depth / 1000 + clearanceMeters * 2),
  );
  box.position.set(dimensions.center.x / 1000, dimensions.center.y / 1000, dimensions.center.z / 1000);
  const blocked = Boolean(product.collisionBlocked);
  box.material.color.setHex(blocked ? 0xe5484d : 0x36a269);
  box.material.opacity = blocked ? 0.96 : 0.72;
  box.visible = blocked || product.id === state.selectedProductId;
  box.material.needsUpdate = true;
}

function normalizeProductModelObject(three, modelRoot, source, category, subtype = null) {
  const box = new three.Box3().setFromObject(source);
  const size = new three.Vector3();
  const center = new three.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  const scale = productDefaultSizeMeters(category, subtype) / maxAxis;
  source.scale.multiplyScalar(scale);

  const scaledBox = new three.Box3().setFromObject(source);
  const scaledCenter = new three.Vector3();
  const scaledSize = new three.Vector3();
  scaledBox.getCenter(scaledCenter);
  scaledBox.getSize(scaledSize);
  source.position.x -= scaledCenter.x;
  source.position.z -= scaledCenter.z;
  source.position.y -= scaledBox.min.y;
  modelRoot.userData.productNormalizedSize = {
    x: Math.max(0.001, scaledSize.x),
    y: Math.max(0.001, scaledSize.y),
    z: Math.max(0.001, scaledSize.z),
  };
  source.traverse((object) => {
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.isMesh) object.renderOrder = 3;
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.side = three.DoubleSide;
        material.depthWrite = material.transparent ? false : true;
        material.needsUpdate = true;
      }
    }
  });
}

function createProductFootprintProxyObject(three, category, subtype = null) {
  const group = createProductFootprint(three, productDefaultSizeMeters(category, subtype), productThreeColor(category));
  group.userData.productProxy = true;
  group.userData.productFootprintOnly = true;
  group.userData.productSubtype = subtype || category;
  group.renderOrder = 1;
  return group;
}

function createProductProxyObject(three, category, subtype = null) {
  const base = productDefaultSizeMeters(category, subtype);
  const color = productThreeColor(category);
  const group = new three.Group();
  group.userData.productProxy = true;
  group.userData.productSubtype = subtype || category;
  group.add(createProductFootprint(three, base, color));
  if (category === "window") {
    addWindowProxyParts(three, group, base, color, subtype);
  } else if (category === "sanitary") {
    addSanitaryProxyParts(three, group, base, color);
  } else if (category === "hardware") {
    addHardwareProxyParts(three, group, base, color);
  } else {
    addFurnitureProxyParts(three, group, base, color, subtype);
  }
  return group;
}

function addWindowProxyParts(three, group, base, color, subtype = "window") {
  const width = base;
  const height = subtype === "door-window" ? 1.25 : 0.9;
  const depth = Math.max(0.08, base * 0.08);
  addProductBox(three, group, width, 0.06, depth, 0, height, 0, color, 0.9);
  addProductBox(three, group, width, 0.06, depth, 0, 0.08, 0, color, 0.9);
  addProductBox(three, group, 0.06, height, depth, -width / 2 + 0.03, height / 2 + 0.04, 0, color, 0.9);
  addProductBox(three, group, 0.06, height, depth, width / 2 - 0.03, height / 2 + 0.04, 0, color, 0.9);
  addProductBox(three, group, 0.04, height * 0.92, depth * 0.85, 0, height / 2 + 0.04, 0, 0x6b3c12, 0.68);
  const slatCount = subtype === "door-window" ? 10 : 8;
  for (let index = 0; index < slatCount; index += 1) {
    const y = 0.18 + (height - 0.24) * (index / Math.max(1, slatCount - 1));
    addProductBox(three, group, width * 0.82, 0.025, depth * 1.15, 0, y, 0.02, 0xf0c36a, 0.86);
  }
}

function createProductFootprint(three, base, color) {
  const height = 0.035;
  const geometry = new three.BoxGeometry(base, height, base);
  const material = new three.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.02,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  material.userData.productBaseOpacity = 0.2;
  const mesh = new three.Mesh(geometry, material);
  mesh.position.y = height / 2 + 0.015;
  mesh.userData.productProxyMesh = true;
  mesh.userData.productFootprintMesh = true;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;

  const edge = new three.LineSegments(
    new three.EdgesGeometry(geometry),
    new three.LineBasicMaterial({ color, transparent: true, opacity: 0.86 }),
  );
  edge.position.copy(mesh.position);
  edge.userData.productProxyEdge = true;
  edge.renderOrder = 2;
  const group = new three.Group();
  group.add(mesh, edge);
  return group;
}

function addFurnitureProxyParts(three, group, base, color, subtype = "furniture") {
  if (subtype === "coffee-table") {
    addCoffeeTableProxyParts(three, group, base, color);
    return;
  }
  if (subtype === "wardrobe") {
    addWardrobeProxyParts(three, group, base, color);
    return;
  }
  if (subtype === "chair") {
    addChairProxyParts(three, group, base, color);
    return;
  }
  if (subtype === "bed") {
    addBedProxyParts(three, group, base, color);
    return;
  }
  const cushion = addProductBox(three, group, base * 0.78, 0.16, base * 0.62, 0, 0.15, 0.03, color, 0.88);
  cushion.userData.productProxyMain = true;
  addProductBox(three, group, base * 0.78, 0.34, base * 0.12, 0, 0.25, -base * 0.31, color, 0.92);
  addProductBox(three, group, base * 0.1, 0.24, base * 0.58, -base * 0.39, 0.2, 0.03, color, 0.78);
  addProductBox(three, group, base * 0.1, 0.24, base * 0.58, base * 0.39, 0.2, 0.03, color, 0.78);
  addProductBox(three, group, base * 0.26, 0.08, base * 0.18, -base * 0.2, 0.28, -base * 0.16, 0xffffff, 0.92, true);
  addProductBox(three, group, base * 0.26, 0.08, base * 0.18, base * 0.2, 0.28, -base * 0.16, 0xffffff, 0.92, true);
  addProductLegs(three, group, base, color);
}

function addCoffeeTableProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.9, 0.08, base * 0.52, 0, 0.26, 0, color, 0.9);
  addProductBox(three, group, base * 0.74, 0.035, base * 0.4, 0, 0.14, 0, 0xffffff, 0.45, true);
  addProductBox(three, group, base * 0.08, 0.22, base * 0.08, -base * 0.34, 0.11, -base * 0.2, color, 0.84);
  addProductBox(three, group, base * 0.08, 0.22, base * 0.08, base * 0.34, 0.11, -base * 0.2, color, 0.84);
  addProductBox(three, group, base * 0.08, 0.22, base * 0.08, -base * 0.34, 0.11, base * 0.2, color, 0.84);
  addProductBox(three, group, base * 0.08, 0.22, base * 0.08, base * 0.34, 0.11, base * 0.2, color, 0.84);
}

function addWardrobeProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.85, 1.15, base * 0.36, 0, 0.58, 0, color, 0.86);
  addProductBox(three, group, base * 0.035, 1.08, base * 0.39, 0, 0.59, 0, 0xffffff, 0.42, true);
  addProductBox(three, group, base * 0.08, 0.08, base * 0.03, -base * 0.12, 0.66, -base * 0.21, 0xd4dde2, 0.95, true);
  addProductBox(three, group, base * 0.08, 0.08, base * 0.03, base * 0.12, 0.66, -base * 0.21, 0xd4dde2, 0.95, true);
}

function addChairProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.5, 0.08, base * 0.48, 0, 0.28, 0.04, color, 0.88);
  addProductBox(three, group, base * 0.5, 0.55, base * 0.08, 0, 0.52, -base * 0.22, color, 0.9);
  addProductLegs(three, group, base * 0.8, color);
}

function addBedProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.9, 0.18, base * 0.64, 0, 0.22, 0.04, color, 0.84);
  addProductBox(three, group, base * 0.82, 0.08, base * 0.54, 0, 0.34, 0.05, 0xffffff, 0.72, true);
  addProductBox(three, group, base * 0.9, 0.42, base * 0.08, 0, 0.38, -base * 0.33, color, 0.88);
}

function addSanitaryProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.78, 0.1, base * 0.46, 0, 0.12, 0, color, 0.82);
  const bowlGeometry = new three.CylinderGeometry(base * 0.2, base * 0.24, 0.13, 24);
  const bowlMaterial = createProductMaterial(three, 0xe8fbff, 0.88);
  const bowl = new three.Mesh(bowlGeometry, bowlMaterial);
  bowl.position.set(0, 0.23, 0);
  bowl.scale.z = 0.72;
  bowl.userData.productProxyMesh = true;
  bowl.userData.productProxyFixedColor = true;
  bowl.castShadow = true;
  group.add(bowl);
  addProductBox(three, group, base * 0.34, 0.22, base * 0.1, 0, 0.28, -base * 0.28, color, 0.78);
  addProductBox(three, group, base * 0.08, 0.22, base * 0.08, 0, 0.3, -base * 0.1, 0xd4dde2, 0.95, true);
}

function addHardwareProxyParts(three, group, base, color) {
  addProductBox(three, group, base * 0.92, 0.05, base * 0.16, 0, 0.12, 0, color, 0.96);
  addProductBox(three, group, base * 0.12, 0.14, base * 0.12, -base * 0.34, 0.16, 0, 0xd4dde2, 0.95, true);
  addProductBox(three, group, base * 0.12, 0.14, base * 0.12, base * 0.34, 0.16, 0, 0xd4dde2, 0.95, true);
}

function addProductLegs(three, group, base, color) {
  const legWidth = base * 0.055;
  const x = base * 0.3;
  const z = base * 0.2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addProductBox(three, group, legWidth, 0.14, legWidth, sx * x, 0.07, sz * z, color, 0.86);
    }
  }
}

function addProductBox(three, group, width, height, depth, x, y, z, color, opacity = 0.9, fixedColor = false) {
  const geometry = new three.BoxGeometry(width, height, depth);
  const mesh = new three.Mesh(geometry, createProductMaterial(three, color, opacity));
  mesh.position.set(x, y, z);
  mesh.userData.productProxyMesh = true;
  mesh.userData.productProxyFixedColor = fixedColor;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  group.add(mesh);
  const edge = new three.LineSegments(
    new three.EdgesGeometry(geometry),
    new three.LineBasicMaterial({ color: 0x2d3c4f, transparent: true, opacity: 0.34 }),
  );
  edge.position.copy(mesh.position);
  edge.userData.productProxyEdge = true;
  group.add(edge);
  return mesh;
}

function createProductMaterial(three, color, opacity) {
  const material = new three.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
  });
  material.userData.productBaseOpacity = opacity;
  return material;
}

function updateProductModelTransforms(unit, bounds) {
  if (!state.three.productsGroup) return;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  for (const product of state.productModels) {
    ensureProductThreeObject(product);
    if (!product.object) continue;
    syncProductObjectScale(product);
    product.object.position.set((product.planX - centerX) * unit, 0.035 + Math.max(0, Number(product.elevationMeters) || 0), (product.planY - centerY) * unit);
    product.object.rotation.y = ((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
    updateProductProxyAppearance(product);
    syncProductCollisionBoxObject(product);
  }
  renderThreeProductResizeHandles();
}

function clearThreeProductResizeHandles() {
  const { scene, resizeHandlesGroup } = state.three;
  if (!resizeHandlesGroup) return;
  scene?.remove(resizeHandlesGroup);
  disposeThreeObject(resizeHandlesGroup);
  state.three.resizeHandlesGroup = null;
}

function selectedProductWorldBounds() {
  const product = selectedProduct();
  if (!product?.object || !state.three.module) return null;
  product.object.updateWorldMatrix?.(true, true);
  const bounds = new state.three.module.Box3().setFromObject(product.object);
  if (!Number.isFinite(bounds.min.x) || bounds.isEmpty()) return null;
  return { product, bounds };
}

function productResizeDimensionsMeters(product) {
  normalizeProductMetadata(product);
  const footprint = productFootprintMeters(product);
  return {
    width: Math.max(0.05, footprint.width),
    depth: Math.max(0.05, footprint.depth),
    height: Math.max(0.05, (product.heightMillimeters || productDefaultHeightMeters(product.category, product.productSubtype) * 1000) / 1000),
  };
}

function selectedProductResizeFrame() {
  const product = selectedProduct();
  const { module: three } = state.three;
  if (!product?.object || !three) return null;
  product.object.updateWorldMatrix?.(true, true);
  const dimensions = productResizeDimensionsMeters(product);
  const localCenter = new three.Vector3(0, dimensions.height / 2, 0);
  const worldCenter = product.object.localToWorld(localCenter.clone());
  return { product, object: product.object, dimensions, worldCenter };
}

function renderThreeProductResizeHandles() {
  clearThreeProductResizeHandles();
  const { module: three, scene } = state.three;
  if (!three || !scene || state.three.mode === "roam") return;
  const selected = selectedProductResizeFrame();
  if (!selected) return;

  if (state.three.productTransformMode !== "resize") {
    renderThreeProductMoveHandles(three, scene, selected);
    return;
  }
  renderThreeProductScaleHandles(three, scene, selected);
}

function renderThreeProductScaleHandles(three, scene, selected) {
  const { object, dimensions } = selected;
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;
  const centerY = dimensions.height / 2;
  const faces = [
    { axis: "x", sign: -1, local: new three.Vector3(-halfWidth, centerY, 0), size: [0.08, 0.24, 0.24], color: 0xe6b747 },
    { axis: "x", sign: 1, local: new three.Vector3(halfWidth, centerY, 0), size: [0.08, 0.24, 0.24], color: 0xe6b747 },
    { axis: "z", sign: -1, local: new three.Vector3(0, centerY, -halfDepth), size: [0.24, 0.24, 0.08], color: 0xe6b747 },
    { axis: "z", sign: 1, local: new three.Vector3(0, centerY, halfDepth), size: [0.24, 0.24, 0.08], color: 0xe6b747 },
    { axis: "y", sign: -1, local: new three.Vector3(0, 0.04, 0), size: [0.24, 0.08, 0.24], color: 0xff6b57 },
    { axis: "y", sign: 1, local: new three.Vector3(0, dimensions.height + 0.04, 0), size: [0.24, 0.08, 0.24], color: 0xff6b57 },
  ];

  const group = new three.Group();
  group.userData.resizeHandlesGroup = true;
  faces.forEach((face, index) => {
    const geometry = new three.BoxGeometry(...face.size);
    const material = new three.MeshStandardMaterial({
      color: face.color,
      roughness: 0.42,
      metalness: 0.06,
      transparent: true,
      opacity: 0.95,
    });
    const handle = new three.Mesh(geometry, material);
    handle.position.copy(object.localToWorld(face.local.clone()));
    handle.rotation.y = object.rotation.y;
    handle.userData.resizeHandle = true;
    handle.userData.handleIndex = index;
    handle.userData.axis = face.axis;
    handle.userData.sign = face.sign;
    handle.userData.sideX = face.axis === "x" ? face.sign : 0;
    handle.userData.sideY = face.axis === "y" ? face.sign : 0;
    handle.userData.sideZ = face.axis === "z" ? face.sign : 0;
    handle.castShadow = false;
    handle.renderOrder = 12;
    group.add(handle);
  });
  state.three.resizeHandlesGroup = group;
  scene.add(group);
}

function renderThreeProductMoveHandles(three, scene, selected) {
  const { object, dimensions } = selected;
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;
  const centerY = dimensions.height / 2;
  const span = Math.max(dimensions.width, dimensions.depth, dimensions.height, 0.7) * 0.74;
  const axes = [
    { axis: "x", color: 0xe94b3c, local: new three.Vector3(1, 0, 0), center: new three.Vector3(0, centerY, 0) },
    { axis: "z", color: 0x2f80ed, local: new three.Vector3(0, 0, 1), center: new three.Vector3(0, centerY, 0) },
    { axis: "y", color: 0x22a06b, local: new three.Vector3(0, 1, 0), center: new three.Vector3(0, centerY, 0) },
  ];
  const group = new three.Group();
  group.userData.resizeHandlesGroup = true;
  group.userData.productMoveHandlesGroup = true;
  for (const axis of axes) {
    const lineGeometry = new three.BufferGeometry().setFromPoints([
      object.localToWorld(axis.center.clone().add(axis.local.clone().multiplyScalar(-span))),
      object.localToWorld(axis.center.clone().add(axis.local.clone().multiplyScalar(span))),
    ]);
    const line = new three.Line(
      lineGeometry,
      new three.LineBasicMaterial({ color: axis.color, transparent: true, opacity: 0.92 }),
    );
    line.userData.moveAxisLine = true;
    group.add(line);
    for (const sign of [-1, 1]) {
      const local = axis.center.clone().add(axis.local.clone().multiplyScalar(sign * span));
      if (axis.axis === "x") local.x += sign * halfWidth;
      if (axis.axis === "z") local.z += sign * halfDepth;
      if (axis.axis === "y") local.y += sign > 0 ? dimensions.height / 2 : -dimensions.height / 2;
      const size = axis.axis === "y" ? [0.2, 0.13, 0.2] : [0.18, 0.18, 0.18];
      const geometry = new three.BoxGeometry(...size);
      const material = new three.MeshStandardMaterial({
        color: axis.color,
        roughness: 0.4,
        metalness: 0.05,
        transparent: true,
        opacity: 0.96,
      });
      const handle = new three.Mesh(geometry, material);
      handle.position.copy(object.localToWorld(local));
      handle.rotation.y = object.rotation.y;
      handle.userData.moveHandle = true;
      handle.userData.axis = axis.axis;
      handle.userData.sign = sign;
      handle.castShadow = false;
      handle.renderOrder = 12;
      group.add(handle);
    }
  }
  state.three.resizeHandlesGroup = group;
  scene.add(group);
}

function ensureProductThreeObject(product) {
  if (!product || product.object || !state.three.module || !state.three.productsGroup) return;
  normalizeProductMetadata(product);
  const object = createProductPlaceholderObject(state.three.module, product.category, product.productSubtype);
  object.userData.productId = product.id;
  product.object = object;
  state.three.productsGroup.add(object);
  if (product.modelData && !product.restoringModel) {
    restoreProductModelObject(product).then((restored) => {
      if (!restored) return;
      updateProductModelTransforms(state.three.unit || 1, state.three.planBounds || getPlanBounds(state.lines));
      updateSelectedComponentInfo();
      renderThreeScene();
    });
  } else if ((product.assetId || product.assetModelUrl) && !product.assetRestorePromise) {
    restoreProductAssetObject(product).then((restored) => {
      if (!restored) return;
      updateProductModelTransforms(state.three.unit || 1, state.three.planBounds || getPlanBounds(state.lines));
      updateSelectedComponentInfo();
      renderThreeScene();
    });
  }
}

function updateProductProxyAppearance(product) {
  if (!product || !product.object || !state.three.module) return;
  const three = state.three.module;
  const selected = product.id === state.selectedProductId;
  const color = selected ? 0xffb14a : productThreeColor(product.category);
  const hasSourceModel = Boolean(product.object.userData && product.object.userData.productHasSourceModel);
  product.object.traverse((object) => {
    if (object.userData && object.userData.productProxyMesh && object.material) {
      if (!object.userData.productProxyFixedColor) object.material.color.setHex(color);
      const baseOpacity = Number(object.material.userData && object.material.userData.productBaseOpacity) || 0.82;
      if (hasSourceModel && object.userData.productFootprintMesh) {
        object.material.opacity = selected ? 0.08 : 0.0;
        object.visible = selected;
      } else {
        object.material.opacity = selected ? Math.min(1, baseOpacity + 0.14) : baseOpacity;
        object.visible = true;
      }
      object.material.transparent = object.material.opacity < 1;
      object.material.depthWrite = false;
      object.material.needsUpdate = true;
    }
    if (object.userData && object.userData.productProxyEdge && object.material) {
      object.material.color.setHex(color);
      object.material.opacity = hasSourceModel ? (selected ? 0.95 : 0.28) : (selected ? 1 : 0.86);
      object.material.needsUpdate = true;
    }
  });
}

function findProductScenePart(productObject, key) {
  let result = null;
  productObject.traverse((object) => {
    if (!result && object.userData && object.userData[key]) result = object;
  });
  return result;
}

function syncProductObjectScale(product) {
  if (!product || !product.object) return;
  normalizeProductMetadata(product);
  const base = productDefaultSizeMeters(product.category, product.productSubtype);
  const width = Math.max(0.05, (product.widthMillimeters || base * 1000) / 1000);
  const depth = Math.max(0.05, (product.depthMillimeters || productDefaultDepthMeters(product.category, product.productSubtype) * 1000) / 1000);
  const height = Math.max(0.05, (product.heightMillimeters || productDefaultHeightMeters(product.category, product.productSubtype) * 1000) / 1000);
  product.object.scale.set(1, 1, 1);

  const proxy = findProductScenePart(product.object, "productProxy");
  if (proxy) {
    const yScale = proxy.userData.productFootprintOnly ? 1 : height / base;
    proxy.scale.set(width / base, yScale, depth / base);
  }

  const modelRoot = findProductScenePart(product.object, "productModelRoot");
  if (modelRoot) {
    const normalizedSize = modelRoot.userData.productNormalizedSize || { x: base, y: base, z: base };
    modelRoot.scale.set(
      Math.max(0.01, (width / Math.max(0.001, normalizedSize.x)) * 0.96),
      Math.max(0.01, (height / Math.max(0.001, normalizedSize.y)) * 0.96),
      Math.max(0.01, (depth / Math.max(0.001, normalizedSize.z)) * 0.96),
    );
  }
  syncProductCollisionBoxObject(product);
}

function clearProductModels() {
  clearThreeProductResizeHandles();
  if (state.three.productsGroup) clearThreeObject(state.three.productsGroup);
  for (const product of state.productModels) product.object = null;
  state.productModels = [];
  state.selectedProductId = null;
  state.draggedProduct = null;
  state.draggedProductResize = null;
  state.three.resizeDrag = null;
  state.three.productMoveDrag = null;
}

function buildContinuousWallModels(lines, openings, settings) {
  const eligibleOpenings = openings.filter((opening) => isConstructibleOpening(opening) && opening.leftWall && opening.rightWall);
  const lineById = new Map(lines.map((line, index) => [line.id, { line, index }]));
  const adjacency = new Map();
  const connect = (leftId, rightId) => {
    if (!adjacency.has(leftId)) adjacency.set(leftId, new Set());
    if (!adjacency.has(rightId)) adjacency.set(rightId, new Set());
    adjacency.get(leftId).add(rightId);
    adjacency.get(rightId).add(leftId);
  };
  for (const opening of eligibleOpenings) {
    const left = lineById.get(opening.leftWall);
    const right = lineById.get(opening.rightWall);
    if (!left || !right) continue;
    if (left.line.orientation !== right.line.orientation || left.line.orientation !== opening.orientation) continue;
    const axisDelta = Math.abs(getLineAxis(left.line, opening.orientation) - getLineAxis(right.line, opening.orientation));
    if (axisDelta > Math.max(settings.mergeGap, settings.maxThickness)) continue;
    connect(opening.leftWall, opening.rightWall);
  }
  connectCollinearWallGaps(lines, settings, connect);

  const visited = new Set();
  const models = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (visited.has(line.id)) continue;
    const component = [];
    const stack = [line.id];
    visited.add(line.id);
    while (stack.length) {
      const id = stack.pop();
      const entry = lineById.get(id);
      if (entry) component.push(entry);
      for (const next of adjacency.get(id) || []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
    if (component.length <= 1) {
      models.push(closeSingleWallModel({ line, index }, lines));
      continue;
    }
    models.push(mergeWallModelComponent(component, lines));
  }
  return models;
}

function closeSingleWallModel(model, hostLines) {
  const [line] = closeWallModelComponentEndpoints([model.line], model.line.orientation, hostLines);
  return { line, index: model.index, sourceWallIds: new Set([model.line.id]) };
}

function connectCollinearWallGaps(lines, settings, connect) {
  const maxGap = openingCandidateMaxWidth(settings);
  for (const orientation of ["horizontal", "vertical"]) {
    const groups = groupByAxis(lines.filter((line) => line.orientation === orientation), orientation, Math.max(settings.mergeGap, settings.maxThickness));
    for (const group of groups) {
      const sorted = [...group.lines].sort((a, b) => getLineStart(a, orientation) - getLineStart(b, orientation));
      for (let index = 0; index < sorted.length - 1; index += 1) {
        const left = sorted[index];
        const right = sorted[index + 1];
        const gap = getLineStart(right, orientation) - getLineEnd(left, orientation);
        if (gap < 0 || gap > maxGap) continue;
        const thicknessMatch = 1 - Math.abs(left.thickness - right.thickness) / Math.max(left.thickness, right.thickness, 1);
        if (thicknessMatch < 0.58) continue;
        connect(left.id, right.id);
      }
    }
  }
}

function mergeWallModelComponent(component, hostLines) {
  const first = component[0];
  const orientation = first.line.orientation;
  const mergedLines = closeWallModelComponentEndpoints(component.map((entry) => entry.line), orientation, hostLines);
  const starts = mergedLines.map((line) => getLineStart(line, orientation));
  const ends = mergedLines.map((line) => getLineEnd(line, orientation));
  const axis = Math.round(component.reduce((sum, entry) => sum + getLineAxis(entry.line, orientation), 0) / component.length);
  const thickness = Math.round(component.reduce((sum, entry) => sum + entry.line.thickness, 0) / component.length);
  const heightMillimeters = Math.max(...component.map((entry) => lineHeightMillimeters(entry.line)));
  const start = Math.min(...starts);
  const end = Math.max(...ends);
  const line = orientation === "horizontal"
    ? makeLine("horizontal", start, axis, end, axis, thickness)
    : makeLine("vertical", axis, start, axis, end, thickness);
  line.id = `continuous-${component.map((entry) => entry.line.id).join("-")}`;
  line.heightMillimeters = heightMillimeters;
  return { line, index: first.index, sourceWallIds: new Set(component.map((entry) => entry.line.id)) };
}

function closeWallModelComponentEndpoints(lines, orientation, hostSource = state.lines) {
  const merged = lines.map(cloneLine);
  const perpendicular = orientation === "horizontal" ? "vertical" : "horizontal";
  const hosts = hostSource.filter((line) => line.orientation === perpendicular);
  const settings = getSettings();
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness);
  for (const line of merged) {
    for (const end of ["start", "end"]) {
      const point = lineEndpoint(line, end);
      const host = nearestPerpendicularHost(point, hosts, orientation, tolerance);
      if (!host) continue;
      if (orientation === "horizontal") {
        setLineEndpoint(line, end, { x: host.x1, y: point.y });
      } else {
        setLineEndpoint(line, end, { x: point.x, y: host.y1 });
      }
      normalizeEditedLine(line);
    }
  }
  return merged;
}

function nearestPerpendicularHost(point, hosts, orientation, tolerance) {
  let best = null;
  for (const host of hosts) {
    const axisMiss = orientation === "horizontal" ? Math.abs(point.x - host.x1) : Math.abs(point.y - host.y1);
    const spanMiss = orientation === "horizontal" ? perpendicularMiss(point.y, host.y1, host.y2) : perpendicularMiss(point.x, host.x1, host.x2);
    if (axisMiss > tolerance || spanMiss > tolerance) continue;
    if (!hasTopologyEvidenceNearWallJoin(point, host, orientation, tolerance)) continue;
    const score = axisMiss + spanMiss * 0.5;
    if (!best || score < best.score) best = { host, score };
  }
  return best ? best.host : null;
}

function hasTopologyEvidenceNearWallJoin(point, host, orientation, tolerance) {
  const joinPoint = orientation === "horizontal" ? { x: host.x1, y: point.y } : { x: point.x, y: host.y1 };
  if ((state.topology.intersections || []).some((node) => distance(node, joinPoint) <= tolerance * 1.4)) return true;
  if (constructibleOpenings().some((opening) => distanceToSegment(joinPoint, opening) <= tolerance * 1.4 || distanceToSegment(point, opening) <= tolerance * 1.4)) return true;
  if ((state.topology.breaks || []).some((breakPoint) => distance(breakPoint, point) <= tolerance * 1.4 || distance(breakPoint, joinPoint) <= tolerance * 1.4)) return true;
  return endpointDistanceToLine(host, point) <= tolerance * 1.2;
}

function splitWallModelByOpenings(model, openings, settings) {
  const { line, index } = model;
  const cuts = openings
    .filter((opening) => isConstructibleOpening(opening) && opening.orientation === line.orientation)
    .filter((opening) => openingBelongsToWallModel(opening, model))
    .map((opening) => openingCutOnLine(opening, line, settings))
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
  if (!cuts.length) return [model];

  const start = getLineStart(line, line.orientation);
  const end = getLineEnd(line, line.orientation);
  const minSegment = Math.max(2, settings.minWallThickness);
  const minJambSegment = Math.max(1.5, Math.min(minSegment, settings.maxThickness) * 0.28);
  const segments = [];
  let cursor = start;
  for (const cut of cuts) {
    const cutStart = clamp(cut.start, start, end);
    const cutEnd = clamp(cut.end, start, end);
    if (cutEnd <= cursor || cutEnd - cutStart < 1) continue;
    if (cutStart - cursor >= minJambSegment) {
      segments.push({
        line: wallSegmentFromSpan(line, cursor, cutStart, `${line.id}-part-${segments.length + 1}`, {
          start: cursor > start + 0.5,
          end: true,
        }),
        index,
      });
    }
    segments.push(...retainedWallSegmentsForOpening(line, cutStart, cutEnd, cut.opening, index, segments.length));
    cursor = Math.max(cursor, cutEnd);
  }
  if (end - cursor >= minJambSegment) {
    segments.push({
      line: wallSegmentFromSpan(line, cursor, end, `${line.id}-part-${segments.length + 1}`, {
        start: true,
        end: false,
      }),
      index,
    });
  }
  return segments.length ? segments : [model];
}

function openingBelongsToWallModel(opening, model) {
  const sourceWallIds = model.sourceWallIds || new Set([model.line.id]);
  const relatedWallIds = [opening.leftWall, opening.rightWall, opening.hostWall].filter(Boolean);
  if (!relatedWallIds.length) return true;
  return relatedWallIds.some((id) => sourceWallIds.has(id));
}

function openingCutOnLine(opening, line, settings) {
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness);
  const axisDelta = opening.orientation === "horizontal" ? Math.abs(opening.y1 - line.y1) : Math.abs(opening.x1 - line.x1);
  if (axisDelta > tolerance) return null;
  const lineStart = getLineStart(line, line.orientation);
  const lineEnd = getLineEnd(line, line.orientation);
  const start = getLineStart(opening, opening.orientation);
  const end = getLineEnd(opening, opening.orientation);
  if (end < lineStart - tolerance || start > lineEnd + tolerance) return null;
  return { start, end, opening };
}

function wallSegmentFromSpan(source, start, end, id, skipJointExtensionEnds = null) {
  const line = source.orientation === "horizontal"
    ? makeLine("horizontal", start, source.y1, end, source.y1, source.thickness)
    : makeLine("vertical", source.x1, start, source.x1, end, source.thickness);
  line.id = id;
  line.heightMillimeters = lineHeightMillimeters(source);
  line.baseMeters = Number(source.baseMeters) || 0;
  if (skipJointExtensionEnds) line.skipJointExtensionEnds = { ...skipJointExtensionEnds };
  return line;
}

function retainedWallSegmentsForOpening(source, start, end, opening, index, serial) {
  const profile = openingVoidProfile(opening, source);
  const wallHeight = lineHeightMeters(source);
  const retained = [];
  if (profile.bottom > 0.05) {
    const sill = wallSegmentFromSpan(source, start, end, `${source.id}-sill-${serial + 1}`, { start: true, end: true });
    sill.heightMillimeters = Math.round(profile.bottom * 1000);
    sill.baseMeters = 0;
    retained.push({ line: sill, index });
  }
  const topBase = Math.min(wallHeight, profile.bottom + profile.height);
  if (wallHeight - topBase > 0.08) {
    const lintel = wallSegmentFromSpan(source, start, end, `${source.id}-lintel-${serial + 1}`, { start: true, end: true });
    lintel.heightMillimeters = Math.round((wallHeight - topBase) * 1000);
    lintel.baseMeters = topBase;
    retained.push({ line: lintel, index });
  }
  return retained;
}

function openingVoidProfile(opening, wallLine = null) {
  const wallHeight = wallLine ? lineHeightMeters(wallLine) : WALL_HEIGHT_METERS;
  const profile = openingProfileMillimeters(opening);
  const bottom = clamp(profile.sill / 1000, 0, Math.max(0, wallHeight - 0.1));
  const height = clamp(profile.height / 1000, 0.1, Math.max(0.1, wallHeight - bottom));
  return { bottom, height };
}

function createThreeOpeningComponent(three, opening, index, unit, bounds) {
  const settings = getSettings();
  const variant = openingVariant(opening);
  const color = openingThreeColor(opening);
  const length = Math.max((opening.width || distance({ x: opening.x1, y: opening.y1 }, { x: opening.x2, y: opening.y2 })) * unit, 0.08);
  const band = Math.max(visualOpeningWallBand(opening, settings) * unit * 1.25, 0.09);
  const profile = openingVoidProfile(opening);
  const height = profile.height;
  const bottom = profile.bottom;
  const projection = Math.max(0, openingProfileMillimeters(opening).projection / 1000) * unit;
  const isSelected = selectedOpening() && selectedOpening().id === opening.id;
  const material = new three.MeshStandardMaterial({
    color: isSelected ? 0xffb14a : color,
    roughness: 0.58,
    metalness: 0.01,
    transparent: true,
    opacity: isSelected ? 0.88 : 0.78,
  });
  const edgeMaterial = new three.LineBasicMaterial({ color: isSelected ? 0x8d4c0c : 0x6d5a08, transparent: true, opacity: 0.72 });
  const revealMaterial = new three.MeshStandardMaterial({
    color: 0xf7f5ef,
    roughness: 0.76,
    metalness: 0,
  });
  const revealEdgeMaterial = new three.LineBasicMaterial({ color: 0xd8d3c8, transparent: true, opacity: 0.28 });
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const group = new three.Group();
  group.userData.openingIndex = index;
  const frame = Math.max(0.055, Math.min(length * 0.12, band * 0.55));
  const rail = Math.max(0.055, band * 0.45);
  const center = {
    x: ((opening.x1 + opening.x2) / 2 - centerX) * unit,
    z: ((opening.y1 + opening.y2) / 2 - centerY) * unit,
  };
  const start = opening.orientation === "horizontal"
    ? (Math.min(opening.x1, opening.x2) - centerX) * unit
    : (Math.min(opening.y1, opening.y2) - centerY) * unit;
  const end = opening.orientation === "horizontal"
    ? (Math.max(opening.x1, opening.x2) - centerX) * unit
    : (Math.max(opening.y1, opening.y2) - centerY) * unit;

  const parts = [
    makeOpeningRevealPart(three, opening.orientation, band, height, start, center, bottom, "start", revealMaterial, revealEdgeMaterial, index),
    makeOpeningRevealPart(three, opening.orientation, band, height, end, center, bottom, "end", revealMaterial, revealEdgeMaterial, index),
    makeOpeningFramePart(three, opening.orientation, frame, band, height, start, center, bottom, "start", material, edgeMaterial, index),
    makeOpeningFramePart(three, opening.orientation, frame, band, height, end, center, bottom, "end", material, edgeMaterial, index),
    makeOpeningTopRail(three, opening.orientation, length, band, rail, center, bottom + height, material, edgeMaterial, index),
  ];
  if (opening.kind !== "door") {
    parts.push(makeOpeningPanel(three, opening.orientation, length, band, Math.max(0.12, height * 0.55), center, bottom + height * 0.52, color, index));
    if (variant === "bay-window") {
      parts.push(makeBayWindowProjection(three, opening.orientation, length, band, projection, Math.max(0.28, height * 0.55), center, bottom + height * 0.45, color, index));
    }
  } else {
    parts.push(makeOpeningTopRail(three, opening.orientation, length, band, Math.max(0.035, rail * 0.6), center, 0.04, material, edgeMaterial, index));
  }
  for (const part of parts) group.add(part);
  return group;
}

function makeOpeningRevealPart(three, orientation, band, height, axisPosition, center, bottom, side, material, edgeMaterial, openingIndex) {
  const cap = Math.max(0.018, Math.min(0.06, band * 0.22));
  const width = orientation === "horizontal" ? cap : band;
  const depth = orientation === "horizontal" ? band : cap;
  const geometry = new three.BoxGeometry(width, height, depth);
  const mesh = new three.Mesh(geometry, material);
  if (orientation === "horizontal") {
    mesh.position.set(axisPosition + (side === "start" ? -cap / 2 : cap / 2), bottom + height / 2, center.z);
  } else {
    mesh.position.set(center.x, bottom + height / 2, axisPosition + (side === "start" ? -cap / 2 : cap / 2));
  }
  mesh.userData.openingIndex = openingIndex;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edge = new three.LineSegments(new three.EdgesGeometry(geometry), edgeMaterial);
  edge.position.copy(mesh.position);
  edge.userData.openingIndex = openingIndex;
  const group = new three.Group();
  group.userData.openingIndex = openingIndex;
  group.add(mesh, edge);
  return group;
}

function makeOpeningFramePart(three, orientation, frame, band, height, axisPosition, center, bottom, side, material, edgeMaterial, openingIndex) {
  const width = orientation === "horizontal" ? frame : band;
  const depth = orientation === "horizontal" ? band : frame;
  const geometry = new three.BoxGeometry(width, height, depth);
  const mesh = new three.Mesh(geometry, material);
  if (orientation === "horizontal") {
    mesh.position.set(axisPosition + (side === "start" ? frame / 2 : -frame / 2), bottom + height / 2, center.z);
  } else {
    mesh.position.set(center.x, bottom + height / 2, axisPosition + (side === "start" ? frame / 2 : -frame / 2));
  }
  mesh.userData.openingIndex = openingIndex;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edge = new three.LineSegments(new three.EdgesGeometry(geometry), edgeMaterial);
  edge.position.copy(mesh.position);
  edge.userData.openingIndex = openingIndex;
  const group = new three.Group();
  group.userData.openingIndex = openingIndex;
  group.add(mesh, edge);
  return group;
}

function makeOpeningTopRail(three, orientation, length, band, height, center, y, material, edgeMaterial, openingIndex) {
  const width = orientation === "horizontal" ? length : band;
  const depth = orientation === "horizontal" ? band : length;
  const geometry = new three.BoxGeometry(width, height, depth);
  const mesh = new three.Mesh(geometry, material);
  mesh.position.set(center.x, Math.max(height / 2, y - height / 2), center.z);
  mesh.userData.openingIndex = openingIndex;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edge = new three.LineSegments(new three.EdgesGeometry(geometry), edgeMaterial);
  edge.position.copy(mesh.position);
  edge.userData.openingIndex = openingIndex;
  const group = new three.Group();
  group.userData.openingIndex = openingIndex;
  group.add(mesh, edge);
  return group;
}

function makeOpeningPanel(three, orientation, length, band, height, center, y, color, openingIndex) {
  const width = orientation === "horizontal" ? length : band * 0.55;
  const depth = orientation === "horizontal" ? band * 0.55 : length;
  const geometry = new three.BoxGeometry(width, height, depth);
  const material = new three.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, transparent: true, opacity: 0.22 });
  const mesh = new three.Mesh(geometry, material);
  mesh.position.set(center.x, y, center.z);
  mesh.userData.openingIndex = openingIndex;
  return mesh;
}

function makeBayWindowProjection(three, orientation, length, band, projection, height, center, y, color, openingIndex) {
  const out = Math.max(projection, band * 1.3);
  const width = orientation === "horizontal" ? length : out;
  const depth = orientation === "horizontal" ? out : length;
  const geometry = new three.BoxGeometry(width, height, depth);
  const material = new three.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0, transparent: true, opacity: 0.36 });
  const mesh = new three.Mesh(geometry, material);
  const offset = band / 2 + out / 2;
  mesh.position.set(
    center.x + (orientation === "vertical" ? offset : 0),
    y,
    center.z + (orientation === "horizontal" ? offset : 0),
  );
  mesh.userData.openingIndex = openingIndex;
  return mesh;
}

function openingThreeColor(opening) {
  const variant = openingVariant(opening);
  if (variant === "high-window") return 0x6fc3d0;
  if (variant === "floor-window") return 0x2296a8;
  if (variant === "bay-window") return 0x4cb5c5;
  if (opening.kind === "door") return 0xe8bf25;
  if (opening.kind === "window") return 0x35a7b7;
  if (opening.kind === "opening") return 0xf28c28;
  return 0x9aa3ad;
}

function getPlanBounds(lines) {
  if (!lines.length) {
    const width = state.analysisCanvas ? state.analysisCanvas.width : 600;
    const height = state.analysisCanvas ? state.analysisCanvas.height : 420;
    return { minX: 0, minY: 0, maxX: width, maxY: height, width, height };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const line of lines) {
    minX = Math.min(minX, line.x1, line.x2);
    minY = Math.min(minY, line.y1, line.y2);
    maxX = Math.max(maxX, line.x1, line.x2);
    maxY = Math.max(maxY, line.y1, line.y2);
  }
  const padding = Math.max(24, Math.max(maxX - minX, maxY - minY) * 0.04);
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function resetThreeCamera() {
  if (state.three.mode === "roam") {
    resetThreeRoamCamera();
    return;
  }
  state.three.yaw = -0.72;
  state.three.pitch = 0.72;
  if (state.three.camera) {
    state.three.camera.fov = 42;
    state.three.camera.updateProjectionMatrix();
  }
  updateThreeCamera();
}

function updateThreeCamera() {
  if (state.three.mode === "roam") {
    updateThreeRoamCamera();
    return;
  }
  const { camera, center, radius, yaw, pitch } = state.three;
  if (!camera || !center) return;
  const horizontal = Math.cos(pitch) * radius;
  camera.position.set(
    center.x + Math.sin(yaw) * horizontal,
    center.y + Math.sin(pitch) * radius,
    center.z + Math.cos(yaw) * horizontal,
  );
  camera.lookAt(center);
  renderThreeScene();
}

function setThreeMode(mode) {
  state.three.mode = mode === "roam" ? "roam" : "orbit";
  elements.threeRoamButton.classList.toggle("active", state.three.mode === "roam");
  elements.threeViewport.classList.toggle("is-roaming", state.three.mode === "roam");
  renderThreeProductResizeHandles();
  if (state.three.mode === "roam") {
    resetThreeRoamCamera();
    elements.threeViewport.focus({ preventScroll: true });
    setStatus("3D 漫游模式");
  } else {
    resetThreeCamera();
    setStatus("3D 俯视模式");
  }
}

function toggleThreeRoamMode() {
  setThreeMode(state.three.mode === "roam" ? "orbit" : "roam");
}

function resetThreeRoamCamera() {
  const { camera, roamPosition, roamBounds } = state.three;
  if (!camera || !roamPosition) return;
  const widthLimit = roamBounds ? roamBounds.width / 2 - 0.5 : 3;
  const depthLimit = roamBounds ? roamBounds.depth / 2 - 0.5 : 3;
  roamPosition.set(clamp(0, -widthLimit, widthLimit), 1.55, clamp(depthLimit * 0.35, -depthLimit, depthLimit));
  state.three.roamYaw = Math.PI;
  state.three.roamPitch = 0;
  camera.fov = 62;
  camera.updateProjectionMatrix();
  updateThreeRoamCamera();
}

function updateThreeRoamCamera() {
  const { camera, roamPosition, roamYaw, roamPitch } = state.three;
  if (!camera || !roamPosition) return;
  const direction = threeRoamDirection();
  camera.position.copy(roamPosition);
  camera.lookAt(roamPosition.x + direction.x, roamPosition.y + direction.y, roamPosition.z + direction.z);
  renderThreeScene();
}

function threeRoamDirection() {
  const { module: three, roamYaw, roamPitch } = state.three;
  const horizontal = Math.cos(roamPitch);
  return new three.Vector3(
    Math.sin(roamYaw) * horizontal,
    Math.sin(roamPitch),
    Math.cos(roamYaw) * horizontal,
  ).normalize();
}

function moveThreeRoam(forwardAmount, strafeAmount = 0, verticalAmount = 0) {
  const { module: three, roamPosition, roamYaw, roamBounds } = state.three;
  if (!three || !roamPosition) return;
  const forward = new three.Vector3(Math.sin(roamYaw), 0, Math.cos(roamYaw)).normalize();
  const right = new three.Vector3(Math.cos(roamYaw), 0, -Math.sin(roamYaw)).normalize();
  roamPosition.addScaledVector(forward, forwardAmount);
  roamPosition.addScaledVector(right, strafeAmount);
  roamPosition.y = clamp(roamPosition.y + verticalAmount, 0.35, WALL_HEIGHT_METERS + 1.4);
  if (roamBounds) {
    const xLimit = Math.max(1, roamBounds.width / 2 - 0.2);
    const zLimit = Math.max(1, roamBounds.depth / 2 - 0.2);
    roamPosition.x = clamp(roamPosition.x, -xLimit, xLimit);
    roamPosition.z = clamp(roamPosition.z, -zLimit, zLimit);
  }
  updateThreeRoamCamera();
}

function renderThreeScene() {
  const { renderer, scene, camera } = state.three;
  if (!renderer || !scene || !camera) return;
  renderer.render(scene, camera);
  if (state.beginnerPhonePreviewMode === "three") updateBeginnerPhonePreview();
}

function setThreePresentationMode(enabled) {
  const { scene } = state.three;
  if (!scene || !enabled) return () => {};
  const visibility = [];
  scene.traverse((object) => {
    const shouldHide = object.isLine
      || object.isLineSegments
      || object.userData.renderHelper
      || object.userData.productCollisionBox
      || object.userData.resizeHandlesGroup;
    if (!shouldHide) return;
    visibility.push([object, object.visible]);
    object.visible = false;
  });
  return () => {
    for (const [object, wasVisible] of visibility) object.visible = wasVisible;
  };
}

function snapshotThreeSelection() {
  const selection = {
    lineIndex: state.selectedLineIndex,
    openingIndex: state.selectedOpeningIndex,
    openingId: state.selectedOpeningId,
    railingId: state.selectedRailingId,
    productId: state.selectedProductId,
  };
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = null;
  return () => {
    state.selectedLineIndex = selection.lineIndex;
    state.selectedOpeningIndex = selection.openingIndex;
    state.selectedOpeningId = selection.openingId;
    state.selectedRailingId = selection.railingId;
    state.selectedProductId = selection.productId;
  };
}

function exportThreeRenderImage() {
  const { module: three, renderer, scene, camera } = state.three;
  if (!three || !renderer || !scene || !camera) {
    setStatus("3D 模型尚未加载完成");
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || renderer.domElement.clientWidth || 1200));
  const height = Math.max(1, Math.round(rect.height || renderer.domElement.clientHeight || 820));
  const outputScale = Math.min(
    THREE_RENDER_DEFAULTS.exportScale,
    THREE_RENDER_DEFAULTS.maxExportDimension / Math.max(width, height),
  );
  const outputWidth = Math.max(1, Math.round(width * outputScale));
  const outputHeight = Math.max(1, Math.round(height * outputScale));
  const originalPixelRatio = renderer.getPixelRatio();
  const originalSize = renderer.getSize(new three.Vector2());
  const originalAspect = camera.aspect;
  const restoreSelection = snapshotThreeSelection();

  updateThreeModel(false);
  const restoreHelpers = setThreePresentationMode(true);

  setStatus(`3D 渲染中 · ${outputWidth} × ${outputHeight}`);
  renderer.setPixelRatio(1);
  renderer.setSize(outputWidth, outputHeight, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  renderer.domElement.toBlob((blob) => {
    if (blob) {
      const name = `${state.sourceName || "floor-plan"}-3d-render.png`;
      showThreeRenderPreview(blob, name);
      setStatus("3D 渲染图已生成");
    } else {
      setStatus("3D 渲染导出失败");
    }
    renderer.setPixelRatio(originalPixelRatio);
    renderer.setSize(originalSize.x, originalSize.y, false);
    camera.aspect = originalAspect;
    camera.updateProjectionMatrix();
    restoreHelpers();
    restoreSelection();
    updateThreeModel(false);
    renderThreeScene();
  }, "image/png");
}

function showThreeRenderPreview(blob, fileName) {
  closeThreeRenderPreview();
  state.three.renderBlob = blob;
  state.three.renderFileName = fileName;
  state.three.renderUrl = URL.createObjectURL(blob);
  elements.threeRenderImage.src = state.three.renderUrl;
  elements.threeRenderModal.hidden = false;
  elements.threeRenderSaveButton.focus({ preventScroll: true });
}

function closeThreeRenderPreview() {
  if (state.three.renderUrl) URL.revokeObjectURL(state.three.renderUrl);
  state.three.renderUrl = null;
  state.three.renderBlob = null;
  elements.threeRenderImage.removeAttribute("src");
  elements.threeRenderModal.hidden = true;
}

function saveThreeRenderPreview() {
  if (!state.three.renderBlob) {
    setStatus("没有可保存的渲染图");
    return;
  }
  downloadBlob(state.three.renderBlob, state.three.renderFileName || "floor-plan-3d-render.png");
  setStatus("3D 渲染图已保存");
}

function updateThreeRaycasterFromEvent(event) {
  const { renderer, camera, raycaster, pointer } = state.three;
  if (!renderer || !camera || !raycaster || !pointer) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return true;
}

function threeGroundPointFromEvent(event) {
  const { module: three, raycaster } = state.three;
  if (!three || !updateThreeRaycasterFromEvent(event)) return null;
  const point = new three.Vector3();
  const plane = new three.Plane(new three.Vector3(0, 1, 0), 0);
  return raycaster.ray.intersectPlane(plane, point) ? point : null;
}

function threeResizeHandleHit(event) {
  const { resizeHandlesGroup, raycaster } = state.three;
  if (!resizeHandlesGroup || !updateThreeRaycasterFromEvent(event)) return null;
  const hits = raycaster.intersectObjects(resizeHandlesGroup.children, true);
  return hits.find((hit) => hit.object.userData && hit.object.userData.resizeHandle) || null;
}

function threeMoveHandleHit(event) {
  const { resizeHandlesGroup, raycaster } = state.three;
  if (!resizeHandlesGroup || !updateThreeRaycasterFromEvent(event)) return null;
  const hits = raycaster.intersectObjects(resizeHandlesGroup.children, true);
  return hits.find((hit) => hit.object.userData && hit.object.userData.moveHandle) || null;
}

function threeProductHit(event) {
  const { productsGroup, raycaster } = state.three;
  if (!productsGroup || !updateThreeRaycasterFromEvent(event)) return null;
  const hits = raycaster.intersectObjects(productsGroup.children, true);
  const hit = hits.find((candidate) => findThreeProductId(candidate.object));
  if (!hit) return null;
  const productId = findThreeProductId(hit.object);
  return productId ? { ...hit, productId } : null;
}

function beginThreeProductResize(event, hit) {
  const selected = selectedProductResizeFrame();
  const point = threeGroundPointFromEvent(event);
  if (!hit || !selected || !point || event.button !== 0) return false;
  state.three.productMoveDrag = null;
  const { product, object, dimensions } = selected;
  const inverseWorldMatrix = object.matrixWorld.clone().invert();
  state.three.resizeDrag = {
    pointerId: event.pointerId,
    productId: product.id,
    startPoint: point,
    startClientY: event.clientY,
    startProduct: {
      widthMillimeters: product.widthMillimeters,
      depthMillimeters: product.depthMillimeters,
      heightMillimeters: product.heightMillimeters,
      planX: product.planX,
      planY: product.planY,
      rotationDegrees: product.rotationDegrees,
    },
    dimensions,
    inverseWorldMatrix,
    axis: hit.object.userData.axis || "x",
    sign: hit.object.userData.sign || 1,
    sideX: hit.object.userData.sideX || 1,
    sideY: hit.object.userData.sideY || 0,
    sideZ: hit.object.userData.sideZ || 1,
    pushedUndo: false,
  };
  elements.threeViewport.setPointerCapture(event.pointerId);
  setStatus("拖动控点调整产品尺寸");
  return true;
}

function beginThreeProductMove(event, hit) {
  const point = threeGroundPointFromEvent(event);
  const productId = hit && (hit.productId || state.selectedProductId);
  const product = productId ? state.productModels.find((item) => item.id === productId) : null;
  if (!hit || !product || !point || event.button !== 0 || state.three.mode === "roam") return false;
  const rect = state.three.renderer.domElement.getBoundingClientRect();
  setTool("select");
  state.three.productTransformMode = "move";
  const axis = hit.object?.userData?.moveHandle ? hit.object.userData.axis : "free";
  const object = product.object;
  const inverseWorldMatrix = object ? object.matrixWorld.clone().invert() : null;
  state.three.productMoveDrag = {
    pointerId: event.pointerId,
    productId: product.id,
    startPoint: point,
    startLocalPoint: inverseWorldMatrix ? point.clone().applyMatrix4(inverseWorldMatrix) : null,
    inverseWorldMatrix,
    axis,
    sign: hit.object?.userData?.sign || 0,
    startClientY: event.clientY,
    startProduct: {
      planX: product.planX,
      planY: product.planY,
      elevationMeters: Math.max(0, Number(product.elevationMeters) || 0),
      rotationDegrees: product.rotationDegrees,
    },
    pushedUndo: false,
    moved: false,
  };
  state.three.dragging = false;
  state.three.dragDistance = 0;
  state.three.cardX = event.clientX - rect.left;
  state.three.cardY = event.clientY - rect.top;
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = product.id;
  state.hoveredEndpoint = null;
  elements.threeComponentCard.hidden = false;
  updateSelectedComponentInfo();
  if (state.analysisCanvas) renderPreview();
  renderThreeProductResizeHandles();
  elements.threeViewport.setPointerCapture(event.pointerId);
  elements.threeViewport.classList.add("is-moving-product");
  setStatus("拖动产品模型移动位置");
  return true;
}

function updateThreeProductMove(event) {
  const drag = state.three.productMoveDrag;
  const product = drag ? state.productModels.find((item) => item.id === drag.productId) : null;
  const point = product ? threeGroundPointFromEvent(event) : null;
  if (!drag || !product || !point) return;
  const unit = state.three.unit || 1;
  const localPoint = drag.inverseWorldMatrix ? point.clone().applyMatrix4(drag.inverseWorldMatrix) : null;
  const localDelta = localPoint && drag.startLocalPoint
    ? { x: localPoint.x - drag.startLocalPoint.x, z: localPoint.z - drag.startLocalPoint.z }
    : null;
  const freeDelta = {
    x: (point.x - drag.startPoint.x) / Math.max(0.001, unit),
    y: (point.z - drag.startPoint.z) / Math.max(0.001, unit),
  };
  const verticalDelta = drag.axis === "y" ? (drag.startClientY - event.clientY) * 0.012 : 0;
  const movedDistance = drag.axis === "y" ? Math.abs(verticalDelta) * 60 : Math.hypot(freeDelta.x, freeDelta.y);
  if (!drag.pushedUndo && movedDistance > 0.75) {
    pushUndoSnapshot("move-product-3d");
    drag.pushedUndo = true;
  }
  if (!drag.pushedUndo) return;
  const previous = captureProductTransform(product);
  if (drag.axis === "x" && localDelta) {
    const delta = productLocalOffsetToPlanDelta({ x: localDelta.x, z: 0 }, drag.startProduct.rotationDegrees, unit);
    product.planX = drag.startProduct.planX + delta.x;
    product.planY = drag.startProduct.planY + delta.y;
    product.elevationMeters = drag.startProduct.elevationMeters;
  } else if (drag.axis === "z" && localDelta) {
    const delta = productLocalOffsetToPlanDelta({ x: 0, z: localDelta.z }, drag.startProduct.rotationDegrees, unit);
    product.planX = drag.startProduct.planX + delta.x;
    product.planY = drag.startProduct.planY + delta.y;
    product.elevationMeters = drag.startProduct.elevationMeters;
  } else if (drag.axis === "y") {
    product.planX = drag.startProduct.planX;
    product.planY = drag.startProduct.planY;
    product.elevationMeters = clamp(drag.startProduct.elevationMeters + verticalDelta, 0, 12);
  } else {
    product.planX = drag.startProduct.planX + freeDelta.x;
    product.planY = drag.startProduct.planY + freeDelta.y;
    product.elevationMeters = drag.startProduct.elevationMeters;
  }
  if (state.analysisCanvas) {
    product.planX = clamp(product.planX, 0, state.analysisCanvas.width);
    product.planY = clamp(product.planY, 0, state.analysisCanvas.height);
  }
  const collision = findProductCollision(product);
  if (collision) {
    restoreProductTransform(product, previous);
    product.collisionBlocked = collision;
    drag.blocked = collision;
  } else {
    product.collisionBlocked = null;
    drag.blocked = null;
    drag.moved = true;
  }
  updateProductModelTransforms(unit, state.three.planBounds || getPlanBounds(state.lines));
  updateSelectedComponentInfo();
  renderPreview();
  renderThreeScene();
}

function finishThreeProductMove(event) {
  const drag = state.three.productMoveDrag;
  if (!drag || event.pointerId !== drag.pointerId) return false;
  const moved = drag.moved;
  const product = state.productModels.find((item) => item.id === drag.productId);
  if (product) product.collisionBlocked = null;
  state.three.productMoveDrag = null;
  elements.threeViewport.classList.remove("is-moving-product");
  if (elements.threeViewport.hasPointerCapture(event.pointerId)) {
    elements.threeViewport.releasePointerCapture(event.pointerId);
  }
  if (drag.blocked) {
    updateThreeModel(false);
    renderPreview();
    setStatus(productCollisionStatusMessage(drag.blocked));
  } else if (moved) {
    updateThreeModel(false);
    setStatus("产品模型位置已移动");
  } else {
    setStatus("已选择产品模型");
  }
  return true;
}

function productLocalOffsetToPlanDelta(localOffset, rotationDegrees, unit) {
  const angle = ((Number(rotationDegrees) || 0) * Math.PI) / 180;
  return {
    x: (localOffset.x * Math.cos(angle) - localOffset.z * Math.sin(angle)) / Math.max(0.001, unit),
    y: (localOffset.x * Math.sin(angle) + localOffset.z * Math.cos(angle)) / Math.max(0.001, unit),
  };
}

function updateThreeProductResize(event) {
  const drag = state.three.resizeDrag;
  const product = drag ? state.productModels.find((item) => item.id === drag.productId) : null;
  const point = product ? threeGroundPointFromEvent(event) : null;
  if (!drag || !product || !point) return;
  if (!drag.pushedUndo) {
    pushUndoSnapshot("resize-product-3d");
    drag.pushedUndo = true;
  }
  const previous = captureProductTransform(product);

  const unit = state.three.unit || 1;
  const localPoint = point.clone().applyMatrix4(drag.inverseWorldMatrix);
  const startWidth = Math.max(0.05, drag.dimensions.width);
  const startDepth = Math.max(0.05, drag.dimensions.depth);
  const startHeight = Math.max(0.05, drag.dimensions.height);
  const oppositeX = drag.sign > 0 ? -startWidth / 2 : startWidth / 2;
  const oppositeZ = drag.sign > 0 ? -startDepth / 2 : startDepth / 2;
  normalizeProductMetadata(product);
  const minWidthMeters = productMinimumSizeMeters(product.category, product.productSubtype);
  const minDepthMeters = productMinimumDepthMeters(product.category, product.productSubtype);
  const minHeightMeters = productMinimumHeightMeters(product.category, product.productSubtype);
  const nextWidth = drag.axis === "x" ? clamp(Math.abs(localPoint.x - oppositeX), minWidthMeters, 80) : startWidth;
  const nextDepth = drag.axis === "z" ? clamp(Math.abs(localPoint.z - oppositeZ), minDepthMeters, 80) : startDepth;
  const nextHeight = drag.axis === "y" ? clamp(startHeight + (drag.startClientY - event.clientY) * 0.012 * drag.sign, minHeightMeters, 12) : startHeight;
  const widthRatio = nextWidth / startWidth;
  const depthRatio = nextDepth / startDepth;
  const heightRatio = nextHeight / startHeight;

  product.widthMillimeters = clampProductDimensionMillimeters(product, "length", (drag.startProduct.widthMillimeters || productDefaultSizeMeters(product.category, product.productSubtype) * 1000) * widthRatio);
  product.depthMillimeters = clampProductDimensionMillimeters(product, "thickness", (drag.startProduct.depthMillimeters || productDefaultDepthMeters(product.category, product.productSubtype) * 1000) * depthRatio);
  product.heightMillimeters = clampProductDimensionMillimeters(product, "height", (drag.startProduct.heightMillimeters || productDefaultHeightMeters(product.category, product.productSubtype) * 1000) * heightRatio);
  if (drag.axis === "x") {
    const centerLocal = { x: (oppositeX + localPoint.x) / 2, z: 0 };
    const delta = productLocalOffsetToPlanDelta(centerLocal, drag.startProduct.rotationDegrees, unit);
    product.planX = drag.startProduct.planX + delta.x;
    product.planY = drag.startProduct.planY + delta.y;
  } else if (drag.axis === "z") {
    const centerLocal = { x: 0, z: (oppositeZ + localPoint.z) / 2 };
    const delta = productLocalOffsetToPlanDelta(centerLocal, drag.startProduct.rotationDegrees, unit);
    product.planX = drag.startProduct.planX + delta.x;
    product.planY = drag.startProduct.planY + delta.y;
  } else {
    product.planX = drag.startProduct.planX;
    product.planY = drag.startProduct.planY;
  }
  if (state.analysisCanvas) {
    product.planX = clamp(product.planX, 0, state.analysisCanvas.width);
    product.planY = clamp(product.planY, 0, state.analysisCanvas.height);
  }

  const collision = findProductCollision(product);
  if (collision) {
    restoreProductTransform(product, previous);
    product.collisionBlocked = collision;
    drag.blocked = collision;
  } else {
    product.collisionBlocked = null;
    drag.blocked = null;
  }

  syncProductObjectScale(product);
  updateProductModelTransforms(unit, state.three.planBounds || getPlanBounds(state.lines));
  updateSelectedComponentInfo();
  renderPreview();
  renderThreeScene();
}

function finishThreeProductResize(event) {
  const drag = state.three.resizeDrag;
  if (!drag || event.pointerId !== drag.pointerId) return false;
  const product = state.productModels.find((item) => item.id === drag.productId);
  if (product) product.collisionBlocked = null;
  state.three.resizeDrag = null;
  if (elements.threeViewport.hasPointerCapture(event.pointerId)) {
    elements.threeViewport.releasePointerCapture(event.pointerId);
  }
  updateThreeModel(false);
  setStatus(drag.blocked ? productCollisionStatusMessage(drag.blocked) : "产品尺寸已调整");
  return true;
}

function handleThreePointerDown(event) {
  if (!state.three.renderer) return;
  elements.threeViewport.focus({ preventScroll: true });
  const resizeHit = threeResizeHandleHit(event);
  if (resizeHit && beginThreeProductResize(event, resizeHit)) {
    event.preventDefault();
    return;
  }
  const moveHit = threeMoveHandleHit(event);
  if (moveHit && beginThreeProductMove(event, moveHit)) {
    event.preventDefault();
    return;
  }
  const productHit = threeProductHit(event);
  if (productHit && beginThreeProductMove(event, productHit)) {
    event.preventDefault();
    return;
  }
  state.three.dragging = true;
  state.three.dragDistance = 0;
  state.three.lastX = event.clientX;
  state.three.lastY = event.clientY;
  elements.threeViewport.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handleThreePointerMove(event) {
  if (state.three.resizeDrag) {
    updateThreeProductResize(event);
    return;
  }
  if (state.three.productMoveDrag) {
    updateThreeProductMove(event);
    return;
  }
  if (!state.three.dragging) return;
  const dx = event.clientX - state.three.lastX;
  const dy = event.clientY - state.three.lastY;
  state.three.lastX = event.clientX;
  state.three.lastY = event.clientY;
  state.three.dragDistance += Math.hypot(dx, dy);
  if (state.three.mode === "roam") {
    state.three.roamYaw -= dx * 0.006;
    state.three.roamPitch = clamp(state.three.roamPitch - dy * 0.0045, -0.75, 0.75);
    updateThreeRoamCamera();
    return;
  }
  state.three.yaw -= dx * 0.008;
  state.three.pitch = clamp(state.three.pitch + dy * 0.006, 0.22, 1.28);
  updateThreeCamera();
}

function handleThreePointerUp(event) {
  if (finishThreeProductResize(event)) return;
  if (finishThreeProductMove(event)) return;
  if (!state.three.dragging) return;
  const wasClick = state.three.dragDistance < 5;
  state.three.dragging = false;
  if (elements.threeViewport.hasPointerCapture(event.pointerId)) {
    elements.threeViewport.releasePointerCapture(event.pointerId);
  }
  if (wasClick) selectThreeWallAt(event);
}

function handleThreeDoubleClick(event) {
  if (!state.three.renderer || state.three.mode === "roam") return;
  const productHit = threeProductHit(event);
  if (!productHit) return;
  const productId = productHit.productId;
  if (!productId) return;
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = productId;
  state.three.productTransformMode = "resize";
  state.three.cardX = event.clientX - state.three.renderer.domElement.getBoundingClientRect().left;
  state.three.cardY = event.clientY - state.three.renderer.domElement.getBoundingClientRect().top;
  elements.threeComponentCard.hidden = false;
  updateSelectedComponentInfo();
  renderPreview();
  renderThreeProductResizeHandles();
  renderThreeScene();
  setStatus("已进入产品尺寸编辑");
  event.preventDefault();
}

function handleThreeWheel(event) {
  if (!state.three.renderer) return;
  event.preventDefault();
  if (state.three.mode === "roam") {
    const step = state.three.roamSpeed * (event.shiftKey ? 2.2 : 1);
    moveThreeRoam(event.deltaY < 0 ? step : -step);
    return;
  }
  state.three.radius = clamp(state.three.radius * Math.exp(event.deltaY * 0.0012), 3.8, 48);
  updateThreeCamera();
}

function handleThreeKeyDown(event) {
  if (state.three.mode !== "roam") return;
  const key = event.key.toLowerCase();
  const step = state.three.roamSpeed * (event.shiftKey ? 2.2 : 1);
  let forward = 0;
  let strafe = 0;
  let vertical = 0;
  if (key === "w" || event.key === "ArrowUp") {
    forward = step;
  } else if (key === "s" || event.key === "ArrowDown") {
    forward = -step;
  } else if (key === "a" || event.key === "ArrowLeft") {
    strafe = -step;
  } else if (key === "d" || event.key === "ArrowRight") {
    strafe = step;
  } else if (key === "q") {
    vertical = -step * 0.5;
  } else if (key === "e") {
    vertical = step * 0.5;
  } else if (event.key === "Escape") {
    setThreeMode("orbit");
    event.preventDefault();
    return;
  } else {
    return;
  }
  moveThreeRoam(forward, strafe, vertical);
  event.preventDefault();
}

function selectThreeWallAt(event) {
  const { renderer, camera, wallsGroup, productsGroup, lightSourcesGroup, raycaster, pointer } = state.three;
  if (!renderer || !camera || !wallsGroup || !raycaster || !pointer) return;
  const rect = renderer.domElement.getBoundingClientRect();
  if (!updateThreeRaycasterFromEvent(event)) return;
  const lightHits = lightSourcesGroup ? raycaster.intersectObjects(lightSourcesGroup.children, true) : [];
  const lightHit = lightHits.find((candidate) => findThreeLightSourceId(candidate.object));
  if (lightHit) {
    state.selectedLightSourceId = findThreeLightSourceId(lightHit.object);
    renderPreview();
    openLightingEditor();
    setStatus("已选择光源");
    return;
  }
  const productHits = productsGroup ? raycaster.intersectObjects(productsGroup.children, true) : [];
  const productHit = productHits.find((candidate) => findThreeProductId(candidate.object));
  if (productHit) {
    const productId = findThreeProductId(productHit.object);
    if (!productId) return;
    state.three.cardX = event.clientX - rect.left;
    state.three.cardY = event.clientY - rect.top;
    setTool("select");
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.selectedProductId = productId;
    state.three.productTransformMode = "move";
    state.hoveredEndpoint = null;
    elements.threeComponentCard.hidden = false;
    updateStats();
    if (state.analysisCanvas) renderPreview();
    updateThreeModel(false);
    setStatus("已选择产品模型");
    return;
  }
  const hits = raycaster.intersectObjects(wallsGroup.children, true);
  const railingHit = hits.find((candidate) => findThreeRailingId(candidate.object) !== null);
  if (railingHit) {
    const railingId = findThreeRailingId(railingHit.object);
    if (!railingId) return;
    state.three.cardX = event.clientX - rect.left;
    state.three.cardY = event.clientY - rect.top;
    setTool("select");
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = railingId;
    state.selectedProductId = null;
    state.hoveredEndpoint = null;
    elements.threeComponentCard.hidden = false;
    updateStats();
    if (state.analysisCanvas) renderPreview();
    updateThreeModel(false);
    setStatus("已选择栏杆构件");
    return;
  }
  const openingHit = hits.find((candidate) => findThreeOpeningIndex(candidate.object) !== null);
  if (openingHit) {
    const openingIndex = findThreeOpeningIndex(openingHit.object);
    const opening = state.topology.openings[openingIndex];
    if (!opening) return;
    state.three.cardX = event.clientX - rect.left;
    state.three.cardY = event.clientY - rect.top;
    setTool("select");
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = openingIndex;
    state.selectedOpeningId = opening.id;
    state.selectedRailingId = null;
    state.selectedProductId = null;
    state.hoveredEndpoint = null;
    elements.threeComponentCard.hidden = false;
    updateStats();
    if (state.analysisCanvas) renderPreview();
    updateThreeModel(false);
    setStatus("已选择洞口构件");
    return;
  }

  const hit = hits.find((candidate) => findThreeLineIndex(candidate.object) !== null);
  if (!hit) {
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.selectedProductId = null;
    state.hoveredEndpoint = null;
    updateSelectedComponentInfo();
    if (state.analysisCanvas) renderPreview();
    updateThreeModel(false);
    return;
  }

  const index = findThreeLineIndex(hit.object);
  if (index === null) return;
  state.three.cardX = event.clientX - rect.left;
  state.three.cardY = event.clientY - rect.top;
  setTool("select");
  state.selectedLineIndex = index;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = null;
  state.hoveredEndpoint = null;
  elements.threeComponentCard.hidden = false;
  updateStats();
  if (state.analysisCanvas) renderPreview();
  updateThreeModel(false);
  setStatus("已选择 3D 构件");
}

function findThreeLineIndex(object) {
  let current = object;
  while (current) {
    if (Number.isInteger(current.userData && current.userData.lineIndex)) return current.userData.lineIndex;
    current = current.parent;
  }
  return null;
}

function findThreeOpeningIndex(object) {
  let current = object;
  while (current) {
    if (Number.isInteger(current.userData && current.userData.openingIndex)) return current.userData.openingIndex;
    current = current.parent;
  }
  return null;
}

function findThreeRailingId(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.railingId) return current.userData.railingId;
    current = current.parent;
  }
  return null;
}

function findThreeProductId(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.productId) return current.userData.productId;
    current = current.parent;
  }
  return null;
}

function findThreeLightSourceId(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.lightSourceId) return current.userData.lightSourceId;
    current = current.parent;
  }
  return null;
}

function clearThreeObject(object) {
  while (object.children.length) {
    const child = object.children.pop();
    disposeThreeObject(child);
  }
}

function disposeThreeObject(object) {
  if (object.children) clearThreeObject(object);
  if (object.shadow && object.shadow.map) object.shadow.map.dispose();
  if (object.geometry) object.geometry.dispose();
  if (Array.isArray(object.material)) {
    object.material.forEach(disposeThreeMaterial);
  } else if (object.material) {
    disposeThreeMaterial(object.material);
  }
}

function disposeThreeMaterial(material) {
  for (const value of Object.values(material)) {
    if (value && typeof value.dispose === "function" && value.isTexture) value.dispose();
  }
  material.dispose();
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

function setTool(tool) {
  state.tool = tool;
  state.drawingLine = null;
  state.openingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  if (tool !== "select") {
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.selectedProductId = null;
  }
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.draggedProduct = null;
  state.draggedProductResize = null;
  state.three.productMoveDrag = null;
  state.hoveredEndpoint = null;
  elements.drawWallButton.classList.toggle("active", tool === "draw-wall");
  elements.drawDoorButton.classList.toggle("active", tool === "draw-door");
  elements.drawWindowButton.classList.toggle("active", tool === "draw-window");
  elements.drawRailingButton.classList.toggle("active", tool === "draw-railing");
  elements.calibrateToolButton.classList.toggle("active", tool === "calibrate-scale");
  elements.calibrateScaleButton.classList.toggle("active", tool === "calibrate-scale");
  elements.measureToolButton.classList.toggle("active", tool === "measure");
  elements.previewCanvas.style.cursor = isPointDrawingTool(tool) ? "crosshair" : "default";
  if (isPointDrawingTool(tool)) {
    ensureDrawingCanvas();
    setStatus(toolStatusText(tool));
  }
  if (state.analysisCanvas) renderPreview();
  updateSelectedComponentInfo();
}

function isPointDrawingTool(tool) {
  return tool === "draw-wall" || tool === "draw-door" || tool === "draw-window" || tool === "draw-railing" || tool === "calibrate-scale" || tool === "measure";
}

function toolStatusText(tool) {
  if (tool === "draw-wall") return "画墙模式";
  if (tool === "draw-door") return "画门模式";
  if (tool === "draw-window") return "画窗模式";
  if (tool === "draw-railing") return "画栏杆模式";
  if (tool === "calibrate-scale") return "标定比例";
  if (tool === "measure") return "测量尺寸";
  return "已生成";
}

function toggleDrawWallTool() {
  setTool(state.tool === "draw-wall" ? "select" : "draw-wall");
}

function toggleDrawDoorTool() {
  setTool(state.tool === "draw-door" ? "select" : "draw-door");
}

function toggleDrawWindowTool() {
  setTool(state.tool === "draw-window" ? "select" : "draw-window");
}

function toggleDrawRailingTool() {
  setTool(state.tool === "draw-railing" ? "select" : "draw-railing");
}

function toggleCalibrateScaleTool() {
  setTool(state.tool === "calibrate-scale" ? "select" : "calibrate-scale");
}

function toggleMeasureTool() {
  setTool(state.tool === "measure" ? "select" : "measure");
}

function getCalibrationLengthMillimeters() {
  return Math.max(1, Number(elements.calibrationLengthInput.value) || 3000);
}

function applyCalibrationFromDraft() {
  if (!state.calibrationLine) return false;
  const pixelLength = distance(state.calibrationLine.start, state.calibrationLine.end);
  const actualLength = getCalibrationLengthMillimeters();
  state.calibrationLine = null;
  if (pixelLength < 6) {
    renderPreview();
    setStatus("标定线太短");
    return false;
  }
  pushUndoSnapshot("calibrate-scale");
  state.manualMillimetersPerPixel = actualLength / pixelLength;
  syncControlLabels();
  updateStats();
  renderPreview();
  updateThreeModel(false);
  setStatus("已标定");
  return true;
}

function addMeasurementFromDraft() {
  if (!state.measurementLine) return false;
  const measurement = state.measurementLine;
  const pixelLength = distance(measurement.start, measurement.end);
  state.measurementLine = null;
  if (pixelLength < 6) {
    renderPreview();
    setStatus("测量线太短");
    return false;
  }
  pushUndoSnapshot("add-measurement");
  state.measurements.push({
    id: `measurement-${Date.now()}-${state.measurements.length + 1}`,
    start: { ...measurement.start },
    end: { ...measurement.end },
    pixelLength,
    millimeterLength: pxToMillimeters(pixelLength, getSettings()),
  });
  renderPreview();
  setStatus("已测量");
  return true;
}

function lineFromDrawingDraft(start, end, settings) {
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const thickness = clamp(Math.round(settings.maxThickness), settings.minWallThickness, settings.maxThickness);
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    return makeLine("horizontal", x1, start.y, x2, start.y, thickness);
  }
  const y1 = Math.min(start.y, end.y);
  const y2 = Math.max(start.y, end.y);
  return makeLine("vertical", start.x, y1, start.x, y2, thickness);
}

function openingFromDraft(start, end, variant) {
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const definition = OPENING_VARIANTS[variant] || OPENING_VARIANTS.door;
  let opening;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    opening = { orientation: "horizontal", x1, y1: start.y, x2, y2: start.y };
  } else {
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    opening = { orientation: "vertical", x1: start.x, y1, x2: start.x, y2 };
  }
  opening.variant = variant;
  opening.kind = definition.kind;
  opening.sillHeightMillimeters = definition.sill;
  opening.openingHeightMillimeters = definition.height;
  opening.projectionMillimeters = definition.projection || 0;
  snapOpeningDraftToWall(opening);
  normalizeOpeningComponent(opening);
  return opening;
}

function railingFromDraft(start, end) {
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let railing;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    railing = { orientation: "horizontal", x1, y1: start.y, x2, y2: start.y };
  } else {
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    railing = { orientation: "vertical", x1: start.x, y1, x2: start.x, y2 };
  }
  railing.thicknessMillimeters = RAILING_DEFAULT_THICKNESS_MM;
  railing.heightMillimeters = RAILING_DEFAULT_HEIGHT_MM;
  normalizeRailing(railing);
  return railing;
}

function normalizeRailing(railing) {
  if (railing.orientation === "horizontal") {
    if (railing.x1 > railing.x2) [railing.x1, railing.x2] = [railing.x2, railing.x1];
    railing.y2 = railing.y1;
    railing.length = Math.abs(railing.x2 - railing.x1);
  } else {
    if (railing.y1 > railing.y2) [railing.y1, railing.y2] = [railing.y2, railing.y1];
    railing.x2 = railing.x1;
    railing.length = Math.abs(railing.y2 - railing.y1);
  }
  railing.thicknessMillimeters = Math.max(10, Number(railing.thicknessMillimeters) || RAILING_DEFAULT_THICKNESS_MM);
  railing.heightMillimeters = Math.max(100, Number(railing.heightMillimeters) || RAILING_DEFAULT_HEIGHT_MM);
  return railing;
}

function snapRailingToNearbyGeometry(railing) {
  const settings = getSettings();
  const tolerance = snapPointDistancePixels(settings);
  for (const end of ["start", "end"]) {
    const point = lineEndpoint(railing, end);
    const snapped = nearestRailingSnapPoint(point, railing, tolerance);
    if (snapped) setLineEndpoint(railing, end, snapped);
  }
  normalizeRailing(railing);
  return railing;
}

function snapOpeningDraftToWall(opening) {
  if (!state.lines.length) return opening;
  const settings = getSettings();
  const tolerance = Math.max(settings.mergeGap, settings.maxThickness);
  const start = getLineStart(opening, opening.orientation);
  const end = getLineEnd(opening, opening.orientation);
  let best = null;
  for (const line of state.lines) {
    if (line.orientation !== opening.orientation) continue;
    const axisDelta = Math.abs(getLineAxis(line, line.orientation) - getLineAxis(opening, opening.orientation));
    if (axisDelta > tolerance) continue;
    const overlap = Math.min(getLineEnd(line, line.orientation), end) - Math.max(getLineStart(line, line.orientation), start);
    const score = axisDelta - Math.max(0, overlap) * 0.02;
    if (!best || score < best.score) best = { line, score };
  }
  if (!best) return opening;
  if (opening.orientation === "horizontal") {
    opening.y1 = best.line.y1;
    opening.y2 = best.line.y1;
  } else {
    opening.x1 = best.line.x1;
    opening.x2 = best.line.x1;
  }
  opening.hostWall = best.line.id;
  opening.leftThickness = best.line.thickness;
  opening.rightThickness = best.line.thickness;
  return opening;
}

function addManualWallFromDraft() {
  if (!state.drawingLine) return false;
  const settings = getSettings();
  const line = lineFromDrawingDraft(state.drawingLine.start, state.drawingLine.end, settings);
  state.drawingLine = null;
  if (!line || line.length < manualWallMinLengthPixels(settings)) {
    renderPreview();
    setStatus("线段太短");
    return false;
  }

  pushUndoSnapshot("add-wall");
  const nextIndex = state.lines.length + 1;
  const wall = { ...line, id: `manual-wall-${Date.now()}-${nextIndex}` };
  state.lines.push(wall);
  state.selectedLineIndex = state.lines.length - 1;
  state.hoveredEndpoint = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.recognitionMode = state.recognitionMode === "-" ? "manual" : state.recognitionMode;
  refreshAfterEdit({ skipEndpointSnapLineId: wall.id });
  updateSelectedComponentInfo();
  elements.exportJsonButton.disabled = !state.lines.length;
  elements.processButton.disabled = !state.analysisCanvas;
  setStatus("已添加墙体");
  return true;
}

function addManualOpeningFromDraft() {
  if (!state.openingDraft) return false;
  const settings = getSettings();
  const opening = openingFromDraft(state.openingDraft.start, state.openingDraft.end, state.openingDraft.variant);
  state.openingDraft = null;
  if (!opening || opening.width < Math.max(2, settings.openingMinWidth * 0.35)) {
    renderPreview();
    setStatus("构件太短");
    return false;
  }

  pushUndoSnapshot("add-opening-component");
  opening.id = `manual-opening-${Date.now()}-${state.manualOpenings.length + 1}`;
  opening.manual = true;
  state.manualOpenings.push(opening);
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = opening.id;
  state.hoveredEndpoint = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.recognitionMode = state.recognitionMode === "-" ? "manual" : state.recognitionMode;
  refreshAfterEdit();
  updateSelectedComponentInfo();
  elements.exportJsonButton.disabled = !state.lines.length;
  elements.processButton.disabled = !state.analysisCanvas;
  setStatus(`${openingKindLabel(opening)}构件已添加`);
  return true;
}

function addManualRailingFromDraft() {
  if (!state.railingDraft) return false;
  const settings = getSettings();
  const railing = railingFromDraft(state.railingDraft.start, state.railingDraft.end);
  state.railingDraft = null;
  if (!railing || railing.length < manualWallMinLengthPixels(settings)) {
    renderPreview();
    setStatus("栏杆太短");
    return false;
  }

  pushUndoSnapshot("add-railing");
  railing.id = `manual-railing-${Date.now()}-${state.manualRailings.length + 1}`;
  snapRailingToNearbyGeometry(railing);
  state.manualRailings.push(railing);
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = railing.id;
  state.hoveredEndpoint = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.recognitionMode = state.recognitionMode === "-" ? "manual" : state.recognitionMode;
  setTool("select");
  refreshAfterEdit();
  updateSelectedComponentInfo();
  elements.exportJsonButton.disabled = !state.lines.length && !state.manualRailings.length;
  elements.processButton.disabled = !state.analysisCanvas;
  setStatus("栏杆已添加");
  return true;
}

function selectedLine() {
  if (state.selectedLineIndex === null) return null;
  return state.lines[state.selectedLineIndex] || null;
}

function selectedRailing() {
  if (!state.selectedRailingId) return null;
  return state.manualRailings.find((railing) => railing.id === state.selectedRailingId) || null;
}

function canvasPointFromEvent(event) {
  if (event && event.phoneCanvasPoint) return event.phoneCanvasPoint;
  const rect = elements.previewCanvas.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) * elements.previewCanvas.width) / rect.width, 0, elements.previewCanvas.width),
    y: clamp(((event.clientY - rect.top) * elements.previewCanvas.height) / rect.height, 0, elements.previewCanvas.height),
  };
}

function capturePreviewPointer(event) {
  if (event && event.phonePreviewProxy) return;
  elements.previewCanvas.setPointerCapture(event.pointerId);
}

function releasePreviewPointer(event) {
  if (event && event.phonePreviewProxy) return;
  if (elements.previewCanvas.hasPointerCapture(event.pointerId)) elements.previewCanvas.releasePointerCapture(event.pointerId);
}

function findNearestLineIndex(point) {
  const radius = lineHitRadius();
  const settings = getSettings();
  let nearest = null;

  for (let index = 0; index < state.lines.length; index += 1) {
    const line = state.lines[index];
    const hitDistance = distanceToSegment(point, line);
    const lineRadius = Math.max(radius, visualWallThicknessPixels(line, settings) / 2 + 10);
    if (hitDistance > lineRadius) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { index, distance: hitDistance };
  }

  return nearest ? nearest.index : null;
}

function findNearestOpeningIndex(point) {
  const radius = lineHitRadius();
  let nearest = null;
  for (let index = 0; index < state.topology.openings.length; index += 1) {
    const opening = state.topology.openings[index];
    if (!isConstructibleOpening(opening)) continue;
    const hitDistance = distanceToSegment(point, opening);
    if (hitDistance > radius + 6) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { index, distance: hitDistance };
  }
  return nearest ? nearest.index : null;
}

function findNearestRailingId(point) {
  const radius = lineHitRadius();
  let nearest = null;
  for (const railing of state.manualRailings) {
    const hitDistance = distanceToSegment(point, railing);
    const thicknessPx = millimetersToPixels(railing.thicknessMillimeters || RAILING_DEFAULT_THICKNESS_MM, getSettings());
    if (hitDistance > Math.max(radius, thicknessPx / 2 + 8)) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { id: railing.id, distance: hitDistance };
  }
  return nearest ? nearest.id : null;
}

function findNearestProductId(point) {
  const settings = getSettings();
  for (let index = state.productModels.length - 1; index >= 0; index -= 1) {
    const product = state.productModels[index];
    const { width, depth } = productFootprintPixels(product, settings);
    const angle = -((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
    const dx = point.x - product.planX;
    const dy = point.y - product.planY;
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
    if (Math.abs(localX) <= width / 2 + 8 && Math.abs(localY) <= depth / 2 + 8) return product.id;
  }
  return null;
}

function findSelectedProductRotationHandle(point) {
  const product = selectedProduct();
  if (!product) return null;
  const handle = productRotationHandlePoint(product);
  return distance(point, handle) <= editableHitRadius() ? product.id : null;
}

function findSelectedProductResizeHandle(point) {
  const product = selectedProduct();
  if (!product) return null;
  const settings = getSettings();
  const { width, depth } = productFootprintPixels(product, settings);
  const local = pointToProductLocal(point, product);
  const radius = editableHitRadius();
  let nearest = null;
  for (const handle of productResizeHandleDefinitions(width, depth)) {
    const hitDistance = distance({ x: local.x, y: local.y }, handle);
    if (hitDistance > radius) continue;
    if (!nearest || hitDistance < nearest.distance) nearest = { ...handle, productId: product.id, distance: hitDistance };
  }
  return nearest;
}

function pointToProductLocal(point, product) {
  const angle = -((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
  const dx = point.x - product.planX;
  const dy = point.y - product.planY;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

function productLocalToWorld(local, product) {
  const angle = ((Number(product.rotationDegrees) || 0) * Math.PI) / 180;
  return {
    x: product.planX + local.x * Math.cos(angle) - local.y * Math.sin(angle),
    y: product.planY + local.x * Math.sin(angle) + local.y * Math.cos(angle),
  };
}

function lineHitRadius() {
  const rect = elements.previewCanvas.getBoundingClientRect();
  const scale = Math.max(0.2, Math.min(rect.width / elements.previewCanvas.width, rect.height / elements.previewCanvas.height));
  return Math.max(10, 10 / scale);
}

function findNearestSelectedEndpoint(point) {
  const line = selectedLine();
  const railing = selectedRailing();
  const editable = line || railing;
  if (!editable) return null;

  const radius = editableHitRadius();
  const endpoints = [
    { kind: line ? "line" : "railing", end: "start", x: editable.x1, y: editable.y1 },
    { kind: line ? "line" : "railing", end: "end", x: editable.x2, y: editable.y2 },
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
  const railing = selectedRailing();
  if (selection.kind === "railing" || (!line && railing)) {
    moveSelectedRailingEndpoint(selection, point);
    return;
  }
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

function moveSelectedRailingEndpoint(selection, point) {
  const railing = selectedRailing();
  if (!railing) return;
  const minLength = 2;
  if (railing.orientation === "horizontal") {
    if (selection.end === "start") railing.x1 = Math.min(point.x, railing.x2 - minLength);
    else railing.x2 = Math.max(point.x, railing.x1 + minLength);
    railing.y2 = railing.y1;
  } else {
    if (selection.end === "start") railing.y1 = Math.min(point.y, railing.y2 - minLength);
    else railing.y2 = Math.max(point.y, railing.y1 + minLength);
    railing.x2 = railing.x1;
  }
  normalizeRailing(railing);
}

function beginSelectedLineDrag(index, point) {
  const line = state.lines[index];
  if (!line) return;
  state.draggedLine = {
    index,
    start: { ...point },
    original: cloneLine(line),
    moved: false,
    snapshotPushed: false,
  };
}

function moveSelectedLine(selection, point) {
  if (!selection) return;
  const line = state.lines[selection.index];
  if (!line) return;
  const dx = point.x - selection.start.x;
  const dy = point.y - selection.start.y;
  if (!selection.snapshotPushed && Math.hypot(dx, dy) > 1.5) {
    pushUndoSnapshot("move-line");
    selection.snapshotPushed = true;
  }
  if (!selection.snapshotPushed) return;

  line.x1 = selection.original.x1 + dx;
  line.y1 = selection.original.y1 + dy;
  line.x2 = selection.original.x2 + dx;
  line.y2 = selection.original.y2 + dy;
  normalizeEditedLine(line);
  selection.moved = true;
}

function beginSelectedOpeningDrag(index, point) {
  const opening = state.topology.openings[index];
  if (!opening) return;
  state.draggedOpening = {
    index,
    start: { ...point },
    original: cloneOpening(opening),
    moved: false,
    snapshotPushed: false,
    manualId: opening.manual ? opening.id : null,
  };
}

function beginSelectedRailingDrag(id, point) {
  const railing = state.manualRailings.find((item) => item.id === id);
  if (!railing) return;
  state.draggedRailing = {
    id,
    start: { ...point },
    original: cloneRailing(railing),
    moved: false,
    snapshotPushed: false,
  };
}

function beginSelectedProductDrag(id, point) {
  const product = state.productModels.find((item) => item.id === id);
  if (!product) return;
  state.draggedProduct = {
    id,
    start: { ...point },
    original: { planX: product.planX, planY: product.planY },
    moved: false,
    snapshotPushed: false,
  };
}

function beginSelectedProductResizeDrag(handle, point) {
  const product = selectedProduct();
  if (!product || !handle) return;
  const settings = getSettings();
  const { width, depth } = productFootprintPixels(product, settings);
  state.draggedProductResize = {
    id: product.id,
    start: { ...point },
    sideX: handle.sideX,
    sideY: handle.sideY,
    resizeAxis: handle.resizeAxis || "both",
    oppositeLocal: {
      x: handle.sideX ? -handle.sideX * width / 2 : 0,
      y: handle.sideY ? -handle.sideY * depth / 2 : 0,
    },
    original: {
      planX: product.planX,
      planY: product.planY,
      widthMillimeters: product.widthMillimeters,
      depthMillimeters: product.depthMillimeters,
      heightMillimeters: product.heightMillimeters,
      rotationDegrees: product.rotationDegrees,
    },
    moved: false,
    snapshotPushed: false,
  };
}

function captureProductTransform(product) {
  return {
    planX: product.planX,
    planY: product.planY,
    elevationMeters: product.elevationMeters,
    rotationDegrees: product.rotationDegrees,
    widthMillimeters: product.widthMillimeters,
    depthMillimeters: product.depthMillimeters,
    heightMillimeters: product.heightMillimeters,
  };
}

function restoreProductTransform(product, transform) {
  Object.assign(product, transform);
}

function moveSelectedProduct(selection, point) {
  if (!selection) return;
  const product = state.productModels.find((item) => item.id === selection.id);
  if (!product) return;
  const dx = point.x - selection.start.x;
  const dy = point.y - selection.start.y;
  if (!selection.snapshotPushed && Math.hypot(dx, dy) > 1.5) {
    pushUndoSnapshot("move-product");
    selection.snapshotPushed = true;
  }
  if (!selection.snapshotPushed) return;
  const previous = captureProductTransform(product);
  product.planX = selection.original.planX + dx;
  product.planY = selection.original.planY + dy;
  if (state.analysisCanvas) {
    product.planX = clamp(product.planX, 0, state.analysisCanvas.width);
    product.planY = clamp(product.planY, 0, state.analysisCanvas.height);
  }
  const collision = findProductCollision(product);
  if (collision) {
    restoreProductTransform(product, previous);
    product.collisionBlocked = collision;
    selection.blocked = collision;
    setStatus(productCollisionStatusMessage(collision));
    return;
  }
  product.collisionBlocked = null;
  selection.blocked = null;
  selection.moved = true;
}

function resizeSelectedProduct(selection, point) {
  if (!selection) return;
  const product = state.productModels.find((item) => item.id === selection.id);
  if (!product) return;
  const dx = point.x - selection.start.x;
  const dy = point.y - selection.start.y;
  if (!selection.snapshotPushed && Math.hypot(dx, dy) > 1.5) {
    pushUndoSnapshot("resize-product-2d");
    selection.snapshotPushed = true;
  }
  if (!selection.snapshotPushed) return;
  const previous = captureProductTransform(product);

  product.planX = selection.original.planX;
  product.planY = selection.original.planY;
  product.rotationDegrees = selection.original.rotationDegrees;
  const local = pointToProductLocal(point, product);
  normalizeProductMetadata(product);
  const settings = getSettings();
  const minWidthPixels = millimetersToPixels(productMinimumSizeMeters(product.category, product.productSubtype) * 1000, settings);
  const minDepthPixels = millimetersToPixels(productMinimumDepthMeters(product.category, product.productSubtype) * 1000, settings);
  const originalWidthPixels = millimetersToPixels(selection.original.widthMillimeters || productDefaultSizeMeters(product.category, product.productSubtype) * 1000, settings);
  const originalDepthPixels = millimetersToPixels(selection.original.depthMillimeters || productDefaultDepthMeters(product.category, product.productSubtype) * 1000, settings);
  const resizeAxis = selection.resizeAxis || "both";
  const widthPixels = resizeAxis === "depth" ? originalWidthPixels : Math.max(minWidthPixels, Math.abs(local.x - selection.oppositeLocal.x));
  const depthPixels = resizeAxis === "width" ? originalDepthPixels : Math.max(minDepthPixels, Math.abs(local.y - selection.oppositeLocal.y));
  const centerLocal = {
    x: resizeAxis === "depth" ? 0 : (local.x + selection.oppositeLocal.x) / 2,
    y: resizeAxis === "width" ? 0 : (local.y + selection.oppositeLocal.y) / 2,
  };
  const centerWorld = productLocalToWorld(centerLocal, product);
  product.widthMillimeters = clampProductDimensionMillimeters(product, "length", pxToMillimeters(widthPixels, settings));
  product.depthMillimeters = clampProductDimensionMillimeters(product, "thickness", pxToMillimeters(depthPixels, settings));
  product.heightMillimeters = clampProductDimensionMillimeters(product, "height", selection.original.heightMillimeters || productDefaultHeightMeters(product.category, product.productSubtype) * 1000);
  product.planX = centerWorld.x;
  product.planY = centerWorld.y;
  if (state.analysisCanvas) {
    product.planX = clamp(product.planX, 0, state.analysisCanvas.width);
    product.planY = clamp(product.planY, 0, state.analysisCanvas.height);
  }
  const collision = findProductCollision(product);
  if (collision) {
    restoreProductTransform(product, previous);
    product.collisionBlocked = collision;
    selection.blocked = collision;
    setStatus(productCollisionStatusMessage(collision));
    return;
  }
  product.collisionBlocked = null;
  selection.blocked = null;
  selection.moved = true;
}

function rotateSelectedProductByStep() {
  const product = selectedProduct();
  if (!product) return false;
  normalizeProductMetadata(product);
  const nextRotation = normalizeDegrees((Number(product.rotationDegrees) || 0) + product.placement.rotationStepDegrees);
  const collision = findProductCollision({ ...product, rotationDegrees: nextRotation });
  if (collision) {
    product.collisionBlocked = collision;
    updateThreeModel(false);
    renderPreview();
    setStatus(productCollisionStatusMessage(collision));
    return false;
  }
  pushUndoSnapshot("rotate-product");
  product.rotationDegrees = nextRotation;
  product.collisionBlocked = null;
  renderPreview();
  updateSelectedComponentInfo();
  updateThreeModel(false);
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus("产品模型已旋转");
  return true;
}

function moveSelectedRailing(selection, point) {
  if (!selection) return;
  const railing = state.manualRailings.find((item) => item.id === selection.id);
  if (!railing) return;
  const dx = point.x - selection.start.x;
  const dy = point.y - selection.start.y;
  if (!selection.snapshotPushed && Math.hypot(dx, dy) > 1.5) {
    pushUndoSnapshot("move-railing");
    selection.snapshotPushed = true;
  }
  if (!selection.snapshotPushed) return;
  railing.x1 = selection.original.x1 + dx;
  railing.y1 = selection.original.y1 + dy;
  railing.x2 = selection.original.x2 + dx;
  railing.y2 = selection.original.y2 + dy;
  normalizeRailing(railing);
  selection.moved = true;
}

function deleteSelectedLine() {
  const line = selectedLine();
  if (!line) return false;
  pushUndoSnapshot("delete-line");
  state.lines = state.lines.filter((_, index) => index !== state.selectedLineIndex);
  state.selectedLineIndex = null;
  state.hoveredEndpoint = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length && !state.manualRailings.length;
  setStatus("墙体已删除");
  return true;
}

function materializeOpeningForEdit(selection) {
  if (selection.manualId) return selection.manualId;
  const original = selection.original;
  const key = openingKey(original);
  if (!state.hiddenOpeningKeys.includes(key)) state.hiddenOpeningKeys.push(key);
  const manual = {
    ...original,
    id: `manual-opening-${Date.now()}-${state.manualOpenings.length + 1}`,
    manual: true,
    sourceOpeningKey: key,
  };
  state.manualOpenings.push(manual);
  selection.manualId = manual.id;
  state.selectedOpeningId = manual.id;
  state.selectedOpeningIndex = null;
  return manual.id;
}

function materializeSelectedOpeningForEdit() {
  const opening = selectedOpening();
  if (!opening) return null;
  if (opening.manual) return state.manualOpenings.find((item) => item.id === opening.id) || opening;
  const key = openingKey(opening);
  if (!state.hiddenOpeningKeys.includes(key)) state.hiddenOpeningKeys.push(key);
  const manual = {
    ...opening,
    id: `manual-opening-${Date.now()}-${state.manualOpenings.length + 1}`,
    manual: true,
    sourceOpeningKey: key,
  };
  normalizeOpeningComponent(manual);
  state.manualOpenings.push(manual);
  state.selectedOpeningId = manual.id;
  state.selectedOpeningIndex = null;
  return manual;
}

function normalizeOpeningComponent(opening) {
  opening.variant = openingVariant(opening);
  syncOpeningKindFromVariant(opening);
  const profile = openingProfileMillimeters(opening);
  opening.sillHeightMillimeters = Math.round(profile.sill);
  opening.openingHeightMillimeters = Math.round(profile.height);
  opening.projectionMillimeters = Math.round(profile.projection);
  opening.width = distance({ x: opening.x1, y: opening.y1 }, { x: opening.x2, y: opening.y2 });
  opening.widthMm = round(pxToMillimeters(opening.width, getSettings()));
  return opening;
}

function moveSelectedOpening(selection, point) {
  if (!selection) return;
  const dx = point.x - selection.start.x;
  const dy = point.y - selection.start.y;
  if (!selection.snapshotPushed && Math.hypot(dx, dy) > 1.5) {
    pushUndoSnapshot("move-opening");
    selection.snapshotPushed = true;
    materializeOpeningForEdit(selection);
  }
  if (!selection.snapshotPushed) return;
  const opening = state.manualOpenings.find((item) => item.id === selection.manualId);
  if (!opening) return;
  opening.x1 = selection.original.x1 + dx;
  opening.y1 = selection.original.y1 + dy;
  opening.x2 = selection.original.x2 + dx;
  opening.y2 = selection.original.y2 + dy;
  normalizeOpeningComponent(opening);
  selection.moved = true;
  const visible = selectedOpening();
  if (visible && visible.id === opening.id) Object.assign(visible, opening);
}

function deleteSelectedOpening() {
  const opening = selectedOpening();
  if (!opening) return false;
  pushUndoSnapshot("delete-opening");
  if (opening.manual) {
    state.manualOpenings = state.manualOpenings.filter((item) => item.id !== opening.id);
  } else {
    const key = openingKey(opening);
    if (!state.hiddenOpeningKeys.includes(key)) state.hiddenOpeningKeys.push(key);
  }
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length && !state.manualRailings.length;
  setStatus("已删除构件");
  return true;
}

function deleteSelectedRailing() {
  const railing = selectedRailing();
  if (!railing) return false;
  pushUndoSnapshot("delete-railing");
  state.manualRailings = state.manualRailings.filter((item) => item.id !== railing.id);
  state.selectedRailingId = null;
  refreshAfterEdit();
  elements.exportJsonButton.disabled = !state.lines.length && !state.manualRailings.length;
  setStatus("栏杆已删除");
  return true;
}

function deleteSelectedProduct() {
  const product = selectedProduct();
  if (!product) return false;
  pushUndoSnapshot("delete-product");
  if (state.three.productsGroup && product.object) {
    state.three.productsGroup.remove(product.object);
    disposeThreeObject(product.object);
  }
  state.productModels = state.productModels.filter((item) => item.id !== product.id);
  removeLightSourcesForProduct(product.id);
  state.selectedProductId = null;
  renderPreview();
  updateSelectedComponentInfo();
  updateThreeModel(false);
  elements.exportJsonButton.disabled = !hasExportableContent();
  setStatus("产品模型已删除");
  return true;
}

function deleteSelectedComponent() {
  if (selectedProduct()) return deleteSelectedProduct();
  if (selectedRailing()) return deleteSelectedRailing();
  if (selectedOpening()) return deleteSelectedOpening();
  if (selectedLine()) return deleteSelectedLine();
  return false;
}

function selectedClipboardPayload() {
  const product = selectedProduct();
  if (product) return { type: "product", data: cloneProductMeta(product) };
  const railing = selectedRailing();
  if (railing) return { type: "railing", data: cloneRailing(railing) };
  const opening = selectedOpening();
  if (opening && isConstructibleOpening(opening)) return { type: "opening", data: cloneOpening(opening) };
  const line = selectedLine();
  if (line) return { type: "line", data: cloneLine(line) };
  return null;
}

function copySelectedComponent() {
  const payload = selectedClipboardPayload();
  if (!payload) {
    setStatus("没有选中可复制构件");
    return false;
  }
  state.clipboard = payload;
  setStatus("已复制构件");
  return true;
}

function pasteCopiedComponent() {
  if (!state.clipboard || !state.clipboard.data) {
    setStatus("剪贴板为空");
    return false;
  }
  if (!state.analysisCanvas && state.clipboard.type !== "product") {
    setStatus("请先上传或加载平面图");
    return false;
  }
  pushUndoSnapshot("paste-component");
  const pasted = createPastedComponent(state.clipboard);
  if (!pasted) {
    state.undoStack.pop();
    setStatus("无法粘贴构件");
    return false;
  }
  selectPastedComponent(pasted);
  refreshAfterPaste();
  setStatus("已粘贴构件");
  return true;
}

function createPastedComponent(payload) {
  const offset = pasteOffsetPixels();
  if (payload.type === "line") return pasteLine(payload.data, offset);
  if (payload.type === "opening") return pasteOpening(payload.data, offset);
  if (payload.type === "railing") return pasteRailing(payload.data, offset);
  if (payload.type === "product") return pasteProduct(payload.data, offset);
  return null;
}

function pasteOffsetPixels() {
  const settings = getSettings();
  return Math.max(18, millimetersToPixels(300, settings));
}

function offsetSegmentCopy(source, offset) {
  return {
    ...source,
    x1: source.x1 + offset,
    y1: source.y1 + offset,
    x2: source.x2 + offset,
    y2: source.y2 + offset,
  };
}

function pasteLine(source, offset) {
  const line = offsetSegmentCopy(source, offset);
  line.id = `wall-${Date.now()}-${state.lines.length + 1}`;
  normalizeEditedLine(line);
  line.thickness = Math.max(1, Number(line.thickness) || getSettings().maxThickness);
  state.lines.push(line);
  return { type: "line", index: state.lines.length - 1 };
}

function pasteOpening(source, offset) {
  const opening = offsetSegmentCopy(source, offset);
  opening.id = `manual-opening-${Date.now()}-${state.manualOpenings.length + 1}`;
  opening.manual = true;
  delete opening.sourceOpeningKey;
  normalizeOpeningComponent(opening);
  state.manualOpenings.push(opening);
  return { type: "opening", id: opening.id };
}

function pasteRailing(source, offset) {
  const railing = offsetSegmentCopy(source, offset);
  railing.id = `manual-railing-${Date.now()}-${state.manualRailings.length + 1}`;
  normalizeRailing(railing);
  state.manualRailings.push(railing);
  return { type: "railing", id: railing.id };
}

function pasteProduct(source, offset) {
  if (!state.analysisCanvas) {
    ensureDrawingCanvas();
  }
  normalizeProductMetadata(source);
  const product = {
    ...cloneProductMeta(source),
    id: `product-${Date.now()}-${state.productModels.length + 1}`,
    name: `${source.name || productCategoryLabel(source.category)} 副本`,
    planX: (Number(source.planX) || 0) + offset,
    planY: (Number(source.planY) || 0) + offset,
    object: null,
  };
  delete product.lightSourceId;
  if (state.analysisCanvas) {
    product.planX = clamp(product.planX, 0, state.analysisCanvas.width);
    product.planY = clamp(product.planY, 0, state.analysisCanvas.height);
  }
  const placement = findAvailableProductPlacement(product, { x: product.planX, y: product.planY });
  if (!placement) return null;
  product.planX = placement.x;
  product.planY = placement.y;
  state.productModels.push(product);
  return { type: "product", id: product.id };
}

function selectPastedComponent(pasted) {
  state.selectedLineIndex = null;
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = null;
  state.hoveredEndpoint = null;
  if (pasted.type === "line") state.selectedLineIndex = pasted.index;
  if (pasted.type === "opening") state.selectedOpeningId = pasted.id;
  if (pasted.type === "railing") state.selectedRailingId = pasted.id;
  if (pasted.type === "product") state.selectedProductId = pasted.id;
}

function refreshAfterPaste() {
  if (state.lines.length) {
    refreshAfterEdit({ skipSelected: true });
  } else {
    updateStats();
    renderPreview();
    updateThreeModel(false);
  }
  updateSelectedComponentInfo();
  elements.exportJsonButton.disabled = !hasExportableContent();
  elements.processButton.disabled = !state.analysisCanvas;
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

function refreshAfterEdit(options = {}) {
  const settings = getSettings();
  applyAutoCloseToLines(settings, options);
  state.topology = analyzeTopology(state.lines, settings);
  updateStats();
  renderPreview();
  updateThreeModel(false);
  setStatus("已编辑");
}

function applyAutoCloseToLines(settings = getSettings(), options = {}) {
  if (!state.lines.length) return false;
  const tolerance = Math.max(8, settings.mergeGap + settings.minWallThickness);
  const closed = autoCloseLineIntersections(state.lines, settings, tolerance, options);
  let changed = false;
  for (let index = 0; index < state.lines.length; index += 1) {
    const source = state.lines[index];
    const target = closed[index];
    if (!target) continue;
    for (const key of ["x1", "y1", "x2", "y2", "length"]) {
      if (source[key] !== target[key]) {
        source[key] = target[key];
        changed = true;
      }
    }
  }
  return changed;
}

function snapDraggedEndpointToNearbyWall(selection) {
  if (selection && selection.kind === "railing") {
    snapSelectedRailingEndpoint(selection);
    return;
  }
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

function snapSelectedRailingEndpoint(selection) {
  const railing = selectedRailing();
  if (!railing || !selection) return;
  const settings = getSettings();
  const tolerance = snapPointDistancePixels(settings);
  const point = lineEndpoint(railing, selection.end);
  const snapped = nearestRailingSnapPoint(point, railing, tolerance);
  if (!snapped) return;
  setLineEndpoint(railing, selection.end, snapped);
  normalizeRailing(railing);
}

function nearestRailingSnapPoint(point, sourceRailing, tolerance) {
  let best = null;
  const consider = (candidate, weight = 1) => {
    const score = distance(point, candidate) * weight;
    if (score > tolerance) return;
    if (!best || score < best.score) best = { point: candidate, score };
  };

  for (const wall of state.lines) {
    const projected = projectPointToAxisSegment(point, wall);
    if (projected) consider(projected, 0.88);
  }
  for (const railing of state.manualRailings) {
    if (railing.id === sourceRailing.id) continue;
    consider({ x: railing.x1, y: railing.y1 });
    consider({ x: railing.x2, y: railing.y2 });
    const projected = projectPointToAxisSegment(point, railing);
    if (projected) consider(projected, 0.92);
  }
  return best ? { x: Math.round(best.point.x), y: Math.round(best.point.y) } : null;
}

function projectPointToAxisSegment(point, segment) {
  if (segment.orientation === "horizontal") {
    const x = clamp(point.x, Math.min(segment.x1, segment.x2), Math.max(segment.x1, segment.x2));
    return { x, y: segment.y1 };
  }
  const y = clamp(point.y, Math.min(segment.y1, segment.y2), Math.max(segment.y1, segment.y2));
  return { x: segment.x1, y };
}

function handleCanvasPointerDown(event) {
  if (state.tool === "measure") {
    if (!ensureDrawingCanvas()) return;
    const point = canvasPointFromEvent(event);
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.hoveredEndpoint = null;
    if (!state.measurementLine) {
      state.measurementLine = { start: point, end: point };
      setStatus("选择测量终点");
    } else {
      state.measurementLine.end = point;
      addMeasurementFromDraft();
    }
    elements.previewCanvas.style.cursor = "crosshair";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "calibrate-scale") {
    if (!ensureDrawingCanvas()) return;
    const point = canvasPointFromEvent(event);
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.hoveredEndpoint = null;
    if (!state.calibrationLine) {
      state.calibrationLine = { start: point, end: point };
      setStatus("选择标定终点");
    } else {
      state.calibrationLine.end = point;
      applyCalibrationFromDraft();
    }
    elements.previewCanvas.style.cursor = "crosshair";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "draw-wall") {
    if (!ensureDrawingCanvas()) return;
    const point = canvasPointFromEvent(event);
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.hoveredEndpoint = null;
    if (!state.drawingLine) {
      state.drawingLine = { start: point, end: point };
      setStatus("选择终点");
    } else {
      state.drawingLine.end = point;
      addManualWallFromDraft();
    }
    elements.previewCanvas.style.cursor = "crosshair";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "draw-door" || state.tool === "draw-window") {
    if (!ensureDrawingCanvas()) return;
    const point = canvasPointFromEvent(event);
    const variant = state.tool === "draw-door" ? "door" : "window";
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.hoveredEndpoint = null;
    if (!state.openingDraft) {
      state.openingDraft = { start: point, end: point, variant };
      setStatus("选择构件终点");
    } else {
      state.openingDraft.end = point;
      state.openingDraft.variant = variant;
      addManualOpeningFromDraft();
    }
    elements.previewCanvas.style.cursor = "crosshair";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "draw-railing") {
    if (!ensureDrawingCanvas()) return;
    const point = canvasPointFromEvent(event);
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.hoveredEndpoint = null;
    if (!state.railingDraft) {
      state.railingDraft = { start: point, end: point };
      setStatus("选择栏杆终点");
    } else {
      state.railingDraft.end = point;
      addManualRailingFromDraft();
    }
    elements.previewCanvas.style.cursor = "crosshair";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (!hasExportableContent()) return;
  const point = canvasPointFromEvent(event);
  const productResizeHandle = findSelectedProductResizeHandle(point);
  if (productResizeHandle) {
    beginSelectedProductResizeDrag(productResizeHandle, point);
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = productResizeCursor(productResizeHandle);
    event.preventDefault();
    return;
  }

  const rotateProductId = findSelectedProductRotationHandle(point);
  if (rotateProductId) {
    rotateSelectedProductByStep();
    elements.previewCanvas.style.cursor = "grab";
    event.preventDefault();
    return;
  }

  const endpoint = findNearestSelectedEndpoint(point);
  if (endpoint) {
    pushUndoSnapshot("move-endpoint");
    state.draggedEndpoint = endpoint;
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = "grabbing";
    event.preventDefault();
    return;
  }

  const productId = findNearestProductId(point);
  if (productId !== null) {
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = null;
    state.selectedProductId = productId;
    state.hoveredEndpoint = null;
    beginSelectedProductDrag(productId, point);
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = "grabbing";
    renderPreview();
    updateSelectedComponentInfo();
    updateThreeModel(false);
    event.preventDefault();
    return;
  }

  const openingIndex = findNearestOpeningIndex(point);
  if (openingIndex !== null) {
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = openingIndex;
    state.selectedOpeningId = state.topology.openings[openingIndex] ? state.topology.openings[openingIndex].id : null;
    state.selectedProductId = null;
    state.hoveredEndpoint = null;
    beginSelectedOpeningDrag(openingIndex, point);
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = "grabbing";
    renderPreview();
    updateSelectedComponentInfo();
    updateThreeModel(false);
    event.preventDefault();
    return;
  }

  const railingId = findNearestRailingId(point);
  if (railingId !== null) {
    state.selectedLineIndex = null;
    state.selectedOpeningIndex = null;
    state.selectedOpeningId = null;
    state.selectedRailingId = railingId;
    state.selectedProductId = null;
    state.hoveredEndpoint = null;
    beginSelectedRailingDrag(railingId, point);
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = "grabbing";
    renderPreview();
    updateSelectedComponentInfo();
    updateThreeModel(false);
    event.preventDefault();
    return;
  }

  state.selectedLineIndex = findNearestLineIndex(point);
  state.selectedOpeningIndex = null;
  state.selectedOpeningId = null;
  state.selectedRailingId = null;
  state.selectedProductId = null;
  state.hoveredEndpoint = null;
  if (state.selectedLineIndex !== null) {
    beginSelectedLineDrag(state.selectedLineIndex, point);
    capturePreviewPointer(event);
    elements.previewCanvas.style.cursor = "grabbing";
    event.preventDefault();
  } else {
    state.draggedLine = null;
    elements.previewCanvas.style.cursor = "default";
  }
  renderPreview();
  updateSelectedComponentInfo();
  updateThreeModel(false);
}

function handleCanvasPointerMove(event) {
  if (state.tool === "measure" && state.measurementLine) {
    state.measurementLine.end = canvasPointFromEvent(event);
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "calibrate-scale" && state.calibrationLine) {
    state.calibrationLine.end = canvasPointFromEvent(event);
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "draw-wall" && state.drawingLine) {
    state.drawingLine.end = canvasPointFromEvent(event);
    renderPreview();
    event.preventDefault();
    return;
  }

  if ((state.tool === "draw-door" || state.tool === "draw-window") && state.openingDraft) {
    state.openingDraft.end = canvasPointFromEvent(event);
    state.openingDraft.variant = state.tool === "draw-door" ? "door" : "window";
    renderPreview();
    event.preventDefault();
    return;
  }

  if (state.tool === "draw-railing" && state.railingDraft) {
    state.railingDraft.end = canvasPointFromEvent(event);
    renderPreview();
    event.preventDefault();
    return;
  }

  if (!hasExportableContent()) return;
  const point = canvasPointFromEvent(event);

  if (state.draggedEndpoint) {
    moveSelectedEndpoint(state.draggedEndpoint, point);
    state.topology = analyzeTopology(state.lines, getSettings());
    updateStats();
    renderPreview();
    updateThreeModel(false);
    event.preventDefault();
    return;
  }

  if (state.draggedLine) {
    moveSelectedLine(state.draggedLine, point);
    if (state.draggedLine.snapshotPushed) {
      state.topology = analyzeTopology(state.lines, getSettings());
      updateStats();
      renderPreview();
      updateThreeModel(false);
    }
    event.preventDefault();
    return;
  }

  if (state.draggedOpening) {
    moveSelectedOpening(state.draggedOpening, point);
    if (state.draggedOpening.snapshotPushed) {
      updateStats();
      renderPreview();
      updateThreeModel(false);
    }
    event.preventDefault();
    return;
  }

  if (state.draggedRailing) {
    moveSelectedRailing(state.draggedRailing, point);
    if (state.draggedRailing.snapshotPushed) {
      updateStats();
      renderPreview();
      updateThreeModel(false);
    }
    event.preventDefault();
    return;
  }

  if (state.draggedProduct) {
    moveSelectedProduct(state.draggedProduct, point);
    if (state.draggedProduct.snapshotPushed) {
      renderPreview();
      updateSelectedComponentInfo();
      updateThreeModel(false);
    }
    event.preventDefault();
    return;
  }

  if (state.draggedProductResize) {
    resizeSelectedProduct(state.draggedProductResize, point);
    if (state.draggedProductResize.snapshotPushed) {
      renderPreview();
      updateSelectedComponentInfo();
      updateThreeModel(false);
    }
    event.preventDefault();
    return;
  }

  state.hoveredEndpoint = findNearestSelectedEndpoint(point);
  const productResizeHandle = findSelectedProductResizeHandle(point);
  if (productResizeHandle) {
    elements.previewCanvas.style.cursor = productResizeCursor(productResizeHandle);
  } else if (findSelectedProductRotationHandle(point)) {
    elements.previewCanvas.style.cursor = "grab";
  } else if (state.hoveredEndpoint) {
    elements.previewCanvas.style.cursor = "grab";
  } else {
    elements.previewCanvas.style.cursor = findNearestProductId(point) === null && findNearestOpeningIndex(point) === null && findNearestRailingId(point) === null && findNearestLineIndex(point) === null ? "default" : "pointer";
  }
  renderPreview();
}

function handleCanvasPointerUp(event) {
  if (!state.draggedEndpoint && !state.draggedLine && !state.draggedOpening && !state.draggedRailing && !state.draggedProduct && !state.draggedProductResize) return;
  const hadEndpointDrag = Boolean(state.draggedEndpoint);
  const hadLineMove = Boolean(state.draggedLine && state.draggedLine.moved);
  const hadOpeningMove = Boolean(state.draggedOpening && state.draggedOpening.moved);
  const hadRailingMove = Boolean(state.draggedRailing && state.draggedRailing.moved);
  const hadProductMove = Boolean(state.draggedProduct && state.draggedProduct.moved);
  const hadProductResize = Boolean(state.draggedProductResize && state.draggedProductResize.moved);
  const blockedProductCollision = state.draggedProduct?.blocked || state.draggedProductResize?.blocked || null;
  const draggedProductId = state.draggedProduct?.id || state.draggedProductResize?.id || null;
  const draggedProduct = draggedProductId ? state.productModels.find((item) => item.id === draggedProductId) : null;
  if (draggedProduct) draggedProduct.collisionBlocked = null;
  if (state.draggedEndpoint) snapDraggedEndpointToNearbyWall(state.draggedEndpoint);
  if (state.draggedRailing && state.draggedRailing.moved) {
    const railing = state.manualRailings.find((item) => item.id === state.draggedRailing.id);
    if (railing) snapRailingToNearbyGeometry(railing);
  }
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.draggedProduct = null;
  state.draggedProductResize = null;
  state.hoveredEndpoint = null;
  releasePreviewPointer(event);
  elements.previewCanvas.style.cursor = state.selectedLineIndex === null && !state.selectedRailingId && !state.selectedProductId ? "default" : "pointer";
  if (hadEndpointDrag || hadLineMove || hadOpeningMove || hadRailingMove) refreshAfterEdit();
  else if (hadProductMove || hadProductResize) {
    renderPreview();
    updateSelectedComponentInfo();
    updateThreeModel(false);
  }
  else {
    renderPreview();
    updateSelectedComponentInfo();
    updateThreeModel(false);
  }
  if (blockedProductCollision) setStatus(productCollisionStatusMessage(blockedProductCollision));
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
  const settings = getSettings();
  const millimetersPerPixel = getMillimetersPerPixel(settings);
  const payload = {
    source: state.sourceName,
    scale: {
      millimetersPerPixel,
      outerWallThicknessMillimeters: { min: OUTER_WALL_MIN_MM, max: OUTER_WALL_MAX_MM },
      source: state.manualMillimetersPerPixel ? "manual-calibration" : "outer-wall-default",
      reference: state.manualMillimetersPerPixel
        ? `manual calibration ${millimetersPerPixel.toFixed(4)}mm/px`
        : `maxThickness ${settings.maxThickness}px = ${OUTER_WALL_MAX_MM}mm`,
    },
    walls: state.lines,
    wallsMillimeters: state.lines.map((line) => ({
      id: line.id,
      orientation: line.orientation,
      x1: round(pxToMillimeters(line.x1, settings)),
      y1: round(pxToMillimeters(line.y1, settings)),
      x2: round(pxToMillimeters(line.x2, settings)),
      y2: round(pxToMillimeters(line.y2, settings)),
      thickness: round(physicalWallThicknessMillimeters(line.thickness, settings)),
      length: round(pxToMillimeters(line.length, settings)),
      height: round(lineHeightMillimeters(line)),
    })),
    measurements: state.measurements.map((measurement) => ({
      id: measurement.id,
      x1: round(measurement.start.x),
      y1: round(measurement.start.y),
      x2: round(measurement.end.x),
      y2: round(measurement.end.y),
      pixelLength: round(distance(measurement.start, measurement.end)),
      millimeterLength: round(pxToMillimeters(distance(measurement.start, measurement.end), settings)),
    })),
    openingOverrides: {
      manualOpenings: state.manualOpenings.map(cloneOpening),
      hiddenOpeningKeys: [...state.hiddenOpeningKeys],
    },
    railings: state.manualRailings.map(cloneRailing),
    products: state.productModels.map(cloneProductMeta),
    lightSources: state.lightSources.map(cloneLightSource),
    topology: state.topology,
    settings,
  };
  downloadJson(payload, `${state.sourceName}-walls.json`);
}

function createProjectArchive() {
  if (!state.analysisCanvas) {
    setStatus("没有可保存项目");
    return null;
  }
  return {
    version: 3,
    type: "floor-plan-generation-project",
    savedAt: new Date().toISOString(),
    sourceName: state.sourceName,
    image: state.analysisCanvas.toDataURL("image/png"),
    view: state.view,
    recognitionMode: state.recognitionMode,
    selectedLineIndex: state.selectedLineIndex,
    selectedOpeningIndex: state.selectedOpeningIndex,
    selectedOpeningId: state.selectedOpeningId,
    selectedRailingId: state.selectedRailingId,
    selectedProductId: state.selectedProductId,
    selectedLightSourceId: state.selectedLightSourceId,
    manualMillimetersPerPixel: state.manualMillimetersPerPixel,
    calibrationLengthMillimeters: getCalibrationLengthMillimeters(),
    settings: getSettings(),
    lines: state.lines.map(cloneLine),
    measurements: state.measurements.map(cloneMeasurement),
    manualOpenings: state.manualOpenings.map(cloneOpening),
    manualRailings: state.manualRailings.map(cloneRailing),
    products: state.productModels.map(cloneProductMeta),
    lightSources: state.lightSources.map(cloneLightSource),
    interiorCatalogSources: [...state.interiorCatalogSources],
    hiddenOpeningKeys: [...state.hiddenOpeningKeys],
  };
}

async function saveProjectArchive() {
  const payload = createProjectArchive();
  if (!payload) return;
  const fileName = `${state.sourceName || "floor-plan"}-project.floorplan.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });

  if (state.projectFileHandle) {
    try {
      await writeProjectBlobToHandle(state.projectFileHandle, blob);
      setStatus("项目已保存到原文件");
      return;
    } catch (error) {
      console.warn(error);
      state.projectFileHandle = null;
      setStatus("原文件不可写，请重新选择保存路径");
    }
  }

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "建筑平面项目", accept: { "application/json": [".json"] } }],
      });
      await writeProjectBlobToHandle(handle, blob);
      state.projectFileHandle = handle;
      setStatus("项目已保存");
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn(error);
    }
  }

  downloadBlob(blob, fileName);
  setStatus("项目已下载");
}

async function writeProjectBlobToHandle(handle, blob) {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function openProjectArchive() {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "建筑平面项目", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      await loadProjectArchiveFromFile(file, handle);
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn(error);
    }
  }
  elements.projectFileInput.click();
}

async function loadProjectArchiveFromFile(file, handle = null) {
  try {
    setStatus("打开项目中");
    const archive = JSON.parse(await file.text());
    await restoreProjectArchive(archive);
    state.projectFileHandle = handle;
  } catch (error) {
    console.error(error);
    setStatus("项目打开失败");
  } finally {
    elements.projectFileInput.value = "";
  }
}

async function restoreProjectArchive(archive) {
  if (!archive || archive.type !== "floor-plan-generation-project" || !archive.image) {
    throw new Error("项目文件格式不正确");
  }

  const image = await loadImage(archive.image);
  await ensureInteriorCatalogReady();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  canvas.getContext("2d").drawImage(image, 0, 0);

  state.analysisCanvas = canvas;
  state.maskImage = null;
  state.lines = Array.isArray(archive.lines) ? archive.lines.map((line, index) => ({ ...line, id: line.id || `wall-${index + 1}` })) : [];
  state.measurements = Array.isArray(archive.measurements) ? archive.measurements.map(cloneMeasurement) : [];
  state.manualOpenings = Array.isArray(archive.manualOpenings) ? archive.manualOpenings.map(cloneOpening) : [];
  state.manualRailings = Array.isArray(archive.manualRailings) ? archive.manualRailings.map(cloneRailing).map(normalizeRailing) : [];
  clearProductModels();
  state.productModels = Array.isArray(archive.products) ? archive.products.map((product) => normalizeProductMetadata({ ...product, object: null })) : [];
  clearLightSources();
  state.lightSources = Array.isArray(archive.lightSources) ? archive.lightSources.map(normalizeLightSource) : [];
  state.hiddenOpeningKeys = Array.isArray(archive.hiddenOpeningKeys) ? [...archive.hiddenOpeningKeys] : [];
  state.selectedLineIndex = Number.isInteger(archive.selectedLineIndex) ? archive.selectedLineIndex : null;
  if (state.selectedLineIndex !== null && !state.lines[state.selectedLineIndex]) state.selectedLineIndex = null;
  state.selectedOpeningIndex = Number.isInteger(archive.selectedOpeningIndex) ? archive.selectedOpeningIndex : null;
  state.selectedOpeningId = archive.selectedOpeningId || null;
  state.selectedRailingId = archive.selectedRailingId || null;
  if (state.selectedRailingId && !state.manualRailings.some((railing) => railing.id === state.selectedRailingId)) state.selectedRailingId = null;
  state.selectedProductId = archive.selectedProductId || null;
  if (state.selectedProductId && !state.productModels.some((product) => product.id === state.selectedProductId)) state.selectedProductId = null;
  state.selectedLightSourceId = archive.selectedLightSourceId || null;
  if (state.selectedLightSourceId && !state.lightSources.some((source) => source.id === state.selectedLightSourceId)) state.selectedLightSourceId = null;
  state.draggedEndpoint = null;
  state.draggedLine = null;
  state.draggedOpening = null;
  state.draggedRailing = null;
  state.hoveredEndpoint = null;
  state.drawingLine = null;
  state.openingDraft = null;
  state.railingDraft = null;
  state.calibrationLine = null;
  state.measurementLine = null;
  state.manualMillimetersPerPixel = Number(archive.manualMillimetersPerPixel) || null;
  state.undoStack = [];
  state.removedPixels = 0;
  state.recognitionMode = archive.recognitionMode || "project";
  state.deepLearningInfo = null;
  state.sourceName = archive.sourceName || "floor-plan-project";

  applySettings(archive.settings || {});
  if (archive.calibrationLengthMillimeters) elements.calibrationLengthInput.value = String(Math.round(archive.calibrationLengthMillimeters));
  fitCanvasToImage(state.analysisCanvas);
  elements.emptyState.hidden = true;
  elements.imageStat.textContent = `${state.analysisCanvas.width} x ${state.analysisCanvas.height}`;
  state.topology = analyzeTopology(state.lines, getSettings());
  setView(archive.view === "vector" ? "vector" : "overlay");
  syncControlLabels();
  updateStats();
  renderPreview();
  await restoreStoredProductModelObjects();
  updateThreeModel(true);
  elements.processButton.disabled = false;
  elements.saveProjectButton.disabled = false;
  elements.exportJsonButton.disabled = !state.lines.length;
  setStatus("项目已打开");
}

function applySettings(settings) {
  setControlValue(elements.thresholdRange, settings.threshold);
  setControlValue(elements.minLengthRange, settings.minLength);
  setControlValue(elements.mergeGapRange, settings.mergeGap);
  setControlValue(elements.maxThicknessRange, settings.maxThickness);
  setControlValue(elements.minNoiseAreaRange, settings.minNoiseArea);
  setControlValue(elements.minWallThicknessRange, settings.minWallThickness);
  setControlValue(elements.openingMinWidthRange, settings.openingMinWidth);
  setControlValue(elements.openingMaxWidthRange, settings.openingMaxWidth);
  if (typeof settings.denoiseEnabled === "boolean") elements.denoiseToggle.checked = settings.denoiseEnabled;
  if (settings.recognitionMode && [...elements.recognitionModeSelect.options].some((option) => option.value === settings.recognitionMode)) {
    elements.recognitionModeSelect.value = settings.recognitionMode;
  }
}

function setControlValue(element, value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return;
  element.value = String(value);
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function bindComponentParameterInputs(prefix) {
  const card = componentElements(prefix);
  if (prefix === "selected") {
    card.card.addEventListener("pointerdown", beginSelectedCardDrag);
    card.card.addEventListener("pointermove", moveSelectedCard);
    card.card.addEventListener("pointerup", endSelectedCardDrag);
    card.card.addEventListener("pointercancel", endSelectedCardDrag);
  } else {
    card.card.addEventListener("pointerdown", (event) => event.stopPropagation());
  }
  card.card.addEventListener("click", (event) => event.stopPropagation());
  card.card.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
  card.variantSelect.addEventListener("change", () => commitSelectedOpeningVariant(prefix));
  card.variantSelect.addEventListener("pointerdown", (event) => event.stopPropagation());
  card.variantSelect.addEventListener("click", (event) => event.stopPropagation());
  const bindings = [
    ["length", card.lengthInput],
    ["thickness", card.thicknessInput],
    ["height", card.heightInput],
  ];
  for (const [parameter, input] of bindings) {
    input.addEventListener("change", () => commitSelectedComponentParameter(parameter, prefix));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      } else if (event.key === "Escape") {
        event.preventDefault();
        updateSelectedComponentInfo();
        input.blur();
      }
      event.stopPropagation();
    });
    input.addEventListener("pointerdown", (event) => event.stopPropagation());
    input.addEventListener("click", (event) => event.stopPropagation());
  }
}

function openImagePicker() {
  elements.fileInput.click();
}

function isEditableTarget(target) {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

function handleDocumentKeyDown(event) {
  if (!elements.lightingModal.hidden && event.key === "Escape") {
    event.preventDefault();
    closeLightingEditor();
    setStatus("已关闭灯光管理");
    return;
  }
  if (!elements.threeRenderModal.hidden && event.key === "Escape") {
    event.preventDefault();
    closeThreeRenderPreview();
    setStatus("已退出渲染预览");
    return;
  }
  if (state.three.mode === "roam" && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !isEditableTarget(event.target)) {
    handleThreeKeyDown(event);
    if (event.defaultPrevented) return;
  }
  if ((event.ctrlKey || event.metaKey) && !isEditableTarget(event.target) && event.key.toLowerCase() === "c") {
    if (copySelectedComponent()) event.preventDefault();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && !isEditableTarget(event.target) && event.key.toLowerCase() === "v") {
    if (pasteCopiedComponent()) event.preventDefault();
    return;
  }
  if ((event.key === "Delete" || event.key === "Backspace") && deleteSelectedComponent()) {
    event.preventDefault();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (!state.analysisCanvas) {
      setStatus("没有可保存项目");
      return;
    }
    saveProjectArchive();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (state.drawingLine) {
      state.drawingLine = null;
      renderPreview();
      setStatus("已取消画线");
      return;
    }
    if (state.openingDraft) {
      state.openingDraft = null;
      renderPreview();
      setStatus("已取消构件绘制");
      return;
    }
    if (state.railingDraft) {
      state.railingDraft = null;
      renderPreview();
      setStatus("已取消栏杆绘制");
      return;
    }
    if (state.calibrationLine) {
      state.calibrationLine = null;
      renderPreview();
      setStatus("已取消标定");
      return;
    }
    if (state.measurementLine) {
      state.measurementLine = null;
      renderPreview();
      setStatus("已取消测量");
      return;
    }
    undoLastEdit();
  }
}

function isBeginnerMode() {
  return document.body.classList.contains("mode-beginner");
}

function setExperienceMode(mode) {
  const nextMode = mode === "beginner" || mode === "advanced" ? mode : "launch";
  document.body.classList.toggle("mode-launch", nextMode === "launch");
  document.body.classList.toggle("mode-beginner", nextMode === "beginner");
  document.body.classList.toggle("mode-advanced", nextMode === "advanced");
  updateBeginnerSummary();
  updateBeginnerPhonePreview();

  if (nextMode === "beginner") {
    window.setTimeout(() => {
      resizeThreeViewer();
      if (state.analysisCanvas) renderPreview();
      beginnerUi.chatInput?.focus({ preventScroll: true });
    }, 0);
    return;
  }

  if (nextMode === "advanced") {
    window.setTimeout(() => {
      resizeThreeViewer();
      if (state.analysisCanvas) renderPreview();
    }, 0);
  }
}

function recognitionModeLabel() {
  const selected = elements.recognitionModeSelect.value;
  if (state.deepLearningInfo) {
    const provider = floorPlanAiProviderLabel(state.deepLearningInfo.provider || FLOOR_PLAN_AI_PROVIDER);
    const model = state.deepLearningInfo.model ? ` · ${state.deepLearningInfo.model}` : "";
    return state.deepLearningInfo.active ? `${provider}${model}` : `${provider} fallback`;
  }
  if (state.recognitionMode === "deep-learning" || selected === "deep-learning") return floorPlanAiProviderLabel();
  if (state.recognitionMode === "opencv-fallback") return "AI/CV 后端";
  if (state.recognitionMode === "browser-rules" || selected === "browser") return "普通识别";
  if (selected === "ai-cv") return "AI/CV 识别";
  if (state.recognitionMode === "manual") return "手动画图";
  if (state.recognitionMode === "project") return "项目文件";
  return state.recognitionMode === "-" ? "普通识别" : state.recognitionMode;
}

function updateBeginnerSummary() {
  if (!beginnerUi.chatStatusText) return;
  const openingCount = state.topology ? constructibleOpenings().length : 0;
  beginnerUi.chatStatusText.textContent = elements.statusPill.textContent || "待上传";
  beginnerUi.chatImageText.textContent = state.analysisCanvas ? `${state.analysisCanvas.width} x ${state.analysisCanvas.height}` : "还没有图纸";
  beginnerUi.chatWallText.textContent = `${state.lines.length} 条墙线`;
  beginnerUi.chatRoomText.textContent = `${state.topology.rooms.length} 个房间`;
  beginnerUi.chatOpeningText.textContent = `${openingCount} 个`;
  beginnerUi.chatModeText.textContent = recognitionModeLabel();
  if (beginnerUi.chatRegenerateButton) beginnerUi.chatRegenerateButton.disabled = !state.analysisCanvas;
  if (beginnerUi.chatExportButton) beginnerUi.chatExportButton.disabled = !hasExportableContent();
}

function addChatMessage(role, text) {
  if (!beginnerUi.chatMessages) return;
  const message = document.createElement("article");
  message.className = `chat-message ${role}`;
  const label = document.createElement("span");
  label.textContent = role === "user" ? "你" : "助手";
  const body = document.createElement("p");
  body.textContent = text;
  message.append(label, body);
  beginnerUi.chatMessages.appendChild(message);
  beginnerUi.chatMessages.scrollTop = beginnerUi.chatMessages.scrollHeight;
}

function addAssistantMessage(text) {
  if (isBeginnerMode()) addChatMessage("assistant", text);
}

function addAssistantActionMessage(text, actionLabel, actionHandler) {
  if (!isBeginnerMode() || !beginnerUi.chatMessages) return;
  const message = document.createElement("article");
  message.className = "chat-message assistant action";
  const label = document.createElement("span");
  label.textContent = "助手";
  const body = document.createElement("p");
  body.textContent = text;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = actionLabel;
  button.addEventListener("click", actionHandler);
  message.append(label, body, button);
  beginnerUi.chatMessages.appendChild(message);
  beginnerUi.chatMessages.scrollTop = beginnerUi.chatMessages.scrollHeight;
}

function addVoiceUploadFallbackMessage(text) {
  addAssistantActionMessage(text, "选择平面图", openImagePicker);
}

function requestImageUploadFromVoice() {
  addAssistantMessage("好的，请选择一张 PNG、JPG、WebP 或 SVG 平面图。选完后我会自动开始识别。");
  const attemptId = state.beginnerVoice.uploadAttemptId + 1;
  state.beginnerVoice.uploadAttemptId = attemptId;
  window.clearTimeout(state.beginnerVoice.uploadFallbackTimer);

  let pickerProbablyOpened = false;
  const markPickerOpened = () => {
    pickerProbablyOpened = true;
  };
  window.addEventListener("blur", markPickerOpened, { once: true });

  try {
    openImagePicker();
  } catch (error) {
    window.removeEventListener("blur", markPickerOpened);
    addVoiceUploadFallbackMessage("浏览器没有允许语音直接打开文件选择窗口，请点下面按钮选择平面图。");
    return;
  }

  state.beginnerVoice.uploadFallbackTimer = window.setTimeout(() => {
    window.removeEventListener("blur", markPickerOpened);
    if (attemptId !== state.beginnerVoice.uploadAttemptId || pickerProbablyOpened || !isBeginnerMode()) return;
    addVoiceUploadFallbackMessage("如果文件选择窗口没有弹出，请点下面按钮选择平面图。");
  }, 900);
}

function announceBeginnerImageLoaded(fileName) {
  if (!isBeginnerMode()) return;
  addChatMessage(
    "assistant",
    `我已经读到「${fileName}」了。接下来会自动识别墙线；你先看右侧预览，如果墙线太多或太少，可以让我切换 AI/CV 识别或普通识别。`
  );
}

function announceBeginnerRecognition() {
  if (!isBeginnerMode()) return;
  const openingCount = constructibleOpenings().length;
  const resultKey = `${state.sourceName}|${state.recognitionMode}|${state.lines.length}|${state.topology.rooms.length}|${openingCount}`;
  if (state.beginnerLastResultKey === resultKey) return;
  state.beginnerLastResultKey = resultKey;

  if (!state.lines.length) {
    addChatMessage(
      "assistant",
      "这次没有识别到明显墙线。你可以试试 AI/CV 识别；如果原图线条很浅，建议换一张更清晰的平面图，或者进详细界面调低墙体阈值。"
    );
    return;
  }

  addChatMessage(
    "assistant",
    `生成完成：我找到了 ${state.lines.length} 条墙线、${openingCount} 个门窗洞口、${state.topology.rooms.length} 个闭合房间。现在建议先检查右侧叠加图：墙体位置对的话就可以导出 JSON；如果有缺墙，可以让我进入画墙或门窗模式补一下。`
  );
}

function setBeginnerRecognitionMode(mode) {
  elements.recognitionModeSelect.value = mode;
  syncControlLabels();
  if (mode === "deep-learning") {
    addAssistantMessage(`我已切到智能读图 / 深度学习识别。它会请求 /api/floorplan/recognize，并优先使用 ${floorPlanAiProviderLabel()} 模型。`);
  } else if (mode === "ai-cv") {
    addAssistantMessage("我已切到 AI/CV 识别。它会请求同一个后端接口 `/api/segment`，适合线条复杂、噪点多的图。");
  } else {
    addAssistantMessage("我已切到普通识别。它直接在浏览器里按线条规则处理，速度快，适合清晰的黑白平面图。");
  }
  if (state.analysisCanvas) runRecognition();
}

function runBeginnerCommand(input, source = "text") {
  const text = input.trim().toLowerCase();
  if (!text) return;

  if (/返回选择|回到选择|选择入口|切换入口|重新选择/.test(text)) {
    addAssistantMessage("好的，我带你回到入口选择页。当前图纸和识别结果还保留在页面状态里。");
    setExperienceMode("launch");
    return;
  }

  if (/详细|专业|参数/.test(text)) {
    addAssistantMessage("好的，我切到详细界面。你的图纸和识别结果不会丢。");
    setExperienceMode("advanced");
    return;
  }

  if (/帮助|能做什么|怎么用|指令/.test(text)) {
    addAssistantMessage("你可以直接说：帮我上传图纸、加载样例、用 AI/CV 识别、普通识别、重新生成、导出 JSON、保存项目、打开项目、画墙、画门、画窗、测量、标定比例、线框模式、叠加模式、重置视角、进入详细界面。");
    return;
  }

  if (/关闭语音|停止语音|退出语音|关掉语音|静音/.test(text)) {
    setBeginnerVoiceEnabled(false, true);
    return;
  }

  if (/开启语音|打开语音|语音输入|麦克风|说话模式/.test(text)) {
    setBeginnerVoiceEnabled(true, true);
    return;
  }

  if (/3d|三维|模型画面|立体/.test(text)) {
    setBeginnerPhonePreviewMode("three");
    addAssistantMessage("已把手机屏幕切到 3D 画面。你也可以说“漫游”进入第一人称查看。");
    return;
  }

  if (/深度学习|智能读图|cubicasa|户型识别|语义识别/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setBeginnerRecognitionMode("deep-learning");
    return;
  }

  if (/ai|cv|智能|模型|后端|精细/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setBeginnerRecognitionMode("ai-cv");
    return;
  }

  if (/普通|浏览器|规则|快速/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setBeginnerRecognitionMode("browser");
    return;
  }

  if (/样例|示例|demo|试试/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    addAssistantMessage("好的，我先加载内置样例。加载后会自动生成，你可以用它熟悉流程。");
    loadDemoPlan();
    return;
  }

  if (/上传|导入|图片|图纸|平面图|户型/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    if (source === "voice") {
      requestImageUploadFromVoice();
      return;
    }
    addAssistantMessage("好的，请选择一张 PNG、JPG、WebP 或 SVG 平面图。选完后我会自动开始识别。");
    openImagePicker();
    return;
  }

  if (/重新|再生成|重跑|识别/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    if (!state.analysisCanvas) {
      addAssistantMessage("还没有图纸。先上传一张平面图，或者加载样例，我再帮你重新生成。");
      return;
    }
    addAssistantMessage("我会用当前识别方式重新生成一次。你稍后看右侧叠加图和下方 3D 模型。");
    runRecognition();
    return;
  }

  if (/导出|json|结果/.test(text)) {
    if (!hasExportableContent()) {
      addAssistantMessage("现在还没有可导出的墙线或构件。先上传图纸并生成结果，再导出 JSON。");
      return;
    }
    addAssistantMessage("我正在导出 JSON。这个文件会包含墙线、交点、门窗洞口、房间和当前参数。");
    exportJson();
    return;
  }

  if (/打开/.test(text)) {
    addAssistantMessage("请选择之前保存的项目 JSON。打开后，右侧会恢复原图、墙线和 3D 内容。");
    openProjectArchive();
    return;
  }

  if (/保存|存档|项目/.test(text)) {
    if (!state.analysisCanvas) {
      addAssistantMessage("现在还没有项目内容。先上传图纸或打开已有项目，再保存。");
      return;
    }
    addAssistantMessage("我会保存项目文件，里面包含原图、识别结果、手动修改和当前参数。");
    saveProjectArchive();
    return;
  }

  if (/画墙|补墙|加墙/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setTool("draw-wall");
    addAssistantMessage("已进入画墙模式。请在右侧图纸上点一下作为起点，再点一下作为终点；适合补识别漏掉的墙。");
    return;
  }

  if (/门/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setTool("draw-door");
    addAssistantMessage("已进入画门模式。请在右侧墙线上点门洞的起点和终点；门会和墙体一起参与导出。");
    return;
  }

  if (/窗/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setTool("draw-window");
    addAssistantMessage("已进入画窗模式。请在右侧墙线上点窗洞两端；选中窗以后还能改成高窗、落地窗或飘窗。");
    return;
  }

  if (/测量|量尺|尺寸/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setTool("measure");
    addAssistantMessage("已进入测量模式。请在右侧图纸上点两个位置，我会按当前比例给出尺寸。");
    return;
  }

  if (/标定|比例/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    const metricMatch = text.match(/(\d+(?:\.\d+)?)\s*(米|m|毫米|mm)?/i);
    if (metricMatch) {
      const unit = metricMatch[2] || "mm";
      const value = Number(metricMatch[1]);
      const millimeters = /米|m/i.test(unit) ? value * 1000 : value;
      if (millimeters >= 100) elements.calibrationLengthInput.value = String(Math.round(millimeters));
    }
    setTool("calibrate-scale");
    addAssistantMessage(`已进入比例标定。请在右侧图纸上点一段已知长度的两个端点；我会按 ${elements.calibrationLengthInput.value} mm 来换算。你也可以输入“按 3 米标定比例”来改长度。`);
    return;
  }

  if (/线框|只看线/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setView("vector");
    addAssistantMessage("已切到线框模式。现在右侧主要显示识别出的墙体中心线和构件关系。");
    return;
  }

  if (/叠加|原图|覆盖/.test(text)) {
    setBeginnerPhonePreviewMode("plan");
    setView("overlay");
    addAssistantMessage("已切到叠加模式。现在可以对照原图检查墙线是否贴合。");
    return;
  }

  if (/重置视角|恢复视角|视角重置/.test(text)) {
    setBeginnerPhonePreviewMode("three");
    resetThreeCamera();
    addAssistantMessage("3D 视角已重置。");
    return;
  }

  if (/退出漫游|俯视/.test(text)) {
    setBeginnerPhonePreviewMode("three");
    setThreeMode("orbit");
    addAssistantMessage("已回到 3D 俯视模式。");
    return;
  }

  if (/漫游|走进|第一人称/.test(text)) {
    setBeginnerPhonePreviewMode("three");
    setThreeMode("roam");
    addAssistantMessage("已进入 3D 漫游模式。你可以用键盘方向键或 WASD 在模型里移动。");
    return;
  }

  addAssistantMessage("我可以帮你做这些事：上传图纸、加载样例、切换 AI/CV 或普通识别、重新生成、导出 JSON、保存项目、打开项目、画墙、画门窗、测量、标定比例、线框模式、叠加模式、重置视角、进入详细界面、返回选择页。");
}

function submitBeginnerChatValue(value, source = "text") {
  if (!beginnerUi.chatInput) return;
  const command = value.trim();
  if (!command) return;
  addChatMessage("user", command);
  beginnerUi.chatInput.value = "";
  runBeginnerCommand(command, source);
}

function voiceRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function updateBeginnerVoiceUi() {
  const button = beginnerUi.voiceToggleButton;
  if (!button) return;
  button.classList.toggle("is-enabled", state.beginnerVoice.enabled);
  button.classList.toggle("is-listening", state.beginnerVoice.listening);
  button.setAttribute("aria-pressed", state.beginnerVoice.enabled ? "true" : "false");
  button.textContent = state.beginnerVoice.listening ? "听写中" : "语音";
}

function ensureBeginnerVoiceRecognition() {
  if (state.beginnerVoice.recognition) return state.beginnerVoice.recognition;
  const SpeechRecognition = voiceRecognitionConstructor();
  if (!SpeechRecognition) return null;
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => {
    state.beginnerVoice.listening = true;
    updateBeginnerVoiceUi();
  };
  recognition.onend = () => {
    state.beginnerVoice.listening = false;
    updateBeginnerVoiceUi();
    if (!state.beginnerVoice.enabled) return;
    window.clearTimeout(state.beginnerVoice.restartTimer);
    state.beginnerVoice.restartTimer = window.setTimeout(() => startBeginnerVoiceRecognition(false), 220);
  };
  recognition.onerror = (event) => {
    state.beginnerVoice.listening = false;
    state.beginnerVoice.lastError = event.error || "unknown";
    window.clearTimeout(state.beginnerVoice.restartTimer);
    updateBeginnerVoiceUi();
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      state.beginnerVoice.enabled = false;
      updateBeginnerVoiceUi();
      addVoiceUploadFallbackMessage("浏览器没有麦克风权限，语音输入已关闭。需要上传图纸时，可以点下面按钮选择文件。");
    } else if (event.error === "audio-capture") {
      state.beginnerVoice.enabled = false;
      updateBeginnerVoiceUi();
      addVoiceUploadFallbackMessage("没有检测到可用麦克风，语音输入已关闭。需要上传图纸时，可以点下面按钮选择文件。");
    } else if (event.error === "network") {
      state.beginnerVoice.enabled = false;
      updateBeginnerVoiceUi();
      addVoiceUploadFallbackMessage("浏览器语音识别服务连接失败，语音输入已关闭。需要上传图纸时，可以点下面按钮选择文件。");
    } else if (event.error !== "no-speech" && event.error !== "aborted") {
      state.beginnerVoice.enabled = false;
      updateBeginnerVoiceUi();
      addVoiceUploadFallbackMessage("语音识别暂时不可用，已停止听写，避免反复中断。需要上传图纸时，可以点下面按钮选择文件。");
    }
  };
  recognition.onresult = (event) => {
    let interimText = "";
    let finalText = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript || "";
      if (event.results[index].isFinal) finalText += transcript;
      else interimText += transcript;
    }
    if (interimText && beginnerUi.chatInput) beginnerUi.chatInput.value = interimText.trim();
    if (finalText.trim()) submitBeginnerChatValue(finalText, "voice");
  };
  state.beginnerVoice.recognition = recognition;
  return recognition;
}

function startBeginnerVoiceRecognition(announce = true) {
  const recognition = ensureBeginnerVoiceRecognition();
  if (!recognition) {
    state.beginnerVoice.enabled = false;
    updateBeginnerVoiceUi();
    addAssistantMessage("当前浏览器不支持语音识别，请继续用文字输入。");
    return;
  }
  state.beginnerVoice.enabled = true;
  updateBeginnerVoiceUi();
  if (announce) addAssistantMessage("语音输入已开启。说出“加载样例”“切到 3D”“画窗”等指令，我会自动执行。");
  if (state.beginnerVoice.listening) return;
  try {
    recognition.start();
  } catch (error) {
    if (error.name !== "InvalidStateError") {
      state.beginnerVoice.enabled = false;
      updateBeginnerVoiceUi();
      addAssistantMessage("语音输入启动失败，请检查浏览器麦克风权限。");
    }
  }
}

function stopBeginnerVoiceRecognition(announce = true) {
  state.beginnerVoice.enabled = false;
  window.clearTimeout(state.beginnerVoice.restartTimer);
  if (state.beginnerVoice.recognition) {
    try {
      state.beginnerVoice.recognition.stop();
    } catch (error) {
      // Ignore stop calls while the recognizer is already idle.
    }
  }
  state.beginnerVoice.listening = false;
  updateBeginnerVoiceUi();
  if (announce) addAssistantMessage("语音输入已关闭。");
}

function setBeginnerVoiceEnabled(enabled, announce = true) {
  if (enabled) startBeginnerVoiceRecognition(announce);
  else stopBeginnerVoiceRecognition(announce);
}

function toggleBeginnerVoice() {
  setBeginnerVoiceEnabled(!state.beginnerVoice.enabled, true);
}

function handleChatSubmit(event) {
  event.preventDefault();
  if (!beginnerUi.chatInput) return;
  submitBeginnerChatValue(beginnerUi.chatInput.value);
}

function bindExperienceUi() {
  beginnerUi.beginnerModeButton?.addEventListener("click", () => setExperienceMode("beginner"));
  beginnerUi.advancedModeButton?.addEventListener("click", () => setExperienceMode("advanced"));
  beginnerUi.modeSwitchButton?.addEventListener("click", () => setExperienceMode("launch"));
  beginnerUi.chatBackButton?.addEventListener("click", () => setExperienceMode("launch"));
  beginnerUi.chatAdvancedButton?.addEventListener("click", () => setExperienceMode("advanced"));
  beginnerUi.chatUploadButton?.addEventListener("click", () => {
    addAssistantMessage("请从电脑里选择一张平面图。选完后，我会自动识别并解释结果。");
    openImagePicker();
  });
  beginnerUi.chatDemoButton?.addEventListener("click", () => {
    addAssistantMessage("我先加载内置样例。它适合快速看完整流程，不会影响你之后上传自己的图。");
    loadDemoPlan();
  });
  beginnerUi.chatAiButton?.addEventListener("click", () => setBeginnerRecognitionMode("ai-cv"));
  beginnerUi.chatBrowserButton?.addEventListener("click", () => setBeginnerRecognitionMode("browser"));
  beginnerUi.chatRegenerateButton?.addEventListener("click", () => {
    if (!state.analysisCanvas) {
      addAssistantMessage("还没有图纸。先上传图纸或加载样例，再重新生成。");
      return;
    }
    addAssistantMessage("我会按当前设置重新生成一次。");
    runRecognition();
  });
  beginnerUi.chatExportButton?.addEventListener("click", () => {
    if (!hasExportableContent()) {
      addAssistantMessage("现在还没有可导出的结果。先生成墙线后再导出。");
      return;
    }
    addAssistantMessage("正在导出 JSON，文件里会包含这次识别和编辑后的数据。");
    exportJson();
  });
  beginnerUi.chatForm?.addEventListener("submit", handleChatSubmit);
  beginnerUi.voiceToggleButton?.addEventListener("click", toggleBeginnerVoice);
  beginnerUi.phonePreviewCanvas?.addEventListener("wheel", handlePhonePreviewWheel, { passive: false });
  beginnerUi.phonePreviewCanvas?.addEventListener("pointerdown", handlePhonePreviewPointerDown);
  beginnerUi.phonePreviewCanvas?.addEventListener("pointermove", handlePhonePreviewPointerMove);
  beginnerUi.phonePreviewCanvas?.addEventListener("pointerup", handlePhonePreviewPointerUp);
  beginnerUi.phonePreviewCanvas?.addEventListener("pointercancel", handlePhonePreviewPointerUp);
  beginnerUi.phonePreviewCanvas?.addEventListener("keydown", handlePhonePreviewKeyDown);
  beginnerUi.phonePreviewCanvas?.addEventListener("contextmenu", (event) => event.preventDefault());
  beginnerUi.phoneChatResizer?.addEventListener("pointerdown", handlePhoneChatResizePointerDown);
  beginnerUi.phoneChatResizer?.addEventListener("pointermove", handlePhoneChatResizePointerMove);
  beginnerUi.phoneChatResizer?.addEventListener("pointerup", handlePhoneChatResizePointerUp);
  beginnerUi.phoneChatResizer?.addEventListener("pointercancel", handlePhoneChatResizePointerUp);
  beginnerUi.phoneChatResizer?.addEventListener("keydown", handlePhoneChatResizeKeyDown);
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
elements.projectFileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) loadProjectArchiveFromFile(file);
});
elements.demoButton.addEventListener("click", loadDemoPlan);
elements.processButton.addEventListener("click", runRecognition);
elements.saveProjectButton.addEventListener("click", saveProjectArchive);
elements.openProjectButton.addEventListener("click", openProjectArchive);
elements.exportJsonButton.addEventListener("click", exportJson);
elements.drawWallButton.addEventListener("click", toggleDrawWallTool);
elements.drawDoorButton.addEventListener("click", toggleDrawDoorTool);
elements.drawWindowButton.addEventListener("click", openWindowModelPicker);
elements.drawRailingButton.addEventListener("click", toggleDrawRailingTool);
elements.openInteriorLibraryButton.addEventListener("click", openInteriorLibrary);
elements.interiorLibraryCloseButton.addEventListener("click", closeInteriorLibrary);
elements.interiorLibraryModal.addEventListener("click", (event) => {
  if (event.target === elements.interiorLibraryModal) closeInteriorLibrary();
});
elements.interiorCategorySelect.addEventListener("change", () => {
  state.pendingProductCategory = elements.interiorCategorySelect.value || "custom";
  renderInteriorLibraryControls();
});
elements.addInteriorAssetButton.addEventListener("click", addSelectedInteriorAsset);
elements.addInteriorPlaceholderButton.addEventListener("click", () => addInteriorPlaceholderToPlan(elements.interiorCategorySelect.value));
elements.importInteriorModelButton.addEventListener("click", () => openProductModelPicker(elements.interiorCategorySelect.value));
elements.importInteriorCatalogButton.addEventListener("click", () => {
  elements.interiorCatalogInput.value = "";
  elements.interiorCatalogInput.click();
});
elements.interiorCatalogInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importInteriorCatalogFromFile(file);
});
elements.productModelInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importProductModelFromFile(file);
});
elements.calibrateToolButton.addEventListener("click", toggleCalibrateScaleTool);
elements.calibrateScaleButton.addEventListener("click", toggleCalibrateScaleTool);
elements.measureToolButton.addEventListener("click", toggleMeasureTool);
elements.threeRoamButton.addEventListener("click", toggleThreeRoamMode);
elements.threeLightingButton.addEventListener("click", openLightingEditor);
elements.lightingCloseButton.addEventListener("click", closeLightingEditor);
elements.lightingModal.addEventListener("click", (event) => {
  if (event.target === elements.lightingModal) closeLightingEditor();
});
elements.addPointLightButton.addEventListener("click", () => addManualLightSource("point"));
elements.addLineLightButton.addEventListener("click", () => addManualLightSource("line"));
elements.lightingSourceSelect.addEventListener("change", () => {
  state.selectedLightSourceId = elements.lightingSourceSelect.value || null;
  renderLightingEditor();
  renderPreview();
  updateThreeLightSources();
  renderThreeScene();
});
for (const input of lightingEditorInputs()) input.addEventListener("change", applyLightingEditorChanges);
elements.lightingDeleteButton.addEventListener("click", deleteSelectedLightSource);
elements.threeRenderButton.addEventListener("click", exportThreeRenderImage);
elements.threeResetButton.addEventListener("click", resetThreeCamera);
elements.threeRenderSaveButton.addEventListener("click", saveThreeRenderPreview);
elements.threeRenderCloseButton.addEventListener("click", () => {
  closeThreeRenderPreview();
  setStatus("已退出渲染预览");
});
elements.threeRenderModal.addEventListener("click", (event) => {
  if (event.target !== elements.threeRenderModal) return;
  closeThreeRenderPreview();
  setStatus("已退出渲染预览");
});
elements.selectedDeleteComponentButton.addEventListener("click", deleteSelectedComponent);
elements.threeDeleteComponentButton.addEventListener("click", deleteSelectedComponent);
elements.overlayTab.addEventListener("click", () => setView("overlay"));
elements.vectorTab.addEventListener("click", () => setView("vector"));
elements.recognitionModeSelect.addEventListener("change", () => state.analysisCanvas && runRecognition());
bindComponentParameterInputs("selected");
bindComponentParameterInputs("three");
elements.previewCanvas.addEventListener("pointerdown", handleCanvasPointerDown);
elements.previewCanvas.addEventListener("pointermove", handleCanvasPointerMove);
elements.previewCanvas.addEventListener("pointerup", handleCanvasPointerUp);
elements.previewCanvas.addEventListener("pointercancel", handleCanvasPointerUp);
elements.previewCanvas.addEventListener("pointerleave", () => {
  if (state.drawingLine) return;
  if (state.openingDraft) return;
  if (state.railingDraft) return;
  if (state.calibrationLine) return;
  if (state.measurementLine) return;
  if (state.draggedEndpoint) return;
  if (state.draggedLine) return;
  if (state.draggedRailing) return;
  state.hoveredEndpoint = null;
  elements.previewCanvas.style.cursor = isPointDrawingTool(state.tool) ? "crosshair" : "default";
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
document.addEventListener("keydown", handleDocumentKeyDown);

bindExperienceUi();
window.GewuInteriorAssets = Object.freeze({
  schemaVersion: INTERIOR_CATALOG_SCHEMA,
  categories: INTERIOR_CATEGORY_DEFINITIONS,
  registerCatalog: (catalog, options) => registerInteriorCatalog(catalog, options),
  listAssets: () => [...state.interiorAssets.values()].map((asset) => ({ ...asset })),
  addAsset: (assetId, placement) => addInteriorAssetToPlan(assetId, placement),
  addPlaceholder: (category) => addInteriorPlaceholderToPlan(category),
  findCollision: (product) => findProductCollision(product),
});
window.GewuLighting = Object.freeze({
  listSources: () => state.lightSources.map(cloneLightSource),
  addPoint: () => addManualLightSource("point"),
  addLine: () => addManualLightSource("line"),
  update: (id, patch = {}) => {
    const source = state.lightSources.find((candidate) => candidate.id === id);
    if (!source) throw new Error(`未找到光源：${id}`);
    Object.assign(source, patch);
    normalizeLightSource(source);
    updateThreeLightSources();
    renderThreeScene();
    if (state.analysisCanvas) renderPreview();
    return cloneLightSource(source);
  },
  remove: (id) => {
    const source = state.lightSources.find((candidate) => candidate.id === id);
    if (!source || source.ownerProductId) return false;
    state.selectedLightSourceId = source.id;
    return deleteSelectedLightSource();
  },
  kelvinToSrgb: (temperatureKelvin) => ({ ...kelvinToSrgb(temperatureKelvin) }),
});
ensureInteriorCatalogReady();
syncControlLabels();
updateBeginnerSummary();
updateBeginnerPhonePreview();
initThreeViewer();
