import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";

const canvas = document.querySelector("#modelCanvas");
const designStage = document.querySelector(".design-stage");
const roomLabel = document.querySelector("#modelRoomLabel");
const selectionLabel = document.querySelector("#modelSelection");
const modelCount = document.querySelector("#modelCount");
const viewButtons = document.querySelectorAll("[data-model-view]");
const modeButtons = document.querySelectorAll("[data-model-mode]");
const resetStageSizeButton = document.querySelector("#resetStageSize");
const toggleStageFullscreenButton = document.querySelector("#toggleStageFullscreen");
const addButtons = document.querySelectorAll("[data-add-model]");
const sceneEditor = document.querySelector(".scene-editor");
const editorSelection = document.querySelector("#editorSelection");
const variantOptions = document.querySelector("#variantOptions");
const furnitureSwatches = document.querySelectorAll("[data-furniture-finish]");
const wallSwatches = document.querySelectorAll("[data-wall-finish]");
const floorSwatches = document.querySelectorAll("[data-floor-finish]");
const lightTones = document.querySelectorAll("[data-light-tone]");
const positionXRange = document.querySelector("#positionXRange");
const positionZRange = document.querySelector("#positionZRange");
const rotationRange = document.querySelector("#rotationRange");
const scaleRange = document.querySelector("#scaleRange");
const lightRange = document.querySelector("#lightRange");
const deleteModelButton = document.querySelector("#deleteModel");
const clearOriginalModelButton = document.querySelector("#clearOriginalModel");
const planFileInput = document.querySelector("#planFileInput");
const planStatus = document.querySelector("#planStatus");
const planMeta = document.querySelector("#planMeta");
const planWidthInput = document.querySelector("#planWidthInput");
const planOpacityRange = document.querySelector("#planOpacityRange");
const calibrateScaleButton = document.querySelector("#calibrateScale");
const scaleLengthInput = document.querySelector("#scaleLengthInput");
const applyPlanScaleButton = document.querySelector("#applyPlanScale");
const rotatePlanButton = document.querySelector("#rotatePlan");
const selectPlanRegionButton = document.querySelector("#selectPlanRegion");
const keepPlanRegionButton = document.querySelector("#keepPlanRegion");
const clearPlanRegionButton = document.querySelector("#clearPlanRegion");
const clearPlanButton = document.querySelector("#clearPlan");
const analyzePlanPhotoButton = document.querySelector("#analyzePlanPhoto");
const cleanPlanPhotoButton = document.querySelector("#cleanPlanPhoto");
const restoreOriginalPlanPhotoButton = document.querySelector("#restoreOriginalPlanPhoto");
const photoQualitySummary = document.querySelector("#photoQualitySummary");
const photoQualityMetrics = document.querySelector("#photoQualityMetrics");
const detectWallsButton = document.querySelector("#detectWalls");
const clearWallsButton = document.querySelector("#clearWalls");
const recognitionStatus = document.querySelector("#recognitionStatus");
const wallHeightInput = document.querySelector("#wallHeightInput");
const build3DModelButton = document.querySelector("#build3DModel");
const clear3DModelButton = document.querySelector("#clear3DModel");
const sitePhotoInput = document.querySelector("#sitePhotoInput");
const sitePhotoStatus = document.querySelector("#sitePhotoStatus");
const sitePhotoMeta = document.querySelector("#sitePhotoMeta");
const generatePhotoModelButton = document.querySelector("#generatePhotoModel");
const refinePlanPhotoModelButton = document.querySelector("#refinePlanPhotoModel");
const matchSitePhotosButton = document.querySelector("#matchSitePhotos");
const trellisEndpointInput = document.querySelector("#trellisEndpointInput");
const generateTrellisModelButton = document.querySelector("#generateTrellisModel");
const clearPhotoModelButton = document.querySelector("#clearPhotoModel");
const wallEditor = document.querySelector("#wallEditor");
const wallSelection = document.querySelector("#wallSelection");
const deleteWallButton = document.querySelector("#deleteWall");
const wallLengthInput = document.querySelector("#wallLengthInput");
const wallThicknessInput = document.querySelector("#wallThicknessInput");
const wallStartOffsetInput = document.querySelector("#wallStartOffsetInput");
const wallEndOffsetInput = document.querySelector("#wallEndOffsetInput");
const planOptimizerStatus = document.querySelector("#planOptimizerStatus");
const rerunOptimizedRecognitionButton = document.querySelector("#rerunOptimizedRecognition");
const optCollapseWallsInput = document.querySelector("#optCollapseWalls");
const optExtendCornersInput = document.querySelector("#optExtendCorners");
const optDoorWindowSymbolsInput = document.querySelector("#optDoorWindowSymbols");
const optShowRoomsInput = document.querySelector("#optShowRooms");
const optLengthLabelsInput = document.querySelector("#optLengthLabels");
const optMinWallLengthInput = document.querySelector("#optMinWallLength");
const linearPlanSummary = document.querySelector("#linearPlanSummary");
const linearPlanList = document.querySelector("#linearPlanList");
const addLinearWallButton = document.querySelector("#addLinearWall");
const addLinearDoorButton = document.querySelector("#addLinearDoor");
const addLinearWindowButton = document.querySelector("#addLinearWindow");
const workflowSteps = {
  plan: document.querySelector("#workflowPlan"),
  structure: document.querySelector("#workflowStructure"),
  reality: document.querySelector("#workflowReality"),
  procurement: document.querySelector("#workflowProcurement"),
};
const workflowSummary = document.querySelector("#workflowSummary");
const modelBomTotal = document.querySelector("#modelBomTotal");
const modelBomSummary = document.querySelector("#modelBomSummary");
const modelBomRows = document.querySelector("#modelBomRows");
const modelBootStatus = document.querySelector("#modelBootStatus");

const roomNames = {
  living: "客餐厅模型",
  kitchen: "厨房模型",
  bath: "主卫模型",
  bedroom: "主卧模型",
};

const materialLookup = [
  { test: ["木饰面", "柜"], target: "木饰面柜体" },
  { test: ["地面", "地板", "微水泥"], target: "地面面层" },
  { test: ["软装", "沙发"], target: "沙发模型" },
  { test: ["照明", "灯"], target: "轨道灯具" },
  { test: ["岩板", "台面"], target: "岛台台面" },
  { test: ["橱柜"], target: "橱柜系统" },
  { test: ["墙地砖", "砖"], target: "墙地砖铺贴" },
  { test: ["马桶"], target: "智能马桶" },
  { test: ["花洒"], target: "淋浴系统" },
  { test: ["衣柜"], target: "定制衣柜" },
  { test: ["窗帘"], target: "窗帘软装" },
];

const colors = {
  floor: 0xd7d1c6,
  wall: 0xf2f3ef,
  wallSide: 0xe7ecea,
  wood: 0x9c8062,
  woodDark: 0x66503c,
  fabric: 0x6f8794,
  stone: 0xdedbd2,
  metal: 0x8b9495,
  glass: 0x9fd4e8,
  green: 0x24745b,
  coral: 0xc7644e,
  blue: 0x356d8a,
  gold: 0xbd8b2f,
  light: 0xffd98a,
  white: 0xffffff,
};

const finishPresets = {
  default: null,
  fabric: 0x6f8794,
  moss: 0x71836e,
  clay: 0xb06d57,
  oak: 0xb08a61,
};

const wallFinishes = {
  ivory: 0xf2f3ef,
  greige: 0xdad4cb,
  sage: 0xd7dfd6,
};

const floorFinishes = {
  stone: 0xd7d1c6,
  oak: 0xc5ae8c,
  walnut: 0x8c6b4f,
};

const lightTonePresets = {
  warm: 0xffd98a,
  neutral: 0xfff1d8,
  cool: 0xe8f3ff,
};

let renderer;
let scene;
let camera;
let controls;
let root;
let raycaster;
let pointer;
let selectedHelper;
let selectedObject;
let selectedGroup;
let activeRoom = "living";
let currentView = "orbit";
let pulseLight;
let ambientLight;
let sunLight;
let modelObjects = [];
let selectableMeshes = [];
let shellMeshes = {
  floor: [],
  wall: [],
};
let addOffset = 0;
let activeWallFinish = "ivory";
let activeFloorFinish = "stone";
let activeLightTone = "warm";
let planMesh;
let planTexture;
let planCanvas;
let originalPlanCanvas;
let planAspect = 1;
let planRotation = 0;
let planRegion = null;
let planRegionDraft = null;
let planRegionOverlayGroup = null;
let isPlanRegionSelectionMode = false;
let isDrawingPlanRegion = false;
let planRegionPointerId = null;
let scaleCalibration = null;
let scaleCalibrationDraft = null;
let scaleOverlayGroup = null;
let isScaleCalibrationMode = false;
let isDrawingScaleCalibration = false;
let scaleCalibrationPointerId = null;
let gridHelper;
let detectedWallGroup;
let detectedWallSegments = [];
let detectedDoorOpenings = [];
let detectedWindowOpenings = [];
let detectedRoomRegions = [];
let detectedWallResult;
let detectedWallMeshes = [];
let selectedDetectedWallIndex = null;
let selectedLinearFeature = null;
let generatedModelGroup;
let generatedWallMeshes = [];
let generatedDoorMeshes = [];
let generatedWindowMeshes = [];
let generatedFloorMesh;
let generated3DActive = false;
let generated3DSource = null;
let sitePhotoCanvas;
let sitePhotoCanvases = [];
let sitePhotoTexture;
let sitePhotoTextures = [];
let sitePhotoAnalysis;
let sitePhotoMatches = [];
let trellisModelGroup;
let trellisAssetUrl;
let gltfLoader;
let isDraggingModel = false;
let dragPointerId = null;
let dragOffset = new THREE.Vector3();
let isDraggingDetectedWall = false;
let detectedWallDragPointerId = null;
let detectedWallDragIndex = null;
let detectedWallDragEndpoint = null;
let detectedWallDragLastPixel = null;
let detectedWallDragStartSegment = null;
let detectedWallDragMoved = false;
let isStageExpanded = false;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let lastAnimationTime = 0;
const walkKeys = new Set();
const walkDirection = new THREE.Vector3();
const walkForward = new THREE.Vector3();
const walkRight = new THREE.Vector3();
const walkUp = new THREE.Vector3(0, 1, 0);
const walkMoveSpeed = 2.2;
const minWalkHeight = 0.45;
const maxWalkHeight = 6.5;
const furnitureWallClearance = 0.04;
const defaultFurnitureBounds = {
  minX: -3.6,
  maxX: 3.6,
  minZ: -2.25,
  maxZ: 2.25,
};
const projectCostFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});
const modelCostCatalog = {
  sofa: { label: "软装家具", base: 12800 },
  table: { label: "软装家具", base: 3600 },
  cabinet: { label: "定制柜体", base: 18800 },
  island: { label: "定制柜体", base: 22600 },
  bed: { label: "软装家具", base: 9800 },
  wardrobe: { label: "定制柜体", base: 24800 },
  light: { label: "照明灯具", base: 4200 },
  beam: { label: "结构构件", base: 2600 },
  column: { label: "结构构件", base: 1800 },
  ceiling: { label: "吊顶系统", base: 8600 },
};
const planOptimizerDefaults = {
  collapseWalls: true,
  extendCorners: true,
  doorWindowSymbols: true,
  showRooms: true,
  lengthLabels: true,
  minWallLength: 0.6,
};
const floorPlanReadingProfiles = {
  luxuryFlat: {
    label: "大平层深度读图",
    minRooms: 6,
    minBalconies: 1,
    minBedroomLikeRooms: 3,
    minServiceRooms: 2,
  },
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.04,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function planOptimizerSettings() {
  return {
    collapseWalls: optCollapseWallsInput?.checked ?? planOptimizerDefaults.collapseWalls,
    extendCorners: optExtendCornersInput?.checked ?? planOptimizerDefaults.extendCorners,
    doorWindowSymbols: optDoorWindowSymbolsInput?.checked ?? planOptimizerDefaults.doorWindowSymbols,
    showRooms: optShowRoomsInput?.checked ?? planOptimizerDefaults.showRooms,
    lengthLabels: optLengthLabelsInput?.checked ?? planOptimizerDefaults.lengthLabels,
    minWallLength: THREE.MathUtils.clamp(
      Number(optMinWallLengthInput?.value || planOptimizerDefaults.minWallLength),
      0.1,
      3,
    ),
  };
}

function updatePlanOptimizerStatus() {
  if (!planOptimizerStatus) return;
  const settings = planOptimizerSettings();
  const enabled = [
    settings.collapseWalls,
    settings.extendCorners,
    settings.doorWindowSymbols,
    settings.showRooms,
    settings.lengthLabels,
  ].filter(Boolean).length;
  planOptimizerStatus.textContent = `已启用 ${enabled}/5 项增强 · 短墙过滤 ${settings.minWallLength.toFixed(1)}m`;
}

function applyPlanOptimizerDisplayOnly() {
  updatePlanOptimizerStatus();
  if (detectedWallResult) {
    renderDetectedWalls(detectedWallResult);
  }
  if (generated3DActive && generated3DSource === "detected-walls") {
    build3DFromDetectedWalls();
  }
}

function box(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(color, options));
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 32),
    mat(color, options),
  );
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function tagged(mesh, role) {
  mesh.userData.finishRole = role;
  return mesh;
}

function darker(color, factor = 0.72) {
  const value = new THREE.Color(color);
  value.multiplyScalar(factor);
  return value;
}

function register(group, meta) {
  const data = typeof meta === "string" ? { name: meta } : meta;
  group.userData = {
    name: data.name,
    selectName: data.name,
    kind: data.kind ?? null,
    variant: data.variant ?? null,
    finishKey: data.finishKey ?? "default",
    editable: data.editable ?? Boolean(data.kind),
    deletable: data.deletable ?? Boolean(data.kind),
  };
  modelObjects.push(group);

  group.traverse((child) => {
    if (!child.isMesh) return;
    child.userData.selectName = data.name;
    child.userData.modelRoot = group;
    selectableMeshes.push(child);
  });

  captureDefaultColors(group);
  root.add(group);
  updateModelCount();
  return group;
}

function place(mesh, x, y, z, rotationY = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  return mesh;
}

function makeShell() {
  const shell = new THREE.Group();
  shell.userData = {
    name: "户型壳体",
    selectName: "户型壳体",
    editable: false,
    deletable: false,
  };

  const floor = box(8.2, 0.08, 5.2, colors.floor, { castShadow: false });
  floor.userData.selectName = "地面面层";
  floor.userData.modelRoot = shell;
  floor.position.y = -0.04;
  shell.add(floor);

  const backWall = box(8.2, 2.8, 0.08, colors.wall, { castShadow: false });
  backWall.userData.selectName = "墙面构件";
  backWall.userData.modelRoot = shell;
  backWall.position.set(0, 1.36, -2.58);
  shell.add(backWall);

  const leftWall = box(0.08, 2.8, 5.2, colors.wallSide, { castShadow: false });
  leftWall.userData.selectName = "墙面构件";
  leftWall.userData.modelRoot = shell;
  leftWall.position.set(-4.1, 1.36, 0);
  shell.add(leftWall);

  const rightWall = box(0.06, 2.8, 5.2, colors.wallSide, {
    castShadow: false,
    transparent: true,
    opacity: 0.36,
  });
  rightWall.userData.selectName = "墙面构件";
  rightWall.userData.modelRoot = shell;
  rightWall.position.set(4.1, 1.36, 0);
  shell.add(rightWall);

  const windowFrame = box(2.4, 1.1, 0.05, colors.glass, {
    castShadow: false,
    transparent: true,
    opacity: 0.55,
  });
  windowFrame.position.set(-1.8, 1.55, -2.62);
  shell.add(windowFrame);

  gridHelper = new THREE.GridHelper(8, 16, 0xaeb8b6, 0xd7ddda);
  gridHelper.position.y = 0.002;
  shell.add(gridHelper);

  root.add(shell);
  selectableMeshes.push(floor, backWall, leftWall, rightWall);
  shellMeshes.floor.push(floor);
  shellMeshes.wall.push(backWall, leftWall, rightWall);
}

function makeCabinet(name = "木饰面柜体", variant = "wall") {
  const group = new THREE.Group();

  if (variant === "sideboard") {
    group.add(place(tagged(box(2.2, 0.72, 0.46, colors.wood), "main"), 0, 0.4, 0));
    group.add(place(tagged(box(2.28, 0.07, 0.52, colors.woodDark), "accent"), 0, 0.8, 0));
    [-0.74, 0, 0.74].forEach((x) => {
      group.add(place(tagged(box(0.03, 0.58, 0.38, colors.woodDark), "accent"), x, 0.42, 0.25));
    });
  } else if (variant === "shelf") {
    group.add(place(tagged(box(2.28, 0.08, 0.42, colors.woodDark), "accent"), 0, 0.12, 0));
    group.add(place(tagged(box(2.28, 0.08, 0.42, colors.woodDark), "accent"), 0, 0.82, 0));
    group.add(place(tagged(box(2.28, 0.08, 0.42, colors.woodDark), "accent"), 0, 1.52, 0));
    [-1.08, 0, 1.08].forEach((x) => {
      group.add(place(tagged(box(0.08, 1.48, 0.42, colors.wood), "main"), x, 0.82, 0));
    });
  } else {
    group.add(place(tagged(box(2.5, 1.45, 0.42, colors.wood), "main"), 0, 0.72, 0));
    group.add(place(tagged(box(2.58, 0.06, 0.48, colors.woodDark), "accent"), 0, 1.48, 0));

    for (let i = -1; i <= 1; i += 1) {
      const door = tagged(box(0.03, 1.28, 0.36, colors.woodDark, { castShadow: false }), "accent");
      door.position.set(i * 0.82, 0.76, 0.24);
      group.add(door);
    }
  }

  return register(group, { name, kind: "cabinet", variant });
}

function makeSofa(name = "沙发模型", variant = "linear") {
  const group = new THREE.Group();

  if (variant === "sectional") {
    group.add(place(tagged(box(2.25, 0.34, 0.86, colors.fabric), "main"), 0, 0.22, 0));
    group.add(place(tagged(box(2.35, 0.66, 0.18, colors.fabric), "main"), 0, 0.62, -0.38));
    group.add(place(tagged(box(0.22, 0.44, 0.88, colors.fabric), "main"), -1.18, 0.38, 0));
    group.add(place(tagged(box(0.22, 0.44, 0.88, colors.fabric), "main"), 1.18, 0.38, 0));
    group.add(place(tagged(box(0.78, 0.34, 1.32, colors.fabric), "main"), 0.72, 0.22, 0.52));
    [-0.68, 0, 0.68].forEach((x) => {
      group.add(place(tagged(box(0.64, 0.18, 0.56, 0x8fa3ab), "accent"), x, 0.48, 0.05));
    });
  } else if (variant === "lounge") {
    group.add(place(tagged(box(1.12, 0.34, 0.92, colors.fabric), "main"), 0, 0.24, 0));
    group.add(place(tagged(box(1.16, 0.74, 0.18, colors.fabric), "main"), 0, 0.66, -0.4));
    group.add(place(tagged(box(0.18, 0.46, 0.92, colors.fabric), "main"), -0.64, 0.4, 0));
    group.add(place(tagged(box(0.18, 0.46, 0.92, colors.fabric), "main"), 0.64, 0.4, 0));
    group.add(place(tagged(box(0.74, 0.18, 0.58, 0x8fa3ab), "accent"), 0, 0.5, 0.04));
  } else {
    group.add(place(tagged(box(2.25, 0.34, 0.86, colors.fabric), "main"), 0, 0.22, 0));
    group.add(place(tagged(box(2.35, 0.66, 0.18, colors.fabric), "main"), 0, 0.62, -0.38));
    group.add(place(tagged(box(0.22, 0.44, 0.88, colors.fabric), "main"), -1.18, 0.38, 0));
    group.add(place(tagged(box(0.22, 0.44, 0.88, colors.fabric), "main"), 1.18, 0.38, 0));

    for (let i = -1; i <= 1; i += 1) {
      group.add(place(tagged(box(0.64, 0.18, 0.56, 0x8fa3ab), "accent"), i * 0.68, 0.48, 0.05));
    }
  }

  return register(group, { name, kind: "sofa", variant });
}

function makeRoundTable(name = "茶几模型", variant = "round") {
  const group = new THREE.Group();

  if (variant === "rect") {
    group.add(place(tagged(box(1.1, 0.08, 0.58, colors.stone), "main"), 0, 0.44, 0));
    [-0.42, 0.42].forEach((x) => {
      group.add(place(tagged(box(0.06, 0.42, 0.06, colors.metal, { metalness: 0.45 }), "accent"), x, 0.22, 0));
    });
  } else {
    const top = tagged(cylinder(0.46, 0.46, 0.08, colors.stone), "main");
    top.position.set(0, 0.44, 0);
    group.add(top);

    const leg = tagged(cylinder(0.08, 0.12, 0.42, colors.metal, { metalness: 0.45, roughness: 0.38 }), "accent");
    leg.position.set(0, 0.22, 0);
    group.add(leg);
  }

  return register(group, { name, kind: "table", variant });
}

function makeLight(name = "轨道灯具", variant = "track") {
  const group = new THREE.Group();

  if (variant === "pendant") {
    [-0.48, 0.48].forEach((x) => {
      group.add(place(tagged(box(0.03, 0.72, 0.03, colors.metal, { metalness: 0.36 }), "accent"), x, -0.34, 0));
      const lamp = tagged(cylinder(0.18, 0.24, 0.26, colors.light, {
        emissive: colors.light,
        emissiveIntensity: 0.35,
      }), "main");
      lamp.position.set(x, -0.78, 0);
      group.add(lamp);
    });
  } else if (variant === "spots") {
    [-0.72, 0, 0.72].forEach((x) => {
      const lamp = tagged(cylinder(0.13, 0.16, 0.18, colors.light, {
        emissive: colors.light,
        emissiveIntensity: 0.35,
      }), "main");
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(x, -0.12, 0);
      group.add(lamp);
    });
  } else {
    group.add(place(tagged(box(2.2, 0.04, 0.06, colors.metal, { metalness: 0.36 }), "accent"), 0, 0, 0));

    for (let i = -1; i <= 1; i += 1) {
      const lamp = tagged(cylinder(0.11, 0.13, 0.18, colors.light, {
        emissive: colors.light,
        emissiveIntensity: 0.35,
      }), "main");
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(i * 0.7, -0.12, 0.02);
      group.add(lamp);
    }
  }

  return register(group, { name, kind: "light", variant });
}

function makeBeam(name = "梁体构件", variant = "straight") {
  const group = new THREE.Group();
  const beamHeight = variant === "drop" ? 0.34 : 0.22;
  const beam = tagged(box(3.4, beamHeight, 0.22, 0xd8dedc, { castShadow: false }), "main");
  beam.position.set(0, 2.62 - beamHeight / 2, 0);
  group.add(beam);

  if (variant === "drop") {
    const shadow = tagged(box(3.45, 0.03, 0.26, 0xb9c1bf, { castShadow: false }), "accent");
    shadow.position.set(0, 2.42, 0);
    group.add(shadow);
  }

  return register(group, { name, kind: "beam", variant });
}

function makeColumn(name = "柱体构件", variant = "square") {
  const group = new THREE.Group();

  if (variant === "round") {
    const column = tagged(cylinder(0.18, 0.18, 2.65, 0xd7ddda, { castShadow: true }), "main");
    column.position.set(0, 1.32, 0);
    group.add(column);
  } else {
    group.add(place(tagged(box(0.36, 2.65, 0.36, 0xd7ddda), "main"), 0, 1.32, 0));
    group.add(place(tagged(box(0.42, 0.08, 0.42, 0xb9c1bf, { castShadow: false }), "accent"), 0, 2.68, 0));
  }

  return register(group, { name, kind: "column", variant });
}

function makeCeiling(name = "吊顶系统", variant = "flat") {
  const group = new THREE.Group();
  const panel = tagged(box(2.8, 0.06, 1.8, 0xf2f3ef, { castShadow: false }), "main");
  panel.position.set(0, 2.74, 0);
  group.add(panel);

  if (variant === "tray") {
    const frameColor = 0xdde3e0;
    group.add(place(tagged(box(2.9, 0.11, 0.12, frameColor, { castShadow: false }), "accent"), 0, 2.66, -0.86));
    group.add(place(tagged(box(2.9, 0.11, 0.12, frameColor, { castShadow: false }), "accent"), 0, 2.66, 0.86));
    group.add(place(tagged(box(0.12, 0.11, 1.8, frameColor, { castShadow: false }), "accent"), -1.39, 2.66, 0));
    group.add(place(tagged(box(0.12, 0.11, 1.8, frameColor, { castShadow: false }), "accent"), 1.39, 2.66, 0));
  }

  return register(group, { name, kind: "ceiling", variant });
}

function makeIsland(name = "岛台台面", variant = "stone") {
  const group = new THREE.Group();

  if (variant === "wood") {
    group.add(place(tagged(box(1.9, 0.14, 0.82, colors.wood), "main"), 0, 0.98, 0));
    group.add(place(tagged(box(1.72, 0.82, 0.66, colors.woodDark), "accent"), 0, 0.47, 0));
  } else if (variant === "bar") {
    group.add(place(tagged(box(2.18, 0.14, 0.72, colors.stone), "main"), 0, 1.04, 0));
    group.add(place(tagged(box(1.68, 0.88, 0.56, 0xd4d7d2), "accent"), -0.15, 0.5, 0));
  } else {
    group.add(place(tagged(box(1.85, 0.16, 0.86, colors.stone), "main"), 0, 0.98, 0));
    group.add(place(tagged(box(1.7, 0.82, 0.7, 0xd4d7d2), "accent"), 0, 0.47, 0));
    group.add(place(tagged(box(1.74, 0.05, 0.74, colors.metal, { metalness: 0.38 }), "accent"), 0, 0.08, 0));
  }

  return register(group, { name, kind: "island", variant });
}

function makeKitchenCabinet(name = "橱柜系统", editable = true) {
  const group = new THREE.Group();
  group.add(place(tagged(box(3.2, 0.82, 0.52, 0xc9c7bd), "main"), 0, 0.41, 0));
  group.add(place(tagged(box(3.3, 0.08, 0.58, colors.stone), "accent"), 0, 0.86, 0));
  group.add(place(tagged(box(0.64, 1.06, 0.42, 0xaeb6b6), "accent"), 1.1, 1.43, -0.04));
  return register(group, { name, kind: editable ? "cabinet" : null, variant: editable ? "wall" : null, editable, deletable: editable });
}

function makeBathSet(name = "淋浴系统") {
  const group = new THREE.Group();
  const glass = box(1.18, 1.82, 0.04, colors.glass, {
    transparent: true,
    opacity: 0.35,
    castShadow: false,
  });
  glass.position.set(0.6, 0.92, 0);
  group.add(glass);

  const shower = cylinder(0.04, 0.04, 1.65, colors.metal, { metalness: 0.45 });
  shower.position.set(-0.1, 0.86, -0.16);
  group.add(shower);

  const head = cylinder(0.18, 0.18, 0.04, colors.metal, { metalness: 0.45 });
  head.rotation.x = Math.PI / 2;
  head.position.set(-0.1, 1.66, -0.16);
  group.add(head);

  return register(group, { name, editable: false, deletable: false });
}

function makeToilet(name = "智能马桶") {
  const group = new THREE.Group();
  group.add(place(box(0.52, 0.32, 0.72, colors.white), 0, 0.23, 0));
  const bowl = cylinder(0.28, 0.22, 0.16, colors.white);
  bowl.position.set(0, 0.44, 0.08);
  group.add(bowl);
  group.add(place(box(0.58, 0.48, 0.18, colors.white), 0, 0.58, -0.35));
  return register(group, { name, editable: false, deletable: false });
}

function makeBed(name = "床具模型", variant = "platform") {
  const group = new THREE.Group();

  if (variant === "storage") {
    group.add(place(tagged(box(2.16, 0.42, 1.78, colors.wood), "accent"), 0, 0.28, 0));
    group.add(place(tagged(box(2.16, 0.16, 1.72, 0xded8cc), "main"), 0, 0.58, 0));
    group.add(place(tagged(box(2.18, 0.72, 0.18, colors.fabric), "main"), 0, 0.72, -0.88));
  } else {
    group.add(place(tagged(box(2.1, 0.28, 1.72, 0xded8cc), "main"), 0, 0.24, 0));
    group.add(place(tagged(box(2.18, 0.68, 0.18, colors.fabric), "main"), 0, 0.56, -0.86));
  }

  group.add(place(tagged(box(0.72, 0.12, 0.46, 0xf4f0e8), "accent"), -0.44, 0.48, -0.24));
  group.add(place(tagged(box(0.72, 0.12, 0.46, 0xf4f0e8), "accent"), 0.44, 0.48, -0.24));
  return register(group, { name, kind: "bed", variant });
}

function makeWardrobe(name = "定制衣柜", variant = "flush") {
  const group = new THREE.Group();

  if (variant === "open") {
    group.add(place(tagged(box(2.6, 0.08, 0.52, colors.woodDark), "accent"), 0, 0.08, 0));
    group.add(place(tagged(box(2.6, 0.08, 0.52, colors.woodDark), "accent"), 0, 2.12, 0));
    [-1.2, -0.4, 0.4, 1.2].forEach((x) => {
      group.add(place(tagged(box(0.08, 2.08, 0.52, colors.wood), "main"), x, 1.08, 0));
    });
    group.add(place(tagged(box(2.45, 0.08, 0.52, colors.woodDark), "accent"), 0, 1.05, 0));
  } else {
    group.add(place(tagged(box(2.6, 2.15, 0.52, colors.wood), "main"), 0, 1.08, 0));
    group.add(place(tagged(box(0.03, 1.92, 0.46, colors.woodDark), "accent"), -0.45, 1.08, 0.28));
    group.add(place(tagged(box(0.03, 1.92, 0.46, colors.woodDark), "accent"), 0.45, 1.08, 0.28));
  }

  return register(group, { name, kind: "wardrobe", variant });
}

function makeCurtain(name = "窗帘软装") {
  const group = new THREE.Group();
  for (let i = 0; i < 8; i += 1) {
    const strip = box(0.14, 1.5, 0.04, 0x91a0a4, { transparent: true, opacity: 0.72 });
    strip.position.set(-0.62 + i * 0.18, 0.86, 0);
    group.add(strip);
  }
  return register(group, { name, editable: false, deletable: false });
}

function clearRoom() {
  if (selectedHelper) {
    scene.remove(selectedHelper);
    selectedHelper = null;
  }
  selectedObject = null;
  selectedGroup = null;
  root.clear();
  selectableMeshes = [];
  modelObjects = [];
  shellMeshes = {
    floor: [],
    wall: [],
  };
  addOffset = 0;
  updateSelection("未选择构件");
  updateEditor();
  updateModelCount();
}

function clearOriginalModel() {
  if (!root) return;
  root.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });
  root.clear();
  selectableMeshes = [];
  modelObjects = [];
  shellMeshes = {
    floor: [],
    wall: [],
  };
  selectedObject = null;
  selectedGroup = null;
  if (selectedHelper) {
    scene.remove(selectedHelper);
    selectedHelper = null;
  }
  addOffset = 0;
  roomLabel.textContent = generated3DActive ? roomLabel.textContent : "空场景";
  updateSelection("已删除原始模型");
  updateEditor();
  updateModelCount();
}

function buildLiving() {
  makeShell();
  place(makeCabinet(), 0.45, 0, -2.28);
  place(makeSofa(), -1.08, 0, 0.95, 0.08);
  place(makeRoundTable(), 0.25, 0, 0.78);
  place(makeLight(), 0.3, 2.48, -0.2);
}

function buildKitchen() {
  makeShell();
  place(makeKitchenCabinet(), 0, 0, -2.1);
  place(makeIsland(), -0.65, 0, 0.45);
  place(makeLight("厨房线性灯"), 0.25, 2.48, -0.12);
}

function buildBath() {
  makeShell();
  place(makeBathSet(), -1.3, 0, -1.05);
  place(makeToilet(), 1.1, 0, 0.05, -Math.PI / 2);
  place(makeCabinet("浴室柜"), 0.55, 0, -2.25);
  place(makeKitchenCabinet("墙地砖铺贴", false), -0.2, 0, 1.65, Math.PI);
}

function buildBedroom() {
  makeShell();
  place(makeBed(), -0.8, 0, 0.65);
  place(makeWardrobe(), 1.9, 0, -0.85, -Math.PI / 2);
  place(makeCurtain(), -1.8, 0, -2.5);
  place(makeLight("卧室吊灯"), 0.1, 2.48, -0.1);
}

const builders = {
  living: buildLiving,
  kitchen: buildKitchen,
  bath: buildBath,
  bedroom: buildBedroom,
};

const addFactories = {
  sofa: () => makeSofa("新增沙发", "linear"),
  cabinet: () => makeCabinet("新增柜体", "wall"),
  island: () => makeIsland("新增岛台", "stone"),
  light: () => makeLight("新增灯具", "track"),
  beam: () => makeBeam("新增梁体", "straight"),
  column: () => makeColumn("新增柱体", "square"),
  ceiling: () => makeCeiling("新增吊顶", "flat"),
};

const variantPresets = {
  sofa: [
    { id: "linear", label: "直排", build: (name) => makeSofa(name, "linear") },
    { id: "sectional", label: "转角", build: (name) => makeSofa(name, "sectional") },
    { id: "lounge", label: "单椅", build: (name) => makeSofa(name, "lounge") },
  ],
  cabinet: [
    { id: "wall", label: "整墙", build: (name) => makeCabinet(name, "wall") },
    { id: "sideboard", label: "边柜", build: (name) => makeCabinet(name, "sideboard") },
    { id: "shelf", label: "开放架", build: (name) => makeCabinet(name, "shelf") },
  ],
  table: [
    { id: "round", label: "圆几", build: (name) => makeRoundTable(name, "round") },
    { id: "rect", label: "长几", build: (name) => makeRoundTable(name, "rect") },
  ],
  light: [
    { id: "track", label: "轨道", build: (name) => makeLight(name, "track") },
    { id: "pendant", label: "吊灯", build: (name) => makeLight(name, "pendant") },
    { id: "spots", label: "筒灯", build: (name) => makeLight(name, "spots") },
  ],
  beam: [
    { id: "straight", label: "直梁", build: (name) => makeBeam(name, "straight") },
    { id: "drop", label: "下挂", build: (name) => makeBeam(name, "drop") },
  ],
  column: [
    { id: "square", label: "方柱", build: (name) => makeColumn(name, "square") },
    { id: "round", label: "圆柱", build: (name) => makeColumn(name, "round") },
  ],
  ceiling: [
    { id: "flat", label: "平顶", build: (name) => makeCeiling(name, "flat") },
    { id: "tray", label: "跌级", build: (name) => makeCeiling(name, "tray") },
  ],
  island: [
    { id: "stone", label: "岩板", build: (name) => makeIsland(name, "stone") },
    { id: "wood", label: "木台", build: (name) => makeIsland(name, "wood") },
    { id: "bar", label: "吧台", build: (name) => makeIsland(name, "bar") },
  ],
  bed: [
    { id: "platform", label: "平台床", build: (name) => makeBed(name, "platform") },
    { id: "storage", label: "储物床", build: (name) => makeBed(name, "storage") },
  ],
  wardrobe: [
    { id: "flush", label: "平板门", build: (name) => makeWardrobe(name, "flush") },
    { id: "open", label: "开放柜", build: (name) => makeWardrobe(name, "open") },
  ],
};

function loadRoom(room) {
  activeRoom = room;
  clearRoom();
  roomLabel.textContent = roomNames[room] ?? "DFC 模型";
  builders[room]?.();
  applyWallFinish(activeWallFinish);
  applyFloorFinish(activeFloorFinish);
  if (planCanvas) updatePlanMesh();
  selectFirstEditableModel();
  setView(planCanvas ? "top" : "orbit");
}

function addLibraryModel(kind) {
  const create = addFactories[kind];
  if (!create) return;

  const group = create();
  const x = -1.7 + (addOffset % 4) * 1.05;
  const z = 1.75 - Math.floor(addOffset / 4) * 0.64;
  group.position.set(x, 0, z);
  if (generated3DActive) {
    findNearestValidFurniturePosition(group, group.position.clone());
  } else {
    constrainFurniturePosition(group, group.position.clone());
  }
  addOffset += 1;
  selectByGroup(group);
}

function updateModelCount() {
  if (modelCount) {
    modelCount.textContent = `${modelObjects.length} 件`;
  }
  updateDecisionBoard();
  updateWorkflowBoard();
}

function detectedPlanArea() {
  if (detectedRoomRegions.length > 0) {
    return detectedRoomRegions.reduce((sum, room) => sum + (room.worldArea ?? 0), 0);
  }
  if (detectedWallResult?.segments?.length || planCanvas) {
    const bounds = floorBoundsForDetectedResult(detectedWallResult);
    return Math.max(1, bounds.width * bounds.depth);
  }
  return 42;
}

function modelProcurementEstimate() {
  const area = detectedPlanArea();
  const wallLength = detectedWallSegments.reduce((sum, segment) => sum + worldLengthForSegment(segment, detectedWallResult), 0);
  const baseRows = [
    { label: "墙地顶基础", value: Math.round(area * 680 + wallLength * 520) },
    { label: "房间空间", value: detectedRoomRegions.length > 0 ? detectedRoomRegions.length * 1200 : 0 },
    { label: "门窗结构", value: detectedDoorOpenings.length * 1800 + detectedWindowOpenings.length * 2400 },
    { label: "AI 还原深化", value: sitePhotoCanvases.length > 0 ? Math.max(3800, sitePhotoCanvases.length * 1200) : 0 },
  ];

  modelObjects.forEach((group) => {
    const meta = group.userData ?? {};
    const cost = modelCostCatalog[meta.kind];
    if (!cost) return;
    const scaleFactor = Math.max(0.55, group.scale.x || 1);
    baseRows.push({
      label: cost.label,
      value: Math.round(cost.base * scaleFactor),
    });
  });

  const grouped = baseRows.reduce((rows, item) => {
    if (item.value <= 0) return rows;
    rows[item.label] = (rows[item.label] ?? 0) + item.value;
    return rows;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function updateDecisionBoard() {
  if (!modelBomTotal && !modelBomRows && !modelBomSummary) return;
  const rows = modelProcurementEstimate();
  const total = rows.reduce((sum, item) => sum + item.value, 0);

  if (modelBomTotal) modelBomTotal.textContent = projectCostFormatter.format(total);
  if (modelBomSummary) {
    const area = detectedPlanArea();
    modelBomSummary.textContent = `${area.toFixed(1)} m² 估算 · ${modelObjects.length} 件软硬装/结构构件 · 可进入采购比价`;
  }
  if (modelBomRows) {
    modelBomRows.innerHTML = rows
      .slice(0, 3)
      .map(
        (item) => `
          <div class="decision-item">
            <span>${item.label}</span>
            <strong>${projectCostFormatter.format(item.value)}</strong>
          </div>
        `,
      )
      .join("");
  }
}

function setWorkflowState(key, state) {
  const element = workflowSteps[key];
  if (!element) return;
  element.classList.toggle("is-done", state === "done");
  element.classList.toggle("is-active", state === "active");
}

function updateWorkflowBoard() {
  const hasPlan = Boolean(planCanvas);
  const hasLinearPlan = Boolean(detectedWallResult?.segments?.length);
  const hasStructure = generated3DActive || hasLinearPlan;
  const hasReality = sitePhotoCanvases.length > 0 && (generated3DSource === "site-photo" || generated3DSource === "plan-photo-refined");
  const hasProcurement = modelObjects.length > 0 || hasStructure;

  setWorkflowState("plan", hasLinearPlan ? "done" : hasPlan ? "active" : "active");
  setWorkflowState("structure", hasStructure ? "done" : hasPlan ? "active" : "idle");
  setWorkflowState("reality", hasReality ? "done" : sitePhotoCanvases.length > 0 ? "active" : "idle");
  setWorkflowState("procurement", hasProcurement && modelObjects.length > 0 ? "done" : hasStructure ? "active" : "idle");

  if (!workflowSummary) return;
  if (!hasPlan && sitePhotoCanvases.length === 0) {
    workflowSummary.textContent = "先导入户型图或现场图片，系统会按步骤推进。";
  } else if (!hasLinearPlan) {
    workflowSummary.textContent = "已导入资料，下一步识别墙线生成可编辑 2D 线性平面图。";
  } else if (!generated3DActive) {
    workflowSummary.textContent = "线性平面图已生成，可补门窗/梁柱后生成 3D 户型。";
  } else if (!hasReality && sitePhotoCanvases.length === 0) {
    workflowSummary.textContent = "3D 户型已生成，继续上传现场图片做真实场景还原。";
  } else if (!hasReality) {
    workflowSummary.textContent = "现场图片已导入，点击图纸深化把真实材质和构件匹配到户型。";
  } else {
    workflowSummary.textContent = "还原模型已形成，可继续配置软装并查看采购成本建议。";
  }
}

function updateSelection(text) {
  if (selectionLabel) {
    selectionLabel.textContent = text;
  }
}

function selectedMeta() {
  return selectedGroup?.userData ?? null;
}

function setRangeState(enabled) {
  [positionXRange, positionZRange, rotationRange, scaleRange].forEach((input) => {
    if (input) input.disabled = !enabled;
  });
  if (deleteModelButton) {
    deleteModelButton.disabled = !enabled || !selectedMeta()?.deletable;
  }
}

function updateVariantOptions(meta) {
  if (!variantOptions) return;

  const variants = meta?.kind ? variantPresets[meta.kind] : null;
  if (!variants) {
    variantOptions.innerHTML = `<button class="variant-button" type="button" disabled>无可替换款式</button>`;
    return;
  }

  variantOptions.innerHTML = variants
    .map(
      (variant) => `
        <button
          class="variant-button ${variant.id === meta.variant ? "active" : ""}"
          type="button"
          data-variant="${variant.id}"
        >
          ${variant.label}
        </button>
      `,
    )
    .join("");
}

function updateEditor() {
  const meta = selectedMeta();
  const enabled = Boolean(meta?.editable);

  if (sceneEditor) {
    sceneEditor.classList.toggle("is-disabled", !enabled);
  }
  if (editorSelection) {
    editorSelection.textContent = meta?.name ?? "未选择";
  }

  updateVariantOptions(meta);
  setRangeState(enabled);

  if (!selectedGroup || !enabled) return;

  if (positionXRange) positionXRange.value = selectedGroup.position.x.toFixed(1);
  if (positionZRange) positionZRange.value = selectedGroup.position.z.toFixed(1);
  if (rotationRange) {
    const degrees = THREE.MathUtils.radToDeg(selectedGroup.rotation.y);
    rotationRange.value = ((degrees % 360) + 360) % 360;
  }
  if (scaleRange) scaleRange.value = Math.round(selectedGroup.scale.x * 100);

  furnitureSwatches.forEach((button) => {
    button.classList.toggle("active", button.dataset.furnitureFinish === meta.finishKey);
  });
}

function applyFurnitureFinish(group, finishKey) {
  if (!group?.userData?.editable) return;

  const baseColor = finishPresets[finishKey];
  group.userData.finishKey = finishKey;

  group.traverse((child) => {
    if (!child.isMesh || !child.userData.finishRole) return;

    if (finishKey === "default") {
      const defaultColor = child.userData.defaultColor;
      if (defaultColor) child.material.color.copy(defaultColor);
      return;
    }

    if (child.userData.finishRole === "accent") {
      child.material.color.copy(darker(baseColor));
      return;
    }

    child.material.color.setHex(baseColor);
  });

  updateEditor();
}

function captureDefaultColors(group) {
  group.traverse((child) => {
    if (!child.isMesh || !child.userData.finishRole) return;
    child.userData.defaultColor = child.material.color.clone();
  });
}

function removeModel(group) {
  if (!group?.userData?.deletable) return;

  root.remove(group);
  modelObjects = modelObjects.filter((item) => item !== group);
  selectableMeshes = selectableMeshes.filter((mesh) => mesh.userData.modelRoot !== group);

  if (selectedHelper) {
    scene.remove(selectedHelper);
    selectedHelper = null;
  }

  selectedGroup = null;
  selectedObject = null;
  updateModelCount();
  selectFirstEditableModel();
}

function replaceSelectedVariant(variantId) {
  const meta = selectedMeta();
  const variants = meta?.kind ? variantPresets[meta.kind] : null;
  const nextVariant = variants?.find((item) => item.id === variantId);
  if (!nextVariant || !selectedGroup) return;

  const pose = {
    position: selectedGroup.position.clone(),
    rotation: selectedGroup.rotation.clone(),
    scale: selectedGroup.scale.clone(),
    finishKey: meta.finishKey,
    name: meta.name,
  };

  root.remove(selectedGroup);
  modelObjects = modelObjects.filter((item) => item !== selectedGroup);
  selectableMeshes = selectableMeshes.filter((mesh) => mesh.userData.modelRoot !== selectedGroup);

  const replacement = nextVariant.build(pose.name);
  replacement.position.copy(pose.position);
  replacement.rotation.copy(pose.rotation);
  replacement.scale.copy(pose.scale);
  applyFurnitureFinish(replacement, pose.finishKey);
  selectByGroup(replacement);
}

function selectFirstEditableModel() {
  const preferredKinds = ["sofa", "island", "bed", "cabinet", "table", "wardrobe", "light", "beam", "column", "ceiling"];
  const first =
    preferredKinds
      .map((kind) => modelObjects.find((group) => group.userData.editable && group.userData.kind === kind))
      .find(Boolean) ?? modelObjects.find((group) => group.userData.editable);
  if (first) {
    selectByGroup(first);
    return;
  }

  selectedGroup = null;
  selectedObject = null;
  updateSelection("未选择构件");
  updateEditor();
}

function selectByGroup(group) {
  const firstMesh = [];
  group.traverse((child) => {
    if (child.isMesh) firstMesh.push(child);
  });
  if (firstMesh[0]) {
    selectMesh(firstMesh[0]);
  }
}

function selectMesh(mesh) {
  selectedObject = mesh;
  selectedGroup = mesh.userData.modelRoot ?? null;

  if (selectedHelper) {
    scene.remove(selectedHelper);
  }

  selectedHelper = new THREE.BoxHelper(selectedGroup ?? mesh, colors.coral);
  scene.add(selectedHelper);
  updateSelection(mesh.userData.selectName || "已选择构件");
  updateEditor();
}

function selectByName(name) {
  const mesh = selectableMeshes.find((item) => item.userData.selectName === name);
  if (mesh) {
    selectMesh(mesh);
  }
}

function highlightMaterial(name) {
  const rule = materialLookup.find((item) => item.test.some((keyword) => name.includes(keyword)));
  if (rule) {
    selectByName(rule.target);
  }
}

function applyWallFinish(finishKey) {
  const color = wallFinishes[finishKey];
  if (!color) return;

  shellMeshes.wall.forEach((mesh) => {
    mesh.material.color.setHex(color);
  });
  generatedWallMeshes.forEach((mesh) => {
    mesh.material.color.setHex(color);
  });

  wallSwatches.forEach((button) => {
    button.classList.toggle("active", button.dataset.wallFinish === finishKey);
  });
}

function applyFloorFinish(finishKey) {
  const color = floorFinishes[finishKey];
  if (!color) return;

  shellMeshes.floor.forEach((mesh) => {
    mesh.material.color.setHex(color);
  });
  if (generatedFloorMesh) {
    generatedFloorMesh.material.color.setHex(color);
  }

  floorSwatches.forEach((button) => {
    button.classList.toggle("active", button.dataset.floorFinish === finishKey);
  });
}

function applyLightTone(toneKey) {
  const color = lightTonePresets[toneKey];
  if (!color) return;

  pulseLight?.color.setHex(color);
  lightTones.forEach((button) => {
    button.classList.toggle("active", button.dataset.lightTone === toneKey);
  });
}

function applyLightIntensity(value) {
  const normalized = Number(value) / 100;
  if (pulseLight) pulseLight.userData.baseIntensity = 1.8 * normalized;
  if (ambientLight) ambientLight.intensity = 1.55 + normalized * 0.7;
  if (sunLight) sunLight.intensity = 1.55 + normalized * 0.7;
}

function setPlanStatus(status, meta) {
  if (planStatus) planStatus.textContent = status;
  if (planMeta) planMeta.textContent = meta;
  updateWorkflowBoard();
  updateDecisionBoard();
}

function setRecognitionStatus(text) {
  if (recognitionStatus) recognitionStatus.textContent = text;
  updateWorkflowBoard();
  updateDecisionBoard();
}

function markModelReady() {
  window.__MODEL_READY__ = true;
  if (modelBootStatus) modelBootStatus.hidden = true;
}

function showModelBootIssue(title, detail) {
  if (!modelBootStatus) return;
  modelBootStatus.hidden = false;
  modelBootStatus.querySelector("strong").textContent = title;
  modelBootStatus.querySelector("span").textContent = detail;
}

function disposeMaterial(material) {
  if (!material) return;
  material.map?.dispose?.();
  material.dispose?.();
}

function disposeObjectTree(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });
}

function clearTrellisModel() {
  if (trellisModelGroup) {
    scene.remove(trellisModelGroup);
    disposeObjectTree(trellisModelGroup);
    trellisModelGroup = null;
  }
  if (trellisAssetUrl) {
    URL.revokeObjectURL(trellisAssetUrl);
    trellisAssetUrl = null;
  }
}

function activePlanPlaneSize() {
  const width = Math.max(0.5, Number(planWidthInput?.value || 8.2));
  return {
    width,
    height: width / planAspect,
  };
}

function updatePlanRegionControls() {
  const hasPlan = Boolean(planCanvas);
  const hasRegion = Boolean(planRegion);
  const label = selectPlanRegionButton?.querySelector("span");

  if (selectPlanRegionButton) {
    selectPlanRegionButton.disabled = !hasPlan;
    selectPlanRegionButton.classList.toggle("active", isPlanRegionSelectionMode || hasRegion);
  }
  if (keepPlanRegionButton) {
    keepPlanRegionButton.disabled = !hasPlan || !hasRegion;
  }
  if (clearPlanRegionButton) {
    clearPlanRegionButton.disabled = !hasPlan || (!hasRegion && !isPlanRegionSelectionMode);
  }
  if (label) {
    label.textContent = isPlanRegionSelectionMode ? "拖拽框选" : hasRegion ? "重画区域" : "框选区域";
  }
}

function normalizePlanRegion(rawRegion) {
  if (!rawRegion || !planCanvas) return null;

  const firstX = rawRegion.x1 ?? rawRegion.x;
  const firstY = rawRegion.y1 ?? rawRegion.y;
  const secondX = rawRegion.x2 ?? rawRegion.x + rawRegion.width;
  const secondY = rawRegion.y2 ?? rawRegion.y + rawRegion.height;
  const minX = THREE.MathUtils.clamp(Math.min(firstX, secondX), 0, planCanvas.width);
  const maxX = THREE.MathUtils.clamp(Math.max(firstX, secondX), 0, planCanvas.width);
  const minY = THREE.MathUtils.clamp(Math.min(firstY, secondY), 0, planCanvas.height);
  const maxY = THREE.MathUtils.clamp(Math.max(firstY, secondY), 0, planCanvas.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function isUsefulPlanRegion(region) {
  return region && region.width >= 24 && region.height >= 24;
}

function planRegionSummary(region) {
  if (!region || !planCanvas) return "";
  const widthRatio = Math.round((region.width / planCanvas.width) * 100);
  const heightRatio = Math.round((region.height / planCanvas.height) * 100);
  return `已框选 ${widthRatio}% x ${heightRatio}%`;
}

function clearPlanRegionOverlay() {
  if (!planRegionOverlayGroup) return;

  planRegionOverlayGroup.parent?.remove(planRegionOverlayGroup);
  disposeObjectTree(planRegionOverlayGroup);
  planRegionOverlayGroup = null;
}

function localRectForPlanRegion(rawRegion) {
  const region = normalizePlanRegion(rawRegion);
  if (!region || region.width < 1 || region.height < 1) return null;

  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  const minLocalX = (region.x / planCanvas.width - 0.5) * planeWidth;
  const maxLocalX = ((region.x + region.width) / planCanvas.width - 0.5) * planeWidth;
  const minLocalY = (0.5 - (region.y + region.height) / planCanvas.height) * planeHeight;
  const maxLocalY = (0.5 - region.y / planCanvas.height) * planeHeight;

  return {
    region,
    minX: Math.min(minLocalX, maxLocalX),
    maxX: Math.max(minLocalX, maxLocalX),
    minY: Math.min(minLocalY, maxLocalY),
    maxY: Math.max(minLocalY, maxLocalY),
  };
}

function renderPlanRegionOverlay(rawRegion = planRegion) {
  clearPlanRegionOverlay();
  if (!planMesh || !planCanvas || !rawRegion) return;

  const rect = localRectForPlanRegion(rawRegion);
  if (!rect) return;

  const rectWidth = Math.max(0.01, rect.maxX - rect.minX);
  const rectHeight = Math.max(0.01, rect.maxY - rect.minY);
  const centerX = (rect.minX + rect.maxX) / 2;
  const centerY = (rect.minY + rect.maxY) / 2;
  const edgeThickness = THREE.MathUtils.clamp(Math.min(rectWidth, rectHeight) * 0.018, 0.018, 0.08);
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: colors.green,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const edgeMaterialOptions = {
    color: colors.green,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
    depthTest: false,
  };

  planRegionOverlayGroup = new THREE.Group();
  planRegionOverlayGroup.name = "plan-region-overlay";

  const fill = new THREE.Mesh(new THREE.PlaneGeometry(rectWidth, rectHeight), fillMaterial);
  fill.position.set(centerX, centerY, 0.018);
  fill.renderOrder = 4;
  planRegionOverlayGroup.add(fill);

  const addEdge = (x, y, width, height) => {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial(edgeMaterialOptions));
    edge.position.set(x, y, 0.026);
    edge.renderOrder = 5;
    planRegionOverlayGroup.add(edge);
  };

  addEdge(centerX, rect.minY, rectWidth, edgeThickness);
  addEdge(centerX, rect.maxY, rectWidth, edgeThickness);
  addEdge(rect.minX, centerY, edgeThickness, rectHeight);
  addEdge(rect.maxX, centerY, edgeThickness, rectHeight);

  planMesh.add(planRegionOverlayGroup);
}

function resetPlanRegionState() {
  isPlanRegionSelectionMode = false;
  isDrawingPlanRegion = false;
  planRegionPointerId = null;
  planRegion = null;
  planRegionDraft = null;
  designStage?.classList.remove("is-selecting-region");
  if (controls) controls.enabled = true;
  clearPlanRegionOverlay();
  updatePlanRegionControls();
}

function clearPlanRegion({ clearRecognition = true } = {}) {
  const hadRegion = Boolean(planRegion) || isPlanRegionSelectionMode;
  resetPlanRegionState();

  if (clearRecognition && hadRegion) {
    clearDetectedWalls();
    setRecognitionStatus(planCanvas ? "已取消框选，可识别全图" : "等待识别");
  }
}

function startPlanRegionSelection() {
  if (!planCanvas) {
    setRecognitionStatus("先导入图纸，再框选区域");
    return;
  }

  isScaleCalibrationMode = false;
  isDrawingScaleCalibration = false;
  scaleCalibrationPointerId = null;
  designStage?.classList.remove("is-calibrating-scale");
  isPlanRegionSelectionMode = true;
  isDrawingPlanRegion = false;
  planRegionDraft = null;
  designStage?.classList.add("is-selecting-region");
  renderPlanRegionOverlay(planRegion);
  updatePlanRegionControls();
  updateScaleControls();
  setRecognitionStatus("在图纸上拖拽框选需要识别的区域");
  setView("top");
}

function planPixelFromEvent(event) {
  if (!planCanvas || !planMesh) return null;

  updatePointerFromEvent(event);
  const hits = raycaster.intersectObject(planMesh, false);
  if (!hits.length) return null;

  const localPoint = planMesh.worldToLocal(hits[0].point.clone());
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  return {
    x: THREE.MathUtils.clamp((localPoint.x / planeWidth + 0.5) * planCanvas.width, 0, planCanvas.width),
    y: THREE.MathUtils.clamp((0.5 - localPoint.y / planeHeight) * planCanvas.height, 0, planCanvas.height),
  };
}

function beginPlanRegionDraw(event) {
  const startPoint = planPixelFromEvent(event);
  if (!startPoint) {
    setRecognitionStatus("请在图纸范围内拖拽框选");
    return;
  }

  isDrawingPlanRegion = true;
  planRegionPointerId = event.pointerId;
  planRegionDraft = {
    x1: startPoint.x,
    y1: startPoint.y,
    x2: startPoint.x,
    y2: startPoint.y,
  };
  controls.enabled = false;
  canvas.setPointerCapture?.(event.pointerId);
  renderPlanRegionOverlay(planRegionDraft);
  event.preventDefault();
}

function updatePlanRegionDraw(event) {
  if (!isDrawingPlanRegion || event.pointerId !== planRegionPointerId || !planRegionDraft) return;

  const currentPoint = planPixelFromEvent(event);
  if (!currentPoint) return;

  planRegionDraft.x2 = currentPoint.x;
  planRegionDraft.y2 = currentPoint.y;
  renderPlanRegionOverlay(planRegionDraft);
  event.preventDefault();
}

function finishPlanRegionDraw(event) {
  if (!isDrawingPlanRegion || event.pointerId !== planRegionPointerId) return false;

  isDrawingPlanRegion = false;
  planRegionPointerId = null;
  controls.enabled = true;
  canvas.releasePointerCapture?.(event.pointerId);

  const region = normalizePlanRegion(planRegionDraft);
  if (!isUsefulPlanRegion(region)) {
    planRegionDraft = null;
    renderPlanRegionOverlay(planRegion);
    setRecognitionStatus("框选区域太小，请重新拖拽");
    updatePlanRegionControls();
    event.preventDefault();
    return true;
  }

  planRegion = region;
  planRegionDraft = null;
  isPlanRegionSelectionMode = false;
  designStage?.classList.remove("is-selecting-region");
  clearDetectedWalls();
  renderPlanRegionOverlay(planRegion);
  updatePlanRegionControls();
  setRecognitionStatus(`${planRegionSummary(planRegion)} · 可识别墙线`);
  event.preventDefault();
  return true;
}

function updateScaleControls() {
  const hasPlan = Boolean(planCanvas);
  const hasScaleLine = Boolean(scaleCalibration);
  const label = calibrateScaleButton?.querySelector("span");

  if (calibrateScaleButton) {
    calibrateScaleButton.disabled = !hasPlan;
    calibrateScaleButton.classList.toggle("active", isScaleCalibrationMode || hasScaleLine);
  }
  if (scaleLengthInput) {
    scaleLengthInput.disabled = !hasPlan;
  }
  if (applyPlanScaleButton) {
    applyPlanScaleButton.disabled = !hasPlan || !hasScaleLine;
  }
  if (label) {
    label.textContent = isScaleCalibrationMode ? "拖拽比例" : hasScaleLine ? "重画比例" : "标定比例";
  }
}

function normalizeScaleLine(rawLine) {
  if (!rawLine || !planCanvas) return null;

  return {
    x1: THREE.MathUtils.clamp(rawLine.x1, 0, planCanvas.width),
    y1: THREE.MathUtils.clamp(rawLine.y1, 0, planCanvas.height),
    x2: THREE.MathUtils.clamp(rawLine.x2, 0, planCanvas.width),
    y2: THREE.MathUtils.clamp(rawLine.y2, 0, planCanvas.height),
  };
}

function scaleLinePixelLength(line) {
  if (!line) return 0;
  return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
}

function isUsefulScaleLine(line) {
  return scaleLinePixelLength(line) >= 12;
}

function planLocalPointForPixel(x, y, z = 0) {
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  return new THREE.Vector3(
    (x / planCanvas.width - 0.5) * planeWidth,
    (0.5 - y / planCanvas.height) * planeHeight,
    z,
  );
}

function clearScaleOverlay() {
  if (!scaleOverlayGroup) return;

  scaleOverlayGroup.parent?.remove(scaleOverlayGroup);
  disposeObjectTree(scaleOverlayGroup);
  scaleOverlayGroup = null;
}

function renderScaleOverlay(rawLine = scaleCalibration) {
  clearScaleOverlay();
  if (!planMesh || !planCanvas || !rawLine) return;

  const line = normalizeScaleLine(rawLine);
  if (!line || scaleLinePixelLength(line) < 1) return;

  const start = planLocalPointForPixel(line.x1, line.y1, 0.04);
  const end = planLocalPointForPixel(line.x2, line.y2, 0.04);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const localLength = Math.hypot(dx, dy);
  if (localLength < 0.01) return;

  const lineMaterial = new THREE.MeshBasicMaterial({
    color: colors.gold,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const endpointMaterial = new THREE.MeshBasicMaterial({
    color: colors.coral,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const thickness = THREE.MathUtils.clamp(localLength * 0.012, 0.018, 0.06);
  const endpointRadius = thickness * 2.4;

  scaleOverlayGroup = new THREE.Group();
  scaleOverlayGroup.name = "scale-calibration-overlay";

  const scaleLine = new THREE.Mesh(new THREE.PlaneGeometry(localLength, thickness), lineMaterial);
  scaleLine.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, 0.042);
  scaleLine.rotation.z = Math.atan2(dy, dx);
  scaleLine.renderOrder = 7;
  scaleOverlayGroup.add(scaleLine);

  [start, end].forEach((point) => {
    const endpoint = new THREE.Mesh(new THREE.CircleGeometry(endpointRadius, 24), endpointMaterial.clone());
    endpoint.position.set(point.x, point.y, 0.05);
    endpoint.renderOrder = 8;
    scaleOverlayGroup.add(endpoint);
  });

  planMesh.add(scaleOverlayGroup);
}

function resetScaleCalibrationState() {
  isScaleCalibrationMode = false;
  isDrawingScaleCalibration = false;
  scaleCalibrationPointerId = null;
  scaleCalibration = null;
  scaleCalibrationDraft = null;
  designStage?.classList.remove("is-calibrating-scale");
  if (controls) controls.enabled = true;
  clearScaleOverlay();
  updateScaleControls();
}

function startScaleCalibration() {
  if (!planCanvas) {
    setRecognitionStatus("先导入图纸，再标定比例");
    return;
  }

  isPlanRegionSelectionMode = false;
  isDrawingPlanRegion = false;
  planRegionPointerId = null;
  designStage?.classList.remove("is-selecting-region");
  isScaleCalibrationMode = true;
  isDrawingScaleCalibration = false;
  scaleCalibrationDraft = null;
  designStage?.classList.add("is-calibrating-scale");
  renderScaleOverlay(scaleCalibration);
  updatePlanRegionControls();
  updateScaleControls();
  setRecognitionStatus("在图纸上拖一段已知长度，再输入实长并应用比例");
  setView("top");
}

function beginScaleCalibrationDraw(event) {
  const startPoint = planPixelFromEvent(event);
  if (!startPoint) {
    setRecognitionStatus("请在图纸范围内拖拽比例尺");
    return;
  }

  isDrawingScaleCalibration = true;
  scaleCalibrationPointerId = event.pointerId;
  scaleCalibrationDraft = {
    x1: startPoint.x,
    y1: startPoint.y,
    x2: startPoint.x,
    y2: startPoint.y,
  };
  controls.enabled = false;
  canvas.setPointerCapture?.(event.pointerId);
  renderScaleOverlay(scaleCalibrationDraft);
  event.preventDefault();
}

function updateScaleCalibrationDraw(event) {
  if (!isDrawingScaleCalibration || event.pointerId !== scaleCalibrationPointerId || !scaleCalibrationDraft) return;

  const currentPoint = planPixelFromEvent(event);
  if (!currentPoint) return;

  scaleCalibrationDraft.x2 = currentPoint.x;
  scaleCalibrationDraft.y2 = currentPoint.y;
  renderScaleOverlay(scaleCalibrationDraft);
  event.preventDefault();
}

function finishScaleCalibrationDraw(event) {
  if (!isDrawingScaleCalibration || event.pointerId !== scaleCalibrationPointerId) return false;

  isDrawingScaleCalibration = false;
  scaleCalibrationPointerId = null;
  controls.enabled = true;
  canvas.releasePointerCapture?.(event.pointerId);

  const line = normalizeScaleLine(scaleCalibrationDraft);
  if (!isUsefulScaleLine(line)) {
    scaleCalibrationDraft = null;
    renderScaleOverlay(scaleCalibration);
    setRecognitionStatus("比例尺太短，请重新拖一段更长的线");
    updateScaleControls();
    event.preventDefault();
    return true;
  }

  scaleCalibration = line;
  scaleCalibrationDraft = null;
  isScaleCalibrationMode = false;
  designStage?.classList.remove("is-calibrating-scale");
  renderScaleOverlay(scaleCalibration);
  updateScaleControls();
  setRecognitionStatus(`比例尺 ${Math.round(scaleLinePixelLength(scaleCalibration))} px · 输入实长后点应用比例`);
  event.preventDefault();
  return true;
}

function applyScaleCalibration() {
  if (!planCanvas) {
    setRecognitionStatus("先导入图纸，再标定比例");
    return;
  }

  const line = normalizeScaleLine(scaleCalibration);
  if (!isUsefulScaleLine(line)) {
    setRecognitionStatus("先点标定比例，在图纸上拖一段已知长度");
    return;
  }

  const actualLength = Number(scaleLengthInput?.value);
  if (!Number.isFinite(actualLength) || actualLength <= 0) {
    setRecognitionStatus("请输入比例尺真实长度");
    return;
  }

  const pixels = scaleLinePixelLength(line);
  const metersPerPixel = actualLength / pixels;
  const planWidthMeters = metersPerPixel * planCanvas.width;
  if (planWidthInput) {
    planWidthInput.value = planWidthMeters >= 10 ? planWidthMeters.toFixed(1) : planWidthMeters.toFixed(2);
  }

  scaleCalibration = line;
  updatePlanMesh();
  setRecognitionStatus(`比例已应用：${(pixels / actualLength).toFixed(1)} px/m · 图宽 ${planWidthInput?.value ?? planWidthMeters.toFixed(1)} m`);
  if (detectedWallResult) updateWallEditor();
}

function recognitionSourceForPlan() {
  if (!planCanvas) return null;

  const region = normalizePlanRegion(planRegion);
  if (!isUsefulPlanRegion(region)) {
    return {
      canvas: planCanvas,
      sourceRect: null,
      label: "全图",
    };
  }

  const cropped = croppedCanvasForRegion(region);
  return {
    canvas: cropped.canvas,
    sourceRect: cropped.sourceRect,
    label: "框选区域",
  };
}

function croppedCanvasForRegion(region) {
  const sourceX = Math.floor(region.x);
  const sourceY = Math.floor(region.y);
  const sourceEndX = Math.ceil(region.x + region.width);
  const sourceEndY = Math.ceil(region.y + region.height);
  const sourceWidth = Math.max(1, Math.min(planCanvas.width - sourceX, sourceEndX - sourceX));
  const sourceHeight = Math.max(1, Math.min(planCanvas.height - sourceY, sourceEndY - sourceY));
  const output = document.createElement("canvas");
  output.width = sourceWidth;
  output.height = sourceHeight;
  output
    .getContext("2d")
    .drawImage(planCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  return {
    canvas: output,
    sourceRect: {
      x: sourceX,
      y: sourceY,
      width: sourceWidth,
      height: sourceHeight,
      canvasWidth: planCanvas.width,
      canvasHeight: planCanvas.height,
    },
  };
}

function keepOnlyPlanRegion() {
  if (!planCanvas) {
    setRecognitionStatus("先导入图纸，再框选区域");
    return;
  }

  const region = normalizePlanRegion(planRegion);
  if (!isUsefulPlanRegion(region)) {
    setRecognitionStatus("先拖拽框选需要保留的区域");
    return;
  }

  const oldPlaneWidth = activePlanPlaneSize().width;
  const cropped = croppedCanvasForRegion(region);
  const croppedPlanWidth = oldPlaneWidth * (cropped.sourceRect.width / Math.max(1, cropped.sourceRect.canvasWidth));

  clearDetectedWalls();
  disposePlan();
  planCanvas = cropped.canvas;
  planAspect = planCanvas.width / planCanvas.height;
  if (planWidthInput) {
    planWidthInput.value = Math.max(0.5, croppedPlanWidth).toFixed(1);
  }
  resetPlanRegionState();
  resetScaleCalibrationState();
  updatePlanMesh();
  setPlanStatus("Selected plan region kept", `${planCanvas.width} x ${planCanvas.height} px`);
  setRecognitionStatus("只保留了框选区域，可重新识别墙线");
  setView("top");
}

function disposePlan() {
  clearPlanRegionOverlay();
  clearScaleOverlay();

  if (planMesh) {
    scene.remove(planMesh);
    planMesh.geometry.dispose();
    planMesh.material.dispose();
    planMesh = null;
  }

  if (planTexture) {
    planTexture.dispose();
    planTexture = null;
  }
}

function updatePlanMesh() {
  if (!planCanvas) return;

  const { width, height } = activePlanPlaneSize();
  const opacity = Number(planOpacityRange?.value || 82) / 100;

  if (!planTexture) {
    planTexture = new THREE.CanvasTexture(planCanvas);
    planTexture.colorSpace = THREE.SRGBColorSpace;
    planTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  if (!planMesh) {
    planMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: planTexture,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      }),
    );
    planMesh.rotation.x = -Math.PI / 2;
    planMesh.position.y = 0.008;
    planMesh.renderOrder = 1;
    scene.add(planMesh);
  } else {
    planMesh.geometry.dispose();
    planMesh.geometry = new THREE.PlaneGeometry(width, height);
    planMesh.material.opacity = opacity;
  }

  planMesh.rotation.z = THREE.MathUtils.degToRad(planRotation);
  if (gridHelper) gridHelper.visible = false;
  shellMeshes.wall.forEach((mesh) => {
    mesh.visible = false;
  });
  designStage?.classList.add("has-plan");

  if (detectedWallResult) {
    renderDetectedWalls(detectedWallResult);
  }
  if (generated3DActive && detectedWallResult) {
    build3DFromDetectedWalls();
  }
  renderPlanRegionOverlay(isDrawingPlanRegion ? planRegionDraft : planRegion);
  renderScaleOverlay(isDrawingScaleCalibration ? scaleCalibrationDraft : scaleCalibration);
  updatePlanRegionControls();
  updateScaleControls();
}

function clearPlan() {
  clearDetectedWalls();
  clearGenerated3D();
  resetPlanRegionState();
  resetScaleCalibrationState();
  disposePlan();
  planCanvas = null;
  originalPlanCanvas = null;
  planAspect = 1;
  planRotation = 0;
  if (gridHelper) gridHelper.visible = true;
  shellMeshes.wall.forEach((mesh) => {
    mesh.visible = true;
  });
  designStage?.classList.remove("has-plan");
  setPlanStatus("尚未导入图纸", "支持 JPG / PNG / PDF");
  setRecognitionStatus("等待识别");
  updatePlanRegionControls();
  updateScaleControls();
}

function canvasFromBitmap(bitmap) {
  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(bitmap.width * scale));
  output.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = output.getContext("2d");
  context.drawImage(bitmap, 0, 0, output.width, output.height);
  return output;
}

async function renderImagePlan(file) {
  const bitmap = await createImageBitmap(file);
  const output = canvasFromBitmap(bitmap);
  bitmap.close?.();
  return {
    canvas: output,
    meta: `${output.width} x ${output.height} px`,
  };
}

async function renderPdfPlan(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewportAtOne = page.getViewport({ scale: 1 });
  const targetWidth = Math.min(1800, Math.max(1200, viewportAtOne.width));
  const scale = targetWidth / viewportAtOne.width;
  const viewport = page.getViewport({ scale });
  const output = document.createElement("canvas");
  output.width = Math.round(viewport.width);
  output.height = Math.round(viewport.height);
  const context = output.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;
  return {
    canvas: output,
    meta: `PDF 第 1 / ${pdf.numPages} 页 · ${output.width} x ${output.height} px`,
  };
}

function cloneCanvas(sourceCanvas) {
  if (!sourceCanvas) return null;
  const output = document.createElement("canvas");
  output.width = sourceCanvas.width;
  output.height = sourceCanvas.height;
  output.getContext("2d").drawImage(sourceCanvas, 0, 0);
  return output;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function sampleCanvasPixels(sourceCanvas, maxSide = 900) {
  const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
  const width = Math.max(1, Math.round(sourceCanvas.width * scale));
  const height = Math.max(1, Math.round(sourceCanvas.height * scale));
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const context = sample.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const gray = new Uint8Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const pixel = index * 4;
    gray[index] = Math.round(
      imageData.data[pixel] * 0.2126 + imageData.data[pixel + 1] * 0.7152 + imageData.data[pixel + 2] * 0.0722,
    );
  }
  return { canvas: sample, width, height, data: imageData.data, gray };
}

function varianceOfLaplacian(gray, width, height) {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const value =
        gray[index] * 4 - gray[index - 1] - gray[index + 1] - gray[index - width] - gray[index + width];
      sum += value;
      sumSquares += value * value;
      count += 1;
    }
  }
  const mean = sum / Math.max(1, count);
  return sumSquares / Math.max(1, count) - mean * mean;
}

function estimatePlanSkew(gray, width, height) {
  const edges = [];
  const step = Math.max(2, Math.round(Math.max(width, height) / 380));
  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const index = y * width + x;
      const gradient =
        Math.abs(gray[index + step] - gray[index - step]) + Math.abs(gray[index + step * width] - gray[index - step * width]);
      if (gradient > 58 && gray[index] < 218) edges.push([x - width / 2, y - height / 2]);
    }
  }
  if (edges.length < 120) return { angle: 0, confidence: 0 };

  let bestAngle = 0;
  let bestScore = -Infinity;
  for (let angle = -8; angle <= 8; angle += 0.5) {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const horizontalBins = new Map();
    const verticalBins = new Map();
    edges.forEach(([x, y]) => {
      const projectedY = Math.round((x * sin + y * cos) / 5);
      const projectedX = Math.round((x * cos - y * sin) / 5);
      horizontalBins.set(projectedY, (horizontalBins.get(projectedY) ?? 0) + 1);
      verticalBins.set(projectedX, (verticalBins.get(projectedX) ?? 0) + 1);
    });
    let score = 0;
    horizontalBins.forEach((count) => {
      score += count * count;
    });
    verticalBins.forEach((count) => {
      score += count * count * 0.78;
    });
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }
  return { angle: bestAngle, confidence: Math.min(1, bestScore / Math.max(1, edges.length * edges.length * 0.018)) };
}

function estimatePerspectiveRisk(gray, width, height) {
  const threshold = Math.min(215, Math.max(150, otsuThreshold(gray)));
  const boundsAtRow = (row) => {
    let left = width;
    let right = 0;
    const y = Math.max(0, Math.min(height - 1, Math.round(row)));
    for (let x = 0; x < width; x += 1) {
      if (gray[y * width + x] < threshold) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    return right > left ? { left, right, span: right - left } : null;
  };
  const top = boundsAtRow(height * 0.18);
  const middle = boundsAtRow(height * 0.5);
  const bottom = boundsAtRow(height * 0.82);
  if (!top || !middle || !bottom) return 0;
  const taper = Math.abs(top.span - bottom.span) / Math.max(1, middle.span);
  const centerShift = Math.abs((top.left + top.right - bottom.left - bottom.right) / 2) / Math.max(1, width);
  return Math.min(1, taper * 2.1 + centerShift * 3.2);
}

function estimateTextureAndFoldRisk(gray, width, height) {
  let lowContrastMid = 0;
  let total = 0;
  let sum = 0;
  let sumSquares = 0;
  for (let index = 0; index < gray.length; index += 1) {
    const value = gray[index];
    sum += value;
    sumSquares += value * value;
    if (value > 92 && value < 224) lowContrastMid += 1;
    total += 1;
  }
  const mean = sum / Math.max(1, total);
  const variance = sumSquares / Math.max(1, total) - mean * mean;
  const textureRisk = Math.min(1, (lowContrastMid / Math.max(1, total)) * 1.45 + (variance < 980 ? 0.22 : 0));

  const rowMeans = [];
  const columnMeans = [];
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) rowSum += gray[y * width + x];
    rowMeans.push(rowSum / width);
  }
  for (let x = 0; x < width; x += 1) {
    let columnSum = 0;
    for (let y = 0; y < height; y += 1) columnSum += gray[y * width + x];
    columnMeans.push(columnSum / height);
  }
  const bandScore = (values) => {
    let hits = 0;
    for (let index = 2; index < values.length - 2; index += 1) {
      const local = (values[index - 2] + values[index - 1] + values[index + 1] + values[index + 2]) / 4;
      if (Math.abs(values[index] - local) > 9) hits += 1;
    }
    return hits / Math.max(1, values.length);
  };
  return {
    textureRisk,
    foldRisk: Math.min(1, Math.max(bandScore(rowMeans), bandScore(columnMeans)) * 5.8),
  };
}

function analyzePlanPhotoQuality(sourceCanvas = planCanvas) {
  if (!sourceCanvas) return null;
  const sample = sampleCanvasPixels(sourceCanvas);
  const blurVariance = varianceOfLaplacian(sample.gray, sample.width, sample.height);
  const skew = estimatePlanSkew(sample.gray, sample.width, sample.height);
  const perspectiveRisk = Math.max(estimatePerspectiveRisk(sample.gray, sample.width, sample.height), Math.abs(skew.angle) / 8);
  const texture = estimateTextureAndFoldRisk(sample.gray, sample.width, sample.height);
  return {
    blurVariance,
    blurRisk: Math.max(0, Math.min(1, (420 - blurVariance) / 420)),
    skewAngle: skew.angle,
    skewConfidence: skew.confidence,
    perspectiveRisk,
    textureRisk: texture.textureRisk,
    foldRisk: texture.foldRisk,
  };
}

function qualityState(value, warn = 0.34, bad = 0.62) {
  if (value >= bad) return "is-bad";
  if (value >= warn) return "is-warn";
  return "is-good";
}

function riskLabel(value) {
  if (value >= 0.62) return "High";
  if (value >= 0.34) return "Medium";
  return "OK";
}

function renderPlanPhotoQuality(quality) {
  if (!photoQualityMetrics || !photoQualitySummary) return;
  if (!quality) {
    photoQualitySummary.textContent = "Import a plan photo to detect perspective, blur, watermark, folds and texture.";
    photoQualityMetrics.innerHTML = ["Perspective", "Blur", "Watermark", "Folds"]
      .map((label) => `<div class="quality-chip is-idle"><span>${label}</span><strong>Idle</strong></div>`)
      .join("");
    return;
  }
  const items = [
    { label: "Perspective", value: quality.perspectiveRisk, detail: `${riskLabel(quality.perspectiveRisk)} ${quality.skewAngle.toFixed(1)}deg` },
    { label: "Blur", value: quality.blurRisk, detail: `${riskLabel(quality.blurRisk)} ${Math.round(quality.blurVariance)}` },
    { label: "Watermark", value: quality.textureRisk, detail: riskLabel(quality.textureRisk) },
    { label: "Folds", value: quality.foldRisk, detail: riskLabel(quality.foldRisk) },
  ];
  const issueCount = items.filter((item) => item.value >= 0.34).length;
  photoQualitySummary.textContent = issueCount
    ? `Detected ${issueCount} quality risks. Clean and enhance before wall recognition.`
    : "Photo quality is stable. Wall recognition can run now.";
  photoQualityMetrics.innerHTML = items
    .map(
      (item) =>
        `<div class="quality-chip ${qualityState(item.value)}"><span>${item.label}</span><strong>${item.detail}</strong></div>`,
    )
    .join("");
}
function rotateCanvas(sourceCanvas, angleDegrees) {
  if (Math.abs(angleDegrees) < 0.15) return cloneCanvas(sourceCanvas);
  const radians = (angleDegrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const output = document.createElement("canvas");
  output.width = Math.ceil(sourceCanvas.width * cos + sourceCanvas.height * sin);
  output.height = Math.ceil(sourceCanvas.width * sin + sourceCanvas.height * cos);
  const context = output.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.translate(output.width / 2, output.height / 2);
  context.rotate(radians);
  context.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
  return output;
}

function enhancePlanCanvas(sourceCanvas, quality = analyzePlanPhotoQuality(sourceCanvas)) {
  const deskewed = rotateCanvas(sourceCanvas, -(quality?.skewAngle ?? 0));
  const scale = Math.min(1.65, Math.max(1, 2400 / Math.max(deskewed.width, deskewed.height)));
  const width = Math.max(1, Math.round(deskewed.width * scale));
  const height = Math.max(1, Math.round(deskewed.height * scale));
  const working = document.createElement("canvas");
  working.width = width;
  working.height = height;
  const workingContext = working.getContext("2d", { willReadFrequently: true });
  workingContext.imageSmoothingEnabled = true;
  workingContext.imageSmoothingQuality = "high";
  workingContext.fillStyle = "#ffffff";
  workingContext.fillRect(0, 0, width, height);
  workingContext.drawImage(deskewed, 0, 0, width, height);

  const blur = document.createElement("canvas");
  blur.width = width;
  blur.height = height;
  const blurContext = blur.getContext("2d", { willReadFrequently: true });
  blurContext.filter = `blur(${Math.max(6, Math.round(Math.max(width, height) / 115))}px)`;
  blurContext.drawImage(working, 0, 0);
  blurContext.filter = "none";

  const image = workingContext.getImageData(0, 0, width, height);
  const background = blurContext.getImageData(0, 0, width, height);
  const correctedGray = new Uint8Array(width * height);
  for (let index = 0; index < correctedGray.length; index += 1) {
    const pixel = index * 4;
    const gray = image.data[pixel] * 0.2126 + image.data[pixel + 1] * 0.7152 + image.data[pixel + 2] * 0.0722;
    const bg =
      background.data[pixel] * 0.2126 + background.data[pixel + 1] * 0.7152 + background.data[pixel + 2] * 0.0722;
    correctedGray[index] = clampByte(238 + (gray - bg) * 1.9 + (gray - 188) * 0.35);
  }

  const sharpened = new Uint8ClampedArray(image.data.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const pixel = index * 4;
      const center = correctedGray[index];
      const left = correctedGray[y * width + Math.max(0, x - 1)];
      const right = correctedGray[y * width + Math.min(width - 1, x + 1)];
      const top = correctedGray[Math.max(0, y - 1) * width + x];
      const bottom = correctedGray[Math.min(height - 1, y + 1) * width + x];
      const localBlur = (left + right + top + bottom) / 4;
      const edge = center - localBlur;
      let value = clampByte(center + edge * 1.45);
      if (value < 118 && Math.abs(edge) > 7) value = Math.max(0, value - 28);
      if (value > 204 && Math.abs(edge) < 9) value = Math.min(255, value + 18);
      sharpened[pixel] = value;
      sharpened[pixel + 1] = value;
      sharpened[pixel + 2] = value;
      sharpened[pixel + 3] = 255;
    }
  }

  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  output.getContext("2d").putImageData(new ImageData(sharpened, width, height), 0, 0);
  return output;
}

function analyzeCurrentPlanPhoto() {
  if (!planCanvas) {
    renderPlanPhotoQuality(null);
    setPlanStatus("Import a plan photo first", "JPG / PNG / PDF");
    return null;
  }
  const quality = analyzePlanPhotoQuality(planCanvas);
  renderPlanPhotoQuality(quality);
  return quality;
}

function cleanCurrentPlanPhoto() {
  if (!planCanvas) {
    setPlanStatus("Import a plan photo first", "JPG / PNG / PDF");
    return;
  }
  const quality = analyzeCurrentPlanPhoto();
  originalPlanCanvas = originalPlanCanvas || cloneCanvas(planCanvas);
  const enhanced = enhancePlanCanvas(planCanvas, quality);
  planCanvas = enhanced;
  planAspect = enhanced.width / enhanced.height;
  clearDetectedWalls();
  resetPlanRegionState();
  updatePlanMesh();
  const afterQuality = analyzePlanPhotoQuality(planCanvas);
  renderPlanPhotoQuality(afterQuality);
  setPlanStatus("Plan photo cleaned and enhanced", `${enhanced.width} x ${enhanced.height} px`);
  setRecognitionStatus("Edges enhanced. Run wall recognition again.");
}

function restoreOriginalPlanPhoto() {
  if (!originalPlanCanvas) return;
  planCanvas = cloneCanvas(originalPlanCanvas);
  planAspect = planCanvas.width / planCanvas.height;
  clearDetectedWalls();
  resetPlanRegionState();
  updatePlanMesh();
  renderPlanPhotoQuality(analyzePlanPhotoQuality(planCanvas));
  setPlanStatus("Original plan photo restored", `${planCanvas.width} x ${planCanvas.height} px`);
  setRecognitionStatus("Run wall recognition again.");
}

async function importPlanFile(file) {
  if (!file) return;

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    setPlanStatus("Unsupported file format", "JPG / PNG / PDF");
    return;
  }

  setPlanStatus("读取中...", file.name);

  try {
    const result = isPdf ? await renderPdfPlan(file) : await renderImagePlan(file);
    disposePlan();
    resetPlanRegionState();
    resetScaleCalibrationState();
    planCanvas = result.canvas;
    originalPlanCanvas = cloneCanvas(result.canvas);
    planAspect = result.canvas.width / result.canvas.height;
    planRotation = 0;
    clearDetectedWalls();
    updatePlanMesh();
    setPlanStatus(file.name, result.meta);
    renderPlanPhotoQuality(analyzePlanPhotoQuality(planCanvas));
    setRecognitionStatus("可识别墙线");
    setView("top");
  } catch (error) {
    console.error(error);
    clearPlan();
    setPlanStatus("读取失败", "请换一份图纸再试");
  }
}

function otsuThreshold(grayscale) {
  const histogram = new Array(256).fill(0);
  grayscale.forEach((value) => {
    histogram[value] += 1;
  });

  const total = grayscale.length;
  let sum = 0;
  histogram.forEach((count, value) => {
    sum += value * count;
  });

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 150;

  for (let value = 0; value < 256; value += 1) {
    weightBackground += histogram[value];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += value * histogram[value];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = value;
    }
  }

  return Math.min(190, Math.max(70, threshold));
}

function hueForRgb(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

function colorProfileForRgb(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max <= 0 ? 0 : (max - min) / max;
  return {
    brightness: max,
    hue: hueForRgb(r, g, b),
    saturation,
  };
}

function isPlanAnnotationColor(r, g, b) {
  const profile = colorProfileForRgb(r, g, b);
  if (profile.brightness < 82 || profile.saturation < 0.32) return false;
  const redOrPink = profile.hue <= 34 || profile.hue >= 330;
  const orange = profile.hue >= 35 && profile.hue <= 54;
  const yellowLabel = profile.hue >= 48 && profile.hue <= 72 && profile.brightness > 150;
  return redOrPink || orange || yellowLabel;
}

function isPlanStructuralWallColor(r, g, b) {
  const profile = colorProfileForRgb(r, g, b);
  if (profile.saturation < 0.18 || profile.brightness < 58 || profile.brightness > 215) return false;
  return profile.hue >= 92 && profile.hue <= 174;
}

function isPlanWindowHighlightColor(r, g, b) {
  const profile = colorProfileForRgb(r, g, b);
  if (profile.saturation < 0.14 || profile.brightness < 126) return false;
  return profile.hue >= 176 && profile.hue <= 205;
}

function analyzePlanVisualPixels(imageData, width, height, grayscale) {
  let darkPixels = 0;
  let brightPixels = 0;
  let saturatedPixels = 0;
  let annotationPixels = 0;
  let cornerDarkPixels = 0;
  let cornerSamples = 0;
  let sum = 0;
  const cornerSize = Math.max(4, Math.round(Math.min(width, height) * 0.045));

  for (let index = 0; index < grayscale.length; index += 1) {
    const x = index % width;
    const y = Math.floor(index / width);
    const pixel = index * 4;
    const gray = grayscale[index];
    const r = imageData[pixel];
    const g = imageData[pixel + 1];
    const b = imageData[pixel + 2];
    const profile = colorProfileForRgb(r, g, b);
    sum += gray;
    if (gray < 72) darkPixels += 1;
    if (gray > 205) brightPixels += 1;
    if (profile.saturation > 0.22 && profile.brightness > 70) saturatedPixels += 1;
    if (isPlanAnnotationColor(r, g, b)) annotationPixels += 1;

    const inCorner =
      (x < cornerSize || x >= width - cornerSize) && (y < cornerSize || y >= height - cornerSize);
    if (inCorner) {
      cornerSamples += 1;
      if (gray < 70) cornerDarkPixels += 1;
    }
  }

  const total = Math.max(1, grayscale.length);
  const darkRatio = darkPixels / total;
  const brightRatio = brightPixels / total;
  const colorRatio = saturatedPixels / total;
  const annotationRatio = annotationPixels / total;
  const cornerDarkRatio = cornerDarkPixels / Math.max(1, cornerSamples);
  const average = sum / total;
  const darkBackground = cornerDarkRatio > 0.62 && darkRatio > 0.42 && brightRatio < 0.38;
  const planType = darkBackground
    ? "black-cad"
    : colorRatio > 0.08
      ? "colored-layout"
      : annotationRatio > 0.018
        ? "annotated-layout"
        : "structural-plan";

  return {
    average,
    darkBackground,
    darkRatio,
    brightRatio,
    colorRatio,
    annotationRatio,
    cornerDarkRatio,
    planType,
  };
}

function buildInkMap(sourceCanvas) {
  const maxSide = 1100;
  const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
  const width = Math.max(1, Math.round(sourceCanvas.width * scale));
  const height = Math.max(1, Math.round(sourceCanvas.height * scale));
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const context = sample.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const grayscale = new Uint8Array(width * height);

  for (let index = 0; index < grayscale.length; index += 1) {
    const pixel = index * 4;
    grayscale[index] = Math.round(
      imageData[pixel] * 0.2126 + imageData[pixel + 1] * 0.7152 + imageData[pixel + 2] * 0.0722,
    );
  }

  const visual = analyzePlanVisualPixels(imageData, width, height, grayscale);
  const threshold = otsuThreshold(grayscale);
  const ink = new Uint8Array(width * height);
  const structuralColorInk = new Uint8Array(width * height);
  for (let index = 0; index < ink.length; index += 1) {
    const pixel = index * 4;
    const r = imageData[pixel];
    const g = imageData[pixel + 1];
    const b = imageData[pixel + 2];
    const structuralWallColor = isPlanStructuralWallColor(r, g, b);
    const windowHighlightColor = isPlanWindowHighlightColor(r, g, b);
    const annotationColor = isPlanAnnotationColor(r, g, b);
    if (structuralWallColor) structuralColorInk[index] = 1;
    if (annotationColor && !structuralWallColor) {
      ink[index] = 0;
      continue;
    }
    if (windowHighlightColor && !structuralWallColor) {
      ink[index] = 0;
      continue;
    }
    ink[index] = visual.darkBackground
      ? grayscale[index] >= Math.max(92, threshold)
        ? 1
        : 0
      : grayscale[index] <= Math.min(214, Math.max(threshold, 178))
        ? 1
        : 0;
    if (structuralWallColor) ink[index] = 1;
  }

  const wallInk = buildStructuralInkLayer(ink, width, height, structuralColorInk);
  return { width, height, ink, wallInk, structuralColorInk, grayscale, visual };
}

function buildStructuralInkLayer(ink, width, height, structuralColorInk = null) {
  const cleaned = new Uint8Array(ink.length);
  const visited = new Uint8Array(ink.length);
  const queue = [];
  const minComponentArea = Math.max(18, Math.round(Math.max(width, height) * 0.012));

  for (let index = 0; index < ink.length; index += 1) {
    if (!ink[index] || visited[index]) continue;

    queue.length = 0;
    queue.push(index);
    visited[index] = 1;
    const pixels = [];
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    while (queue.length > 0) {
      const current = queue.pop();
      const x = current % width;
      const y = Math.floor(current / width);
      pixels.push(current);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy += 1) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
          if (xx === x && yy === y) continue;
          const next = yy * width + xx;
          if (!ink[next] || visited[next]) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }
    }

    const componentWidth = maxX - minX + 1;
    const componentHeight = maxY - minY + 1;
    const longAxis = Math.max(componentWidth, componentHeight);
    const shortAxis = Math.min(componentWidth, componentHeight);
    const fillRatio = pixels.length / Math.max(1, componentWidth * componentHeight);
    const textLike =
      pixels.length < minComponentArea ||
      (longAxis < Math.max(18, Math.max(width, height) * 0.035) && shortAxis < 18 && fillRatio > 0.08);
    if (textLike) continue;

    pixels.forEach((pixel) => {
      cleaned[pixel] = 1;
    });
  }

  const structural = new Uint8Array(ink.length);
  const lineSupport = Math.max(4, Math.round(Math.max(width, height) * 0.004));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!cleaned[index]) continue;

      let horizontal = 0;
      let vertical = 0;
      for (let offset = -lineSupport; offset <= lineSupport; offset += 1) {
        const hx = x + offset;
        const vy = y + offset;
        if (hx >= 0 && hx < width) horizontal += cleaned[y * width + hx];
        if (vy >= 0 && vy < height) vertical += cleaned[vy * width + x];
      }

      if (horizontal >= lineSupport || vertical >= lineSupport) {
        structural[index] = 1;
      }
    }
  }

  if (structuralColorInk) {
    structuralColorInk.forEach((value, index) => {
      if (value) structural[index] = 1;
    });
  }

  return structural;
}

function scanRuns(map, orientation, inkKey = "ink", options = {}) {
  const { width, height } = map;
  const ink = map[inkKey] ?? map.ink;
  const horizontal = orientation === "horizontal";
  const outerLimit = horizontal ? height : width;
  const innerLimit = horizontal ? width : height;
  const minLength = Math.max(options.minLengthPx ?? 10, Math.round(innerLimit * (options.minLengthRatio ?? 0.025)));
  const supportThreshold = options.supportThreshold ?? 0.14;
  const runs = [];

  for (let outer = 0; outer < outerLimit; outer += 1) {
    let start = -1;

    for (let inner = 0; inner <= innerLimit; inner += 1) {
      const x = horizontal ? inner : outer;
      const y = horizontal ? outer : inner;
      const isInk = inner < innerLimit ? ink[y * width + x] === 1 : false;

      if (isInk && start === -1) start = inner;
      if ((!isInk || inner === innerLimit) && start !== -1) {
        const end = inner - 1;
        if (end - start + 1 >= minLength) {
          let support = 0;
          let total = 0;
          for (let neighbor = Math.max(0, outer - 2); neighbor <= Math.min(outerLimit - 1, outer + 2); neighbor += 1) {
            for (let cursor = start; cursor <= end; cursor += 1) {
              const nx = horizontal ? cursor : neighbor;
              const ny = horizontal ? neighbor : cursor;
              support += ink[ny * width + nx];
              total += 1;
            }
          }

          if (support / total >= supportThreshold) {
            runs.push({
              orientation,
              start,
              end,
              axis: outer,
            });
          }
        }
        start = -1;
      }
    }
  }

  return runs;
}

function mergeRuns(runs) {
  const merged = [];
  runs.forEach((run) => {
    const candidate = merged.find(
      (item) =>
        item.orientation === run.orientation &&
        Math.abs(item.axisCenter - run.axis) <= 4 &&
        Math.min(item.end, run.end) - Math.max(item.start, run.start) >=
          Math.min(item.end - item.start, run.end - run.start) * 0.45,
    );

    if (!candidate) {
      merged.push({
        orientation: run.orientation,
        start: run.start,
        end: run.end,
        minAxis: run.axis,
        maxAxis: run.axis,
        axisCenter: run.axis,
        samples: 1,
      });
      return;
    }

    candidate.start = Math.min(candidate.start, run.start);
    candidate.end = Math.max(candidate.end, run.end);
    candidate.minAxis = Math.min(candidate.minAxis, run.axis);
    candidate.maxAxis = Math.max(candidate.maxAxis, run.axis);
    candidate.samples += 1;
    candidate.axisCenter = (candidate.minAxis + candidate.maxAxis) / 2;
  });

  return merged.filter((segment) => segment.samples >= 2);
}

function segmentLength(segment) {
  return segment.end - segment.start;
}

function overlapLength(a, b) {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

function isLikelySheetBorder(segment, width, height) {
  const horizontal = segment.orientation === "horizontal";
  const outerLimit = horizontal ? height : width;
  const innerLimit = horizontal ? width : height;
  const nearEdge = segment.axisCenter <= outerLimit * 0.035 || segment.axisCenter >= outerLimit * 0.965;
  return nearEdge && segmentLength(segment) >= innerLimit * 0.55;
}

function mergeWallCandidates(candidates) {
  const merged = [];

  candidates
    .sort((a, b) => {
      if (a.orientation !== b.orientation) return a.orientation.localeCompare(b.orientation);
      if (a.axisCenter !== b.axisCenter) return a.axisCenter - b.axisCenter;
      return a.start - b.start;
    })
    .forEach((candidate) => {
      const existing = merged.find(
        (segment) =>
          segment.orientation === candidate.orientation &&
          Math.abs(segment.axisCenter - candidate.axisCenter) <= Math.max(3, Math.min(segment.thicknessPx, candidate.thicknessPx)) &&
          overlapLength(segment, candidate) >= Math.min(segmentLength(segment), segmentLength(candidate)) * 0.48,
      );

      if (!existing) {
        merged.push({ ...candidate });
        return;
      }

      existing.start = Math.min(existing.start, candidate.start);
      existing.end = Math.max(existing.end, candidate.end);
      existing.axisCenter = (existing.axisCenter + candidate.axisCenter) / 2;
      existing.thicknessPx = Math.max(existing.thicknessPx, candidate.thicknessPx);
      existing.confidence = Math.max(existing.confidence, candidate.confidence);
      existing.segmentedOutline = existing.segmentedOutline || candidate.segmentedOutline;
      existing.localReturn = existing.localReturn || candidate.localReturn;
      existing.returnRunCount = Math.max(existing.returnRunCount ?? 0, candidate.returnRunCount ?? 0);
      existing.returnSupportCount = Math.max(existing.returnSupportCount ?? 0, candidate.returnSupportCount ?? 0);
      existing.source = existing.source === candidate.source ? existing.source : "mixed";
    });

  return merged;
}

function snapParallelWallAxes(segments, tolerance = 7) {
  const snapped = segments.map((segment) => ({ ...segment }));

  ["horizontal", "vertical"].forEach((orientation) => {
    const group = snapped
      .filter((segment) => segment.orientation === orientation)
      .sort((a, b) => a.axisCenter - b.axisCenter);
    const clusters = [];

    group.forEach((segment) => {
      const cluster = clusters.find((item) => Math.abs(item.axisCenter - segment.axisCenter) <= tolerance);
      if (!cluster) {
        clusters.push({
          axisCenter: segment.axisCenter,
          weight: segmentLength(segment),
          members: [segment],
        });
        return;
      }

      const weight = segmentLength(segment);
      cluster.axisCenter = (cluster.axisCenter * cluster.weight + segment.axisCenter * weight) / Math.max(1, cluster.weight + weight);
      cluster.weight += weight;
      cluster.members.push(segment);
    });

    clusters.forEach((cluster) => {
      cluster.members.forEach((segment) => {
        segment.axisCenter = cluster.axisCenter;
      });
    });
  });

  return snapped;
}

function topologyJunctionTolerance(width, height, segment = null, options = {}) {
  const maxDimension = Math.max(width, height);
  const physicalGap = options.sourceRect
    ? Math.max(
        detectionPixelsForWorldLength(0.16, width, height, "x", options.sourceRect),
        detectionPixelsForWorldLength(0.16, width, height, "y", options.sourceRect),
      )
    : 0;
  return Math.min(
    Math.max(12, Math.round(maxDimension * 0.028)),
    Math.max(8, Math.round(maxDimension * 0.014), segment?.thicknessPx ? segment.thicknessPx * 2.7 : 0, physicalGap),
  );
}

function perpendicularWallCrossesAxis(wall, perpendicular, tolerance) {
  return wall.axisCenter >= perpendicular.start - tolerance && wall.axisCenter <= perpendicular.end + tolerance;
}

function perpendicularSupportInGap(first, second, allSegments, width, height, options = {}) {
  const tolerance = topologyJunctionTolerance(width, height, first, options);
  const gapStart = Math.min(first.end, second.start);
  const gapEnd = Math.max(first.end, second.start);
  const perpendicular = first.orientation === "horizontal" ? "vertical" : "horizontal";
  return allSegments.some((candidate) => {
    if (candidate === first || candidate === second || candidate.orientation !== perpendicular) return false;
    if (candidate.axisCenter < gapStart - tolerance || candidate.axisCenter > gapEnd + tolerance) return false;
    return perpendicularWallCrossesAxis(first, candidate, tolerance);
  });
}

function bridgeTinyWallBreaks(segments, width, height, options = {}) {
  const maxGap = Math.max(5, Math.round(Math.max(width, height) * 0.009));
  const junctionGap = Math.max(maxGap, topologyJunctionTolerance(width, height, null, options));
  const merged = [];

  snapParallelWallAxes(segments)
    .sort((a, b) => {
      if (a.orientation !== b.orientation) return a.orientation.localeCompare(b.orientation);
      if (a.axisCenter !== b.axisCenter) return a.axisCenter - b.axisCenter;
      return a.start - b.start;
    })
    .forEach((segment) => {
      const existing = merged.find(
        (item) =>
          item.orientation === segment.orientation &&
          Math.abs(item.axisCenter - segment.axisCenter) <= Math.max(4, item.thicknessPx, segment.thicknessPx) &&
          segment.start - item.end >= 0 &&
          (segment.start - item.end <= Math.max(maxGap, Math.min(item.thicknessPx, segment.thicknessPx) * 1.8) ||
            (segment.start - item.end <= junctionGap && perpendicularSupportInGap(item, segment, segments, width, height, options))),
      );

      if (!existing) {
        merged.push({ ...segment });
        return;
      }

      const bridgedGap = Math.max(0, segment.start - existing.end);
      existing.end = Math.max(existing.end, segment.end);
      existing.thicknessPx = Math.max(existing.thicknessPx, segment.thicknessPx);
      existing.confidence = Math.max(existing.confidence, segment.confidence);
      existing.segmentedOutline = existing.segmentedOutline || segment.segmentedOutline;
      existing.localReturn = existing.localReturn || segment.localReturn;
      existing.returnRunCount = Math.max(existing.returnRunCount ?? 0, segment.returnRunCount ?? 0);
      existing.returnSupportCount = Math.max(existing.returnSupportCount ?? 0, segment.returnSupportCount ?? 0);
      existing.source = existing.source === segment.source ? existing.source : "bridged";
      if (bridgedGap > maxGap && bridgedGap <= junctionGap) existing.ltJunctionBridged = true;
    });

  return merged;
}

function mergeCollinearWallSpans(segments, width, height, options = {}) {
  const tolerance = options.axisTolerance ?? Math.max(5, Math.round(Math.max(width, height) * 0.008));
  const maxGap = options.maxGap ?? Math.max(8, Math.round(Math.max(width, height) * 0.014));
  const merged = [];

  snapParallelWallAxes(segments, tolerance)
    .sort((a, b) => {
      if (a.orientation !== b.orientation) return a.orientation.localeCompare(b.orientation);
      if (a.axisCenter !== b.axisCenter) return a.axisCenter - b.axisCenter;
      return a.start - b.start;
    })
    .forEach((segment) => {
      const existing = merged.find(
        (item) =>
          item.orientation === segment.orientation &&
          Math.abs(item.axisCenter - segment.axisCenter) <= Math.max(tolerance, item.thicknessPx ?? 4, segment.thicknessPx ?? 4) &&
          segment.start <= item.end + maxGap &&
          segment.end >= item.start - maxGap,
      );

      if (!existing) {
        merged.push({ ...segment });
        return;
      }

      existing.start = Math.min(existing.start, segment.start);
      existing.end = Math.max(existing.end, segment.end);
      existing.axisCenter =
        (existing.axisCenter * Math.max(1, segmentLength(existing)) + segment.axisCenter * Math.max(1, segmentLength(segment))) /
        Math.max(1, segmentLength(existing) + segmentLength(segment));
      existing.thicknessPx = Math.max(existing.thicknessPx ?? 4, segment.thicknessPx ?? 4);
      existing.confidence = Math.max(existing.confidence ?? 0.5, segment.confidence ?? 0.5);
      existing.shortBranchPreserved = existing.shortBranchPreserved || segment.shortBranchPreserved;
      existing.ltJunctionSnapped = existing.ltJunctionSnapped || segment.ltJunctionSnapped;
      existing.ltJunctionBridged = existing.ltJunctionBridged || segment.ltJunctionBridged;
      existing.segmentedOutline = existing.segmentedOutline || segment.segmentedOutline;
      existing.localReturn = existing.localReturn || segment.localReturn;
      existing.returnRunCount = Math.max(existing.returnRunCount ?? 0, segment.returnRunCount ?? 0);
      existing.returnSupportCount = Math.max(existing.returnSupportCount ?? 0, segment.returnSupportCount ?? 0);
      existing.source = existing.source === segment.source ? existing.source : "topology-merged";
    });

  return merged;
}

function extendWallsToIntersections(segments, width, height, options = {}) {
  const tolerance = topologyJunctionTolerance(width, height, null, options);
  const extended = segments.map((segment) => ({ ...segment }));
  const horizontals = extended.filter((segment) => segment.orientation === "horizontal");
  const verticals = extended.filter((segment) => segment.orientation === "vertical");

  horizontals.forEach((horizontal) => {
    verticals.forEach((vertical) => {
      const yHitsVertical = horizontal.axisCenter >= vertical.start - tolerance && horizontal.axisCenter <= vertical.end + tolerance;
      const xNearHorizontal = vertical.axisCenter >= horizontal.start - tolerance && vertical.axisCenter <= horizontal.end + tolerance;
      if (!yHitsVertical && !xNearHorizontal) return;

      if (yHitsVertical) {
        if (Math.abs(horizontal.start - vertical.axisCenter) <= tolerance) horizontal.start = Math.min(horizontal.start, vertical.axisCenter);
        if (Math.abs(horizontal.end - vertical.axisCenter) <= tolerance) horizontal.end = Math.max(horizontal.end, vertical.axisCenter);
      }
      if (xNearHorizontal) {
        if (Math.abs(vertical.start - horizontal.axisCenter) <= tolerance) vertical.start = Math.min(vertical.start, horizontal.axisCenter);
        if (Math.abs(vertical.end - horizontal.axisCenter) <= tolerance) vertical.end = Math.max(vertical.end, horizontal.axisCenter);
      }
    });
  });

  return extended.map((segment) => ({
    ...segment,
    start: THREE.MathUtils.clamp(segment.start, 0, segment.orientation === "horizontal" ? width : height),
    end: THREE.MathUtils.clamp(segment.end, 0, segment.orientation === "horizontal" ? width : height),
  }));
}

function snapWallEndpointsToPerpendiculars(segments, width, height, options = {}) {
  const snapped = segments.map((segment) => ({ ...segment }));
  const horizontals = snapped.filter((segment) => segment.orientation === "horizontal");
  const verticals = snapped.filter((segment) => segment.orientation === "vertical");
  let snapCount = 0;

  const snapHorizontalEndpoint = (wall, endpoint) => {
    const tolerance = topologyJunctionTolerance(width, height, wall, options);
    const currentX = wall[endpoint];
    const best = verticals
      .filter((vertical) => Math.abs(vertical.axisCenter - currentX) <= tolerance)
      .filter((vertical) => wall.axisCenter >= vertical.start - tolerance && wall.axisCenter <= vertical.end + tolerance)
      .sort((a, b) => Math.abs(a.axisCenter - currentX) - Math.abs(b.axisCenter - currentX))[0];
    if (!best) return;
    if (Math.abs(wall[endpoint] - best.axisCenter) > 0.01) snapCount += 1;
    wall[endpoint] = best.axisCenter;
    if (wall.axisCenter < best.start) best.start = wall.axisCenter;
    if (wall.axisCenter > best.end) best.end = wall.axisCenter;
    best.ltJunctionSnapped = true;
  };

  const snapVerticalEndpoint = (wall, endpoint) => {
    const tolerance = topologyJunctionTolerance(width, height, wall, options);
    const currentY = wall[endpoint];
    const best = horizontals
      .filter((horizontal) => Math.abs(horizontal.axisCenter - currentY) <= tolerance)
      .filter((horizontal) => wall.axisCenter >= horizontal.start - tolerance && wall.axisCenter <= horizontal.end + tolerance)
      .sort((a, b) => Math.abs(a.axisCenter - currentY) - Math.abs(b.axisCenter - currentY))[0];
    if (!best) return;
    if (Math.abs(wall[endpoint] - best.axisCenter) > 0.01) snapCount += 1;
    wall[endpoint] = best.axisCenter;
    if (wall.axisCenter < best.start) best.start = wall.axisCenter;
    if (wall.axisCenter > best.end) best.end = wall.axisCenter;
    best.ltJunctionSnapped = true;
  };

  horizontals.forEach((wall) => {
    snapHorizontalEndpoint(wall, "start");
    snapHorizontalEndpoint(wall, "end");
  });
  verticals.forEach((wall) => {
    snapVerticalEndpoint(wall, "start");
    snapVerticalEndpoint(wall, "end");
  });

  return {
    segments: snapped
      .map((segment) => ({
        ...segment,
        start: THREE.MathUtils.clamp(Math.min(segment.start, segment.end), 0, segment.orientation === "horizontal" ? width : height),
        end: THREE.MathUtils.clamp(Math.max(segment.start, segment.end), 0, segment.orientation === "horizontal" ? width : height),
        topologyClosed: segment.topologyClosed || snapCount > 0,
      }))
      .filter((segment) => segment.end - segment.start > 1),
    snapCount,
  };
}

function closeWallTopology(segments, width, height, options = {}) {
  let closed = snapParallelWallAxes(segments, Math.max(6, Math.round(Math.max(width, height) * 0.01)));
  closed = mergeCollinearWallSpans(closed, width, height);

  let totalSnaps = 0;
  for (let pass = 0; pass < 3; pass += 1) {
    const snapped = snapWallEndpointsToPerpendiculars(closed, width, height, options);
    totalSnaps += snapped.snapCount;
    closed = mergeCollinearWallSpans(extendWallsToIntersections(snapped.segments, width, height, options), width, height, {
      maxGap: Math.max(10, Math.round(Math.max(width, height) * 0.016)),
    });
  }

  return closed.map((segment) => ({
    ...segment,
    topologyClosed: segment.topologyClosed || totalSnaps > 0,
    ltJunctionSnapped: segment.ltJunctionSnapped || segment.ltJunctionBridged,
    source: segment.source === "topology-merged" ? segment.source : `${segment.source ?? "wall"}-closed`,
  }));
}

function detectionWorldSizeForSource(sourceRect = null) {
  const plane = activePlanPlaneSize();
  if (!sourceRect) return plane;

  return {
    width: plane.width * (sourceRect.width / Math.max(1, sourceRect.canvasWidth)),
    height: plane.height * (sourceRect.height / Math.max(1, sourceRect.canvasHeight)),
  };
}

function detectionPixelsForWorldLength(lengthMeters, width, height, axis, sourceRect = null) {
  const worldSize = detectionWorldSizeForSource(sourceRect);
  const pixels = axis === "x" ? width : height;
  const worldLength = axis === "x" ? worldSize.width : worldSize.height;
  return lengthMeters / Math.max(0.001, worldLength / Math.max(1, pixels));
}

function wallSideGapRangeForOrientation(orientation, width, height, sourceRect = null) {
  const axis = orientation === "horizontal" ? "y" : "x";
  const maxDimension = Math.max(width, height);
  const minGap = detectionPixelsForWorldLength(0.06, width, height, axis, sourceRect);
  const maxGap = detectionPixelsForWorldLength(0.42, width, height, axis, sourceRect);
  const safeMin = THREE.MathUtils.clamp(Math.round(minGap), 2, Math.max(2, Math.round(maxDimension * 0.035)));
  const safeMax = THREE.MathUtils.clamp(Math.round(maxGap), safeMin + 2, Math.max(safeMin + 2, Math.round(maxDimension * 0.18)));

  return { min: safeMin, max: safeMax };
}

function collapseParallelWallSides(segments, width, height, options = {}) {
  const collapsed = [];

  snapParallelWallAxes(segments, 4)
    .sort((a, b) => {
      if (a.orientation !== b.orientation) return a.orientation.localeCompare(b.orientation);
      if (a.axisCenter !== b.axisCenter) return a.axisCenter - b.axisCenter;
      return b.end - b.start - (a.end - a.start);
    })
    .forEach((segment) => {
      const match = collapsed.find((item) => {
        if (item.orientation !== segment.orientation) return false;
        const gapRange = wallSideGapRangeForOrientation(segment.orientation, width, height, options.sourceRect);
        const axisGap = Math.abs(item.axisCenter - segment.axisCenter);
        if (axisGap < gapRange.min || axisGap > gapRange.max) return false;
        const overlap = overlapLength(item, segment);
        const shorter = Math.min(segmentLength(item), segmentLength(segment));
        const longer = Math.max(segmentLength(item), segmentLength(segment));
        const strongOverlap = overlap >= shorter * 0.62;
        const similarSpan = shorter / Math.max(1, longer) >= 0.34;
        return strongOverlap && similarSpan;
      });

      if (!match) {
        collapsed.push({ ...segment });
        return;
      }

      const matchLength = segmentLength(match);
      const segmentLengthValue = segmentLength(segment);
      const weight = Math.max(1, matchLength + segmentLengthValue);
      const axisGap = Math.abs(match.axisCenter - segment.axisCenter);
      match.axisCenter = (match.axisCenter * matchLength + segment.axisCenter * segmentLengthValue) / weight;
      match.start = Math.min(match.start, segment.start);
      match.end = Math.max(match.end, segment.end);
      match.thicknessPx = Math.max(match.thicknessPx ?? 4, segment.thicknessPx ?? 4, axisGap);
      match.confidence = Math.min(1, Math.max(match.confidence ?? 0.5, segment.confidence ?? 0.5) + 0.08);
      match.segmentedOutline = match.segmentedOutline || segment.segmentedOutline;
      match.localReturn = match.localReturn || segment.localReturn;
      match.returnRunCount = Math.max(match.returnRunCount ?? 0, segment.returnRunCount ?? 0);
      match.returnSupportCount = Math.max(match.returnSupportCount ?? 0, segment.returnSupportCount ?? 0);
      match.source = "collapsed-wall";
      match.collapsedCount = (match.collapsedCount ?? 1) + 1;
    });

  return collapsed;
}

function cleanWallSegments(segments, width, height, options = {}) {
  const optimizer = options.optimizer ?? planOptimizerSettings();
  let cleaned = mergeCollinearWallSpans(bridgeTinyWallBreaks(segments, width, height, options), width, height);
  if (optimizer.collapseWalls) {
    cleaned = collapseParallelWallSides(cleaned, width, height, options);
  }
  if (optimizer.extendCorners) {
    cleaned = extendWallsToIntersections(cleaned, width, height, options);
    cleaned = closeWallTopology(cleaned, width, height, options);
  }
  cleaned = mergeCollinearWallSpans(bridgeTinyWallBreaks(cleaned, width, height, options), width, height);
  return pruneTinyWallSegments(cleaned, width, height, options);
}

function buildPairedWallCandidates(runs, width, height, options = {}) {
  const candidates = [];
  const grouped = {
    horizontal: runs.filter((run) => run.orientation === "horizontal"),
    vertical: runs.filter((run) => run.orientation === "vertical"),
  };

  Object.values(grouped).forEach((group) => {
    group.forEach((first, index) => {
      const gapRange = wallSideGapRangeForOrientation(first.orientation, width, height, options.sourceRect);
      for (let cursor = index + 1; cursor < group.length; cursor += 1) {
        const second = group[cursor];
        const gap = Math.abs(second.axisCenter - first.axisCenter);
        if (gap < gapRange.min) continue;
        if (gap > gapRange.max) break;

        const overlap = overlapLength(first, second);
        const shortest = Math.min(segmentLength(first), segmentLength(second));
        if (overlap < Math.max(10, shortest * 0.62)) continue;

        const candidate = {
          orientation: first.orientation,
          start: Math.max(first.start, second.start),
          end: Math.min(first.end, second.end),
          axisCenter: (first.axisCenter + second.axisCenter) / 2,
          thicknessPx: gap,
          confidence: Math.min(1, overlap / Math.max(1, shortest)),
          source: "paired",
        };

        if (!isLikelySheetBorder(candidate, width, height)) {
          candidates.push(candidate);
        }
      }
    });
  });

  return candidates;
}

function mergedCoverageLength(intervals) {
  const merged = [];
  intervals
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start)
    .forEach((interval) => {
      const last = merged[merged.length - 1];
      if (!last || interval.start > last.end) {
        merged.push({ ...interval });
        return;
      }
      last.end = Math.max(last.end, interval.end);
    });
  return merged.reduce((sum, interval) => sum + interval.end - interval.start, 0);
}

function countWallReturnRuns(base, sideAxis, runs, width, height, options = {}) {
  const perpendicular = base.orientation === "horizontal" ? "vertical" : "horizontal";
  const tolerance = topologyJunctionTolerance(width, height, base, options);
  const minAxis = Math.min(base.axisCenter, sideAxis) - tolerance * 0.45;
  const maxAxis = Math.max(base.axisCenter, sideAxis) + tolerance * 0.45;

  return runs.filter((run) => {
    if (run.orientation !== perpendicular) return false;
    if (run.axisCenter < base.start - tolerance || run.axisCenter > base.end + tolerance) return false;
    return run.start <= minAxis && run.end >= maxAxis;
  }).length;
}

function buildSegmentedOutlineWallCandidates(runs, width, height, options = {}) {
  const candidates = [];
  const minBaseLength = Math.max(28, Math.round(Math.max(width, height) * 0.052));
  const grouped = {
    horizontal: runs.filter((run) => run.orientation === "horizontal"),
    vertical: runs.filter((run) => run.orientation === "vertical"),
  };

  Object.values(grouped).forEach((group) => {
    group.forEach((base) => {
      if (segmentLength(base) < minBaseLength) return;
      const gapRange = wallSideGapRangeForOrientation(base.orientation, width, height, options.sourceRect);
      const sideRuns = group
        .filter((run) => run !== base)
        .map((run) => ({
          run,
          gap: Math.abs(run.axisCenter - base.axisCenter),
          overlap: overlapLength(base, run),
        }))
        .filter((item) => item.gap >= gapRange.min && item.gap <= gapRange.max)
        .filter((item) => item.overlap >= Math.max(8, Math.min(segmentLength(base), segmentLength(item.run)) * 0.22));

      if (sideRuns.length < 2) return;

      const sideGroups = [];
      sideRuns.forEach((item) => {
        const existing = sideGroups.find((groupItem) => Math.abs(groupItem.axisCenter - item.run.axisCenter) <= Math.max(4, item.gap * 0.25));
        if (!existing) {
          sideGroups.push({ axisCenter: item.run.axisCenter, gap: item.gap, items: [item] });
          return;
        }
        existing.items.push(item);
        existing.axisCenter =
          existing.items.reduce((sum, next) => sum + next.run.axisCenter * Math.max(1, next.overlap), 0) /
          Math.max(1, existing.items.reduce((sum, next) => sum + Math.max(1, next.overlap), 0));
        existing.gap = Math.abs(existing.axisCenter - base.axisCenter);
      });

      sideGroups.forEach((sideGroup) => {
        const intervals = sideGroup.items.map((item) => ({
          start: Math.max(base.start, item.run.start),
          end: Math.min(base.end, item.run.end),
        }));
        const coverage = mergedCoverageLength(intervals);
        const coverageRatio = coverage / Math.max(1, segmentLength(base));
        const returnRuns = countWallReturnRuns(base, sideGroup.axisCenter, runs, width, height, options);
        if (coverageRatio < 0.34 && returnRuns < 1) return;

        const start = Math.max(
          0,
          Math.min(base.start, ...sideGroup.items.map((item) => Math.max(base.start, item.run.start))),
        );
        const end = Math.min(
          base.orientation === "horizontal" ? width : height,
          Math.max(base.end, ...sideGroup.items.map((item) => Math.min(base.end, item.run.end))),
        );
        const candidate = {
          orientation: base.orientation,
          start,
          end,
          axisCenter: (base.axisCenter + sideGroup.axisCenter) / 2,
          thicknessPx: Math.max(gapRange.min, sideGroup.gap),
          confidence: Math.min(1, 0.48 + coverageRatio * 0.34 + returnRuns * 0.08),
          source: returnRuns > 0 ? "capped-outline" : "segmented-outline",
          segmentedOutline: true,
          returnRunCount: returnRuns,
        };

        if (!isLikelySheetBorder(candidate, width, height)) {
          candidates.push(candidate);
        }
      });
    });
  });

  return mergeWallCandidates(candidates);
}

function buildSolidWallCandidates(runs, width, height) {
  return runs
    .filter((segment) => segment.samples >= 4)
    .map((segment) => ({
      orientation: segment.orientation,
      start: segment.start,
      end: segment.end,
      axisCenter: segment.axisCenter,
      thicknessPx: Math.max(4, segment.maxAxis - segment.minAxis + 1),
      confidence: Math.min(1, segment.samples / 10),
      source: "solid",
    }))
    .filter((segment) => !isLikelySheetBorder(segment, width, height));
}

function hasPerpendicularWallSupport(segment, segments, width, height) {
  const tolerance = Math.max(7, Math.round(Math.max(width, height) * 0.011), segment.thicknessPx ?? 4);
  const perpendicular = segment.orientation === "horizontal" ? "vertical" : "horizontal";
  const axis = segment.axisCenter;
  const endpoints = [segment.start, segment.end];

  return segments.some((candidate) => {
    if (candidate === segment || candidate.orientation !== perpendicular) return false;
    if (segmentLength(candidate) < Math.max(12, segmentLength(segment) * 0.65)) return false;
    const alongTouchesEndpoint = endpoints.some((endpoint) => Math.abs(candidate.axisCenter - endpoint) <= tolerance);
    const crossesSpan = candidate.axisCenter >= segment.start - tolerance && candidate.axisCenter <= segment.end + tolerance;
    const reachesAxis = axis >= candidate.start - tolerance && axis <= candidate.end + tolerance;
    return reachesAxis && (alongTouchesEndpoint || crossesSpan);
  });
}

function perpendicularSupportCount(segment, segments, width, height, options = {}) {
  const tolerance = topologyJunctionTolerance(width, height, segment, options);
  const perpendicular = segment.orientation === "horizontal" ? "vertical" : "horizontal";
  const axis = segment.axisCenter;

  return segments.filter((candidate) => {
    if (candidate === segment || candidate.orientation !== perpendicular) return false;
    const reachesAxis = axis >= candidate.start - tolerance && axis <= candidate.end + tolerance;
    const nearStart = Math.abs(candidate.axisCenter - segment.start) <= tolerance;
    const nearEnd = Math.abs(candidate.axisCenter - segment.end) <= tolerance;
    const crossesSpan = candidate.axisCenter >= segment.start - tolerance && candidate.axisCenter <= segment.end + tolerance;
    return reachesAxis && (nearStart || nearEnd || crossesSpan);
  }).length;
}

function isOutlineReturnWall(segment, segments, width, height, options = {}) {
  const lengthAxis = segment.orientation === "horizontal" ? "x" : "y";
  const returnMax = Math.max(
    topologyJunctionTolerance(width, height, segment, options) * 2.4,
    detectionPixelsForWorldLength(0.55, width, height, lengthAxis, options.sourceRect),
  );
  if (segmentLength(segment) > returnMax) return false;
  const supports = perpendicularSupportCount(segment, segments, width, height, options);
  return supports >= 2 || (supports >= 1 && segmentLength(segment) <= returnMax * 0.62);
}

function localDetailNearMajorWall(detail, majorSegments, width, height, options = {}) {
  const tolerance = topologyJunctionTolerance(width, height, detail, options);
  return majorSegments.some((major) => {
    if (major === detail) return false;
    if (major.orientation === detail.orientation) {
      const axisGap = Math.abs(major.axisCenter - detail.axisCenter);
      if (axisGap > Math.max(tolerance, major.thicknessPx ?? 4, detail.thicknessPx ?? 4)) return false;
      return overlapLength(major, detail) >= Math.max(4, segmentLength(detail) * 0.34);
    }

    const detailTouchesMajorAxis = major.axisCenter >= detail.start - tolerance && major.axisCenter <= detail.end + tolerance;
    const majorReachesDetailAxis = detail.axisCenter >= major.start - tolerance && detail.axisCenter <= major.end + tolerance;
    return detailTouchesMajorAxis && majorReachesDetailAxis;
  });
}

function buildLocalReturnWallCandidates(detailRuns, majorRuns, width, height, options = {}) {
  const detailSegments = detailRuns.map((run) => ({
    orientation: run.orientation,
    start: run.start,
    end: run.end,
    axisCenter: run.axisCenter,
    thicknessPx: Math.max(3, run.maxAxis - run.minAxis + 1),
    confidence: Math.min(1, 0.46 + (run.samples ?? 1) * 0.035),
    source: "local-return",
    localReturn: true,
  }));
  const majorSegments = majorRuns.map((run) => ({
    orientation: run.orientation,
    start: run.start,
    end: run.end,
    axisCenter: run.axisCenter,
    thicknessPx: Math.max(4, run.maxAxis - run.minAxis + 1),
  }));

  const candidates = detailSegments.filter((segment) => {
    const lengthAxis = segment.orientation === "horizontal" ? "x" : "y";
    const length = segmentLength(segment);
    const minLength = Math.max(5, Math.round(Math.max(width, height) * 0.004));
    const maxLength = Math.max(
      topologyJunctionTolerance(width, height, segment, options) * 3.2,
      detectionPixelsForWorldLength(0.82, width, height, lengthAxis, options.sourceRect),
    );
    if (length < minLength || length > maxLength) return false;

    const supportCount = perpendicularSupportCount(segment, detailSegments, width, height, options);
    const nearMajor = localDetailNearMajorWall(segment, majorSegments, width, height, options);
    if (supportCount < 2 && !(supportCount >= 1 && nearMajor)) return false;
    if (!nearMajor && supportCount < 2) return false;
    segment.returnSupportCount = supportCount;
    if (supportCount >= 2) segment.confidence = Math.min(1, segment.confidence + 0.18);
    if (nearMajor) segment.confidence = Math.min(1, segment.confidence + 0.12);
    return true;
  });

  return mergeWallCandidates(candidates);
}

function shouldKeepShortBranchWall(segment, segments, width, height, minLength, options = {}) {
  const length = segmentLength(segment);
  const sourceRect = options.sourceRect ?? null;
  const lengthAxis = segment.orientation === "horizontal" ? "x" : "y";
  const branchMin = Math.max(
    8,
    detectionPixelsForWorldLength(0.18, width, height, lengthAxis, sourceRect),
    Math.round(Math.max(width, height) * 0.008),
  );
  if (length < branchMin || length >= minLength) return false;
  if (!hasPerpendicularWallSupport(segment, segments, width, height)) return false;

  const strongWallSignal =
    segment.source?.includes("solid") ||
    segment.source?.includes("paired") ||
    segment.source?.includes("outline") ||
    isOutlineReturnWall(segment, segments, width, height, options) ||
    (segment.thicknessPx ?? 4) >= Math.max(4, Math.round(Math.max(width, height) * 0.006));
  return strongWallSignal;
}

function pruneTinyWallSegments(segments, width, height, options = {}) {
  const minLength = Math.max(12, Math.round(Math.max(width, height) * 0.018));
  const optimizer = options.optimizer ?? planOptimizerSettings();
  return segments.filter((segment) => {
    const lengthAxis = segment.orientation === "horizontal" ? "x" : "y";
    const minWorldPixels = detectionPixelsForWorldLength(optimizer.minWallLength, width, height, lengthAxis, options.sourceRect);
    const threshold = Math.max(minLength, minWorldPixels);
    if (segmentLength(segment) >= threshold) return true;
    if (!shouldKeepShortBranchWall(segment, segments, width, height, threshold, options)) return false;
    segment.shortBranchPreserved = true;
    segment.source = segment.source?.includes("branch-preserved") ? segment.source : `${segment.source ?? "wall"}-branch-preserved`;
    return true;
  });
}

function boundsForSegment(segment) {
  if (segment.orientation === "horizontal") {
    return {
      minX: segment.start,
      maxX: segment.end,
      minY: segment.axisCenter - segment.thicknessPx / 2,
      maxY: segment.axisCenter + segment.thicknessPx / 2,
    };
  }

  return {
    minX: segment.axisCenter - segment.thicknessPx / 2,
    maxX: segment.axisCenter + segment.thicknessPx / 2,
    minY: segment.start,
    maxY: segment.end,
  };
}

function midpointForSegment(segment) {
  if (segment.orientation === "horizontal") {
    return {
      x: (segment.start + segment.end) / 2,
      y: segment.axisCenter,
    };
  }

  return {
    x: segment.axisCenter,
    y: (segment.start + segment.end) / 2,
  };
}

function expandBounds(bounds, amount) {
  return {
    minX: bounds.minX - amount,
    maxX: bounds.maxX + amount,
    minY: bounds.minY - amount,
    maxY: bounds.maxY + amount,
  };
}

function mergeBounds(first, second) {
  return {
    minX: Math.min(first.minX, second.minX),
    maxX: Math.max(first.maxX, second.maxX),
    minY: Math.min(first.minY, second.minY),
    maxY: Math.max(first.maxY, second.maxY),
  };
}

function boundsTouch(first, second, padding) {
  const expanded = expandBounds(first, padding);
  return !(
    expanded.maxX < second.minX ||
    expanded.minX > second.maxX ||
    expanded.maxY < second.minY ||
    expanded.minY > second.maxY
  );
}

function clusterWallSegments(segments) {
  const clusters = [];
  const visited = new Set();

  segments.forEach((segment, index) => {
    if (visited.has(index)) return;

    const queue = [index];
    const members = [];
    let bounds = boundsForSegment(segment);
    visited.add(index);

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      const current = segments[currentIndex];
      members.push(current);
      bounds = mergeBounds(bounds, boundsForSegment(current));

      segments.forEach((candidate, candidateIndex) => {
        if (visited.has(candidateIndex)) return;
        if (!boundsTouch(boundsForSegment(current), boundsForSegment(candidate), 14)) return;
        visited.add(candidateIndex);
        queue.push(candidateIndex);
      });
    }

    clusters.push({ members, bounds });
  });

  return clusters;
}

function scoreWallCluster(cluster, width, height) {
  const lengthScore = cluster.members.reduce((sum, segment) => sum + segmentLength(segment), 0);
  const centerX = (cluster.bounds.minX + cluster.bounds.maxX) / 2;
  const centerY = (cluster.bounds.minY + cluster.bounds.maxY) / 2;
  const distanceFromCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
  const maxDistance = Math.hypot(width / 2, height / 2);
  const centerWeight = 1 - Math.min(0.42, (distanceFromCenter / Math.max(1, maxDistance)) * 0.42);
  return lengthScore * centerWeight * Math.max(1, Math.sqrt(cluster.members.length));
}

function keepDominantWallRegion(segments, width, height) {
  const clusters = clusterWallSegments(segments);
  if (clusters.length <= 1) return segments;

  const dominant = clusters.sort((a, b) => scoreWallCluster(b, width, height) - scoreWallCluster(a, width, height))[0];
  if (!dominant || dominant.members.length < 4) return segments;

  const horizontalPadding = Math.max(16, (dominant.bounds.maxX - dominant.bounds.minX) * 0.18);
  const verticalPadding = Math.max(16, (dominant.bounds.maxY - dominant.bounds.minY) * 0.18);
  const region = {
    minX: dominant.bounds.minX - horizontalPadding,
    maxX: dominant.bounds.maxX + horizontalPadding,
    minY: dominant.bounds.minY - verticalPadding,
    maxY: dominant.bounds.maxY + verticalPadding,
  };

  return segments.filter((segment) => {
    const midpoint = midpointForSegment(segment);
    return midpoint.x >= region.minX && midpoint.x <= region.maxX && midpoint.y >= region.minY && midpoint.y <= region.maxY;
  });
}

function estimateDoorEvidence(map, opening) {
  const { width, height, ink } = map;
  const horizontal = opening.orientation === "horizontal";
  const doorSpan = opening.end - opening.start;
  const sideReach = Math.max(6, Math.round(Math.max(doorSpan * 0.95, opening.thicknessPx * 2.4)));
  let sideInk = 0;
  let sideArea = 0;
  let centerInk = 0;
  let centerArea = 0;

  for (let along = opening.start; along <= opening.end; along += 1) {
    for (let offset = -sideReach; offset <= sideReach; offset += 1) {
      const x = horizontal ? along : opening.axisCenter + offset;
      const y = horizontal ? opening.axisCenter + offset : along;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const value = ink[Math.round(y) * width + Math.round(x)];
      if (Math.abs(offset) <= Math.max(1, Math.round(opening.thicknessPx / 2))) {
        centerInk += value;
        centerArea += 1;
      } else {
        sideInk += value;
        sideArea += 1;
      }
    }
  }

  return {
    centerRatio: centerInk / Math.max(1, centerArea),
    sideRatio: sideInk / Math.max(1, sideArea),
  };
}

function dedupeOpenings(openings) {
  const deduped = [];

  openings.forEach((opening) => {
    const existing = deduped.find(
      (item) =>
        item.orientation === opening.orientation &&
        Math.abs(item.axisCenter - opening.axisCenter) <= Math.max(3, opening.thicknessPx) &&
        overlapLength(item, opening) >= Math.min(segmentLength(item), segmentLength(opening)) * 0.55,
    );

    if (!existing) {
      deduped.push(opening);
      return;
    }

    existing.start = Math.min(existing.start, opening.start);
    existing.end = Math.max(existing.end, opening.end);
    existing.axisCenter = (existing.axisCenter + opening.axisCenter) / 2;
    existing.thicknessPx = Math.max(existing.thicknessPx, opening.thicknessPx);
    existing.confidence = Math.max(existing.confidence, opening.confidence);
    existing.windowType = existing.windowType ?? opening.windowType;
    existing.source = existing.source === opening.source ? existing.source : "merged-opening";
    existing.symbolLineCount = Math.max(existing.symbolLineCount ?? 0, opening.symbolLineCount ?? 0);
  });

  return deduped;
}

function estimateDoorOpenings(map, segments) {
  const candidates = [];

  ["horizontal", "vertical"].forEach((orientation) => {
    const aligned = segments
      .filter((segment) => segment.orientation === orientation)
      .sort((a, b) => a.axisCenter - b.axisCenter || a.start - b.start);

    aligned.forEach((first, index) => {
      for (let cursor = index + 1; cursor < aligned.length; cursor += 1) {
        const second = aligned[cursor];
        const axisGap = Math.abs(second.axisCenter - first.axisCenter);
        if (axisGap > Math.max(4, Math.max(first.thicknessPx, second.thicknessPx))) break;
        if (second.start <= first.end) continue;

        const gap = second.start - first.end;
        const maxGap = Math.max(18, Math.round(Math.max(map.width, map.height) * 0.065));
        if (gap < 4 || gap > maxGap) continue;

        const opening = {
          orientation,
          start: first.end,
          end: second.start,
          axisCenter: (first.axisCenter + second.axisCenter) / 2,
          thicknessPx: Math.max(first.thicknessPx, second.thicknessPx),
          confidence: 0,
          source: "door-gap",
        };
        const evidence = estimateDoorEvidence(map, opening);

        if (evidence.centerRatio <= 0.28 && evidence.sideRatio >= 0.018) {
          opening.confidence = Math.min(1, evidence.sideRatio * 16 + (0.28 - evidence.centerRatio));
          candidates.push(opening);
        }
      }
    });
  });

  return dedupeOpenings(candidates);
}

function estimateWindowOpenings(map, segments, doors = []) {
  const candidates = [];

  ["horizontal", "vertical"].forEach((orientation) => {
    const aligned = segments
      .filter((segment) => segment.orientation === orientation)
      .sort((a, b) => a.axisCenter - b.axisCenter || a.start - b.start);

    aligned.forEach((first, index) => {
      for (let cursor = index + 1; cursor < aligned.length; cursor += 1) {
        const second = aligned[cursor];
        const axisGap = Math.abs(second.axisCenter - first.axisCenter);
        if (axisGap > Math.max(4, Math.max(first.thicknessPx, second.thicknessPx))) break;
        if (second.start <= first.end) continue;

        const gap = second.start - first.end;
        const minGap = Math.max(10, Math.round(Math.min(map.width, map.height) * 0.025));
        const maxGap = Math.max(34, Math.round(Math.max(map.width, map.height) * 0.16));
        if (gap < minGap || gap > maxGap) continue;

        const opening = {
          orientation,
          start: first.end,
          end: second.start,
          axisCenter: (first.axisCenter + second.axisCenter) / 2,
          thicknessPx: Math.max(first.thicknessPx, second.thicknessPx),
          confidence: 0,
          source: "window-gap",
        };
        const overlapsDoor = doors.some(
          (door) =>
            door.orientation === opening.orientation &&
            Math.abs(door.axisCenter - opening.axisCenter) <= Math.max(5, opening.thicknessPx) &&
            overlapLength(door, opening) >= Math.min(segmentLength(door), segmentLength(opening)) * 0.36,
        );
        if (overlapsDoor) continue;

        const evidence = estimateDoorEvidence(map, opening);
        const spanScore = THREE.MathUtils.clamp(gap / Math.max(1, Math.max(map.width, map.height) * 0.11), 0, 1);
        if (evidence.centerRatio <= 0.34 && evidence.sideRatio >= 0.012) {
          opening.confidence = Math.min(1, evidence.sideRatio * 12 + spanScore * 0.45 + (0.34 - evidence.centerRatio));
          candidates.push(opening);
        }
      }
    });
  });

  return dedupeOpenings(candidates);
}

function segmentDistanceToEdge(segment, width, height) {
  const horizontal = segment.orientation === "horizontal";
  const outerLimit = horizontal ? height : width;
  return Math.min(segment.axisCenter, outerLimit - segment.axisCenter);
}

function openingOverlapsAny(opening, others, ratio = 0.36) {
  return others.some(
    (other) =>
      other.orientation === opening.orientation &&
      Math.abs(other.axisCenter - opening.axisCenter) <= Math.max(6, opening.thicknessPx ?? 4) &&
      overlapLength(other, opening) >= Math.min(segmentLength(other), segmentLength(opening)) * ratio,
  );
}

function windowTypeForOpening(opening, wallSegment, map) {
  const lengthRatio = segmentLength(opening) / Math.max(1, Math.max(map.width, map.height));
  const edgeDistance = segmentDistanceToEdge(wallSegment, map.width, map.height);
  const nearExterior = edgeDistance <= Math.max(map.width, map.height) * 0.12;

  if (opening.symbolLineCount >= 3 && nearExterior) return "bay";
  if (lengthRatio >= 0.16 || opening.confidence >= 0.82) return "floor";
  if (lengthRatio <= 0.075) return "high";
  return "standard";
}

function estimateSymbolWindows(map, wallSegments, runs, existingOpenings = []) {
  const candidates = [];
  const minLength = Math.max(18, Math.round(Math.max(map.width, map.height) * 0.035));
  const maxAxisDistance = Math.max(18, Math.round(Math.max(map.width, map.height) * 0.05));

  wallSegments.forEach((wall) => {
    const parallelRuns = runs
      .filter((run) => run.orientation === wall.orientation)
      .filter((run) => Math.abs(run.axisCenter - wall.axisCenter) > Math.max(3, wall.thicknessPx * 0.7))
      .filter((run) => Math.abs(run.axisCenter - wall.axisCenter) <= maxAxisDistance)
      .filter((run) => overlapLength(run, wall) >= minLength)
      .filter((run) => segmentLength(run) <= segmentLength(wall) * 0.72)
      .sort((a, b) => a.start - b.start || a.axisCenter - b.axisCenter);

    parallelRuns.forEach((run) => {
      const overlapStart = Math.max(run.start, wall.start);
      const overlapEnd = Math.min(run.end, wall.end);
      if (overlapEnd - overlapStart < minLength) return;

      const nearbyLines = parallelRuns.filter(
        (item) =>
          Math.abs(item.axisCenter - run.axisCenter) <= 14 &&
          overlapLength(item, run) >= Math.min(segmentLength(item), segmentLength(run)) * 0.45,
      );
      if (nearbyLines.length < 1) return;

      const opening = {
        orientation: wall.orientation,
        start: overlapStart,
        end: overlapEnd,
        axisCenter: wall.axisCenter,
        thicknessPx: Math.max(wall.thicknessPx, 5),
        confidence: Math.min(1, 0.42 + nearbyLines.length * 0.16 + (overlapEnd - overlapStart) / Math.max(1, segmentLength(wall)) * 0.6),
        source: "window-symbol",
        symbolLineCount: nearbyLines.length,
      };
      opening.windowType = windowTypeForOpening(opening, wall, map);
      if (!openingOverlapsAny(opening, existingOpenings, 0.32)) {
        candidates.push(opening);
      }
    });
  });

  return dedupeOpenings(candidates);
}

function estimateSlidingOpenings(map, wallSegments, runs, existingOpenings = []) {
  const candidates = [];
  const maxAxisDistance = Math.max(18, Math.round(Math.max(map.width, map.height) * 0.052));
  const minLength = Math.max(22, Math.round(Math.max(map.width, map.height) * 0.04));

  wallSegments.forEach((wall) => {
    const parallelRuns = runs
      .filter((run) => run.orientation === wall.orientation)
      .filter((run) => Math.abs(run.axisCenter - wall.axisCenter) > Math.max(3, wall.thicknessPx * 0.65))
      .filter((run) => Math.abs(run.axisCenter - wall.axisCenter) <= maxAxisDistance)
      .filter((run) => overlapLength(run, wall) >= minLength)
      .filter((run) => segmentLength(run) <= segmentLength(wall) * 0.92)
      .sort((a, b) => a.start - b.start || a.axisCenter - b.axisCenter);

    parallelRuns.forEach((run) => {
      const siblingLines = parallelRuns.filter(
        (item) =>
          item !== run &&
          Math.abs(item.axisCenter - run.axisCenter) <= Math.max(16, wall.thicknessPx * 3.2) &&
          overlapLength(item, run) >= Math.min(segmentLength(item), segmentLength(run)) * 0.48,
      );
      if (siblingLines.length < 1) return;

      const overlapStart = Math.max(wall.start, Math.min(run.start, ...siblingLines.map((item) => item.start)));
      const overlapEnd = Math.min(wall.end, Math.max(run.end, ...siblingLines.map((item) => item.end)));
      if (overlapEnd - overlapStart < minLength) return;

      const opening = {
        orientation: wall.orientation,
        start: overlapStart,
        end: overlapEnd,
        axisCenter: wall.axisCenter,
        thicknessPx: Math.max(wall.thicknessPx, 5),
        confidence: Math.min(1, 0.68 + siblingLines.length * 0.08),
        source: "sliding-symbol",
        symbolLineCount: siblingLines.length + 1,
        windowType: segmentLength({ start: overlapStart, end: overlapEnd }) >= Math.max(map.width, map.height) * 0.11 ? "floor" : "standard",
      };
      if (!openingOverlapsAny(opening, existingOpenings, 0.28)) {
        candidates.push(opening);
      }
    });
  });

  return dedupeOpenings(candidates);
}

function estimateSymbolDoors(map, wallSegments, runs, existingDoors = []) {
  const candidates = [];
  const minLength = Math.max(10, Math.round(Math.max(map.width, map.height) * 0.018));
  const maxLength = Math.max(36, Math.round(Math.max(map.width, map.height) * 0.085));

  wallSegments.forEach((wall) => {
    const perpendicular = wall.orientation === "horizontal" ? "vertical" : "horizontal";
    const nearby = runs
      .filter((run) => run.orientation === perpendicular)
      .filter((run) => segmentLength(run) >= minLength && segmentLength(run) <= maxLength)
      .filter((run) => {
        const runAxis = run.axisCenter;
        const runStart = run.start;
        const runEnd = run.end;
        if (wall.orientation === "horizontal") {
          return runAxis >= wall.start && runAxis <= wall.end && wall.axisCenter >= runStart - 10 && wall.axisCenter <= runEnd + 10;
        }
        return runAxis >= wall.start && runAxis <= wall.end && wall.axisCenter >= runStart - 10 && wall.axisCenter <= runEnd + 10;
      });

    nearby.forEach((run) => {
      const center = run.axisCenter;
      const doorWidth = Math.max(minLength, Math.min(maxLength, segmentLength(run) * 1.6));
      const arcEvidence = estimateDoorSwingEvidence(map, wall, center, doorWidth);
      const opening = {
        orientation: wall.orientation,
        start: THREE.MathUtils.clamp(center - doorWidth / 2, wall.start, wall.end),
        end: THREE.MathUtils.clamp(center + doorWidth / 2, wall.start, wall.end),
        axisCenter: wall.axisCenter,
        thicknessPx: Math.max(wall.thicknessPx, 5),
        confidence: arcEvidence > 0 ? Math.min(1, 0.64 + arcEvidence * 0.2) : 0.58,
        source: arcEvidence > 0 ? "door-swing-symbol" : "door-symbol",
        swingEvidence: arcEvidence,
      };
      if (opening.end - opening.start < minLength) return;
      if (!openingOverlapsAny(opening, existingDoors, 0.32)) {
        candidates.push(opening);
      }
    });
  });

  return dedupeOpenings(candidates);
}

function estimateDoorSwingEvidence(map, wall, hingeAlong, radius) {
  const { width, height, ink } = map;
  const horizontalWall = wall.orientation === "horizontal";
  const sampleRadius = Math.max(8, Math.min(56, radius));
  const axis = wall.axisCenter;
  const directions = [-1, 1];
  let bestScore = 0;

  directions.forEach((direction) => {
    let arcHits = 0;
    let arcSamples = 0;
    for (let degree = 12; degree <= 82; degree += 7) {
      const angle = THREE.MathUtils.degToRad(degree);
      const alongOffset = Math.cos(angle) * sampleRadius;
      const axisOffset = Math.sin(angle) * sampleRadius * direction;
      const x = horizontalWall ? hingeAlong + alongOffset : axis + axisOffset;
      const y = horizontalWall ? axis + axisOffset : hingeAlong + alongOffset;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const px = Math.round(x + dx);
          const py = Math.round(y + dy);
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          arcHits += ink[py * width + px];
          arcSamples += 1;
        }
      }
    }

    let leafHits = 0;
    let leafSamples = 0;
    for (let offset = 0; offset <= sampleRadius; offset += 2) {
      const x = horizontalWall ? hingeAlong + offset : axis + sampleRadius * direction;
      const y = horizontalWall ? axis + sampleRadius * direction : hingeAlong + offset;
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) continue;
      leafHits += ink[py * width + px];
      leafSamples += 1;
    }

    const arcRatio = arcHits / Math.max(1, arcSamples);
    const leafRatio = leafHits / Math.max(1, leafSamples);
    bestScore = Math.max(bestScore, arcRatio * 0.75 + leafRatio * 0.25);
  });

  return bestScore >= 0.055 ? THREE.MathUtils.clamp(bestScore * 6, 0, 1) : 0;
}

function planBoundsForSegments(segments, width, height) {
  if (!segments.length) {
    return { minX: 0, maxX: width, minY: 0, maxY: height, width, height };
  }

  const bounds = segments.reduce(
    (box, segment) => {
      const item = boundsForSegment(segment);
      box.minX = Math.min(box.minX, item.minX);
      box.maxX = Math.max(box.maxX, item.maxX);
      box.minY = Math.min(box.minY, item.minY);
      box.maxY = Math.max(box.maxY, item.maxY);
      return box;
    },
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  return {
    ...bounds,
    width: Math.max(1, bounds.maxX - bounds.minX),
    height: Math.max(1, bounds.maxY - bounds.minY),
  };
}

function wallRoomSideProfile(wall, rooms = []) {
  const tolerance = Math.max(8, wall.thicknessPx * 2.2);
  const sides = new Set();
  let coverage = 0;

  rooms.forEach((room) => {
    let touches = false;
    let side = "";
    let overlap = 0;
    if (wall.orientation === "horizontal") {
      const nearTop = Math.abs(room.minY - wall.axisCenter) <= tolerance;
      const nearBottom = Math.abs(room.maxY - wall.axisCenter) <= tolerance;
      overlap = Math.max(0, Math.min(wall.end, room.maxX) - Math.max(wall.start, room.minX));
      touches = (nearTop || nearBottom) && overlap >= Math.min(segmentLength(wall), room.maxX - room.minX) * 0.12;
      side = room.centerY > wall.axisCenter ? "after" : "before";
    } else {
      const nearLeft = Math.abs(room.minX - wall.axisCenter) <= tolerance;
      const nearRight = Math.abs(room.maxX - wall.axisCenter) <= tolerance;
      overlap = Math.max(0, Math.min(wall.end, room.maxY) - Math.max(wall.start, room.minY));
      touches = (nearLeft || nearRight) && overlap >= Math.min(segmentLength(wall), room.maxY - room.minY) * 0.12;
      side = room.centerX > wall.axisCenter ? "after" : "before";
    }

    if (!touches) return;
    sides.add(side);
    coverage += overlap;
  });

  return {
    sideCount: sides.size,
    coverage,
  };
}

function architecturalWallRole(wall, result) {
  const bounds = result.architecturalBounds ?? planBoundsForSegments(result.segments, result.width, result.height);
  const edgeTolerance = Math.max(14, Math.min(bounds.width, bounds.height) * 0.055, wall.thicknessPx * 2.5);
  const roomProfile = wallRoomSideProfile(wall, result.rooms ?? []);
  const nearEdge =
    wall.orientation === "horizontal"
      ? Math.min(Math.abs(wall.axisCenter - bounds.minY), Math.abs(wall.axisCenter - bounds.maxY)) <= edgeTolerance
      : Math.min(Math.abs(wall.axisCenter - bounds.minX), Math.abs(wall.axisCenter - bounds.maxX)) <= edgeTolerance;

  if (nearEdge || roomProfile.sideCount <= 1) return "exterior";
  return "interior";
}

function bestWallForOpening(opening, segments) {
  let best = null;
  segments.forEach((wall) => {
    if (wall.orientation !== opening.orientation) return;
    const overlap = overlapLength(opening, wall);
    if (overlap <= 0) return;
    const axisDistance = Math.abs(opening.axisCenter - wall.axisCenter);
    const score = overlap - axisDistance * 2;
    if (!best || score > best.score) best = { wall, score };
  });
  return best?.wall ?? null;
}

function normalizedOpeningForWall(opening, wall, map, kind) {
  const maxDimension = Math.max(map.width, map.height);
  const cornerClearance = Math.max(4, Math.min(18, segmentLength(wall) * 0.045));
  let start = THREE.MathUtils.clamp(opening.start, wall.start + cornerClearance, wall.end - cornerClearance);
  let end = THREE.MathUtils.clamp(opening.end, wall.start + cornerClearance, wall.end - cornerClearance);
  if (end < start) [start, end] = [end, start];

  const length = end - start;
  const manual = opening.source?.startsWith("manual");
  const symbol = opening.source?.includes("symbol") || opening.source?.includes("swing");
  const minLength = kind === "door" ? Math.max(8, maxDimension * 0.016) : Math.max(12, maxDimension * 0.024);
  const maxLength = kind === "door" ? Math.max(34, maxDimension * 0.105) : Math.max(42, maxDimension * 0.28);

  if (!manual && length < minLength) return null;
  if (!manual && kind === "door" && length > maxLength && !symbol) return null;
  if (!manual && kind === "window" && length > maxLength * 1.25 && !symbol) return null;

  return {
    ...opening,
    start,
    end,
    axisCenter: wall.axisCenter,
    thicknessPx: Math.max(opening.thicknessPx ?? 5, wall.thicknessPx ?? 5),
    wallRole: architecturalWallRole(wall, { ...map, segments: [wall], rooms: [] }),
  };
}

function splitOpeningsByArchitecture(result, map) {
  const roles = new Map(result.segments.map((wall) => [wall, architecturalWallRole(wall, result)]));
  const doors = [];
  const windows = [];
  let convertedDoors = 0;
  let rejected = 0;

  (result.doors ?? []).forEach((opening) => {
    const wall = bestWallForOpening(opening, result.segments);
    if (!wall) {
      rejected += 1;
      return;
    }
    const normalized = normalizedOpeningForWall(opening, wall, map, "door");
    if (!normalized) {
      rejected += 1;
      return;
    }
    const role = roles.get(wall) ?? architecturalWallRole(wall, result);
    const wideExteriorGap =
      role === "exterior" &&
      !opening.source?.startsWith("manual") &&
      !opening.source?.includes("swing") &&
      segmentLength(normalized) >= Math.max(20, Math.max(map.width, map.height) * 0.045);
    if (wideExteriorGap) {
      windows.push({
        ...normalized,
        source: "architecture-door-to-window",
        confidence: Math.max(normalized.confidence ?? 0.42, 0.58),
        windowType: windowTypeForOpening(normalized, wall, map),
      });
      convertedDoors += 1;
      return;
    }
    doors.push({ ...normalized, wallRole: role });
  });

  (result.windows ?? []).forEach((opening) => {
    const wall = bestWallForOpening(opening, result.segments);
    if (!wall) {
      rejected += 1;
      return;
    }
    const normalized = normalizedOpeningForWall(opening, wall, map, "window");
    if (!normalized) {
      rejected += 1;
      return;
    }
    const role = roles.get(wall) ?? architecturalWallRole(wall, result);
    const lowConfidenceInterior =
      role === "interior" &&
      !opening.source?.startsWith("manual") &&
      !opening.source?.includes("symbol") &&
      (opening.confidence ?? 0) < 0.64;
    if (lowConfidenceInterior) {
      rejected += 1;
      return;
    }
    windows.push({
      ...normalized,
      wallRole: role,
      windowType: normalized.windowType ?? windowTypeForOpening(normalized, wall, map),
    });
  });

  return { doors, windows, convertedDoors, rejected };
}

function inferExteriorWindows(result, map, existingWindows, existingDoors) {
  const candidates = [];
  const maxDimension = Math.max(map.width, map.height);
  const minWallLength = Math.max(42, maxDimension * 0.09);

  result.segments.forEach((wall) => {
    if (architecturalWallRole(wall, result) !== "exterior") return;
    const length = segmentLength(wall);
    if (length < minWallLength) return;
    const hasOpening = openingOverlapsAny(wall, [...existingWindows, ...existingDoors], 0.18);
    if (hasOpening) return;

    const windowSpan = THREE.MathUtils.clamp(length * 0.34, Math.max(18, maxDimension * 0.04), Math.max(42, maxDimension * 0.13));
    const center = (wall.start + wall.end) / 2;
    const opening = {
      orientation: wall.orientation,
      start: THREE.MathUtils.clamp(center - windowSpan / 2, wall.start, wall.end),
      end: THREE.MathUtils.clamp(center + windowSpan / 2, wall.start, wall.end),
      axisCenter: wall.axisCenter,
      thicknessPx: Math.max(wall.thicknessPx ?? 5, 5),
      confidence: 0.36,
      source: "architecture-exterior-window",
      wallRole: "exterior",
    };
    opening.windowType = windowTypeForOpening(opening, wall, map);
    candidates.push(opening);
  });

  return candidates;
}

function applyArchitecturalOpeningLogic(result, map) {
  const architecturalBounds = planBoundsForSegments(result.segments, map.width, map.height);
  result.architecturalBounds = architecturalBounds;
  result.rooms = result.rooms?.length ? result.rooms : estimateRoomRegions(result.segments, result);

  const split = splitOpeningsByArchitecture(result, map);
  const doors = dedupeOpenings(split.doors);
  const inferredWindows = inferExteriorWindows(result, map, split.windows, doors);
  const windows = dedupeOpenings([...split.windows, ...inferredWindows])
    .filter((window) => !openingOverlapsAny(window, doors, 0.34))
    .map((opening) => ({
      ...opening,
      windowType: opening.windowType ?? "standard",
    }));

  return {
    doors,
    windows,
    quality: {
      architectureConvertedDoors: split.convertedDoors,
      architectureRejectedOpenings: split.rejected,
      architectureInferredWindows: inferredWindows.length,
    },
  };
}

function recognitionQualityForResult(segments, doors, windows, map, usedRuleBasedSegments) {
  const horizontalCount = segments.filter((segment) => segment.orientation === "horizontal").length;
  const verticalCount = segments.length - horizontalCount;
  const lengthTotal = segments.reduce((sum, segment) => sum + segmentLength(segment), 0);
  const coverage = lengthTotal / Math.max(1, map.width + map.height);
  const orientationBalance = Math.min(horizontalCount, verticalCount) / Math.max(1, Math.max(horizontalCount, verticalCount));
  const openingScore = Math.min(1, (doors.length + windows.length) / Math.max(1, segments.length * 0.42));
  const score = Math.round(
    THREE.MathUtils.clamp(
      (usedRuleBasedSegments ? 0.34 : 0.18) + Math.min(0.32, coverage * 0.18) + orientationBalance * 0.2 + openingScore * 0.14,
      0.12,
      0.96,
    ) * 100,
  );

  return {
    score,
    wallCount: segments.length,
    openingCount: doors.length + windows.length,
    collapsedWallSides: segments.reduce((sum, segment) => sum + Math.max(0, (segment.collapsedCount ?? 1) - 1), 0),
    shortBranchWalls: segments.filter((segment) => segment.shortBranchPreserved || segment.source?.includes("branch-preserved")).length,
    ltJunctionWalls: segments.filter((segment) => segment.ltJunctionSnapped || segment.ltJunctionBridged).length,
    outlineWallCount: segments.filter((segment) => segment.segmentedOutline || segment.source?.includes("outline")).length,
    localReturnWalls: segments.filter((segment) => segment.localReturn || segment.source?.includes("local-return")).length,
    topologyClosedWalls: segments.filter((segment) => segment.topologyClosed || segment.source?.includes("closed") || segment.source === "topology-merged")
      .length,
    swingDoorCount: doors.filter((door) => door.source === "door-swing-symbol").length,
    slidingCount: windows.filter((window) => window.source === "sliding-symbol").length,
    usedRuleBasedSegments,
  };
}

function clusteredAxisValues(values, tolerance) {
  const clusters = [];
  values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)
    .forEach((value) => {
      const cluster = clusters.find((item) => Math.abs(item.center - value) <= tolerance);
      if (!cluster) {
        clusters.push({ center: value, count: 1 });
        return;
      }
      cluster.center = (cluster.center * cluster.count + value) / (cluster.count + 1);
      cluster.count += 1;
    });
  return clusters.map((cluster) => cluster.center).sort((a, b) => a - b);
}

function mergedIntervalCoverage(intervals, start, end) {
  if (end <= start || intervals.length === 0) return 0;
  const merged = [];

  intervals
    .map((interval) => ({
      start: Math.max(start, interval.start),
      end: Math.min(end, interval.end),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start)
    .forEach((interval) => {
      const last = merged[merged.length - 1];
      if (!last || interval.start > last.end) {
        merged.push({ ...interval });
        return;
      }
      last.end = Math.max(last.end, interval.end);
    });

  return merged.reduce((sum, interval) => sum + interval.end - interval.start, 0);
}

function wallCoverageOnBoundary(segments, orientation, axis, start, end, tolerance) {
  const intervals = segments
    .filter((segment) => segment.orientation === orientation)
    .filter((segment) => Math.abs(segment.axisCenter - axis) <= tolerance)
    .map((segment) => ({
      start: segment.start,
      end: segment.end,
    }));
  return mergedIntervalCoverage(intervals, start, end) / Math.max(1, end - start);
}

function roomWorldArea(region, result) {
  const corners = [
    worldPositionForPixel(region.minX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.maxY, result.width, result.height, result),
    worldPositionForPixel(region.minX, region.maxY, result.width, result.height, result),
  ];
  let area = 0;
  corners.forEach((point, index) => {
    const next = corners[(index + 1) % corners.length];
    area += point.x * next.z - next.x * point.z;
  });
  return Math.abs(area) / 2;
}

function estimateRoomRegions(segments, result) {
  const axisTolerance = Math.max(8, Math.round(Math.max(result.width, result.height) * 0.01));
  const minRoomSide = Math.max(24, Math.round(Math.min(result.width, result.height) * 0.035));
  const xs = clusteredAxisValues(
    segments.filter((segment) => segment.orientation === "vertical").map((segment) => segment.axisCenter),
    axisTolerance,
  );
  const ys = clusteredAxisValues(
    segments.filter((segment) => segment.orientation === "horizontal").map((segment) => segment.axisCenter),
    axisTolerance,
  );
  const rooms = [];

  for (let xIndex = 0; xIndex < xs.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < ys.length - 1; yIndex += 1) {
      const minX = xs[xIndex];
      const maxX = xs[xIndex + 1];
      const minY = ys[yIndex];
      const maxY = ys[yIndex + 1];
      if (maxX - minX < minRoomSide || maxY - minY < minRoomSide) continue;

      const top = wallCoverageOnBoundary(segments, "horizontal", minY, minX, maxX, axisTolerance);
      const bottom = wallCoverageOnBoundary(segments, "horizontal", maxY, minX, maxX, axisTolerance);
      const left = wallCoverageOnBoundary(segments, "vertical", minX, minY, maxY, axisTolerance);
      const right = wallCoverageOnBoundary(segments, "vertical", maxX, minY, maxY, axisTolerance);
      if (Math.min(top, bottom, left, right) < 0.58) continue;

      const region = {
        minX,
        maxX,
        minY,
        maxY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        confidence: Math.min(1, (top + bottom + left + right) / 4),
        source: "closed-wall-cell",
      };
      region.worldArea = roomWorldArea(region, result);
      if (region.worldArea < 0.55) continue;
      rooms.push(region);
    }
  }

  return rooms.sort((a, b) => b.worldArea - a.worldArea).slice(0, 32);
}

const planTypeLabels = {
  "black-cad": "黑底 CAD",
  "colored-layout": "彩色户型图",
  "annotated-layout": "带标注布局图",
  "structural-plan": "结构平面图",
};

const floorPlanRoomRoleLabels = {
  living: "客餐厅",
  dining: "餐厅",
  kitchen: "厨房/西厨",
  primarySuite: "主卧套房",
  secondarySuite: "次主卧",
  bedroom: "卧室",
  balcony: "阳台/露台",
  service: "厨卫/设备",
  storage: "家政/储藏",
  circulation: "过道",
  flexible: "弹性空间",
};

function planTypeLabel(type) {
  return planTypeLabels[type] ?? "户型平面图";
}

function roomEdgeTouchCount(room, result) {
  const bounds = result.architecturalBounds ?? planBoundsForSegments(result.segments, result.width, result.height);
  const tolerance = Math.max(10, Math.min(bounds.width, bounds.height) * 0.045);
  return [
    Math.abs(room.minX - bounds.minX) <= tolerance,
    Math.abs(room.maxX - bounds.maxX) <= tolerance,
    Math.abs(room.minY - bounds.minY) <= tolerance,
    Math.abs(room.maxY - bounds.maxY) <= tolerance,
  ].filter(Boolean).length;
}

function roomOpeningCounts(room, result) {
  const tolerance = Math.max(8, Math.min(result.width, result.height) * 0.012);
  const touchesOpening = (opening) => {
    if (opening.orientation === "horizontal") {
      const nearTop = Math.abs(opening.axisCenter - room.minY) <= tolerance;
      const nearBottom = Math.abs(opening.axisCenter - room.maxY) <= tolerance;
      const overlap = Math.max(0, Math.min(opening.end, room.maxX) - Math.max(opening.start, room.minX));
      return (nearTop || nearBottom) && overlap > Math.min(room.maxX - room.minX, segmentLength(opening)) * 0.18;
    }

    const nearLeft = Math.abs(opening.axisCenter - room.minX) <= tolerance;
    const nearRight = Math.abs(opening.axisCenter - room.maxX) <= tolerance;
    const overlap = Math.max(0, Math.min(opening.end, room.maxY) - Math.max(opening.start, room.minY));
    return (nearLeft || nearRight) && overlap > Math.min(room.maxY - room.minY, segmentLength(opening)) * 0.18;
  };

  return {
    doors: (result.doors ?? []).filter(touchesOpening).length,
    windows: (result.windows ?? []).filter(touchesOpening).length,
  };
}

function classifyRoomByFloorPlanLogic(room, result, rankingIndex) {
  const area = room.worldArea ?? roomWorldArea(room, result);
  const width = Math.max(1, room.maxX - room.minX);
  const height = Math.max(1, room.maxY - room.minY);
  const aspect = Math.max(width, height) / Math.max(1, Math.min(width, height));
  const edgeTouches = roomEdgeTouchCount(room, result);
  const openings = roomOpeningCounts(room, result);
  const nearExterior = edgeTouches > 0;

  if (nearExterior && openings.windows > 0 && (aspect >= 2.15 || area <= 5.2)) {
    return { type: "balcony", confidence: 0.68 };
  }
  if (area <= 5.4 && (openings.doors > 0 || nearExterior)) {
    return { type: "service", confidence: 0.58 };
  }
  if (rankingIndex === 0 && area >= 8.2) {
    return { type: "living", confidence: 0.62 };
  }
  if (area >= 6.2 && nearExterior && openings.windows > 0) {
    return { type: "bedroom", confidence: 0.55 };
  }
  if (aspect >= 2.55 && area <= 7.5) {
    return { type: "circulation", confidence: 0.5 };
  }
  return { type: "flexible", confidence: 0.42 };
}

function applyLuxuryFlatReadingProfile(rooms, result, roleCounts) {
  const profile = floorPlanReadingProfiles.luxuryFlat;
  const bedroomLikeRooms = rooms.filter((room) => room.logicalType === "bedroom");
  const serviceRooms = rooms.filter((room) => room.logicalType === "service");
  const balconyRooms = rooms.filter((room) => room.logicalType === "balcony");
  const matchesProfile =
    rooms.length >= profile.minRooms &&
    bedroomLikeRooms.length >= profile.minBedroomLikeRooms &&
    serviceRooms.length >= profile.minServiceRooms &&
    balconyRooms.length >= profile.minBalconies;

  if (!matchesProfile) return null;

  const resetRole = (room, type, confidenceBoost = 0.08) => {
    roleCounts[room.logicalType] = Math.max(0, (roleCounts[room.logicalType] ?? 0) - 1);
    room.logicalType = type;
    room.logicalLabel = floorPlanRoomRoleLabels[type] ?? room.logicalLabel;
    room.logicalConfidence = Math.min(0.88, (room.logicalConfidence ?? 0.5) + confidenceBoost);
    roleCounts[type] = (roleCounts[type] ?? 0) + 1;
  };

  const livingRoom = rooms.find((room) => room.logicalType === "living");
  const publicCenterX = livingRoom ? (livingRoom.minX + livingRoom.maxX) / 2 : result.width / 2;
  const publicCenterY = livingRoom ? (livingRoom.minY + livingRoom.maxY) / 2 : result.height / 2;

  bedroomLikeRooms
    .sort((a, b) => (b.worldArea ?? 0) - (a.worldArea ?? 0))
    .forEach((room, index) => {
      if (index === 0) resetRole(room, "primarySuite", 0.16);
      else if (index === 1) resetRole(room, "secondarySuite", 0.12);
    });

  serviceRooms
    .sort((a, b) => (b.worldArea ?? 0) - (a.worldArea ?? 0))
    .forEach((room, index) => {
      const centerX = (room.minX + room.maxX) / 2;
      const centerY = (room.minY + room.maxY) / 2;
      const nearPublic = Math.abs(centerX - publicCenterX) < result.width * 0.38 && Math.abs(centerY - publicCenterY) < result.height * 0.38;
      if (index === 0 || nearPublic) resetRole(room, "kitchen", 0.1);
      else if ((room.worldArea ?? 0) <= 4.8) resetRole(room, "storage", 0.06);
    });

  const diningCandidate = rooms
    .filter((room) => ["flexible", "circulation"].includes(room.logicalType))
    .sort((a, b) => {
      const distanceA = Math.hypot((a.minX + a.maxX) / 2 - publicCenterX, (a.minY + a.maxY) / 2 - publicCenterY);
      const distanceB = Math.hypot((b.minX + b.maxX) / 2 - publicCenterX, (b.minY + b.maxY) / 2 - publicCenterY);
      return distanceA - distanceB;
    })[0];
  if (diningCandidate && (diningCandidate.worldArea ?? 0) >= 4.8) resetRole(diningCandidate, "dining", 0.1);

  return {
    key: "luxuryFlat",
    label: profile.label,
    suiteCount: (roleCounts.primarySuite ?? 0) + (roleCounts.secondarySuite ?? 0),
    balconyCount: balconyRooms.length,
    serviceCoreCount: serviceRooms.length,
  };
}

function applyFloorPlanSpatialLogic(result, map) {
  const visual = map.visual ?? {};
  const rooms = [...(result.rooms ?? [])].sort((a, b) => (b.worldArea ?? 0) - (a.worldArea ?? 0));
  const roleCounts = {};

  rooms.forEach((room, index) => {
    const classification = classifyRoomByFloorPlanLogic(room, result, index);
    room.logicalType = classification.type;
    room.logicalLabel = floorPlanRoomRoleLabels[classification.type] ?? "空间";
    room.logicalConfidence = classification.confidence;
    roleCounts[classification.type] = (roleCounts[classification.type] ?? 0) + 1;
  });

  const learnedProfile = applyLuxuryFlatReadingProfile(rooms, result, roleCounts);

  const exteriorWalls = result.segments.filter((wall) => architecturalWallRole(wall, result) === "exterior").length;
  const fixedFeatureSignals =
    (visual.planType === "colored-layout" ? 1 : 0) +
    (visual.planType === "black-cad" ? 1 : 0) +
    (roleCounts.service ?? 0) +
    (roleCounts.balcony ?? 0) +
    (learnedProfile ? 2 : 0);

  return {
    planType: visual.planType ?? "structural-plan",
    planTypeLabel: planTypeLabel(visual.planType),
    annotationFiltered: Math.round((visual.annotationRatio ?? 0) * map.width * map.height),
    roomRoles: roleCounts,
    learnedProfile,
    learnedProfileLabel: learnedProfile?.label ?? "",
    exteriorWalls,
    fixedFeatureSignals,
  };
}

function estimateWallSegments(sourceCanvas, options = {}) {
  const optimizer = planOptimizerSettings();
  const map = buildInkMap(sourceCanvas);
  const wallRuns = mergeRuns([...scanRuns(map, "horizontal", "wallInk"), ...scanRuns(map, "vertical", "wallInk")]);
  const detailWallRuns = mergeRuns([
    ...scanRuns(map, "horizontal", "wallInk", { minLengthPx: 5, minLengthRatio: 0.006, supportThreshold: 0.12 }),
    ...scanRuns(map, "vertical", "wallInk", { minLengthPx: 5, minLengthRatio: 0.006, supportThreshold: 0.12 }),
  ]);
  const symbolRuns = mergeRuns([...scanRuns(map, "horizontal"), ...scanRuns(map, "vertical")]);
  const pairedWalls = buildPairedWallCandidates(wallRuns, map.width, map.height, options);
  const outlineWalls = buildSegmentedOutlineWallCandidates(wallRuns, map.width, map.height, options);
  const localReturnWalls = buildLocalReturnWallCandidates(detailWallRuns, wallRuns, map.width, map.height, options);
  const solidWalls = buildSolidWallCandidates(wallRuns, map.width, map.height);
  const ruleBasedSegments = keepDominantWallRegion(
    cleanWallSegments(
      pruneTinyWallSegments(mergeWallCandidates([...pairedWalls, ...outlineWalls, ...localReturnWalls, ...solidWalls]), map.width, map.height, {
        optimizer,
        sourceRect: options.sourceRect,
      }),
      map.width,
      map.height,
      { optimizer, sourceRect: options.sourceRect },
    ),
    map.width,
    map.height,
  );
  const fallbackSegments = cleanWallSegments(
    pruneTinyWallSegments(
      wallRuns.map((segment) => ({
        orientation: segment.orientation,
        start: segment.start,
        end: segment.end,
        axisCenter: segment.axisCenter,
        thicknessPx: Math.max(4, segment.maxAxis - segment.minAxis + 1),
        confidence: Math.min(1, segment.samples / 10),
        source: "fallback",
        })),
      map.width,
      map.height,
      { optimizer, sourceRect: options.sourceRect },
    ),
    map.width,
    map.height,
    { optimizer, sourceRect: options.sourceRect },
  );
  const segments = (ruleBasedSegments.length >= 4 ? ruleBasedSegments : fallbackSegments).map((segment) => ({
    ...segment,
    baseStart: segment.start,
    baseEnd: segment.end,
    startCorrectionMeters: 0,
    endCorrectionMeters: 0,
  }));
  const gapDoors = estimateDoorOpenings(map, segments);
  const symbolDoors = optimizer.doorWindowSymbols ? estimateSymbolDoors(map, segments, symbolRuns, gapDoors) : [];
  const rawDoors = dedupeOpenings([...gapDoors, ...symbolDoors]);
  const gapWindows = estimateWindowOpenings(map, segments, rawDoors);
  const symbolWindows = optimizer.doorWindowSymbols ? estimateSymbolWindows(map, segments, symbolRuns, [...rawDoors, ...gapWindows]) : [];
  const slidingWindows = optimizer.doorWindowSymbols ? estimateSlidingOpenings(map, segments, symbolRuns, [...rawDoors, ...gapWindows, ...symbolWindows]) : [];
  const rawWindows = dedupeOpenings([...gapWindows, ...symbolWindows, ...slidingWindows]).map((opening) => ({
    ...opening,
    windowType: opening.windowType ?? "standard",
  }));
  const rooms = estimateRoomRegions(segments, { width: map.width, height: map.height });
  const architecturalResult = { width: map.width, height: map.height, segments, doors: rawDoors, windows: rawWindows, rooms };
  const architectural = applyArchitecturalOpeningLogic(architecturalResult, map);
  const doors = architectural.doors;
  const windows = architectural.windows;
  architecturalResult.doors = doors;
  architecturalResult.windows = windows;
  const layoutLogic = applyFloorPlanSpatialLogic(architecturalResult, map);
  const quality = {
    ...recognitionQualityForResult(segments, doors, windows, map, ruleBasedSegments.length >= 4),
    ...architectural.quality,
    layoutLogicSignals: layoutLogic.fixedFeatureSignals,
  };

  return {
    width: map.width,
    height: map.height,
    sourceRect: options.sourceRect ?? null,
    segments,
    doors,
    windows,
    rooms,
    layoutLogic,
    runs: symbolRuns,
    wallRuns,
    architecturalBounds: architecturalResult.architecturalBounds,
    quality,
    optimizer,
    inkMap: map,
  };
}

function worldPositionForPixel(x, y, width, height, result = null) {
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  const sourceRect = result?.sourceRect ?? null;
  const imageWidth = sourceRect?.canvasWidth ?? width;
  const imageHeight = sourceRect?.canvasHeight ?? height;
  const imageX = sourceRect ? sourceRect.x + (x / Math.max(1, width)) * sourceRect.width : x;
  const imageY = sourceRect ? sourceRect.y + (y / Math.max(1, height)) * sourceRect.height : y;
  const localPoint = new THREE.Vector3(
    (imageX / imageWidth - 0.5) * planeWidth,
    (0.5 - imageY / imageHeight) * planeHeight,
    0,
  );

  if (planMesh) {
    planMesh.updateMatrixWorld();
    planMesh.localToWorld(localPoint);
  }

  return {
    x: localPoint.x,
    z: localPoint.z,
  };
}

function worldEndpointsForSegment(segment, result) {
  if (segment.orientation === "horizontal") {
    return {
      from: worldPositionForPixel(segment.start, segment.axisCenter, result.width, result.height, result),
      to: worldPositionForPixel(segment.end, segment.axisCenter, result.width, result.height, result),
    };
  }

  return {
    from: worldPositionForPixel(segment.axisCenter, segment.start, result.width, result.height, result),
    to: worldPositionForPixel(segment.axisCenter, segment.end, result.width, result.height, result),
  };
}

function worldUnitsPerDetectionPixel(result, axis) {
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  const resultPixels = axis === "x" ? result.width : result.height;
  const planeSize = axis === "x" ? planeWidth : planeHeight;

  if (!result.sourceRect) {
    return planeSize / Math.max(1, resultPixels);
  }

  const cropPixels = axis === "x" ? result.sourceRect.width : result.sourceRect.height;
  const canvasPixels = axis === "x" ? result.sourceRect.canvasWidth : result.sourceRect.canvasHeight;
  return (cropPixels / Math.max(1, resultPixels) / Math.max(1, canvasPixels)) * planeSize;
}

function worldThicknessForFeature(feature, result, minimum = 0.1) {
  const thicknessAxis = feature.orientation === "horizontal" ? "y" : "x";
  const relativeThickness = (feature.thicknessPx ?? 4) * worldUnitsPerDetectionPixel(result, thicknessAxis);
  return THREE.MathUtils.clamp(relativeThickness, minimum, 0.34);
}

function pixelThicknessForWorldLength(length, result, orientation = "horizontal") {
  const axis = orientation === "horizontal" ? "y" : "x";
  return length / Math.max(0.001, worldUnitsPerDetectionPixel(result, axis));
}

function worldLengthForSegment(segment, result) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  return Math.hypot(to.x - from.x, to.z - from.z);
}

function formatWallLength(length) {
  if (!Number.isFinite(length)) return "0.0 m";
  return `${length >= 1 ? length.toFixed(1) : length.toFixed(2)} m`;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function makeWallLengthSprite(text, options = {}) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const fontSize = options.fontSize ?? 34;
  const paddingX = 20;
  const paddingY = 10;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `700 ${fontSize}px "Noto Sans SC", Arial, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const logicalWidth = textWidth + paddingX * 2;
  const logicalHeight = fontSize + paddingY * 2;

  canvas.width = Math.ceil(logicalWidth * pixelRatio);
  canvas.height = Math.ceil(logicalHeight * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.font = `700 ${fontSize}px "Noto Sans SC", Arial, sans-serif`;
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(31, 37, 43, 0.16)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawRoundedRect(ctx, 2, 2, logicalWidth - 4, logicalHeight - 4, 14);
  ctx.fillStyle = "rgba(255, 241, 169, 0.96)";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(189, 139, 47, 0.95)";
  ctx.stroke();
  ctx.fillStyle = "#1d252c";
  ctx.fillText(text, paddingX, logicalHeight / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const labelHeight = options.height ?? 0.28;
  sprite.scale.set(labelHeight * (logicalWidth / logicalHeight), labelHeight, 1);
  sprite.renderOrder = options.renderOrder ?? 12;
  sprite.userData.featureKind = "wall-length-label";
  return sprite;
}

function makeWallLengthAnnotation(segment, result, options = {}) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  if (length < (options.minLength ?? 0.08)) return null;

  const wallThickness = worldThicknessForFeature(segment, result, 0.08);
  const normalX = -dz / length;
  const normalZ = dx / length;
  const midpoint = new THREE.Vector3((from.x + to.x) / 2, options.y ?? 0.24, (from.z + to.z) / 2);
  const edgeOffset = wallThickness / 2 + 0.04;
  const labelOffset = options.offset ?? Math.max(0.32, wallThickness * 2.2);
  const lineStart = new THREE.Vector3(
    midpoint.x + normalX * edgeOffset,
    midpoint.y,
    midpoint.z + normalZ * edgeOffset,
  );
  const lineEnd = new THREE.Vector3(
    midpoint.x + normalX * labelOffset,
    midpoint.y,
    midpoint.z + normalZ * labelOffset,
  );

  const annotation = new THREE.Group();
  annotation.userData.featureKind = "wall-length-annotation";

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: colors.gold,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
    depthWrite: false,
  });
  const guideLine = new THREE.Line(lineGeometry, lineMaterial);
  guideLine.renderOrder = options.renderOrder ?? 12;
  annotation.add(guideLine);

  const label = makeWallLengthSprite(formatWallLength(length), {
    height: options.height,
    renderOrder: options.renderOrder,
  });
  label.position.set(
    lineEnd.x + normalX * (options.labelGap ?? 0.04),
    lineEnd.y,
    lineEnd.z + normalZ * (options.labelGap ?? 0.04),
  );
  annotation.add(label);
  return annotation;
}

function addWallLengthAnnotations(group, result, options = {}) {
  result.segments.forEach((segment) => {
    const annotation = makeWallLengthAnnotation(segment, result, options);
    if (annotation) group.add(annotation);
  });
}

function pixelLengthForWorldLength(length, result, orientation = "horizontal") {
  const axis = orientation === "horizontal" ? "x" : "y";
  return Math.max(0.2, length) / Math.max(0.001, worldUnitsPerDetectionPixel(result, axis));
}

function wallAxisLimit(segment, result) {
  return segment.orientation === "horizontal" ? result.width : result.height;
}

function floorBoundsForDetectedResult(result) {
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  if (!planCanvas) {
    return {
      centerX: 0,
      centerZ: 0,
      width: planeWidth,
      depth: planeHeight,
    };
  }

  const rect = result?.sourceRect ?? {
    x: 0,
    y: 0,
    width: planCanvas.width,
    height: planCanvas.height,
  };
  const corners = [
    worldPositionForPixel(rect.x, rect.y, planCanvas.width, planCanvas.height),
    worldPositionForPixel(rect.x + rect.width, rect.y, planCanvas.width, planCanvas.height),
    worldPositionForPixel(rect.x + rect.width, rect.y + rect.height, planCanvas.width, planCanvas.height),
    worldPositionForPixel(rect.x, rect.y + rect.height, planCanvas.width, planCanvas.height),
  ];
  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minZ = Math.min(...corners.map((corner) => corner.z));
  const maxZ = Math.max(...corners.map((corner) => corner.z));

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: Math.max(0.2, maxX - minX),
    depth: Math.max(0.2, maxZ - minZ),
  };
}

function makeWallMeshFromSegment(segment, result, height, thickness, color, y) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const mesh = box(length + thickness, height, thickness, color, {
    transparent: height < 0.2,
    opacity: height < 0.2 ? 0.82 : 1,
    castShadow: height >= 0.2,
  });
  mesh.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  return mesh;
}

function wallHandlePixelPositions(segment) {
  const center = (segment.start + segment.end) / 2;
  const halfThickness = Math.max(2, segment.thicknessPx ?? 5) / 2;
  if (segment.orientation === "horizontal") {
    return {
      start: { x: segment.start, y: segment.axisCenter },
      end: { x: segment.end, y: segment.axisCenter },
      "side-min": { x: center, y: segment.axisCenter - halfThickness },
      "side-max": { x: center, y: segment.axisCenter + halfThickness },
    };
  }

  return {
    start: { x: segment.axisCenter, y: segment.start },
    end: { x: segment.axisCenter, y: segment.end },
    "side-min": { x: segment.axisCenter - halfThickness, y: center },
    "side-max": { x: segment.axisCenter + halfThickness, y: center },
  };
}

function makeWallHandleNode(handle, segment, result) {
  const positions = wallHandlePixelPositions(segment);
  const pixel = positions[handle];
  if (!pixel) return null;

  const world = worldPositionForPixel(pixel.x, pixel.y, result.width, result.height, result);
  const isSideHandle = handle === "side-min" || handle === "side-max";
  const radius = isSideHandle ? 0.085 : 0.075;
  const color = isSideHandle ? colors.gold : colors.coral;
  const node = cylinder(radius, radius, 0.045, color, {
    segments: 24,
    castShadow: false,
    receiveShadow: false,
    transparent: true,
    opacity: 0.96,
  });
  node.position.set(world.x, 0.31, world.z);
  node.userData.featureKind = "wall-handle";
  node.userData.wallHandle = handle;
  node.userData.selectName = `${wallDragHandleLabel(handle)}控制点`;
  node.renderOrder = 30;

  const halo = cylinder(radius * 1.55, radius * 1.55, 0.025, colors.white, {
    segments: 24,
    castShadow: false,
    receiveShadow: false,
    transparent: true,
    opacity: 0.78,
  });
  halo.position.set(world.x, 0.285, world.z);
  halo.userData.featureKind = "wall-handle-halo";
  halo.renderOrder = 29;

  const group = new THREE.Group();
  group.add(halo, node);
  group.userData.featureKind = "wall-handle-group";
  group.userData.wallHandle = handle;
  return group;
}

function addSelectedWallHandles(group, result) {
  const segment =
    selectedDetectedWallIndex === null ? null : result?.segments?.[selectedDetectedWallIndex] ?? null;
  if (!segment) return;

  ["start", "end", "side-min", "side-max"].forEach((handle) => {
    const node = makeWallHandleNode(handle, segment, result);
    if (node) group.add(node);
  });
}

function makeRoomRegionMesh(region, result, index) {
  const corners = [
    worldPositionForPixel(region.minX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.maxY, result.width, result.height, result),
    worldPositionForPixel(region.minX, region.maxY, result.width, result.height, result),
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        corners[0].x,
        0.026,
        corners[0].z,
        corners[1].x,
        0.026,
        corners[1].z,
        corners[2].x,
        0.026,
        corners[2].z,
        corners[3].x,
        0.026,
        corners[3].z,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const roomColors = {
    living: 0xd9eee6,
    bedroom: 0x9fd4e8,
    balcony: 0xb8e6c8,
    service: 0xf3dfbd,
    circulation: 0xe5e1d8,
    flexible: 0xd9eee6,
  };
  const material = new THREE.MeshBasicMaterial({
    color: roomColors[region.logicalType] ?? (index % 2 === 0 ? 0x9fd4e8 : 0xd9eee6),
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 4;
  mesh.userData.featureKind = "room-region";
  return mesh;
}

function makeRoomRegionLabel(region, result, index) {
  const center = worldPositionForPixel(region.centerX, region.centerY, result.width, result.height, result);
  const labelText = `${region.logicalLabel ?? "空间"} ${index + 1} · ${(region.worldArea ?? 0).toFixed(1)}m²`;
  const label = makeWallLengthSprite(labelText, {
    height: 0.22,
    renderOrder: 16,
  });
  label.position.set(center.x, 0.18, center.z);
  label.userData.featureKind = "room-region-label";
  return label;
}

function roomWorldBounds(region, result) {
  const corners = [
    worldPositionForPixel(region.minX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.minY, result.width, result.height, result),
    worldPositionForPixel(region.maxX, region.maxY, result.width, result.height, result),
    worldPositionForPixel(region.minX, region.maxY, result.width, result.height, result),
  ];
  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minZ = Math.min(...corners.map((corner) => corner.z));
  const maxZ = Math.max(...corners.map((corner) => corner.z));
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: Math.max(0.18, maxX - minX),
    depth: Math.max(0.18, maxZ - minZ),
  };
}

function roomSemanticFloorColor(type) {
  const floorColors = {
    living: 0xdbd7cf,
    dining: 0xe4dbcd,
    kitchen: 0xd9dde0,
    primarySuite: 0xcbb894,
    secondarySuite: 0xd4c6a8,
    bedroom: floorFinishes.oak,
    balcony: 0xc6d6d1,
    service: 0xd8dce0,
    storage: 0xd1d5d2,
    circulation: 0xd7d4ca,
    flexible: 0xdedbd2,
  };
  return floorColors[type] ?? floorFinishes[activeFloorFinish];
}

function makeSemanticRoomFloor(region, result) {
  const bounds = roomWorldBounds(region, result);
  const type = region.logicalType ?? "flexible";
  const floor = box(bounds.width * 0.94, 0.026, bounds.depth * 0.94, roomSemanticFloorColor(type), {
    castShadow: false,
    receiveShadow: true,
    roughness: type === "service" || type === "balcony" ? 0.58 : 0.72,
  });
  floor.position.set(bounds.centerX, 0.012, bounds.centerZ);
  floor.userData.featureKind = "semantic-room-floor";
  floor.userData.roomType = type;
  return floor;
}

function addSemanticBlock(group, bounds, relX, relZ, width, height, depth, color, options = {}) {
  const mesh = box(
    Math.min(bounds.width * 0.82, Math.max(0.05, width)),
    Math.max(0.04, height),
    Math.min(bounds.depth * 0.82, Math.max(0.05, depth)),
    color,
    {
      castShadow: options.castShadow ?? true,
      receiveShadow: options.receiveShadow ?? true,
      transparent: options.transparent,
      opacity: options.opacity,
      roughness: options.roughness,
      metalness: options.metalness,
    },
  );
  mesh.position.set(bounds.centerX + relX * bounds.width, options.y ?? height / 2, bounds.centerZ + relZ * bounds.depth);
  mesh.rotation.y = options.rotationY ?? 0;
  mesh.userData.featureKind = options.featureKind ?? "semantic-fixture";
  mesh.userData.selectName = options.name ?? "plan semantic fixture";
  group.add(mesh);
  return mesh;
}

function addSemanticCylinder(group, bounds, relX, relZ, radius, height, color, options = {}) {
  const mesh = cylinder(radius, radius, height, color, {
    segments: options.segments ?? 24,
    castShadow: options.castShadow ?? true,
    receiveShadow: options.receiveShadow ?? true,
    transparent: options.transparent,
    opacity: options.opacity,
    roughness: options.roughness,
  });
  mesh.position.set(bounds.centerX + relX * bounds.width, options.y ?? height / 2, bounds.centerZ + relZ * bounds.depth);
  mesh.userData.featureKind = options.featureKind ?? "semantic-fixture";
  mesh.userData.selectName = options.name ?? "plan semantic fixture";
  group.add(mesh);
  return mesh;
}

function exteriorEdgesForRoom(region, result) {
  const bounds = result.architecturalBounds ?? planBoundsForSegments(result.segments, result.width, result.height);
  const tolerance = Math.max(10, Math.min(bounds.width, bounds.height) * 0.045);
  return {
    top: Math.abs(region.minY - bounds.minY) <= tolerance,
    bottom: Math.abs(region.maxY - bounds.maxY) <= tolerance,
    left: Math.abs(region.minX - bounds.minX) <= tolerance,
    right: Math.abs(region.maxX - bounds.maxX) <= tolerance,
  };
}

function addBalconyGuardrails(group, region, result, bounds) {
  const edges = exteriorEdgesForRoom(region, result);
  const railHeight = 1.05;
  const railThickness = 0.055;
  const glassOptions = {
    transparent: true,
    opacity: 0.38,
    castShadow: false,
    receiveShadow: false,
    featureKind: "balcony-glass-rail",
    name: "balcony glass rail",
    y: 0.58,
  };

  if (edges.top) addSemanticBlock(group, bounds, 0, -0.48, bounds.width * 0.86, railHeight, railThickness, colors.glass, glassOptions);
  if (edges.bottom) addSemanticBlock(group, bounds, 0, 0.48, bounds.width * 0.86, railHeight, railThickness, colors.glass, glassOptions);
  if (edges.left) addSemanticBlock(group, bounds, -0.48, 0, railThickness, railHeight, bounds.depth * 0.86, colors.glass, glassOptions);
  if (edges.right) addSemanticBlock(group, bounds, 0.48, 0, railThickness, railHeight, bounds.depth * 0.86, colors.glass, glassOptions);
}

function addSemanticRoomFixtures(group, region, result, wallHeight) {
  const type = region.logicalType ?? "flexible";
  const bounds = roomWorldBounds(region, result);
  const compact = Math.min(bounds.width, bounds.depth) < 1.25;
  if (bounds.width * bounds.depth < 0.8) return 0;

  let count = 0;
  if (type === "living") {
    addSemanticBlock(group, bounds, 0.1, 0.08, bounds.width * 0.42, 0.05, bounds.depth * 0.32, 0xe7dfd1, {
      featureKind: "living-rug",
      name: "living rug",
      y: 0.038,
      castShadow: false,
    });
    addSemanticBlock(group, bounds, -0.2, 0.18, bounds.width * 0.36, 0.34, 0.18, 0xd5c7b4, {
      featureKind: "living-sofa",
      name: "living sofa placeholder",
    });
    addSemanticBlock(group, bounds, 0.12, 0.08, 0.42, 0.22, 0.28, 0xc7ad89, {
      featureKind: "coffee-table",
      name: "coffee table placeholder",
    });
    addSemanticBlock(group, bounds, 0, -0.42, bounds.width * 0.52, 0.28, 0.08, 0xb9a27f, {
      featureKind: "tv-wall-cabinet",
      name: "tv wall cabinet placeholder",
    });
    count += 4;
  } else if (type === "dining") {
    addSemanticCylinder(group, bounds, 0, 0, Math.min(bounds.width, bounds.depth) * 0.18, 0.32, 0xd0b487, {
      featureKind: "dining-table",
      name: "dining table placeholder",
      y: 0.34,
    });
    [-0.26, 0.26].forEach((x) => {
      addSemanticBlock(group, bounds, x, 0.28, 0.18, 0.28, 0.18, 0x9e8970, {
        featureKind: "dining-chair",
        name: "dining chair placeholder",
      });
    });
    count += 3;
  } else if (type === "bedroom" || type === "primarySuite" || type === "secondarySuite") {
    addSemanticBlock(group, bounds, 0.08, 0.05, Math.min(1.55, bounds.width * 0.58), 0.36, Math.min(2.05, bounds.depth * 0.58), 0xd7c6aa, {
      featureKind: "bed-placeholder",
      name: "bed placeholder",
    });
    addSemanticBlock(group, bounds, -0.43, 0, 0.26, Math.min(wallHeight * 0.78, 2.15), bounds.depth * 0.74, 0xc6b08f, {
      featureKind: "wardrobe-placeholder",
      name: "wardrobe placeholder",
    });
    count += 2;
    if (type === "primarySuite") {
      addSemanticBlock(group, bounds, 0.43, -0.34, bounds.width * 0.24, 1.05, 0.28, 0xb8a287, {
        featureKind: "suite-closet",
        name: "suite closet placeholder",
      });
      count += 1;
    }
  } else if (type === "service" || type === "kitchen" || type === "storage") {
    const runLength = compact ? bounds.width * 0.62 : bounds.width * 0.78;
    addSemanticBlock(group, bounds, 0, -0.38, runLength, 0.86, 0.36, 0xddd5ca, {
      featureKind: type === "storage" ? "storage-cabinet" : "service-counter",
      name: type === "storage" ? "storage cabinet placeholder" : "kitchen bath counter placeholder",
    });
    if (type !== "storage") {
      addSemanticBlock(group, bounds, -0.28, -0.37, 0.26, 0.06, 0.26, colors.glass, {
        featureKind: "sink-placeholder",
        name: "sink placeholder",
        y: 0.9,
        transparent: true,
        opacity: 0.5,
        castShadow: false,
      });
      addSemanticCylinder(group, bounds, 0.33, 0.22, 0.16, 0.38, 0xf4f1ea, {
        featureKind: "sanitary-placeholder",
        name: "sanitary fixture placeholder",
      });
      count += 3;
    } else {
      count += 1;
    }
  } else if (type === "balcony") {
    addBalconyGuardrails(group, region, result, bounds);
    addSemanticBlock(group, bounds, 0, 0.42, bounds.width * 0.58, 0.24, 0.16, 0xa7b58e, {
      featureKind: "balcony-planter",
      name: "balcony planter placeholder",
    });
    count += 2;
  } else if (type === "circulation") {
    addSemanticBlock(group, bounds, -0.42, 0, 0.16, 1.75, bounds.depth * 0.52, 0xc8b99c, {
      featureKind: "hall-storage",
      name: "hall storage placeholder",
    });
    count += 1;
  } else if (bounds.width > 1.2 && bounds.depth > 1.2) {
    addSemanticBlock(group, bounds, 0, 0, bounds.width * 0.42, 0.32, bounds.depth * 0.24, 0xcab79a, {
      featureKind: "flexible-table",
      name: "flexible room placeholder",
    });
    count += 1;
  }
  return count;
}

function addSemanticRoomModeling(group, result, wallHeight) {
  let floors = 0;
  let fixtures = 0;
  (result.rooms ?? []).forEach((region) => {
    group.add(makeSemanticRoomFloor(region, result));
    floors += 1;
    fixtures += addSemanticRoomFixtures(group, region, result, wallHeight);
  });
  return { floors, fixtures };
}

function openingAlignedToWall(opening, wall) {
  if (!opening || !wall || opening.orientation !== wall.orientation) return false;
  const axisTolerance = Math.max(6, opening.thicknessPx ?? 4, wall.thicknessPx ?? 4);
  if (Math.abs(opening.axisCenter - wall.axisCenter) > axisTolerance) return false;
  return overlapLength(opening, wall) >= Math.min(segmentLength(opening), segmentLength(wall)) * 0.12;
}

function clampedOpeningForWall(opening, wall, kind) {
  if (!openingAlignedToWall(opening, wall)) return null;
  const start = THREE.MathUtils.clamp(Math.max(opening.start, wall.start), wall.start, wall.end);
  const end = THREE.MathUtils.clamp(Math.min(opening.end, wall.end), wall.start, wall.end);
  if (end - start < 2) return null;
  return {
    ...opening,
    kind,
    start,
    end,
    axisCenter: wall.axisCenter,
    thicknessPx: Math.max(opening.thicknessPx ?? 5, wall.thicknessPx ?? 5),
  };
}

function openingsForWallSegment(wall, result) {
  const openings = [
    ...(result.doors ?? []).map((opening) => clampedOpeningForWall(opening, wall, "door")),
    ...(result.windows ?? []).map((opening) => clampedOpeningForWall(opening, wall, "window")),
  ].filter(Boolean);

  return openings.sort((a, b) => a.start - b.start || a.end - b.end);
}

function addGeneratedWallPiece(group, segment, result, height, thickness, centerY) {
  if (segment.end - segment.start < 1 || height <= 0.03) return null;
  const mesh = makeWallMeshFromSegment(segment, result, height, thickness, wallFinishes[activeWallFinish], centerY);
  mesh.userData.collider = "solid-wall";
  generatedWallMeshes.push(mesh);
  group.add(mesh);
  return mesh;
}

function addSolidWallSpansAroundOpenings(group, wall, openings, result, wallHeight, wallThickness) {
  let cursor = wall.start;
  openings.forEach((opening) => {
    if (opening.start > cursor + 1) {
      addGeneratedWallPiece(group, { ...wall, start: cursor, end: opening.start }, result, wallHeight, wallThickness, wallHeight / 2);
    }
    cursor = Math.max(cursor, opening.end);
  });

  if (wall.end > cursor + 1) {
    addGeneratedWallPiece(group, { ...wall, start: cursor, end: wall.end }, result, wallHeight, wallThickness, wallHeight / 2);
  }
}

function windowVerticalProfile(type, wallHeight) {
  const sillHeight =
    type === "floor"
      ? 0.08
      : type === "high"
        ? THREE.MathUtils.clamp(wallHeight * 0.64, 1.55, 2.1)
        : type === "bay"
          ? THREE.MathUtils.clamp(wallHeight * 0.28, 0.62, 0.9)
          : THREE.MathUtils.clamp(wallHeight * 0.36, 0.72, 1.08);
  const windowHeight =
    type === "floor"
      ? THREE.MathUtils.clamp(wallHeight * 0.78, 1.75, wallHeight - 0.18)
      : type === "high"
        ? THREE.MathUtils.clamp(wallHeight * 0.22, 0.48, 0.82)
        : type === "bay"
          ? THREE.MathUtils.clamp(wallHeight * 0.42, 0.96, 1.42)
          : THREE.MathUtils.clamp(wallHeight * 0.34, 0.78, 1.32);
  return {
    sillHeight,
    windowHeight: Math.min(windowHeight, Math.max(0.2, wallHeight - sillHeight - 0.08)),
  };
}

function addWindowWallInfill(group, opening, result, wallHeight, wallThickness) {
  const type = opening.windowType ?? "standard";
  const profile = windowVerticalProfile(type, wallHeight);
  if (profile.sillHeight > 0.16) {
    addGeneratedWallPiece(group, opening, result, profile.sillHeight, wallThickness, profile.sillHeight / 2);
  }

  const topStart = profile.sillHeight + profile.windowHeight;
  const topHeight = wallHeight - topStart;
  if (topHeight > 0.14) {
    addGeneratedWallPiece(group, opening, result, topHeight, wallThickness, topStart + topHeight / 2);
  }
}

function makeDoorLintelFromOpening(opening, result, wallHeight, wallThickness) {
  const doorHeight = Math.min(2.15, wallHeight - 0.08);
  if (wallHeight <= doorHeight + 0.08) return null;

  const lintelHeight = wallHeight - doorHeight;
  return makeWallMeshFromSegment(
    opening,
    result,
    lintelHeight,
    wallThickness,
    wallFinishes[activeWallFinish],
    doorHeight + lintelHeight / 2,
  );
}

function openingCenterTransform(opening, result) {
  const { from, to } = worldEndpointsForSegment(opening, result);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return {
    centerX: (from.x + to.x) / 2,
    centerZ: (from.z + to.z) / 2,
    length: Math.hypot(dx, dz),
    rotationY: -Math.atan2(dz, dx),
  };
}

function makeDoorAssemblyFromOpening(opening, result, wallHeight, wallThickness) {
  const group = new THREE.Group();
  const transform = openingCenterTransform(opening, result);
  const doorHeight = Math.min(2.15, wallHeight - 0.08);
  const doorWidth = Math.max(0.62, transform.length);
  const doorThickness = Math.max(0.035, wallThickness * 0.28);

  const panel = box(doorWidth * 0.84, doorHeight * 0.88, doorThickness, 0x8e6d4e, {
    castShadow: false,
    transparent: true,
    opacity: 0.86,
  });
  panel.position.set(transform.centerX, doorHeight * 0.44, transform.centerZ);
  panel.rotation.y = transform.rotationY;
  panel.userData.selectName = "图纸识别门板";
  group.add(panel);

  const topFrame = box(doorWidth, 0.08, doorThickness * 1.7, colors.woodDark, { castShadow: false });
  topFrame.position.set(transform.centerX, doorHeight + 0.04, transform.centerZ);
  topFrame.rotation.y = transform.rotationY;
  group.add(topFrame);

  [-0.5, 0.5].forEach((side) => {
    const post = box(0.06, doorHeight, doorThickness * 1.7, colors.woodDark, { castShadow: false });
    const offset = new THREE.Vector3(Math.cos(transform.rotationY) * doorWidth * side, 0, -Math.sin(transform.rotationY) * doorWidth * side);
    post.position.set(transform.centerX + offset.x, doorHeight / 2, transform.centerZ + offset.z);
    post.rotation.y = transform.rotationY;
    group.add(post);
  });

  group.userData.selectName = "图纸识别门洞";
  return group;
}

function makeWindowAssemblyFromOpening(opening, result, wallHeight, wallThickness) {
  const group = new THREE.Group();
  const transform = openingCenterTransform(opening, result);
  const type = opening.windowType ?? "standard";
  const { sillHeight, windowHeight } = windowVerticalProfile(type, wallHeight);
  const windowWidth = Math.max(0.72, transform.length);
  const glassThickness = Math.max(0.025, wallThickness * 0.2);

  const glass = box(windowWidth * 0.86, windowHeight, glassThickness, colors.glass, {
    castShadow: false,
    transparent: true,
    opacity: 0.46,
  });
  glass.position.set(transform.centerX, sillHeight + windowHeight / 2, transform.centerZ);
  glass.rotation.y = transform.rotationY;
  glass.userData.selectName = `图纸识别${type === "floor" ? "落地窗" : type === "high" ? "高窗" : type === "bay" ? "飘窗" : "窗"}玻璃`;
  group.add(glass);

  const frameColor = 0xd9e3e2;
  const top = box(windowWidth, 0.055, glassThickness * 1.8, frameColor, { castShadow: false });
  top.position.set(transform.centerX, sillHeight + windowHeight + 0.03, transform.centerZ);
  top.rotation.y = transform.rotationY;
  group.add(top);

  const sill = box(windowWidth * 1.04, 0.075, glassThickness * 2.4, 0xc8c3b8, { castShadow: false });
  sill.position.set(transform.centerX, sillHeight - 0.04, transform.centerZ);
  sill.rotation.y = transform.rotationY;
  group.add(sill);

  const trackCount = type === "floor" || windowWidth > 1.35 ? 3 : 1;
  for (let index = 1; index <= trackCount; index += 1) {
    const ratio = index / (trackCount + 1) - 0.5;
    const mullion = box(0.032, windowHeight * 0.92, glassThickness * 2.2, 0x5d6a6c, { castShadow: false });
    const offset = new THREE.Vector3(Math.cos(transform.rotationY) * windowWidth * ratio, 0, -Math.sin(transform.rotationY) * windowWidth * ratio);
    mullion.position.set(transform.centerX + offset.x, sillHeight + windowHeight / 2, transform.centerZ + offset.z);
    mullion.rotation.y = transform.rotationY;
    group.add(mullion);
  }

  if (type === "floor" || windowWidth > 1.35) {
    [-0.16, 0.16].forEach((trackOffset) => {
      const track = box(windowWidth * 0.96, 0.035, glassThickness * 1.2, 0x687576, { castShadow: false });
      const normal = new THREE.Vector3(Math.sin(transform.rotationY), 0, Math.cos(transform.rotationY)).multiplyScalar(trackOffset);
      track.position.set(transform.centerX + normal.x, sillHeight + 0.025, transform.centerZ + normal.z);
      track.rotation.y = transform.rotationY;
      group.add(track);
    });
  }

  if (type === "bay") {
    const bayDepth = 0.34;
    const bay = box(windowWidth * 1.02, 0.16, bayDepth, 0xd5d0c2, {
      castShadow: true,
      transparent: true,
      opacity: 0.9,
    });
    const outward = new THREE.Vector3(Math.sin(transform.rotationY), 0, Math.cos(transform.rotationY)).multiplyScalar(bayDepth * 0.38);
    bay.position.set(transform.centerX + outward.x, sillHeight - 0.12, transform.centerZ + outward.z);
    bay.rotation.y = transform.rotationY;
    group.add(bay);
  }

  [-0.5, 0.5].forEach((side) => {
    const post = box(0.045, windowHeight, glassThickness * 1.8, frameColor, { castShadow: false });
    const offset = new THREE.Vector3(Math.cos(transform.rotationY) * windowWidth * side, 0, -Math.sin(transform.rotationY) * windowWidth * side);
    post.position.set(transform.centerX + offset.x, sillHeight + windowHeight / 2, transform.centerZ + offset.z);
    post.rotation.y = transform.rotationY;
    group.add(post);
  });

  group.userData.selectName = `图纸识别${type === "floor" ? "落地窗" : type === "high" ? "高窗" : type === "bay" ? "飘窗" : "窗洞"}`;
  return group;
}

function clearGenerated3D() {
  clearTrellisModel();
  if (generatedModelGroup) {
    scene.remove(generatedModelGroup);
    disposeObjectTree(generatedModelGroup);
    generatedModelGroup = null;
  }

  generatedWallMeshes = [];
  generatedDoorMeshes = [];
  generatedWindowMeshes = [];
  generatedFloorMesh = null;
  generated3DActive = false;
  generated3DSource = null;
  if (roomLabel) roomLabel.textContent = roomNames[activeRoom] ?? "DFC 模型";

  if (detectedWallGroup) detectedWallGroup.visible = true;
  shellMeshes.floor.forEach((mesh) => {
    mesh.visible = true;
  });
  shellMeshes.wall.forEach((mesh) => {
    mesh.visible = true;
  });
  updateWorkflowBoard();
  updateDecisionBoard();
}

function setSitePhotoStatus(status, meta) {
  if (sitePhotoStatus) sitePhotoStatus.textContent = status;
  if (sitePhotoMeta) sitePhotoMeta.textContent = meta;
  updateWorkflowBoard();
  updateDecisionBoard();
}

function rgbToHex(r, g, b) {
  return (r << 16) + (g << 8) + b;
}

function mixChannel(value, target, ratio) {
  return Math.round(value * (1 - ratio) + target * ratio);
}

function colorFromImageAverage(avg, target = 255, ratio = 0.45) {
  return rgbToHex(
    mixChannel(avg.r, target, ratio),
    mixChannel(avg.g, target, ratio),
    mixChannel(avg.b, target, ratio),
  );
}

function averageRgb(items) {
  if (items.length === 0) return { r: 180, g: 180, b: 180 };
  const total = items.reduce(
    (sum, item) => ({
      r: sum.r + item.r,
      g: sum.g + item.g,
      b: sum.b + item.b,
    }),
    { r: 0, g: 0, b: 0 },
  );
  return {
    r: Math.round(total.r / items.length),
    g: Math.round(total.g / items.length),
    b: Math.round(total.b / items.length),
  };
}

function rgbLum(rgb) {
  return (rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722) / 255;
}

function samplePhotoRegion(pixels, size, region) {
  const x1 = Math.max(0, Math.floor(region.x * size));
  const y1 = Math.max(0, Math.floor(region.y * size));
  const x2 = Math.min(size, Math.ceil((region.x + region.width) * size));
  const y2 = Math.min(size, Math.ceil((region.y + region.height) * size));
  const samples = [];

  for (let y = y1; y < y2; y += 2) {
    for (let x = x1; x < x2; x += 2) {
      const index = (y * size + x) * 4;
      samples.push({
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
      });
    }
  }

  return averageRgb(samples);
}

function findBrightRectCandidate(pixels, size) {
  let best = null;
  const cellCount = 8;

  for (let gy = 1; gy <= 4; gy += 1) {
    for (let gx = 0; gx < cellCount; gx += 1) {
      const region = {
        x: gx / cellCount,
        y: gy / cellCount,
        width: 1 / cellCount,
        height: 1 / cellCount,
      };
      const avg = samplePhotoRegion(pixels, size, region);
      const lum = rgbLum(avg);
      const score = lum + (gx >= 2 && gx <= 5 ? 0.06 : 0);
      if (!best || score > best.score) {
        best = { ...region, avg, score, confidence: THREE.MathUtils.clamp((lum - 0.58) / 0.32, 0, 1) };
      }
    }
  }

  return best?.confidence > 0.18 ? best : null;
}

function findDarkVerticalCandidate(pixels, size) {
  let best = null;
  const cellCount = 8;

  for (let gx = 0; gx < cellCount; gx += 1) {
    const region = {
      x: gx / cellCount,
      y: 0.34,
      width: 1 / cellCount,
      height: 0.54,
    };
    const avg = samplePhotoRegion(pixels, size, region);
    const darkness = 1 - rgbLum(avg);
    const centerPenalty = Math.abs(gx - 3.5) * 0.02;
    const score = darkness - centerPenalty;
    if (!best || score > best.score) {
      best = { ...region, avg, score, confidence: THREE.MathUtils.clamp((darkness - 0.36) / 0.38, 0, 1) };
    }
  }

  return best?.confidence > 0.2 ? best : null;
}

function findFurnitureCandidate(pixels, size) {
  let best = null;
  const cellCount = 8;

  for (let gy = 5; gy < cellCount; gy += 1) {
    for (let gx = 1; gx < cellCount - 1; gx += 1) {
      const region = {
        x: gx / cellCount,
        y: gy / cellCount,
        width: 1 / cellCount,
        height: 1 / cellCount,
      };
      const avg = samplePhotoRegion(pixels, size, region);
      const lum = rgbLum(avg);
      const score = (1 - lum) * 0.7 + (gy / cellCount) * 0.18;
      if (!best || score > best.score) {
        best = { ...region, avg, score, confidence: THREE.MathUtils.clamp((score - 0.32) / 0.38, 0, 1) };
      }
    }
  }

  return best?.confidence > 0.22 ? best : null;
}

function analyzeSitePhoto(canvas) {
  const sampleSize = 64;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleContext.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const pixels = sampleContext.getImageData(0, 0, sampleSize, sampleSize).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  let edgeTotal = 0;
  let edgeCount = 0;
  let leftLum = 0;
  let centerLum = 0;
  let rightLum = 0;
  let leftCount = 0;
  let centerCount = 0;
  let rightCount = 0;

  for (let index = 0; index < pixels.length; index += 16) {
    r += pixels[index];
    g += pixels[index + 1];
    b += pixels[index + 2];
    count += 1;
  }

  const luminanceAt = (x, y) => {
    const index = (y * sampleSize + x) * 4;
    return pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
  };

  for (let y = 0; y < sampleSize; y += 2) {
    for (let x = 0; x < sampleSize; x += 2) {
      const lum = luminanceAt(x, y);
      if (x < sampleSize / 3) {
        leftLum += lum;
        leftCount += 1;
      } else if (x > (sampleSize * 2) / 3) {
        rightLum += lum;
        rightCount += 1;
      } else {
        centerLum += lum;
        centerCount += 1;
      }

      if (x + 2 < sampleSize) {
        edgeTotal += Math.abs(lum - luminanceAt(x + 2, y));
        edgeCount += 1;
      }
      if (y + 2 < sampleSize) {
        edgeTotal += Math.abs(lum - luminanceAt(x, y + 2));
        edgeCount += 1;
      }
    }
  }

  const avg = {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
  const ceilingAvg = samplePhotoRegion(pixels, sampleSize, { x: 0, y: 0, width: 1, height: 0.24 });
  const wallAvg = samplePhotoRegion(pixels, sampleSize, { x: 0, y: 0.24, width: 1, height: 0.42 });
  const floorAvg = samplePhotoRegion(pixels, sampleSize, { x: 0, y: 0.66, width: 1, height: 0.34 });
  const windowCandidate = findBrightRectCandidate(pixels, sampleSize);
  const doorCandidate = findDarkVerticalCandidate(pixels, sampleSize);
  const furnitureCandidate = findFurnitureCandidate(pixels, sampleSize);
  const aspect = canvas.width / Math.max(1, canvas.height);
  const luminance = (avg.r * 0.2126 + avg.g * 0.7152 + avg.b * 0.0722) / 255;
  const leftAverage = leftLum / Math.max(1, leftCount);
  const centerAverage = centerLum / Math.max(1, centerCount);
  const rightAverage = rightLum / Math.max(1, rightCount);

  return {
    aspect,
    avg,
    detail: edgeTotal / Math.max(1, edgeCount) / 255,
    sideBias: (rightAverage - leftAverage) / 255,
    centerWeight: centerAverage / 255,
    zones: {
      ceiling: ceilingAvg,
      wall: wallAvg,
      floor: floorAvg,
    },
    features: {
      window: windowCandidate,
      door: doorCandidate,
      furniture: furnitureCandidate,
    },
    wallColor: colorFromImageAverage(wallAvg, 255, luminance > 0.62 ? 0.28 : 0.5),
    floorColor: colorFromImageAverage(floorAvg, 92, 0.38),
    ceilingColor: colorFromImageAverage(ceilingAvg, 255, 0.52),
    accentColor: colorFromImageAverage(avg, 44, 0.38),
    width: THREE.MathUtils.clamp(4.2 + aspect * 1.3, 4.6, 7.8),
    depth: THREE.MathUtils.clamp(3.6 + (1 / Math.max(0.7, aspect)) * 1.4, 3.8, 6.4),
    height: Math.max(2.4, Number(wallHeightInput?.value || 2.8)),
  };
}

function analyzeSitePhotoSet(canvases) {
  const analyses = canvases.map(analyzeSitePhoto);
  const count = Math.max(1, analyses.length);
  const avg = analyses.reduce(
    (sum, item) => ({
      r: sum.r + item.avg.r,
      g: sum.g + item.avg.g,
      b: sum.b + item.avg.b,
    }),
    { r: 0, g: 0, b: 0 },
  );
  const combinedAvg = {
    r: Math.round(avg.r / count),
    g: Math.round(avg.g / count),
    b: Math.round(avg.b / count),
  };
  const ceilingAvg = averageRgb(analyses.map((item) => item.zones.ceiling));
  const wallAvg = averageRgb(analyses.map((item) => item.zones.wall));
  const floorAvg = averageRgb(analyses.map((item) => item.zones.floor));
  const aspect = analyses.reduce((sum, item) => sum + item.aspect, 0) / count;
  const luminance = (combinedAvg.r * 0.2126 + combinedAvg.g * 0.7152 + combinedAvg.b * 0.0722) / 255;

  return {
    aspect,
    avg: combinedAvg,
    zones: {
      ceiling: ceilingAvg,
      wall: wallAvg,
      floor: floorAvg,
    },
    wallColor: colorFromImageAverage(wallAvg, 255, luminance > 0.62 ? 0.28 : 0.5),
    floorColor: colorFromImageAverage(floorAvg, 92, 0.38),
    ceilingColor: colorFromImageAverage(ceilingAvg, 255, 0.52),
    accentColor: colorFromImageAverage(combinedAvg, 44, 0.38),
    width: THREE.MathUtils.clamp(4.2 + aspect * 1.2 + Math.min(count, 4) * 0.22, 4.8, 8.2),
    depth: THREE.MathUtils.clamp(3.8 + (1 / Math.max(0.7, aspect)) * 1.4 + Math.min(count, 4) * 0.16, 4.0, 6.8),
    height: Math.max(2.4, Number(wallHeightInput?.value || 2.8)),
    count,
  };
}

function scorePhotoForSlot(photo, slot) {
  const landscapeScore = THREE.MathUtils.clamp((photo.aspect - 0.75) / 1.4, 0, 1);
  const portraitScore = 1 - Math.abs(photo.aspect - 0.9);
  const detailScore = THREE.MathUtils.clamp(photo.detail * 4.8, 0, 1);
  const centerScore = THREE.MathUtils.clamp(photo.centerWeight, 0, 1);

  if (slot === "main") {
    return landscapeScore * 0.42 + detailScore * 0.34 + centerScore * 0.24;
  }
  if (slot === "right") {
    return Math.max(0, photo.sideBias) * 0.5 + detailScore * 0.28 + THREE.MathUtils.clamp(portraitScore, 0, 1) * 0.22;
  }
  return Math.max(0, -photo.sideBias) * 0.5 + detailScore * 0.28 + THREE.MathUtils.clamp(portraitScore, 0, 1) * 0.22;
}

function matchSitePhotosToModel(canvases) {
  const photos = canvases.map((canvas, index) => ({
    canvas,
    index,
    ...analyzeSitePhoto(canvas),
  }));
  const slots = [
    { id: "main", label: "主墙" },
    { id: "right", label: "右侧墙" },
    { id: "left", label: "左侧墙" },
  ];
  const matches = [];
  const used = new Set();

  slots.forEach((slot) => {
    const best = photos
      .filter((photo) => !used.has(photo.index))
      .map((photo) => ({
        ...photo,
        slot: slot.id,
        label: slot.label,
        score: scorePhotoForSlot(photo, slot.id),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best) return;
    used.add(best.index);
    matches.push(best);
  });

  return matches;
}

function sitePhotoMatchSummary(matches = sitePhotoMatches) {
  if (matches.length === 0) return "尚未完成照片匹配";
  return matches.map((match) => `${match.label}: 第 ${match.index + 1} 张`).join(" / ");
}

function refreshSitePhotoMatches() {
  if (sitePhotoCanvases.length === 0) {
    sitePhotoMatches = [];
    setSitePhotoStatus("请先选择现场图片", "支持多张 JPG / PNG / WEBP");
    return [];
  }

  sitePhotoMatches = matchSitePhotosToModel(sitePhotoCanvases);
  setSitePhotoStatus("已自动匹配照片", sitePhotoMatchSummary(sitePhotoMatches));
  return sitePhotoMatches;
}

function makeSitePhotoTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() ?? 1;
  texture.needsUpdate = true;
  return texture;
}

function photoPanelSize(canvas, maxWidth, maxHeight) {
  const aspect = canvas.width / Math.max(1, canvas.height);
  let width = Math.min(maxWidth, maxHeight * aspect);
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return { width, height };
}

function addPhotoReferencePanel(group, canvas, texture, placement, analysis) {
  const panelSize = photoPanelSize(canvas, placement.maxWidth, placement.maxHeight);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(panelSize.width, panelSize.height),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0,
    }),
  );

  panel.position.copy(placement.position);
  panel.rotation.y = placement.rotationY ?? 0;
  panel.userData.selectName = placement.name;
  group.add(panel);
  panel.renderOrder = 2;
}

function photoPanelPlacementsForAnalysis(analysis, wallThickness = 0.12) {
  const centerX = analysis.centerX ?? 0;
  const centerZ = analysis.centerZ ?? 0;
  const { width, depth, height } = analysis;

  return [
    {
      name: "现场图片参考墙 1",
      position: new THREE.Vector3(centerX, height * 0.56, centerZ - depth / 2 + wallThickness / 2 + 0.014),
      rotationY: 0,
      maxWidth: width * 0.76,
      maxHeight: height * 0.68,
    },
    {
      name: "现场图片参考墙 2",
      position: new THREE.Vector3(centerX + width / 2 - wallThickness / 2 - 0.014, height * 0.56, centerZ + depth * 0.02),
      rotationY: -Math.PI / 2,
      maxWidth: depth * 0.58,
      maxHeight: height * 0.62,
    },
    {
      name: "现场图片参考墙 3",
      position: new THREE.Vector3(centerX - width / 2 + wallThickness / 2 + 0.014, height * 0.56, centerZ + depth * 0.02),
      rotationY: Math.PI / 2,
      maxWidth: depth * 0.58,
      maxHeight: height * 0.62,
    },
  ];
}

function wallSurfaceTransform(slot, nx, ny, analysis) {
  const { width, depth, height } = analysis;
  const centerX = analysis.centerX ?? 0;
  const centerZ = analysis.centerZ ?? 0;
  const y = THREE.MathUtils.clamp((1 - ny) * height, 0.35, height - 0.25);

  if (slot === "right") {
    return {
      position: new THREE.Vector3(centerX + width / 2 - 0.052, y, centerZ + (nx - 0.5) * depth * 0.76),
      rotationY: -Math.PI / 2,
    };
  }

  if (slot === "left") {
    return {
      position: new THREE.Vector3(centerX - width / 2 + 0.052, y, centerZ + (0.5 - nx) * depth * 0.76),
      rotationY: Math.PI / 2,
    };
  }

  return {
    position: new THREE.Vector3(centerX + (nx - 0.5) * width * 0.82, y, centerZ - depth / 2 + 0.052),
    rotationY: 0,
  };
}

function makeSurfacePanel(width, height, color, options = {}) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    mat(color, {
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      roughness: options.roughness ?? 0.5,
      metalness: options.metalness ?? 0,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
    }),
  );
}

function addRecognizedPhotoFeatures(group, matches, analysis) {
  const featureSummary = {
    windows: 0,
    doors: 0,
    furniture: 0,
  };

  matches.forEach((match) => {
    const windowFeature = match.features?.window;
    if (windowFeature?.confidence > 0.18) {
      const centerX = windowFeature.x + windowFeature.width / 2;
      const centerY = windowFeature.y + windowFeature.height / 2;
      const transform = wallSurfaceTransform(match.slot, centerX, centerY, analysis);
      const windowWidth = THREE.MathUtils.clamp(
        (match.slot === "main" ? analysis.width : analysis.depth) * (0.18 + windowFeature.confidence * 0.18),
        0.72,
        2.2,
      );
      const windowHeight = THREE.MathUtils.clamp(analysis.height * (0.18 + windowFeature.confidence * 0.18), 0.56, 1.45);
      const glass = makeSurfacePanel(windowWidth, windowHeight, colors.glass, {
        transparent: true,
        opacity: 0.44,
        roughness: 0.18,
        emissive: 0x7fb6c8,
        emissiveIntensity: 0.08,
      });
      glass.position.copy(transform.position);
      glass.rotation.y = transform.rotationY;
      glass.userData.selectName = `${match.label}识别窗`;
      group.add(glass);

      const frame = makeSurfacePanel(windowWidth + 0.08, windowHeight + 0.08, 0xd9e3e2, {
        transparent: true,
        opacity: 0.34,
      });
      frame.position.copy(transform.position);
      frame.position.y -= 0.01;
      frame.rotation.y = transform.rotationY;
      group.add(frame);
      featureSummary.windows += 1;
    }

    const doorFeature = match.features?.door;
    if (doorFeature?.confidence > 0.24) {
      const centerX = doorFeature.x + doorFeature.width / 2;
      const transform = wallSurfaceTransform(match.slot, centerX, 0.62, analysis);
      const doorWidth = THREE.MathUtils.clamp((match.slot === "main" ? analysis.width : analysis.depth) * 0.16, 0.68, 1.1);
      const doorHeight = Math.min(2.15, analysis.height - 0.18);
      const door = makeSurfacePanel(doorWidth, doorHeight, colorFromImageAverage(doorFeature.avg, 34, 0.22), {
        transparent: true,
        opacity: 0.72,
        roughness: 0.76,
      });
      door.position.copy(transform.position);
      door.position.y = doorHeight / 2;
      door.rotation.y = transform.rotationY;
      door.userData.selectName = `${match.label}识别门洞`;
      group.add(door);
      featureSummary.doors += 1;
    }

    if (match.features?.furniture?.confidence > 0.22) {
      featureSummary.furniture += 1;
    }
  });

  return featureSummary;
}

function furniturePositionFromFeature(feature, match, analysis, fallback) {
  if (!feature || !match) return fallback;

  const centerX = analysis.centerX ?? 0;
  const centerZ = analysis.centerZ ?? 0;
  const nx = feature.x + feature.width / 2;
  const ny = feature.y + feature.height / 2;
  const xOffset = (nx - 0.5) * analysis.width * 0.56;
  const zOffset = THREE.MathUtils.clamp((ny - 0.5) * analysis.depth * 0.42, -analysis.depth * 0.1, analysis.depth * 0.28);

  if (match.slot === "right") {
    return new THREE.Vector3(centerX + analysis.width * 0.2, 0, centerZ + zOffset);
  }
  if (match.slot === "left") {
    return new THREE.Vector3(centerX - analysis.width * 0.2, 0, centerZ + zOffset);
  }
  return new THREE.Vector3(centerX + xOffset, 0, centerZ + analysis.depth * 0.18 + zOffset);
}

function addDisplayFurniture(group, analysis, matches = []) {
  const centerX = analysis.centerX ?? 0;
  const centerZ = analysis.centerZ ?? 0;
  const sofaColor = analysis.accentColor;
  const woodColor = colorFromImageAverage(analysis.avg, 112, 0.5);
  const furnitureMatch = matches
    .filter((match) => match.features?.furniture)
    .sort((a, b) => b.features.furniture.confidence - a.features.furniture.confidence)[0];
  const sofaPosition = furniturePositionFromFeature(
    furnitureMatch?.features?.furniture,
    furnitureMatch,
    analysis,
    new THREE.Vector3(centerX - analysis.width * 0.18, 0, centerZ + analysis.depth * 0.22),
  );

  const sofa = new THREE.Group();
  sofa.add(place(box(2.2, 0.34, 0.82, sofaColor), 0, 0.24, 0));
  sofa.add(place(box(2.28, 0.62, 0.18, sofaColor), 0, 0.6, -0.36));
  sofa.add(place(box(0.2, 0.42, 0.82, sofaColor), -1.14, 0.38, 0));
  sofa.add(place(box(0.2, 0.42, 0.82, sofaColor), 1.14, 0.38, 0));
  sofa.position.copy(sofaPosition);
  group.add(sofa);

  const table = new THREE.Group();
  table.add(place(cylinder(0.45, 0.45, 0.08, colors.stone), 0, 0.42, 0));
  table.add(place(cylinder(0.08, 0.1, 0.38, colors.metal, { metalness: 0.4 }), 0, 0.2, 0));
  table.position.set(centerX + 0.15, 0, centerZ + analysis.depth * 0.12);
  group.add(table);

  const cabinet = new THREE.Group();
  cabinet.add(place(box(2.4, 0.62, 0.38, woodColor), 0, 0.35, 0));
  cabinet.add(place(box(2.5, 0.06, 0.44, colors.woodDark), 0, 0.7, 0));
  cabinet.position.set(centerX + (sofaPosition.x - centerX) * -0.28, 0, centerZ - analysis.depth * 0.5 + 0.42);
  group.add(cabinet);

  const ceilingLight = box(1.8, 0.05, 0.08, colors.light, {
    emissive: colors.light,
    emissiveIntensity: 0.28,
  });
  ceilingLight.position.set(centerX, analysis.height - 0.16, centerZ - 0.15);
  group.add(ceilingLight);
}

function buildDisplayModelFromSitePhoto() {
  if (sitePhotoCanvases.length === 0) {
    setSitePhotoStatus("请先选择现场图片", "支持多张 JPG / PNG / WEBP");
    return;
  }

  clearGenerated3D();
  sitePhotoAnalysis = analyzeSitePhotoSet(sitePhotoCanvases);
  const matches = sitePhotoMatches.length > 0 ? sitePhotoMatches : refreshSitePhotoMatches();
  sitePhotoTextures = matches.map((match) => makeSitePhotoTexture(match.canvas));
  sitePhotoCanvas = matches[0]?.canvas ?? sitePhotoCanvases[0];
  sitePhotoTexture = sitePhotoTextures[0];

  const { width, depth, height, wallColor, floorColor, ceilingColor } = sitePhotoAnalysis;
  generatedModelGroup = new THREE.Group();
  generatedModelGroup.name = "site-photo-display-model";

  generatedFloorMesh = box(width, 0.08, depth, floorColor, { castShadow: false });
  generatedFloorMesh.position.set(0, -0.04, 0);
  generatedModelGroup.add(generatedFloorMesh);

  const ceilingMesh = box(width, 0.06, depth, ceilingColor, { castShadow: false });
  ceilingMesh.position.set(0, height + 0.03, 0);
  generatedModelGroup.add(ceilingMesh);

  const wallThickness = 0.12;
  const backWall = box(width, height, wallThickness, wallColor, { castShadow: false });
  backWall.position.set(0, height / 2, -depth / 2);
  const leftWall = box(wallThickness, height, depth, wallColor, { castShadow: false });
  leftWall.position.set(-width / 2, height / 2, 0);
  const rightWall = box(wallThickness, height, depth, wallColor, { castShadow: false });
  rightWall.position.set(width / 2, height / 2, 0);
  generatedWallMeshes.push(backWall, leftWall, rightWall);
  generatedModelGroup.add(backWall, leftWall, rightWall);

  const panelPlacements = photoPanelPlacementsForAnalysis(sitePhotoAnalysis, wallThickness);

  sitePhotoTextures.forEach((texture, index) => {
    const match = matches[index];
    const placement = {
      ...panelPlacements[index],
      name: `${match.label}参考图 · 第 ${match.index + 1} 张`,
    };
    addPhotoReferencePanel(generatedModelGroup, match.canvas, texture, placement, sitePhotoAnalysis);
  });

  const featureSummary = addRecognizedPhotoFeatures(generatedModelGroup, matches, sitePhotoAnalysis);
  if (featureSummary.windows === 0) {
    const windowGlass = box(width * 0.24, height * 0.34, 0.035, colors.glass, {
      transparent: true,
      opacity: 0.38,
      castShadow: false,
    });
    windowGlass.position.set(-width / 2 + 0.08, height * 0.58, -depth * 0.18);
    generatedModelGroup.add(windowGlass);
  }

  addDisplayFurniture(generatedModelGroup, sitePhotoAnalysis, matches);

  scene.add(generatedModelGroup);
  generated3DActive = true;
  generated3DSource = "site-photo";
  shellMeshes.floor.forEach((mesh) => {
    mesh.visible = false;
  });
  shellMeshes.wall.forEach((mesh) => {
    mesh.visible = false;
  });
  if (detectedWallGroup) detectedWallGroup.visible = false;

  roomLabel.textContent = "现场图片展示模型";
  updateSelection("现场图片生成草模");
  setRecognitionStatus(
    `已识别 ${featureSummary.windows} 处窗 / ${featureSummary.doors} 处门洞 / ${featureSummary.furniture} 组家具块，并优化展示模型`,
  );
  setSitePhotoStatus("已生成展示模型", sitePhotoMatchSummary(matches));
  setView("orbit");
}

function applySitePhotosToPlanModel() {
  if (sitePhotoCanvases.length === 0) {
    setSitePhotoStatus("请先上传现场图片", "图纸深化需要现场图做材质和构件识别");
    return;
  }

  if (!detectedWallResult?.segments?.length) {
    if (planCanvas) {
      detectWallsFromPlan();
    }
  }

  if (!detectedWallResult?.segments?.length) {
    setRecognitionStatus("请先导入图纸并识别墙线，再执行图纸深化");
    return;
  }

  sitePhotoAnalysis = analyzeSitePhotoSet(sitePhotoCanvases);
  const matches = sitePhotoMatches.length > 0 ? sitePhotoMatches : refreshSitePhotoMatches();
  build3DFromDetectedWalls();

  if (!generatedModelGroup) return;

  const wallHeight = Math.max(2.2, Number(wallHeightInput?.value || 2.8));
  const floorBounds = floorBoundsForDetectedResult(detectedWallResult);
  const planAnalysis = {
    ...sitePhotoAnalysis,
    width: floorBounds.width,
    depth: floorBounds.depth,
    height: wallHeight,
    centerX: floorBounds.centerX,
    centerZ: floorBounds.centerZ,
  };

  generatedFloorMesh?.material?.color?.setHex(planAnalysis.floorColor);
  generatedWallMeshes.forEach((mesh) => {
    mesh.material.color.setHex(planAnalysis.wallColor);
  });

  const ceilingMesh = box(floorBounds.width, 0.06, floorBounds.depth, planAnalysis.ceilingColor, { castShadow: false });
  ceilingMesh.position.set(floorBounds.centerX, wallHeight + 0.03, floorBounds.centerZ);
  generatedModelGroup.add(ceilingMesh);

  sitePhotoTextures = matches.map((match) => makeSitePhotoTexture(match.canvas));
  const panelPlacements = photoPanelPlacementsForAnalysis(planAnalysis, 0.12);
  sitePhotoTextures.forEach((texture, index) => {
    const match = matches[index];
    if (!match || !panelPlacements[index]) return;
    addPhotoReferencePanel(
      generatedModelGroup,
      match.canvas,
      texture,
      {
        ...panelPlacements[index],
        name: `${match.label}现场校准图 · 第 ${match.index + 1} 张`,
      },
      planAnalysis,
    );
  });

  const featureSummary = addRecognizedPhotoFeatures(generatedModelGroup, matches, planAnalysis);
  addDisplayFurniture(generatedModelGroup, planAnalysis, matches);
  generated3DSource = "plan-photo-refined";
  roomLabel.textContent = "图纸比例深化模型";
  updateSelection("图纸 + 现场图深化模型");
  setRecognitionStatus(
    `已按真实比例墙体深化：${detectedWallResult.segments.length} 段墙 / ${detectedWallResult.doors.length} 处图纸门洞 / ${(detectedWallResult.windows ?? []).length} 处图纸窗洞 / ${featureSummary.windows} 处现场窗`,
  );
  setSitePhotoStatus("已完成图纸深化", sitePhotoMatchSummary(matches));
  setView("orbit");
}

function loadImageFileToCanvas(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("unsupported-file"));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 1600;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ file, canvas });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load-failed"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("canvas-blob-failed"));
        }
      },
      type,
      quality,
    );
  });
}

function base64ToBlob(base64, contentType = "model/gltf-binary") {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

function fitTrellisModelToScene(object) {
  const box3 = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box3.getSize(size);
  box3.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  const targetSize = generated3DActive ? 1.65 : 2.2;
  const scale = targetSize / maxAxis;
  object.scale.multiplyScalar(scale);
  object.position.sub(center.multiplyScalar(scale));
  object.position.y += 0.08;
  object.position.z += generated3DActive ? 0.95 : 0.35;

  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.selectName = "TRELLIS.2 生成资产";
  });
}

function loadTrellisModelFromUrl(url, ownsUrl = false) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        clearTrellisModel();
        trellisModelGroup = gltf.scene;
        trellisModelGroup.name = "trellis2-generated-asset";
        fitTrellisModelToScene(trellisModelGroup);
        scene.add(trellisModelGroup);
        if (ownsUrl) trellisAssetUrl = url;
        updateSelection("TRELLIS.2 生成资产已加载");
        setSitePhotoStatus("TRELLIS.2 资产已加载", "GLB 已加入当前展示模型");
        setView("orbit");
        resolve(gltf);
      },
      undefined,
      (error) => {
        if (ownsUrl) URL.revokeObjectURL(url);
        reject(error);
      },
    );
  });
}

async function loadTrellisModelFromResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    const url = payload.glb_url ?? payload.model_url ?? payload.url;
    const base64 = payload.glb_base64 ?? payload.model_base64;

    if (url) {
      return loadTrellisModelFromUrl(new URL(url, response.url).href);
    }
    if (base64) {
      const blob = base64ToBlob(base64);
      const objectUrl = URL.createObjectURL(blob);
      return loadTrellisModelFromUrl(objectUrl, true);
    }
    throw new Error("trellis-response-missing-model");
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("trellis-empty-model");
  }
  const objectUrl = URL.createObjectURL(blob);
  return loadTrellisModelFromUrl(objectUrl, true);
}

function activeTrellisPhotoMatch() {
  if (sitePhotoMatches.length === 0) {
    refreshSitePhotoMatches();
  }
  return sitePhotoMatches.find((match) => match.slot === "main") ?? sitePhotoMatches[0] ?? null;
}

async function generateTrellisModelFromSitePhoto() {
  const endpoint = trellisEndpointInput?.value?.trim();
  if (!endpoint) {
    setSitePhotoStatus("请填写 TRELLIS.2 服务地址", "例如 http://127.0.0.1:7861/api/trellis/image-to-3d");
    return;
  }

  const match = activeTrellisPhotoMatch();
  if (!match?.canvas) {
    setSitePhotoStatus("请先上传现场图片", "TRELLIS.2 需要一张主视角参考图");
    return;
  }

  try {
    if (trellisEndpointInput) {
      localStorage.setItem("trellis2Endpoint", endpoint);
    }
    generateTrellisModelButton.disabled = true;
    setSitePhotoStatus("TRELLIS.2 正在生成", `使用${match.label} · 第 ${match.index + 1} 张`);

    const blob = await canvasToBlob(match.canvas);
    const body = new FormData();
    body.append("image", blob, `site-photo-${match.index + 1}.png`);
    body.append("slot", match.slot);
    body.append("output", "glb");
    body.append("source", "GewuZhizao-Design-Platform");

    const response = await fetch(endpoint, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      throw new Error(`trellis-http-${response.status}`);
    }

    await loadTrellisModelFromResponse(response);
  } catch (error) {
    console.error(error);
    setSitePhotoStatus("TRELLIS.2 调用失败", "请确认服务已启动、地址正确，并允许跨域请求");
  } finally {
    generateTrellisModelButton.disabled = false;
  }
}

async function loadSitePhotoFiles(files, autoBuild = false) {
  const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    setSitePhotoStatus("请选择图片文件", "支持多张 JPG / PNG / WEBP");
    return;
  }

  setSitePhotoStatus("正在读取现场图片", `${imageFiles.length} 张图片处理中`);

  try {
    const results = await Promise.all(imageFiles.map(loadImageFileToCanvas));
    sitePhotoCanvases = results.map((item) => item.canvas);
    sitePhotoCanvas = sitePhotoCanvases[0];
    sitePhotoMatches = matchSitePhotosToModel(sitePhotoCanvases);
    const totalPixels = sitePhotoCanvases.reduce((sum, canvas) => sum + canvas.width * canvas.height, 0);
    const megapixels = (totalPixels / 1000000).toFixed(1);
    setSitePhotoStatus(
      `${sitePhotoCanvases.length} 张现场图片已导入`,
      `${megapixels}MP · ${sitePhotoMatchSummary(sitePhotoMatches)}`,
    );
    if (autoBuild) buildDisplayModelFromSitePhoto();
  } catch (error) {
    setSitePhotoStatus("图片读取失败", "请换一组现场图片再试");
  }
}

function loadSitePhotoFile(file, autoBuild = false) {
  loadSitePhotoFiles(file ? [file] : [], autoBuild);
}

function clearSitePhotoModel() {
  clearGenerated3D();
  sitePhotoCanvas = null;
  sitePhotoCanvases = [];
  sitePhotoTexture = null;
  sitePhotoTextures = [];
  sitePhotoAnalysis = null;
  sitePhotoMatches = [];
  if (sitePhotoInput) sitePhotoInput.value = "";
  setSitePhotoStatus("尚未导入现场图片", "可同时上传多张现场图");
  setRecognitionStatus(planCanvas ? "可识别墙线" : "等待识别");
}

function wallSummaryText(suffix = "") {
  const typedWindows = detectedWindowOpenings.reduce(
    (sum, item) => {
      const key = item.windowType ?? "standard";
      sum[key] = (sum[key] ?? 0) + 1;
      return sum;
    },
    {},
  );
  const windowText =
    detectedWindowOpenings.length > 0
      ? `${detectedWindowOpenings.length} 处窗洞（落地 ${typedWindows.floor ?? 0} / 高窗 ${typedWindows.high ?? 0} / 飘窗 ${typedWindows.bay ?? 0}）`
      : "0 处窗洞";
  const roomText =
    detectedRoomRegions.length > 0
      ? `${detectedRoomRegions.length} 个闭合空间 / ${detectedPlanArea().toFixed(1)} m²`
      : "0 个闭合空间";
  const base = `识别到 ${detectedWallSegments.length} 段墙线 / ${detectedDoorOpenings.length} 处门洞 / ${windowText} / ${roomText}`;
  return suffix ? `${base} · ${suffix}` : base;
}

function recognitionQualityText(result = detectedWallResult) {
  if (!result?.quality) return "";
  const details = [];
  if (result.layoutLogic?.planTypeLabel) details.push(result.layoutLogic.planTypeLabel);
  if (result.layoutLogic?.learnedProfileLabel) details.push(result.layoutLogic.learnedProfileLabel);
  if (result.quality.collapsedWallSides > 0) details.push(`已折叠 ${result.quality.collapsedWallSides} 条墙侧线`);
  if (result.quality.shortBranchWalls > 0) details.push(`E/F短支墙 ${result.quality.shortBranchWalls} 段`);
  if (result.quality.ltJunctionWalls > 0) details.push(`L/T节点 ${result.quality.ltJunctionWalls} 处`);
  if (result.quality.outlineWallCount > 0) details.push(`端头/墙垛轮廓 ${result.quality.outlineWallCount} 段`);
  if (result.quality.localReturnWalls > 0) details.push(`局部凸凹返回线 ${result.quality.localReturnWalls} 段`);
  if (result.quality.topologyClosedWalls > 0) details.push(`闭合规整 ${result.quality.topologyClosedWalls} 段墙`);
  if (result.quality.swingDoorCount > 0) details.push(`平开门符号 ${result.quality.swingDoorCount} 处`);
  if (result.quality.slidingCount > 0) details.push(`推拉/窗轨 ${result.quality.slidingCount} 处`);
  if (result.quality.architectureConvertedDoors > 0) details.push(`门窗校正 ${result.quality.architectureConvertedDoors} 处`);
  if (result.quality.architectureInferredWindows > 0) details.push(`外墙补窗 ${result.quality.architectureInferredWindows} 处`);
  if (result.quality.architectureRejectedOpenings > 0) details.push(`过滤疑似误识别 ${result.quality.architectureRejectedOpenings} 处`);
  if (result.quality.layoutLogicSignals > 0) details.push(`户型逻辑 ${result.quality.layoutLogicSignals} 项`);
  return `识别置信 ${result.quality.score}%${details.length ? ` · ${details.join(" · ")}` : ""}`;
}

const windowTypeLabels = {
  standard: "普通窗",
  floor: "落地窗",
  high: "高窗",
  bay: "飘窗",
};

function linearFeatureCounts(result = detectedWallResult) {
  return {
    walls: result?.segments?.length ?? 0,
    doors: result?.doors?.length ?? 0,
    windows: result?.windows?.length ?? 0,
    rooms: result?.rooms?.length ?? 0,
  };
}

function updateLinearPlanSummary(result = detectedWallResult) {
  if (!linearPlanSummary) return;
  const counts = linearFeatureCounts(result);
  linearPlanSummary.textContent =
    counts.walls + counts.doors + counts.windows > 0
      ? `${counts.walls} 段墙 / ${counts.doors} 个门洞 / ${counts.windows} 个窗洞 / ${counts.rooms} 个空间`
      : "先识别图纸生成可编辑线段";
}

function isSelectedLinearFeature(kind, index) {
  return selectedLinearFeature?.kind === kind && selectedLinearFeature.index === index;
}

function linearFeatureBadge(kind, item) {
  if (kind === "wall") return "墙";
  if (kind === "door") return "门洞";
  return windowTypeLabels[item.windowType ?? "standard"] ?? "窗";
}

function linearFeatureClass(kind) {
  if (kind === "door") return "is-door";
  if (kind === "window") return "is-window";
  return "";
}

function linearFeatureTitle(kind, item, index) {
  if (kind === "wall") return `墙体 #${index + 1}`;
  if (kind === "door") return `门洞 #${index + 1}`;
  return `${linearFeatureBadge(kind, item)} #${index + 1}`;
}

function selectLinearFeature(kind, index) {
  if (!detectedWallResult) return;
  const collection =
    kind === "wall" ? detectedWallResult.segments : kind === "door" ? detectedWallResult.doors : detectedWallResult.windows;
  if (!collection?.[index]) return;

  selectedLinearFeature = { kind, index };
  selectedDetectedWallIndex = kind === "wall" ? index : null;
  syncDetectedWallMeshStyles();
  updateWallEditor();
  renderLinearPlanEditor(detectedWallResult);
  updateSelection(linearFeatureTitle(kind, collection[index], index));
}

function makeLinearFeatureRow(kind, item, index, result) {
  const row = document.createElement("div");
  row.className = `linear-plan-item ${isSelectedLinearFeature(kind, index) ? "is-selected" : ""}`;
  row.dataset.linearKind = kind;
  row.dataset.linearIndex = String(index);

  const main = document.createElement("div");
  main.className = "linear-plan-main";

  const title = document.createElement("span");
  title.className = "linear-plan-title";
  title.textContent = linearFeatureTitle(kind, item, index);

  const meta = document.createElement("span");
  meta.className = "linear-plan-meta";
  meta.textContent = `${item.orientation === "horizontal" ? "横向" : "竖向"} · ${formatWallLength(worldLengthForSegment(item, result))}`;

  main.append(title, meta);
  row.append(main);

  if (kind === "window") {
    const select = document.createElement("select");
    select.className = "linear-plan-type";
    select.dataset.windowType = "";
    select.dataset.index = String(index);
    Object.entries(windowTypeLabels).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = (item.windowType ?? "standard") === value;
      select.append(option);
    });
    row.append(select);
  } else {
    const badge = document.createElement("span");
    badge.className = `linear-plan-badge ${linearFeatureClass(kind)}`;
    badge.textContent = linearFeatureBadge(kind, item);
    row.append(badge);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "secondary-button compact-action linear-plan-delete";
  deleteButton.type = "button";
  deleteButton.title = "删除";
  deleteButton.setAttribute("aria-label", "删除");
  deleteButton.dataset.linearDelete = "";
  deleteButton.dataset.linearKind = kind;
  deleteButton.dataset.linearIndex = String(index);
  deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
  row.append(deleteButton);

  return row;
}

function renderLinearPlanEditor(result = detectedWallResult) {
  updateLinearPlanSummary(result);
  if (!linearPlanList) return;
  linearPlanList.innerHTML = "";

  if (!result?.segments?.length) {
    const empty = document.createElement("div");
    empty.className = "linear-plan-empty";
    empty.textContent = "导入平面图并点击识别墙线后，这里会出现可编辑的线性平面图。";
    linearPlanList.append(empty);
    window.lucide?.createIcons();
    return;
  }

  result.segments.forEach((segment, index) => {
    linearPlanList.append(makeLinearFeatureRow("wall", segment, index, result));
  });
  (result.doors ?? []).forEach((opening, index) => {
    linearPlanList.append(makeLinearFeatureRow("door", opening, index, result));
  });
  (result.windows ?? []).forEach((opening, index) => {
    linearPlanList.append(makeLinearFeatureRow("window", opening, index, result));
  });

  window.lucide?.createIcons();
}

function preserveManualOpenings(existing = [], next = []) {
  const manual = existing.filter((opening) => opening.source?.startsWith("manual"));
  return dedupeOpenings([...next, ...manual]);
}

function rebuildGeneratedModelAfterPlanEdit() {
  if (!generated3DActive) return;
  if (generated3DSource === "plan-photo-refined" && sitePhotoCanvases.length > 0) {
    applySitePhotosToPlanModel();
    return;
  }
  build3DFromDetectedWalls();
}

function commitLinearPlanEdit(message) {
  if (!detectedWallResult) return;
  detectedWallResult.doors = detectedWallResult.doors ?? [];
  detectedWallResult.windows = detectedWallResult.windows ?? [];
  applyWallGlueToDetectedResult({ rebuildOpenings: true });
  detectedWallResult.rooms = estimateRoomRegions(detectedWallResult.segments, detectedWallResult);
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText(message));
  rebuildGeneratedModelAfterPlanEdit();
}

function deleteLinearFeature(kind, index) {
  if (!detectedWallResult) return;
  if (kind === "wall") {
    const wall = detectedWallResult.segments[index];
    if (!wall) return;
    detectedWallResult.doors = (detectedWallResult.doors ?? []).filter((opening) => !openingAlignedToWall(opening, wall));
    detectedWallResult.windows = (detectedWallResult.windows ?? []).filter((opening) => !openingAlignedToWall(opening, wall));
    detectedWallResult.segments.splice(index, 1);
    selectedDetectedWallIndex = null;
  } else if (kind === "door") {
    detectedWallResult.doors?.splice(index, 1);
  } else if (kind === "window") {
    detectedWallResult.windows?.splice(index, 1);
  }
  selectedLinearFeature = null;
  commitLinearPlanEdit("已更新线性平面图");
}

function longestDetectedWallIndex() {
  if (!detectedWallResult?.segments?.length) return null;
  let bestIndex = 0;
  let bestLength = -1;
  detectedWallResult.segments.forEach((segment, index) => {
    const length = segment.end - segment.start;
    if (length > bestLength) {
      bestLength = length;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function activeLinearWall() {
  if (!detectedWallResult?.segments?.length) return null;
  const index =
    selectedDetectedWallIndex !== null && detectedWallResult.segments[selectedDetectedWallIndex]
      ? selectedDetectedWallIndex
      : longestDetectedWallIndex();
  return index === null ? null : { index, segment: detectedWallResult.segments[index] };
}

function makeManualOpeningForWall(wall, worldLength, source, windowType = "standard") {
  const span = Math.min(
    Math.max(8, pixelLengthForWorldLength(worldLength, detectedWallResult, wall.orientation)),
    Math.max(8, (wall.end - wall.start) * 0.82),
  );
  const center = (wall.start + wall.end) / 2;
  const start = THREE.MathUtils.clamp(center - span / 2, wall.start, wall.end);
  const end = THREE.MathUtils.clamp(center + span / 2, wall.start, wall.end);
  return {
    orientation: wall.orientation,
    start,
    end,
    axisCenter: wall.axisCenter,
    thicknessPx: Math.max(wall.thicknessPx ?? 5, 5),
    confidence: 1,
    source,
    ...(source === "manual-window" ? { windowType } : {}),
  };
}

function addLinearWall() {
  if (!detectedWallResult) {
    setRecognitionStatus("请先识别图纸，再补墙");
    return;
  }

  const length = Math.max(18, detectedWallResult.width * 0.22);
  const center = detectedWallResult.width * 0.5;
  const segment = {
    orientation: "horizontal",
    start: THREE.MathUtils.clamp(center - length / 2, 0, detectedWallResult.width),
    end: THREE.MathUtils.clamp(center + length / 2, 0, detectedWallResult.width),
    axisCenter: detectedWallResult.height * 0.5,
    thicknessPx: 7,
    confidence: 1,
    source: "manual-wall",
  };
  segment.baseStart = segment.start;
  segment.baseEnd = segment.end;
  segment.startCorrectionMeters = 0;
  segment.endCorrectionMeters = 0;
  detectedWallResult.segments.push(segment);
  selectedDetectedWallIndex = detectedWallResult.segments.length - 1;
  selectedLinearFeature = { kind: "wall", index: selectedDetectedWallIndex };
  commitLinearPlanEdit("已补充墙线");
}

function addLinearOpening(kind) {
  if (!detectedWallResult) {
    setRecognitionStatus("请先识别图纸，再补门窗");
    return;
  }
  const active = activeLinearWall();
  if (!active) return;

  const opening =
    kind === "door"
      ? makeManualOpeningForWall(active.segment, 0.9, "manual-door")
      : makeManualOpeningForWall(active.segment, 1.5, "manual-window", "floor");
  if (opening.end - opening.start < 2) return;

  if (kind === "door") {
    detectedWallResult.doors = dedupeOpenings([...(detectedWallResult.doors ?? []), opening]);
    selectedLinearFeature = { kind: "door", index: detectedWallResult.doors.length - 1 };
  } else {
    detectedWallResult.windows = dedupeOpenings([...(detectedWallResult.windows ?? []), opening]);
    selectedLinearFeature = { kind: "window", index: detectedWallResult.windows.length - 1 };
  }
  commitLinearPlanEdit(kind === "door" ? "已补充门洞" : "已补充窗洞");
}

function syncDetectedWallMeshStyles() {
  detectedWallMeshes.forEach((mesh, index) => {
    mesh.material.color.setHex(index === selectedDetectedWallIndex ? colors.gold : colors.green);
    mesh.material.opacity = index === selectedDetectedWallIndex ? 0.98 : 0.88;
  });
}

function updateWallEditor() {
  const segment =
    selectedDetectedWallIndex === null ? null : detectedWallResult?.segments?.[selectedDetectedWallIndex] ?? null;

  wallEditor?.classList.toggle("is-disabled", !segment);
  if (!segment) {
    if (wallSelection) wallSelection.textContent = detectedWallSegments.length > 0 ? "点击绿色墙体" : "识别后点击绿色墙体";
    if (wallLengthInput) wallLengthInput.value = "0";
    if (wallThicknessInput) wallThicknessInput.value = "0";
    if (wallStartOffsetInput) wallStartOffsetInput.value = "0";
    if (wallEndOffsetInput) wallEndOffsetInput.value = "0";
    return;
  }

  const orientationName = segment.orientation === "horizontal" ? "横墙" : "竖墙";
  if (wallSelection) wallSelection.textContent = `${orientationName} #${selectedDetectedWallIndex + 1}`;
  if (wallLengthInput) wallLengthInput.value = worldLengthForSegment(segment, detectedWallResult).toFixed(1);
  if (wallThicknessInput) wallThicknessInput.value = worldThicknessForFeature(segment, detectedWallResult, 0.01).toFixed(2);
  if (wallStartOffsetInput) wallStartOffsetInput.value = (segment.startCorrectionMeters ?? 0).toFixed(1);
  if (wallEndOffsetInput) wallEndOffsetInput.value = (segment.endCorrectionMeters ?? 0).toFixed(1);
}

function selectDetectedWall(index) {
  if (!detectedWallResult?.segments?.[index]) return;
  selectedDetectedWallIndex = index;
  selectedLinearFeature = { kind: "wall", index };
  renderDetectedWalls(detectedWallResult);
  updateSelection(`墙体 #${index + 1}`);
}

function updateDoorsAfterWallEdit() {
  if (!detectedWallResult?.inkMap) return;
  const previousDoors = detectedWallResult.doors ?? [];
  const previousWindows = detectedWallResult.windows ?? [];
  const gapDoors = estimateDoorOpenings(detectedWallResult.inkMap, detectedWallResult.segments);
  const symbolDoors = detectedWallResult.runs
    ? estimateSymbolDoors(detectedWallResult.inkMap, detectedWallResult.segments, detectedWallResult.runs, gapDoors)
    : [];
  const rawDoors = preserveManualOpenings(previousDoors, [...gapDoors, ...symbolDoors]);
  const gapWindows = estimateWindowOpenings(detectedWallResult.inkMap, detectedWallResult.segments, rawDoors);
  const symbolWindows = detectedWallResult.runs
    ? estimateSymbolWindows(detectedWallResult.inkMap, detectedWallResult.segments, detectedWallResult.runs, [
        ...rawDoors,
        ...gapWindows,
      ])
    : [];
  const slidingWindows = detectedWallResult.runs
    ? estimateSlidingOpenings(detectedWallResult.inkMap, detectedWallResult.segments, detectedWallResult.runs, [
        ...rawDoors,
        ...gapWindows,
        ...symbolWindows,
      ])
    : [];
  const rawWindows = preserveManualOpenings(previousWindows, [...gapWindows, ...symbolWindows, ...slidingWindows]).map((opening) => ({
    ...opening,
    windowType: opening.windowType ?? "standard",
  }));
  detectedWallResult.rooms = estimateRoomRegions(detectedWallResult.segments, detectedWallResult);
  const architecturalInput = {
    ...detectedWallResult,
    doors: rawDoors,
    windows: rawWindows,
    rooms: detectedWallResult.rooms,
  };
  const architectural = applyArchitecturalOpeningLogic(architecturalInput, detectedWallResult.inkMap);
  detectedWallResult.architecturalBounds = architecturalInput.architecturalBounds;
  detectedWallResult.doors = architectural.doors;
  detectedWallResult.windows = architectural.windows;
  detectedWallResult.layoutLogic = applyFloorPlanSpatialLogic(detectedWallResult, detectedWallResult.inkMap);
  detectedWallResult.quality = {
    ...(detectedWallResult.quality ?? {}),
    ...architectural.quality,
    layoutLogicSignals: detectedWallResult.layoutLogic.fixedFeatureSignals,
  };
  detectedDoorOpenings = detectedWallResult.doors;
  detectedWindowOpenings = detectedWallResult.windows;
  detectedRoomRegions = detectedWallResult.rooms;
}

function updateRoomsAfterManualWallEdit() {
  if (!detectedWallResult) return;
  detectedWallResult.rooms = estimateRoomRegions(detectedWallResult.segments, detectedWallResult);
  if (detectedWallResult.inkMap) {
    detectedWallResult.layoutLogic = applyFloorPlanSpatialLogic(detectedWallResult, detectedWallResult.inkMap);
    detectedWallResult.quality = {
      ...(detectedWallResult.quality ?? {}),
      layoutLogicSignals: detectedWallResult.layoutLogic.fixedFeatureSignals,
    };
  }
  detectedDoorOpenings = detectedWallResult.doors ?? [];
  detectedWindowOpenings = detectedWallResult.windows ?? [];
  detectedRoomRegions = detectedWallResult.rooms;
}

function clampOpeningToWall(opening, wall) {
  const start = THREE.MathUtils.clamp(opening.start, wall.start, wall.end);
  const end = THREE.MathUtils.clamp(opening.end, wall.start, wall.end);
  if (end - start < 2) return null;
  return {
    ...opening,
    start,
    end,
    axisCenter: wall.axisCenter,
    thicknessPx: Math.max(opening.thicknessPx ?? 5, wall.thicknessPx ?? 5),
  };
}

function transformOpeningsWithWall(previousWall, nextWall, alongDelta = 0, axisDelta = 0) {
  if (!detectedWallResult) return;
  const transform = (opening) => {
    if (!openingAlignedToWall(opening, previousWall)) return opening;
    return clampOpeningToWall(
      {
        ...opening,
        start: opening.start + alongDelta,
        end: opening.end + alongDelta,
        axisCenter: opening.axisCenter + axisDelta,
      },
      nextWall,
    );
  };
  detectedWallResult.doors = (detectedWallResult.doors ?? []).map(transform).filter(Boolean);
  detectedWallResult.windows = (detectedWallResult.windows ?? []).map(transform).filter(Boolean);
}

function wallMatchScore(reference, candidate) {
  if (!reference || !candidate || reference.orientation !== candidate.orientation) return Number.NEGATIVE_INFINITY;
  const axisScore = -Math.abs(reference.axisCenter - candidate.axisCenter) * 2;
  const overlapScore = overlapLength(reference, candidate);
  const midpointScore = -Math.abs((reference.start + reference.end - candidate.start - candidate.end) / 2);
  return axisScore + overlapScore + midpointScore * 0.3;
}

function closestWallIndex(reference, segments) {
  if (!reference) return null;
  let bestIndex = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  segments.forEach((candidate, index) => {
    const score = wallMatchScore(reference, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function snapEditedWallToNearbyJunctions(wall, result, options = {}) {
  if (!wall || !result?.segments?.length) return 0;
  const tolerance = options.tolerance ?? Math.max(8, Math.round(Math.max(result.width, result.height) * 0.015));
  const endpoints = options.endpoint ? [options.endpoint] : ["start", "end"];
  const perpendiculars = result.segments.filter((segment) => segment.orientation !== wall.orientation);
  let snapCount = 0;

  endpoints.forEach((endpoint) => {
    const along = wall[endpoint];
    const axis = wall.axisCenter;
    const best = perpendiculars
      .map((candidate) => {
        const candidateAxis = candidate.axisCenter;
        const axisDistance = Math.abs(candidateAxis - along);
        const endDistance = Math.min(Math.abs(candidate.start - axis), Math.abs(candidate.end - axis));
        const crossesAxis = axis >= candidate.start - tolerance && axis <= candidate.end + tolerance;
        const reachable = crossesAxis || endDistance <= tolerance;
        return {
          candidate,
          axisDistance,
          endDistance,
          reachable,
          score: axisDistance + (crossesAxis ? 0 : endDistance * 0.45),
        };
      })
      .filter((item) => item.axisDistance <= tolerance && item.reachable)
      .sort((a, b) => a.score - b.score)[0];

    if (!best) return;
    if (Math.abs(wall[endpoint] - best.candidate.axisCenter) > 0.01) snapCount += 1;
    wall[endpoint] = best.candidate.axisCenter;
    if (axis < best.candidate.start) {
      best.candidate.start = axis;
      snapCount += 1;
    }
    if (axis > best.candidate.end) {
      best.candidate.end = axis;
      snapCount += 1;
    }
    best.candidate.topologyClosed = true;
    wall.topologyClosed = true;
  });

  const normalizedStart = Math.min(wall.start, wall.end);
  const normalizedEnd = Math.max(wall.start, wall.end);
  wall.start = normalizedStart;
  wall.end = normalizedEnd;
  return snapCount;
}

function mergeEditedWallWithCollinearNeighbors(wall, result) {
  if (!wall || !result?.segments?.length) return 0;
  const tolerance = Math.max(8, Math.round(Math.max(result.width, result.height) * 0.014), wall.thicknessPx ?? 5);
  let mergeCount = 0;
  let merged = true;

  while (merged) {
    merged = false;
    const wallIndex = result.segments.indexOf(wall);
    if (wallIndex === -1) break;

    const neighborIndex = result.segments.findIndex((candidate, index) => {
      if (index === wallIndex || candidate.orientation !== wall.orientation) return false;
      const axisGap = Math.abs(candidate.axisCenter - wall.axisCenter);
      if (axisGap > Math.max(tolerance, candidate.thicknessPx ?? 4, wall.thicknessPx ?? 4)) return false;
      const overlap = overlapLength(wall, candidate);
      const gap = Math.max(candidate.start - wall.end, wall.start - candidate.end, 0);
      return overlap > 0 || gap <= tolerance;
    });

    if (neighborIndex === -1) break;
    const neighbor = result.segments[neighborIndex];
    const wallLength = Math.max(1, segmentLength(wall));
    const neighborLength = Math.max(1, segmentLength(neighbor));
    const nextAxis = (wall.axisCenter * wallLength + neighbor.axisCenter * neighborLength) / (wallLength + neighborLength);

    [result.doors, result.windows].forEach((openings) => {
      (openings ?? []).forEach((opening) => {
        if (!openingAlignedToWall(opening, wall) && !openingAlignedToWall(opening, neighbor)) return;
        opening.axisCenter = nextAxis;
        opening.thicknessPx = Math.max(opening.thicknessPx ?? 5, wall.thicknessPx ?? 5, neighbor.thicknessPx ?? 5);
      });
    });

    wall.start = Math.min(wall.start, neighbor.start);
    wall.end = Math.max(wall.end, neighbor.end);
    wall.axisCenter = nextAxis;
    wall.thicknessPx = Math.max(wall.thicknessPx ?? 4, neighbor.thicknessPx ?? 4);
    wall.confidence = Math.max(wall.confidence ?? 0.5, neighbor.confidence ?? 0.5);
    wall.source = "manual-merged-wall";
    wall.topologyClosed = true;
    result.segments.splice(neighborIndex, 1);
    selectedDetectedWallIndex = result.segments.indexOf(wall);
    selectedLinearFeature = selectedDetectedWallIndex === -1 ? null : { kind: "wall", index: selectedDetectedWallIndex };
    detectedWallDragIndex = selectedDetectedWallIndex;
    mergeCount += 1;
    merged = true;
  }

  return mergeCount;
}

function applyWallGlueToDetectedResult(options = {}) {
  if (!detectedWallResult?.segments?.length) return false;
  const selectedWall =
    selectedDetectedWallIndex === null ? null : detectedWallResult.segments[selectedDetectedWallIndex] ? { ...detectedWallResult.segments[selectedDetectedWallIndex] } : null;
  const beforeKey = detectedWallResult.segments
    .map((segment) => `${segment.orientation}:${Math.round(segment.axisCenter)}:${Math.round(segment.start)}:${Math.round(segment.end)}`)
    .join("|");

  const glued = closeWallTopology(detectedWallResult.segments, detectedWallResult.width, detectedWallResult.height);
  detectedWallResult.segments = glued.map((segment) => ({
    ...segment,
    baseStart: segment.start,
    baseEnd: segment.end,
    startCorrectionMeters: 0,
    endCorrectionMeters: 0,
  }));

  if (selectedWall) {
    selectedDetectedWallIndex = closestWallIndex(selectedWall, detectedWallResult.segments);
    selectedLinearFeature = selectedDetectedWallIndex === null ? null : { kind: "wall", index: selectedDetectedWallIndex };
  }

  if (detectedWallResult.inkMap && options.rebuildOpenings !== false) {
    updateDoorsAfterWallEdit();
  } else {
    updateRoomsAfterManualWallEdit();
  }

  const afterKey = detectedWallResult.segments
    .map((segment) => `${segment.orientation}:${Math.round(segment.axisCenter)}:${Math.round(segment.start)}:${Math.round(segment.end)}`)
    .join("|");
  return beforeKey !== afterKey;
}

function commitManualWallEdit(message, options = {}) {
  if (options.glue !== false) {
    applyWallGlueToDetectedResult({ rebuildOpenings: true });
  }
  updateRoomsAfterManualWallEdit();
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText(message));
  if (generated3DActive && generated3DSource === "detected-walls") {
    build3DFromDetectedWalls({ preserveView: options.preserveView ?? currentView === "top" });
  }
}

function applySelectedWallThickness(rawValue, message = "已调整墙厚", options = {}) {
  if (selectedDetectedWallIndex === null || !detectedWallResult) return;
  const segment = detectedWallResult.segments[selectedDetectedWallIndex];
  if (!segment) return;

  const thicknessMeters = Number(rawValue);
  if (!Number.isFinite(thicknessMeters)) {
    updateWallEditor();
    return;
  }

  const nextThicknessPx = THREE.MathUtils.clamp(
    pixelThicknessForWorldLength(THREE.MathUtils.clamp(thicknessMeters, 0.05, 1.2), detectedWallResult, segment.orientation),
    2,
    80,
  );
  segment.thicknessPx = nextThicknessPx;
  [...(detectedWallResult.doors ?? []), ...(detectedWallResult.windows ?? [])].forEach((opening) => {
    if (openingAlignedToWall(opening, segment)) opening.thicknessPx = Math.max(opening.thicknessPx ?? 5, nextThicknessPx);
  });
  commitManualWallEdit(message, options);
}

function applySelectedWallEndpointOffsets(rawStart, rawEnd) {
  if (selectedDetectedWallIndex === null || !detectedWallResult) return;

  const segment = detectedWallResult.segments[selectedDetectedWallIndex];
  if (!segment) return;

  const startCorrectionMeters = Number(rawStart);
  const endCorrectionMeters = Number(rawEnd);
  if (!Number.isFinite(startCorrectionMeters) || !Number.isFinite(endCorrectionMeters)) {
    updateWallEditor();
    return;
  }

  const startCorrectionPixels = pixelLengthForWorldLength(
    Math.abs(startCorrectionMeters),
    detectedWallResult,
    segment.orientation,
  );
  const endCorrectionPixels = pixelLengthForWorldLength(
    Math.abs(endCorrectionMeters),
    detectedWallResult,
    segment.orientation,
  );
  const limit = wallAxisLimit(segment, detectedWallResult);
  const baseStart = segment.baseStart ?? segment.start;
  const baseEnd = segment.baseEnd ?? segment.end;
  const startDirection = startCorrectionMeters >= 0 ? -1 : 1;
  const endDirection = endCorrectionMeters >= 0 ? 1 : -1;

  segment.start = THREE.MathUtils.clamp(baseStart + startCorrectionPixels * startDirection, 0, limit);
  segment.end = THREE.MathUtils.clamp(baseEnd + endCorrectionPixels * endDirection, 0, limit);
  segment.startCorrectionMeters = startCorrectionMeters;
  segment.endCorrectionMeters = endCorrectionMeters;

  if (segment.end - segment.start < 1) {
    if (Math.abs(startCorrectionMeters) >= Math.abs(endCorrectionMeters)) {
      segment.start = Math.max(0, segment.end - 1);
    } else {
      segment.end = Math.min(limit, segment.start + 1);
    }
  }

  applyWallGlueToDetectedResult({ rebuildOpenings: true });
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText("已吸附粘合墙体"));
  if (generated3DActive) build3DFromDetectedWalls();
}

function deleteSelectedWall() {
  if (selectedDetectedWallIndex === null || !detectedWallResult) return;

  const wall = detectedWallResult.segments[selectedDetectedWallIndex];
  detectedWallResult.doors = (detectedWallResult.doors ?? []).filter((opening) => !openingAlignedToWall(opening, wall));
  detectedWallResult.windows = (detectedWallResult.windows ?? []).filter((opening) => !openingAlignedToWall(opening, wall));
  detectedWallResult.segments.splice(selectedDetectedWallIndex, 1);
  selectedDetectedWallIndex = null;
  selectedLinearFeature = null;
  applyWallGlueToDetectedResult({ rebuildOpenings: true });
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText("已删除墙体"));
  if (generated3DActive) build3DFromDetectedWalls();
}

function distanceToWallSegment(point, segment, result) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return Number.POSITIVE_INFINITY;

  const projection = THREE.MathUtils.clamp(((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared, 0, 1);
  const closestX = from.x + dx * projection;
  const closestZ = from.z + dz * projection;
  return Math.hypot(point.x - closestX, point.z - closestZ);
}

function findWallAtPoint(point) {
  if (!detectedWallResult) return null;

  let bestMatch = null;
  detectedWallResult.segments.forEach((segment, index) => {
    const distance = distanceToWallSegment(point, segment, detectedWallResult);
    const threshold = Math.max(0.16, worldThicknessForFeature(segment, detectedWallResult, 0.08) * 1.4);
    if (distance > threshold) return;

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { index, distance };
    }
  });

  return bestMatch;
}

function wallEndpointDistances(point, segment, result) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  return {
    start: Math.hypot(point.x - from.x, point.z - from.z),
    end: Math.hypot(point.x - to.x, point.z - to.z),
  };
}

function nearestWallEndpoint(point, segment, result) {
  const distances = wallEndpointDistances(point, segment, result);
  return distances.start <= distances.end ? "start" : "end";
}

function wallAxisValueFromPoint(point, segment, result) {
  const { from, to } = worldEndpointsForSegment(segment, result);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return segment.start;

  const projection = ((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared;
  const value = segment.start + projection * (segment.end - segment.start);
  return THREE.MathUtils.clamp(value, 0, wallAxisLimit(segment, result));
}

function minimumDraggableWallPixels(segment, result) {
  return Math.max(2, pixelLengthForWorldLength(0.3, result, segment.orientation));
}

function detectionPixelFromWorldPoint(point, result = detectedWallResult) {
  if (!point || !result || !planMesh) return null;
  const worldPoint = new THREE.Vector3(point.x, 0, point.z);
  planMesh.updateMatrixWorld();
  const localPoint = planMesh.worldToLocal(worldPoint);
  const { width: planeWidth, height: planeHeight } = activePlanPlaneSize();
  const sourceRect = result.sourceRect ?? null;
  const imageWidth = sourceRect?.canvasWidth ?? result.width;
  const imageHeight = sourceRect?.canvasHeight ?? result.height;
  const imageX = (localPoint.x / Math.max(0.001, planeWidth) + 0.5) * imageWidth;
  const imageY = (0.5 - localPoint.y / Math.max(0.001, planeHeight)) * imageHeight;
  const resultX = sourceRect ? ((imageX - sourceRect.x) / Math.max(1, sourceRect.width)) * result.width : imageX;
  const resultY = sourceRect ? ((imageY - sourceRect.y) / Math.max(1, sourceRect.height)) * result.height : imageY;

  return {
    x: THREE.MathUtils.clamp(resultX, 0, result.width),
    y: THREE.MathUtils.clamp(resultY, 0, result.height),
  };
}

function wallDragHandleForPoint(point, segment, result) {
  const pixel = detectionPixelFromWorldPoint(point, result);
  if (!pixel) return "move";

  const horizontal = segment.orientation === "horizontal";
  const along = horizontal ? pixel.x : pixel.y;
  const perpendicular = horizontal ? pixel.y : pixel.x;
  const thickness = Math.max(2, segment.thicknessPx ?? 5);
  const sideMin = segment.axisCenter - thickness / 2;
  const sideMax = segment.axisCenter + thickness / 2;
  const edgeThreshold = Math.max(5, Math.min(18, thickness * 0.85));
  const endThreshold = Math.max(6, Math.min(22, thickness * 1.1));
  const alongInside = along >= segment.start - endThreshold && along <= segment.end + endThreshold;
  const perpInside = perpendicular >= sideMin - edgeThreshold && perpendicular <= sideMax + edgeThreshold;
  const candidates = [];

  if (perpInside && Math.abs(along - segment.start) <= endThreshold) {
    candidates.push({ handle: "start", distance: Math.abs(along - segment.start) });
  }
  if (perpInside && Math.abs(along - segment.end) <= endThreshold) {
    candidates.push({ handle: "end", distance: Math.abs(along - segment.end) });
  }
  if (alongInside && Math.abs(perpendicular - sideMin) <= edgeThreshold) {
    candidates.push({ handle: "side-min", distance: Math.abs(perpendicular - sideMin) + 1.5 });
  }
  if (alongInside && Math.abs(perpendicular - sideMax) <= edgeThreshold) {
    candidates.push({ handle: "side-max", distance: Math.abs(perpendicular - sideMax) + 1.5 });
  }

  return candidates.sort((a, b) => a.distance - b.distance)[0]?.handle ?? "move";
}

function wallDragHandleLabel(handle) {
  if (handle === "start") return "起点边";
  if (handle === "end") return "终点边";
  if (handle === "side-min" || handle === "side-max") return "厚度边";
  return "整墙";
}

function moveWallSegmentByPixels(segment, result, deltaX, deltaY) {
  const previous = { ...segment };
  if (segment.orientation === "horizontal") {
    const span = segment.end - segment.start;
    const nextStart = THREE.MathUtils.clamp(segment.start + deltaX, 0, Math.max(0, result.width - span));
    segment.start = nextStart;
    segment.end = nextStart + span;
    segment.axisCenter = THREE.MathUtils.clamp(segment.axisCenter + deltaY, 0, result.height);
    segment.baseStart = segment.start;
    segment.baseEnd = segment.end;
    return {
      alongDelta: segment.start - previous.start,
      axisDelta: segment.axisCenter - previous.axisCenter,
      previous,
    };
  }

  const span = segment.end - segment.start;
  const nextStart = THREE.MathUtils.clamp(segment.start + deltaY, 0, Math.max(0, result.height - span));
  segment.start = nextStart;
  segment.end = nextStart + span;
  segment.axisCenter = THREE.MathUtils.clamp(segment.axisCenter + deltaX, 0, result.width);
  segment.baseStart = segment.start;
  segment.baseEnd = segment.end;
  return {
    alongDelta: segment.start - previous.start,
    axisDelta: segment.axisCenter - previous.axisCenter,
    previous,
  };
}

function resizeWallSideToPixel(segment, dragStart, pixel, result, side) {
  if (!segment || !dragStart || !pixel) return false;
  const horizontal = segment.orientation === "horizontal";
  const axisLimit = horizontal ? result.height : result.width;
  const draggedAxis = horizontal ? pixel.y : pixel.x;
  const minThickness = Math.max(2, Math.round(Math.max(result.width, result.height) * 0.003));
  const originalThickness = Math.max(minThickness, dragStart.thicknessPx ?? segment.thicknessPx ?? 5);
  const originalMin = dragStart.axisCenter - originalThickness / 2;
  const originalMax = dragStart.axisCenter + originalThickness / 2;
  let nextMin = originalMin;
  let nextMax = originalMax;

  if (side === "side-min") {
    nextMin = THREE.MathUtils.clamp(draggedAxis, 0, Math.max(0, originalMax - minThickness));
  } else {
    nextMax = THREE.MathUtils.clamp(draggedAxis, Math.min(axisLimit, originalMin + minThickness), axisLimit);
  }

  segment.axisCenter = (nextMin + nextMax) / 2;
  segment.thicknessPx = Math.max(minThickness, nextMax - nextMin);
  return true;
}

function safeSetPointerCapture(pointerId) {
  try {
    canvas.setPointerCapture?.(pointerId);
  } catch {
    // Pointer capture can fail if the pointer was already released by the browser.
  }
}

function safeReleasePointerCapture(pointerId) {
  try {
    canvas.releasePointerCapture?.(pointerId);
  } catch {
    // Matching the guarded capture path above.
  }
}

function beginDetectedWallDrag(event, index, point) {
  const segment = detectedWallResult?.segments?.[index];
  if (!segment || !point || (event.button != null && event.button !== 0)) return false;

  selectDetectedWall(index);
  isDraggingDetectedWall = true;
  detectedWallDragPointerId = event.pointerId;
  detectedWallDragIndex = index;
  detectedWallDragEndpoint = wallDragHandleForPoint(point, segment, detectedWallResult);
  detectedWallDragLastPixel = detectionPixelFromWorldPoint(point, detectedWallResult);
  detectedWallDragStartSegment = { ...segment };
  detectedWallDragMoved = false;
  controls.enabled = false;
  safeSetPointerCapture(event.pointerId);
  updateSelection(
    detectedWallDragEndpoint === "move"
      ? "拖拽平移墙体"
      : `拖拽调整墙体 ${detectedWallDragEndpoint === "start" ? "起点" : "终点"}`,
  );
  return true;
}

function updateDetectedWallDrag(event) {
  const segment = detectedWallResult?.segments?.[detectedWallDragIndex];
  const point = groundPointFromEvent(event);
  if (!segment || !point) return;
  let mergedCount = 0;

  if (detectedWallDragEndpoint === "move") {
    const currentPixel = detectionPixelFromWorldPoint(point, detectedWallResult);
    if (!currentPixel || !detectedWallDragLastPixel) return;
    const deltaX = currentPixel.x - detectedWallDragLastPixel.x;
    const deltaY = currentPixel.y - detectedWallDragLastPixel.y;
    if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) return;
    const move = moveWallSegmentByPixels(segment, detectedWallResult, deltaX, deltaY);
    snapEditedWallToNearbyJunctions(segment, detectedWallResult);
    mergedCount = mergeEditedWallWithCollinearNeighbors(segment, detectedWallResult);
    transformOpeningsWithWall(
      move.previous,
      segment,
      segment.start - move.previous.start,
      segment.axisCenter - move.previous.axisCenter,
    );
    detectedWallDragLastPixel = currentPixel;
    detectedWallDragMoved = true;
    updateRoomsAfterManualWallEdit();
    renderDetectedWalls(detectedWallResult);
    setRecognitionStatus(wallSummaryText("拖拽平移墙体中"));
    return;
  }

  if (detectedWallDragEndpoint === "side-min" || detectedWallDragEndpoint === "side-max") {
    const currentPixel = detectionPixelFromWorldPoint(point, detectedWallResult);
    if (!currentPixel) return;
    const previous = { ...segment };
    if (!resizeWallSideToPixel(segment, detectedWallDragStartSegment, currentPixel, detectedWallResult, detectedWallDragEndpoint)) return;
    detectedWallDragMoved = true;
    transformOpeningsWithWall(previous, segment, 0, segment.axisCenter - previous.axisCenter);
    updateRoomsAfterManualWallEdit();
    renderDetectedWalls(detectedWallResult);
    setRecognitionStatus(wallSummaryText("拖拽调整墙厚中"));
    return;
  }

  const limit = wallAxisLimit(segment, detectedWallResult);
  const minimumLength = minimumDraggableWallPixels(segment, detectedWallResult);
  const axisValue = wallAxisValueFromPoint(point, segment, detectedWallResult);
  const previous = { ...segment };

  if (detectedWallDragEndpoint === "start") {
    segment.start = THREE.MathUtils.clamp(axisValue, 0, Math.max(0, segment.end - minimumLength));
  } else {
    segment.end = THREE.MathUtils.clamp(axisValue, Math.min(limit, segment.start + minimumLength), limit);
  }

  segment.baseStart = segment.start;
  segment.baseEnd = segment.end;
  segment.startCorrectionMeters = 0;
  segment.endCorrectionMeters = 0;
  detectedWallDragMoved = true;
  snapEditedWallToNearbyJunctions(segment, detectedWallResult, { endpoint: detectedWallDragEndpoint });
  mergedCount = mergeEditedWallWithCollinearNeighbors(segment, detectedWallResult);
  transformOpeningsWithWall(previous, segment, 0, 0);
  updateRoomsAfterManualWallEdit();
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText("拖拽调整墙体中"));
}

function finishDetectedWallDrag(event) {
  if (!isDraggingDetectedWall || event.pointerId !== detectedWallDragPointerId) return false;

  const moved = detectedWallDragMoved;
  const shouldRebuild = moved && generated3DActive && generated3DSource === "detected-walls";
  isDraggingDetectedWall = false;
  detectedWallDragPointerId = null;
  detectedWallDragIndex = null;
  detectedWallDragEndpoint = null;
  detectedWallDragLastPixel = null;
  detectedWallDragStartSegment = null;
  detectedWallDragMoved = false;
  controls.enabled = true;
  safeReleasePointerCapture(event.pointerId);

  if (moved && detectedWallResult) {
    applyWallGlueToDetectedResult({ rebuildOpenings: true });
    renderDetectedWalls(detectedWallResult);
    setRecognitionStatus(wallSummaryText("已吸附粘合墙体"));
  } else if (selectedDetectedWallIndex !== null) {
    updateSelection(`墙体 #${selectedDetectedWallIndex + 1}`);
  }

  if (shouldRebuild) build3DFromDetectedWalls({ preserveView: currentView === "top" });
  return true;
}

function usesFurnitureCollision(group) {
  return Boolean(group?.userData?.editable && !["light", "beam", "ceiling"].includes(group.userData.kind));
}

function xzFootprintForObject(object, padding = 0) {
  object.updateWorldMatrix?.(true, true);
  const boxBounds = new THREE.Box3().setFromObject(object);
  return {
    minX: boxBounds.min.x - padding,
    maxX: boxBounds.max.x + padding,
    minZ: boxBounds.min.z - padding,
    maxZ: boxBounds.max.z + padding,
  };
}

function xzFootprintsOverlap(first, second) {
  return !(
    first.maxX <= second.minX ||
    first.minX >= second.maxX ||
    first.maxZ <= second.minZ ||
    first.minZ >= second.maxZ
  );
}

function activeFurnitureBounds() {
  if (!generated3DActive || !generatedFloorMesh) return defaultFurnitureBounds;

  const floorFootprint = xzFootprintForObject(generatedFloorMesh, -0.04);
  return {
    minX: floorFootprint.minX,
    maxX: floorFootprint.maxX,
    minZ: floorFootprint.minZ,
    maxZ: floorFootprint.maxZ,
  };
}

function isFootprintInsideBounds(footprint, bounds) {
  return (
    footprint.minX >= bounds.minX &&
    footprint.maxX <= bounds.maxX &&
    footprint.minZ >= bounds.minZ &&
    footprint.maxZ <= bounds.maxZ
  );
}

function clampFurnitureInsideBounds(group) {
  const bounds = activeFurnitureBounds();
  const footprint = xzFootprintForObject(group);
  const width = footprint.maxX - footprint.minX;
  const depth = footprint.maxZ - footprint.minZ;
  const boundWidth = bounds.maxX - bounds.minX;
  const boundDepth = bounds.maxZ - bounds.minZ;
  let offsetX = 0;
  let offsetZ = 0;

  if (width >= boundWidth) {
    offsetX = (bounds.minX + bounds.maxX) / 2 - (footprint.minX + footprint.maxX) / 2;
  } else if (footprint.minX < bounds.minX) {
    offsetX = bounds.minX - footprint.minX;
  } else if (footprint.maxX > bounds.maxX) {
    offsetX = bounds.maxX - footprint.maxX;
  }

  if (depth >= boundDepth) {
    offsetZ = (bounds.minZ + bounds.maxZ) / 2 - (footprint.minZ + footprint.maxZ) / 2;
  } else if (footprint.minZ < bounds.minZ) {
    offsetZ = bounds.minZ - footprint.minZ;
  } else if (footprint.maxZ > bounds.maxZ) {
    offsetZ = bounds.maxZ - footprint.maxZ;
  }

  group.position.x += offsetX;
  group.position.z += offsetZ;
}

function furnitureHitsGeneratedWall(group) {
  if (!generated3DActive || generatedWallMeshes.length === 0) return false;

  const furnitureFootprint = xzFootprintForObject(group, furnitureWallClearance);
  return generatedWallMeshes.some((wallMesh) => xzFootprintsOverlap(furnitureFootprint, xzFootprintForObject(wallMesh)));
}

function isFurniturePlacementValid(group) {
  if (!usesFurnitureCollision(group)) return true;

  const footprint = xzFootprintForObject(group);
  return isFootprintInsideBounds(footprint, activeFurnitureBounds()) && !furnitureHitsGeneratedWall(group);
}

function constrainFurniturePosition(group, previousPosition = group.position.clone()) {
  if (!group?.userData?.editable) return true;

  if (!usesFurnitureCollision(group)) {
    clampFurnitureInsideBounds(group);
    return true;
  }

  clampFurnitureInsideBounds(group);
  if (isFurniturePlacementValid(group)) return true;

  const slideAttempts = [
    new THREE.Vector3(group.position.x, previousPosition.y, previousPosition.z),
    new THREE.Vector3(previousPosition.x, previousPosition.y, group.position.z),
    previousPosition.clone(),
  ];

  for (const attempt of slideAttempts) {
    group.position.copy(attempt);
    clampFurnitureInsideBounds(group);
    if (isFurniturePlacementValid(group)) return true;
  }

  group.position.copy(previousPosition);
  return false;
}

function findNearestValidFurniturePosition(group, origin = group.position.clone()) {
  if (!usesFurnitureCollision(group)) {
    constrainFurniturePosition(group, origin);
    return true;
  }

  clampFurnitureInsideBounds(group);
  if (isFurniturePlacementValid(group)) return true;

  const start = origin.clone();
  const angleCount = 20;
  const step = 0.18;
  const maxRadius = 3.6;

  for (let radius = step; radius <= maxRadius; radius += step) {
    for (let index = 0; index < angleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / angleCount;
      group.position.set(start.x + Math.cos(angle) * radius, start.y, start.z + Math.sin(angle) * radius);
      clampFurnitureInsideBounds(group);
      if (isFurniturePlacementValid(group)) return true;
    }
  }

  group.position.copy(origin);
  return false;
}

function settleFurnitureAgainstGeneratedWalls() {
  let moved = 0;
  let blocked = 0;

  modelObjects.forEach((group) => {
    if (!usesFurnitureCollision(group)) return;

    const before = group.position.clone();
    if (isFurniturePlacementValid(group)) return;

    if (findNearestValidFurniturePosition(group, before)) {
      if (group.position.distanceTo(before) > 0.01) moved += 1;
    } else {
      blocked += 1;
    }
  });

  syncTransformInputs();
  selectedHelper?.update();
  return { moved, blocked };
}

function applyEditableTransform(mutator) {
  if (!selectedGroup?.userData?.editable) return;

  const previousPosition = selectedGroup.position.clone();
  const previousRotation = selectedGroup.rotation.clone();
  const previousScale = selectedGroup.scale.clone();

  mutator();
  if (!constrainFurniturePosition(selectedGroup, previousPosition)) {
    selectedGroup.position.copy(previousPosition);
    selectedGroup.rotation.copy(previousRotation);
    selectedGroup.scale.copy(previousScale);
    updateSelection(`${selectedGroup.userData.selectName} 已被墙体阻挡`);
  }

  syncTransformInputs();
  updateEditor();
  selectedHelper?.update();
  updateDecisionBoard();
}

function build3DFromDetectedWalls(options = {}) {
  if (!detectedWallResult || detectedWallResult.segments.length === 0) {
    setRecognitionStatus("先识别到墙线，再生成 3D");
    return;
  }

  clearGenerated3D();

  const wallHeight = Math.max(2.2, Number(wallHeightInput?.value || 2.8));
  const optimizer = planOptimizerSettings();
  const floorBounds = floorBoundsForDetectedResult(detectedWallResult);
  generatedModelGroup = new THREE.Group();

  generatedFloorMesh = box(floorBounds.width, 0.08, floorBounds.depth, floorFinishes[activeFloorFinish], {
    castShadow: false,
  });
  generatedFloorMesh.position.set(floorBounds.centerX, -0.04, floorBounds.centerZ);
  generatedModelGroup.add(generatedFloorMesh);

  const semanticSummary = addSemanticRoomModeling(generatedModelGroup, detectedWallResult, wallHeight);

  if (optimizer.showRooms) {
    (detectedWallResult.rooms ?? []).forEach((region, index) => {
      const roomMesh = makeRoomRegionMesh(region, detectedWallResult, index);
      roomMesh.material.opacity = 0.18;
      generatedModelGroup.add(roomMesh);
    });
  }

  detectedWallResult.segments.forEach((segment) => {
    const wallThickness = worldThicknessForFeature(segment, detectedWallResult, 0.1);
    const openings = openingsForWallSegment(segment, detectedWallResult);
    addSolidWallSpansAroundOpenings(generatedModelGroup, segment, openings, detectedWallResult, wallHeight, wallThickness);

    openings.forEach((opening) => {
      if (opening.kind !== "window") return;
      addWindowWallInfill(generatedModelGroup, opening, detectedWallResult, wallHeight, wallThickness);
    });
  });

  detectedWallResult.doors.forEach((opening) => {
    const wallThickness = worldThicknessForFeature(opening, detectedWallResult, 0.1);
    const lintel = makeDoorLintelFromOpening(opening, detectedWallResult, wallHeight, wallThickness);
    if (!lintel) return;
    lintel.userData.collider = "door-lintel";
    generatedDoorMeshes.push(lintel);
    generatedModelGroup.add(lintel);

    const doorAssembly = makeDoorAssemblyFromOpening(opening, detectedWallResult, wallHeight, wallThickness);
    generatedDoorMeshes.push(doorAssembly);
    generatedModelGroup.add(doorAssembly);
  });

  (detectedWallResult.windows ?? []).forEach((opening) => {
    const wallThickness = worldThicknessForFeature(opening, detectedWallResult, 0.1);
    const windowAssembly = makeWindowAssemblyFromOpening(opening, detectedWallResult, wallHeight, wallThickness);
    generatedWindowMeshes.push(windowAssembly);
    generatedModelGroup.add(windowAssembly);
  });

  if (optimizer.lengthLabels) {
    addWallLengthAnnotations(generatedModelGroup, detectedWallResult, {
      y: wallHeight + 0.18,
      offset: 0.42,
      height: 0.28,
      renderOrder: 14,
      minLength: Math.max(0.72, optimizer.minWallLength),
    });
  }

  scene.add(generatedModelGroup);
  generated3DActive = true;
  generated3DSource = "detected-walls";
  const collisionResult = settleFurnitureAgainstGeneratedWalls();
  if (detectedWallGroup) detectedWallGroup.visible = false;
  shellMeshes.floor.forEach((mesh) => {
    mesh.visible = false;
  });
  roomLabel.textContent = "图纸生成 3D";
  const collisionNote =
    collisionResult.moved > 0
      ? `已生成实体 3D，已避让 ${collisionResult.moved} 件家具`
      : "已生成实体 3D";
  const semanticNote =
    semanticSummary.floors > 0
      ? `${collisionNote}，已按户型逻辑深化 ${semanticSummary.floors} 个空间 / ${semanticSummary.fixtures} 个构件`
      : collisionNote;
  setRecognitionStatus(
    wallSummaryText(
      collisionResult.blocked > 0 ? `${semanticNote}，${collisionResult.blocked} 件需手动调整` : semanticNote,
    ),
  );
  setView(options.preserveView ? currentView : "orbit");
}

function clearDetectedWallOverlay() {
  if (detectedWallGroup) {
    scene.remove(detectedWallGroup);
    disposeObjectTree(detectedWallGroup);
    detectedWallGroup = null;
  }
}

function clearDetectedWalls() {
  clearGenerated3D();
  clearDetectedWallOverlay();
  detectedWallSegments = [];
  detectedDoorOpenings = [];
  detectedWindowOpenings = [];
  detectedRoomRegions = [];
  detectedWallMeshes = [];
  selectedDetectedWallIndex = null;
  detectedWallResult = null;
  updateWallEditor();
  selectedLinearFeature = null;
  renderLinearPlanEditor(null);
}

function renderDetectedWalls(result) {
  clearDetectedWallOverlay();
  detectedWallGroup = new THREE.Group();
  detectedWallMeshes = [];
  const optimizer = planOptimizerSettings();
  result.rooms = (result.rooms ?? []).map((region) => ({
    ...region,
    worldArea: roomWorldArea(region, result),
  }));

  if (optimizer.showRooms) {
    result.rooms.forEach((region, index) => {
      detectedWallGroup.add(makeRoomRegionMesh(region, result, index));
      detectedWallGroup.add(makeRoomRegionLabel(region, result, index));
    });
  }

  result.segments.forEach((segment, index) => {
    const mesh = makeWallMeshFromSegment(
      segment,
      result,
      0.09,
      worldThicknessForFeature(segment, result, 0.08),
      colors.green,
      0.065,
    );
    mesh.userData.featureKind = "wall";
    mesh.userData.wallIndex = index;
    detectedWallMeshes.push(mesh);
    detectedWallGroup.add(mesh);
  });

  result.doors.forEach((opening) => {
    const mesh = makeWallMeshFromSegment(
      opening,
      result,
      0.045,
      Math.max(0.08, worldThicknessForFeature(opening, result, 0.08) * 1.18),
      colors.coral,
      0.095,
    );
    detectedWallGroup.add(mesh);
  });

  result.windows?.forEach((opening) => {
    const mesh = makeWallMeshFromSegment(
      opening,
      result,
      0.055,
      Math.max(0.08, worldThicknessForFeature(opening, result, 0.08) * 1.18),
      colors.glass,
      0.125,
    );
    mesh.material.transparent = true;
    mesh.material.opacity = 0.72;
    detectedWallGroup.add(mesh);
  });

  addSelectedWallHandles(detectedWallGroup, result);

  if (optimizer.lengthLabels) {
    addWallLengthAnnotations(detectedWallGroup, result, {
      y: 0.24,
      offset: 0.36,
      height: 0.26,
      renderOrder: 14,
      minLength: optimizer.minWallLength,
    });
  }

  scene.add(detectedWallGroup);
  if (generated3DActive) detectedWallGroup.visible = currentView === "top";
  detectedWallSegments = result.segments;
  detectedDoorOpenings = result.doors;
  detectedWindowOpenings = result.windows ?? [];
  detectedRoomRegions = result.rooms ?? [];
  detectedWallResult = result;
  if (selectedDetectedWallIndex !== null && !result.segments[selectedDetectedWallIndex]) {
    selectedDetectedWallIndex = null;
  }
  syncDetectedWallMeshStyles();
  updateWallEditor();
  renderLinearPlanEditor(result);
}

function detectWallsFromPlan() {
  if (!planCanvas) {
    setRecognitionStatus("请先导入图纸");
    return;
  }

  setRecognitionStatus("识别中...");
  const source = recognitionSourceForPlan();
  const result = estimateWallSegments(source.canvas, { sourceRect: source.sourceRect });
  result.sourceRect = source.sourceRect;
  result.sourceLabel = source.label;
  clearGenerated3D();
  selectedDetectedWallIndex = null;
  selectedLinearFeature = null;
  renderDetectedWalls(result);
  setRecognitionStatus(wallSummaryText([source.sourceRect ? "来自框选区域" : "", recognitionQualityText(result)].filter(Boolean).join(" · ")));
}

function updateSelectedTransform(type, rawValue) {
  if (!selectedGroup?.userData?.editable) return;

  const value = Number(rawValue);
  applyEditableTransform(() => {
    if (type === "x") selectedGroup.position.x = value;
    if (type === "z") selectedGroup.position.z = value;
    if (type === "rotation") selectedGroup.rotation.y = THREE.MathUtils.degToRad(value);
    if (type === "scale") selectedGroup.scale.setScalar(value / 100);
  });
}

function setView(view, updateButtons = true) {
  currentView = view;
  walkKeys.clear();
  const mode = view === "top" ? "2d" : "3d";
  designStage?.classList.toggle("is-2d-mode", mode === "2d");
  designStage?.classList.toggle("is-3d-mode", mode === "3d");
  if (view === "top") {
    camera.position.set(0, 7.8, 0.02);
    controls.target.set(0, 0, 0);
    controls.enableRotate = false;
  } else if (view === "walk") {
    camera.position.set(0.35, 1.35, 3.25);
    controls.target.set(0.15, 1.0, -0.95);
    controls.enableRotate = true;
  } else {
    if (generated3DActive) {
      camera.position.set(5.4, 6.1, 5.8);
      controls.target.set(0, 0.55, 0);
    } else {
      camera.position.set(4.8, 3.6, 5.2);
      controls.target.set(0, 0.72, 0);
    }
    controls.enableRotate = true;
  }

  if (generated3DActive && detectedWallGroup) detectedWallGroup.visible = view === "top";
  if (generatedModelGroup) generatedModelGroup.visible = view !== "top" || !detectedWallResult;
  controls.update();

  if (!updateButtons) return;
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.modelView === view);
  });
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.modelMode === mode);
  });
}

function setModelMode(mode) {
  if (mode === "2d") {
    setView("top");
    updateSelection(detectedWallResult?.segments?.length ? "2D 平面编辑" : planCanvas ? "2D 平面校准" : "2D 平面视图");
    return;
  }

  setView("orbit");
  updateSelection(generated3DActive ? "3D 模型视图" : "3D 方案视图");
}

function updatePointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function groundPointFromEvent(event) {
  updatePointerFromEvent(event);
  const point = new THREE.Vector3();
  return raycaster.ray.intersectPlane(dragPlane, point) ? point : null;
}

function syncTransformInputs() {
  if (!selectedGroup?.userData?.editable) return;
  if (positionXRange) positionXRange.value = selectedGroup.position.x.toFixed(1);
  if (positionZRange) positionZRange.value = selectedGroup.position.z.toFixed(1);
}

function onPointerDown(event) {
  updatePointerFromEvent(event);

  if (isScaleCalibrationMode) {
    beginScaleCalibrationDraw(event);
    return;
  }

  if (isPlanRegionSelectionMode) {
    beginPlanRegionDraw(event);
    return;
  }

  if (currentView === "top" && detectedWallGroup?.visible) {
    const point = groundPointFromEvent(event);
    const wallHit = point ? findWallAtPoint(point) : null;
    if (wallHit && beginDetectedWallDrag(event, wallHit.index, point)) {
      return;
    }
  }

  const hits = raycaster.intersectObjects(selectableMeshes, false);
  const editableHit = hits.find((hit) => hit.object.userData.modelRoot?.userData?.editable);
  if (editableHit) {
    selectMesh(editableHit.object);
  } else if (currentView !== "top" && hits[0]) {
    selectMesh(hits[0].object);
  }

  if (currentView === "top" && selectedGroup?.userData?.editable) {
    const point = groundPointFromEvent(event);
    if (point) {
      isDraggingModel = true;
      dragPointerId = event.pointerId;
      dragOffset.copy(point).sub(selectedGroup.position);
      controls.enabled = false;
      safeSetPointerCapture(event.pointerId);
    }
  }
}

function isTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable;
}

function handleWalkKey(event, pressed) {
  if (isTypingTarget(event.target)) return;

  const allowedKeys = [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
  ];
  if (!allowedKeys.includes(event.code)) return;

  if (pressed) {
    walkKeys.add(event.code);
  } else {
    walkKeys.delete(event.code);
  }

  if (currentView === "walk") {
    event.preventDefault();
  }
}

function handleWallEditKey(event) {
  if (isTypingTarget(event.target)) return false;
  if (currentView !== "top" || selectedDetectedWallIndex === null || !detectedWallResult) return false;
  if (!["Delete", "Backspace"].includes(event.key)) return false;

  event.preventDefault();
  deleteSelectedWall();
  return true;
}

function updateWalkMovement(deltaSeconds) {
  if (currentView !== "walk" || walkKeys.size === 0) return;

  walkForward.subVectors(controls.target, camera.position);
  walkForward.y = 0;
  if (walkForward.lengthSq() < 0.0001) return;
  walkForward.normalize();

  walkRight.crossVectors(walkForward, walkUp).normalize();
  walkDirection.set(0, 0, 0);

  if (walkKeys.has("KeyW")) walkDirection.add(walkForward);
  if (walkKeys.has("KeyS")) walkDirection.sub(walkForward);
  if (walkKeys.has("KeyD")) walkDirection.add(walkRight);
  if (walkKeys.has("KeyA")) walkDirection.sub(walkRight);
  if (walkKeys.has("ShiftLeft") || walkKeys.has("ShiftRight")) walkDirection.y += 1;
  if (walkKeys.has("ControlLeft") || walkKeys.has("ControlRight")) walkDirection.y -= 1;
  if (walkDirection.lengthSq() === 0) return;

  walkDirection.normalize();
  const speed = walkMoveSpeed;
  const step = speed * deltaSeconds;
  walkDirection.multiplyScalar(step);
  camera.position.add(walkDirection);
  controls.target.add(walkDirection);

  const clampedCameraY = THREE.MathUtils.clamp(camera.position.y, minWalkHeight, maxWalkHeight);
  const heightCorrection = clampedCameraY - camera.position.y;
  camera.position.y += heightCorrection;
  controls.target.y += heightCorrection;
}

function onPointerMove(event) {
  if (isDrawingScaleCalibration) {
    updateScaleCalibrationDraw(event);
    return;
  }

  if (isDrawingPlanRegion) {
    updatePlanRegionDraw(event);
    return;
  }

  if (isDraggingDetectedWall && event.pointerId === detectedWallDragPointerId) {
    updateDetectedWallDrag(event);
    return;
  }

  if (!isDraggingModel || event.pointerId !== dragPointerId || !selectedGroup) return;
  const point = groundPointFromEvent(event);
  if (!point) return;

  const previousPosition = selectedGroup.position.clone();
  selectedGroup.position.x = point.x - dragOffset.x;
  selectedGroup.position.z = point.z - dragOffset.z;
  constrainFurniturePosition(selectedGroup, previousPosition);
  syncTransformInputs();
}

function onPointerUp(event) {
  if (finishScaleCalibrationDraw(event)) return;

  if (finishPlanRegionDraw(event)) return;

  if (finishDetectedWallDrag(event)) return;

  if (event.pointerId !== dragPointerId) return;
  isDraggingModel = false;
  dragPointerId = null;
  controls.enabled = true;
  safeReleasePointerCapture(event.pointerId);
}

function onCanvasWheel(event) {
  if (currentView !== "top" || selectedDetectedWallIndex === null || !detectedWallResult) return;
  const segment = detectedWallResult.segments[selectedDetectedWallIndex];
  if (!segment) return;

  event.preventDefault();
  const currentThickness = worldThicknessForFeature(segment, detectedWallResult, 0.01);
  const step = event.shiftKey ? 0.01 : 0.03;
  const nextThickness = THREE.MathUtils.clamp(currentThickness + (event.deltaY < 0 ? step : -step), 0.05, 1.2);
  applySelectedWallThickness(nextThickness, "已用滚轮调整墙厚", { preserveView: true });
}

function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function isNativeFullscreenActive() {
  return document.fullscreenElement === designStage;
}

function updateStageSizeButtons() {
  const active = isStageExpanded || isNativeFullscreenActive();
  toggleStageFullscreenButton?.classList.toggle("active", active);
  if (toggleStageFullscreenButton) {
    const label = toggleStageFullscreenButton.querySelector("span");
    const icon = toggleStageFullscreenButton.querySelector("i");
    toggleStageFullscreenButton.title = active ? "退出全屏" : "全屏查看";
    toggleStageFullscreenButton.setAttribute("aria-label", active ? "退出全屏" : "全屏查看");
    if (label) label.textContent = active ? "退出" : "全屏";
    if (icon) icon.dataset.lucide = active ? "minimize-2" : "maximize-2";
  }
  resetStageSizeButton?.classList.toggle("active", !active);
  window.lucide?.createIcons();
}

function setStageExpanded(expanded) {
  isStageExpanded = expanded;
  designStage?.classList.toggle("is-expanded", expanded);
  document.body.classList.toggle("stage-expanded", expanded);
  updateStageSizeButtons();
  requestAnimationFrame(resizeRenderer);
}

async function exitStageFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen?.();
  }
  setStageExpanded(false);
}

async function toggleStageFullscreen() {
  if (!designStage) return;

  if (isStageExpanded || isNativeFullscreenActive()) {
    await exitStageFullscreen();
    return;
  }

  try {
    await designStage.requestFullscreen?.();
    isStageExpanded = false;
    document.body.classList.remove("stage-expanded");
    updateStageSizeButtons();
    requestAnimationFrame(resizeRenderer);
  } catch (error) {
    setStageExpanded(true);
  }
}

function resetStageSize() {
  exitStageFullscreen();
}

function animate(time) {
  const deltaSeconds = lastAnimationTime ? Math.min((time - lastAnimationTime) / 1000, 0.05) : 0.016;
  lastAnimationTime = time;

  if (pulseLight) {
    const base = pulseLight.userData.baseIntensity ?? 1.8;
    pulseLight.intensity = base + Math.sin(time * 0.002) * 0.18;
  }
  if (selectedHelper) {
    selectedHelper.update();
  }
  updateWalkMovement(deltaSeconds);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function init() {
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0xdfe7e7);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdfe7e7, 8, 16);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.zoomSpeed = 2.4;
  controls.minDistance = 0.9;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.49;

  root = new THREE.Group();
  scene.add(root);

  ambientLight = new THREE.HemisphereLight(0xffffff, 0x9faeaa, 2.25);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  sunLight.position.set(2.8, 5, 3.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  scene.add(sunLight);

  pulseLight = new THREE.PointLight(colors.light, 1.8, 7);
  pulseLight.userData.baseIntensity = 1.8;
  pulseLight.position.set(0, 2.4, 0.2);
  scene.add(pulseLight);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  gltfLoader = new GLTFLoader();

  if (trellisEndpointInput) {
    trellisEndpointInput.value =
      localStorage.getItem("trellis2Endpoint") || trellisEndpointInput.value || "http://127.0.0.1:7861/api/trellis/image-to-3d";
  }

  resizeRenderer();
  loadRoom(activeRoom);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("keydown", (event) => {
    if (handleWallEditKey(event)) return;
    handleWalkKey(event, true);
  });
  window.addEventListener("keyup", (event) => handleWalkKey(event, false));
  window.addEventListener("blur", () => walkKeys.clear());
  document.addEventListener("fullscreenchange", () => {
    if (!isNativeFullscreenActive()) {
      isStageExpanded = false;
      document.body.classList.remove("stage-expanded");
    }
    updateStageSizeButtons();
    requestAnimationFrame(resizeRenderer);
  });
  new ResizeObserver(resizeRenderer).observe(canvas);

  document.addEventListener("roomchange", (event) => {
    loadRoom(event.detail.room);
  });

  document.addEventListener("materialaction", (event) => {
    highlightMaterial(event.detail.name);
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.modelView);
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setModelMode(button.dataset.modelMode);
    });
  });

  resetStageSizeButton?.addEventListener("click", () => {
    resetStageSize();
  });

  toggleStageFullscreenButton?.addEventListener("click", () => {
    toggleStageFullscreen();
  });

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      addLibraryModel(button.dataset.addModel);
    });
  });

  variantOptions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-variant]");
    if (!button) return;
    replaceSelectedVariant(button.dataset.variant);
  });

  furnitureSwatches.forEach((button) => {
    button.addEventListener("click", () => {
      applyFurnitureFinish(selectedGroup, button.dataset.furnitureFinish);
    });
  });

  wallSwatches.forEach((button) => {
    button.addEventListener("click", () => {
      activeWallFinish = button.dataset.wallFinish;
      applyWallFinish(activeWallFinish);
    });
  });

  floorSwatches.forEach((button) => {
    button.addEventListener("click", () => {
      activeFloorFinish = button.dataset.floorFinish;
      applyFloorFinish(activeFloorFinish);
    });
  });

  lightTones.forEach((button) => {
    button.addEventListener("click", () => {
      activeLightTone = button.dataset.lightTone;
      applyLightTone(activeLightTone);
    });
  });

  positionXRange?.addEventListener("input", (event) => {
    updateSelectedTransform("x", event.target.value);
  });

  positionZRange?.addEventListener("input", (event) => {
    updateSelectedTransform("z", event.target.value);
  });

  rotationRange?.addEventListener("input", (event) => {
    updateSelectedTransform("rotation", event.target.value);
  });

  scaleRange?.addEventListener("input", (event) => {
    updateSelectedTransform("scale", event.target.value);
  });

  lightRange?.addEventListener("input", (event) => {
    applyLightIntensity(event.target.value);
  });

  deleteModelButton?.addEventListener("click", () => {
    removeModel(selectedGroup);
  });

  clearOriginalModelButton?.addEventListener("click", () => {
    clearOriginalModel();
  });

  planFileInput?.addEventListener("change", (event) => {
    importPlanFile(event.target.files?.[0]);
  });

  planWidthInput?.addEventListener("input", () => {
    updatePlanMesh();
  });

  planOpacityRange?.addEventListener("input", () => {
    updatePlanMesh();
  });

  calibrateScaleButton?.addEventListener("click", () => {
    startScaleCalibration();
  });

  applyPlanScaleButton?.addEventListener("click", () => {
    applyScaleCalibration();
  });

  scaleLengthInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyScaleCalibration();
  });

  rotatePlanButton?.addEventListener("click", () => {
    if (!planCanvas) return;
    planRotation = (planRotation + 90) % 360;
    clearDetectedWalls();
    setRecognitionStatus("图纸已旋转，请重新识别");
    updatePlanMesh();
  });

  selectPlanRegionButton?.addEventListener("click", () => {
    startPlanRegionSelection();
  });

  keepPlanRegionButton?.addEventListener("click", () => {
    keepOnlyPlanRegion();
  });

  clearPlanRegionButton?.addEventListener("click", () => {
    clearPlanRegion();
  });

  clearPlanButton?.addEventListener("click", () => {
    clearPlan();
    if (planFileInput) planFileInput.value = "";
  });

  analyzePlanPhotoButton?.addEventListener("click", () => {
    analyzeCurrentPlanPhoto();
  });

  cleanPlanPhotoButton?.addEventListener("click", () => {
    cleanCurrentPlanPhoto();
  });

  restoreOriginalPlanPhotoButton?.addEventListener("click", () => {
    restoreOriginalPlanPhoto();
  });

  detectWallsButton?.addEventListener("click", () => {
    detectWallsFromPlan();
  });

  clearWallsButton?.addEventListener("click", () => {
    clearDetectedWalls();
    setRecognitionStatus(planCanvas ? "可重新识别" : "等待识别");
  });

  rerunOptimizedRecognitionButton?.addEventListener("click", () => {
    updatePlanOptimizerStatus();
    detectWallsFromPlan();
  });

  [optShowRoomsInput, optLengthLabelsInput].forEach((input) => {
    input?.addEventListener("change", applyPlanOptimizerDisplayOnly);
  });

  [optCollapseWallsInput, optExtendCornersInput, optDoorWindowSymbolsInput, optMinWallLengthInput].forEach((input) => {
    input?.addEventListener("change", () => {
      updatePlanOptimizerStatus();
      if (planCanvas) setRecognitionStatus("读图设置已更新，点击“按设置重识别”生效");
    });
    input?.addEventListener("input", () => {
      updatePlanOptimizerStatus();
    });
  });

  build3DModelButton?.addEventListener("click", () => {
    build3DFromDetectedWalls();
  });

  clear3DModelButton?.addEventListener("click", () => {
    clearGenerated3D();
    setRecognitionStatus(detectedWallSegments.length > 0 ? wallSummaryText() : planCanvas ? "可识别墙线" : "等待识别");
    if (planCanvas) setView("top");
  });

  sitePhotoInput?.addEventListener("change", (event) => {
    loadSitePhotoFiles(event.target.files);
  });

  generatePhotoModelButton?.addEventListener("click", () => {
    buildDisplayModelFromSitePhoto();
  });

  refinePlanPhotoModelButton?.addEventListener("click", () => {
    applySitePhotosToPlanModel();
  });

  matchSitePhotosButton?.addEventListener("click", () => {
    refreshSitePhotoMatches();
    if (generated3DSource === "site-photo") {
      buildDisplayModelFromSitePhoto();
    } else if (generated3DSource === "plan-photo-refined") {
      applySitePhotosToPlanModel();
    }
  });

  generateTrellisModelButton?.addEventListener("click", () => {
    generateTrellisModelFromSitePhoto();
  });

  clearPhotoModelButton?.addEventListener("click", () => {
    clearSitePhotoModel();
  });

  wallHeightInput?.addEventListener("input", () => {
    if (!generated3DActive) return;
    if (generated3DSource === "site-photo") {
      buildDisplayModelFromSitePhoto();
    } else if (generated3DSource === "plan-photo-refined") {
      applySitePhotosToPlanModel();
    } else {
      build3DFromDetectedWalls();
    }
  });

  wallStartOffsetInput?.addEventListener("input", () => {
    applySelectedWallEndpointOffsets(wallStartOffsetInput.value, wallEndOffsetInput?.value ?? 0);
  });

  wallStartOffsetInput?.addEventListener("change", () => {
    applySelectedWallEndpointOffsets(wallStartOffsetInput.value, wallEndOffsetInput?.value ?? 0);
  });

  wallEndOffsetInput?.addEventListener("input", () => {
    applySelectedWallEndpointOffsets(wallStartOffsetInput?.value ?? 0, wallEndOffsetInput.value);
  });

  wallEndOffsetInput?.addEventListener("change", () => {
    applySelectedWallEndpointOffsets(wallStartOffsetInput?.value ?? 0, wallEndOffsetInput.value);
  });

  wallThicknessInput?.addEventListener("input", () => {
    applySelectedWallThickness(wallThicknessInput.value, "已调整墙厚");
  });

  wallThicknessInput?.addEventListener("change", () => {
    applySelectedWallThickness(wallThicknessInput.value, "已调整墙厚");
  });

  deleteWallButton?.addEventListener("click", () => {
    deleteSelectedWall();
  });

  addLinearWallButton?.addEventListener("click", () => {
    addLinearWall();
  });

  addLinearDoorButton?.addEventListener("click", () => {
    addLinearOpening("door");
  });

  addLinearWindowButton?.addEventListener("click", () => {
    addLinearOpening("window");
  });

  linearPlanList?.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-linear-delete]");
    if (deleteButton) {
      event.stopPropagation();
      deleteLinearFeature(deleteButton.dataset.linearKind, Number(deleteButton.dataset.linearIndex));
      return;
    }

    if (event.target.closest("[data-window-type]")) return;
    const row = event.target.closest("[data-linear-kind]");
    if (!row) return;
    selectLinearFeature(row.dataset.linearKind, Number(row.dataset.linearIndex));
  });

  linearPlanList?.addEventListener("change", (event) => {
    const typeSelect = event.target.closest("[data-window-type]");
    if (!typeSelect || !detectedWallResult?.windows) return;
    const index = Number(typeSelect.dataset.index);
    if (!detectedWallResult.windows[index]) return;
    detectedWallResult.windows[index].windowType = typeSelect.value;
    selectedLinearFeature = { kind: "window", index };
    commitLinearPlanEdit("已切换窗型");
  });

  designStage?.addEventListener("dragenter", (event) => {
    event.preventDefault();
    designStage.classList.add("is-dragover");
  });

  designStage?.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  designStage?.addEventListener("dragleave", () => {
    designStage.classList.remove("is-dragover");
  });

  designStage?.addEventListener("drop", (event) => {
    event.preventDefault();
    designStage.classList.remove("is-dragover");
    importPlanFile(event.dataTransfer?.files?.[0]);
  });

  applyLightTone(activeLightTone);
  applyLightIntensity(lightRange?.value ?? 100);
  renderPlanPhotoQuality(null);
  updatePlanRegionControls();
  updateScaleControls();
  updateStageSizeButtons();
  renderLinearPlanEditor(null);
  updatePlanOptimizerStatus();
  updateDecisionBoard();
  updateWorkflowBoard();

  markModelReady();
  requestAnimationFrame(animate);
}

try {
  init();
} catch (error) {
  console.error(error);
  showModelBootIssue("3D 模型启动失败", "请检查浏览器是否支持 WebGL，并打开 F12 查看具体报错。");
}


