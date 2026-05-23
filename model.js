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
const matchSitePhotosButton = document.querySelector("#matchSitePhotos");
const trellisEndpointInput = document.querySelector("#trellisEndpointInput");
const generateTrellisModelButton = document.querySelector("#generateTrellisModel");
const clearPhotoModelButton = document.querySelector("#clearPhotoModel");
const wallEditor = document.querySelector("#wallEditor");
const wallSelection = document.querySelector("#wallSelection");
const deleteWallButton = document.querySelector("#deleteWall");
const wallLengthInput = document.querySelector("#wallLengthInput");
const wallStartOffsetInput = document.querySelector("#wallStartOffsetInput");
const wallEndOffsetInput = document.querySelector("#wallEndOffsetInput");
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
let detectedWallResult;
let detectedWallMeshes = [];
let selectedDetectedWallIndex = null;
let generatedModelGroup;
let generatedWallMeshes = [];
let generatedDoorMeshes = [];
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
  const preferredKinds = ["sofa", "island", "bed", "cabinet", "table", "wardrobe", "light"];
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
}

function setRecognitionStatus(text) {
  if (recognitionStatus) recognitionStatus.textContent = text;
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
  setPlanStatus("已保留框选图纸", `${planCanvas.width} x ${planCanvas.height} px`);
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

async function importPlanFile(file) {
  if (!file) return;

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    setPlanStatus("文件格式不支持", "请选择 JPG / PNG / PDF");
    return;
  }

  setPlanStatus("读取中...", file.name);

  try {
    const result = isPdf ? await renderPdfPlan(file) : await renderImagePlan(file);
    disposePlan();
    resetPlanRegionState();
    resetScaleCalibrationState();
    planCanvas = result.canvas;
    planAspect = result.canvas.width / result.canvas.height;
    planRotation = 0;
    clearDetectedWalls();
    updatePlanMesh();
    setPlanStatus(file.name, result.meta);
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

function buildInkMap(sourceCanvas) {
  const maxSide = 720;
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

  const threshold = otsuThreshold(grayscale);
  const ink = new Uint8Array(width * height);
  for (let index = 0; index < ink.length; index += 1) {
    ink[index] = grayscale[index] <= threshold ? 1 : 0;
  }

  return { width, height, ink };
}

function scanRuns(map, orientation) {
  const { width, height, ink } = map;
  const horizontal = orientation === "horizontal";
  const outerLimit = horizontal ? height : width;
  const innerLimit = horizontal ? width : height;
  const minLength = Math.max(10, Math.round(innerLimit * 0.025));
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

          if (support / total >= 0.14) {
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
      existing.source = existing.source === candidate.source ? existing.source : "mixed";
    });

  return merged;
}

function buildPairedWallCandidates(runs, width, height) {
  const candidates = [];
  const grouped = {
    horizontal: runs.filter((run) => run.orientation === "horizontal"),
    vertical: runs.filter((run) => run.orientation === "vertical"),
  };

  Object.values(grouped).forEach((group) => {
    group.forEach((first, index) => {
      for (let cursor = index + 1; cursor < group.length; cursor += 1) {
        const second = group[cursor];
        const gap = Math.abs(second.axisCenter - first.axisCenter);
        if (gap < 2) continue;
        if (gap > 18) break;

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

function pruneTinyWallSegments(segments, width, height) {
  const minLength = Math.max(12, Math.round(Math.max(width, height) * 0.018));
  return segments.filter((segment) => segmentLength(segment) >= minLength);
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

function estimateWallSegments(sourceCanvas) {
  const map = buildInkMap(sourceCanvas);
  const runs = mergeRuns([...scanRuns(map, "horizontal"), ...scanRuns(map, "vertical")]);
  const pairedWalls = buildPairedWallCandidates(runs, map.width, map.height);
  const solidWalls = buildSolidWallCandidates(runs, map.width, map.height);
  const ruleBasedSegments = keepDominantWallRegion(
    pruneTinyWallSegments(mergeWallCandidates([...pairedWalls, ...solidWalls]), map.width, map.height),
    map.width,
    map.height,
  );
  const fallbackSegments = pruneTinyWallSegments(
    runs.map((segment) => ({
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
  );
  const segments = (ruleBasedSegments.length >= 4 ? ruleBasedSegments : fallbackSegments).map((segment) => ({
    ...segment,
    baseStart: segment.start,
    baseEnd: segment.end,
    startCorrectionMeters: 0,
    endCorrectionMeters: 0,
  }));
  const doors = estimateDoorOpenings(map, segments);

  return {
    width: map.width,
    height: map.height,
    segments,
    doors,
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
  if (length < 0.08) return null;

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

function clearGenerated3D() {
  clearTrellisModel();
  if (generatedModelGroup) {
    scene.remove(generatedModelGroup);
    disposeObjectTree(generatedModelGroup);
    generatedModelGroup = null;
  }

  generatedWallMeshes = [];
  generatedDoorMeshes = [];
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
}

function setSitePhotoStatus(status, meta) {
  if (sitePhotoStatus) sitePhotoStatus.textContent = status;
  if (sitePhotoMeta) sitePhotoMeta.textContent = meta;
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

function wallSurfaceTransform(slot, nx, ny, analysis) {
  const { width, depth, height } = analysis;
  const y = THREE.MathUtils.clamp((1 - ny) * height, 0.35, height - 0.25);

  if (slot === "right") {
    return {
      position: new THREE.Vector3(width / 2 - 0.052, y, (nx - 0.5) * depth * 0.76),
      rotationY: -Math.PI / 2,
    };
  }

  if (slot === "left") {
    return {
      position: new THREE.Vector3(-width / 2 + 0.052, y, (0.5 - nx) * depth * 0.76),
      rotationY: Math.PI / 2,
    };
  }

  return {
    position: new THREE.Vector3((nx - 0.5) * width * 0.82, y, -depth / 2 + 0.052),
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

  const nx = feature.x + feature.width / 2;
  const ny = feature.y + feature.height / 2;
  const xOffset = (nx - 0.5) * analysis.width * 0.56;
  const zOffset = THREE.MathUtils.clamp((ny - 0.5) * analysis.depth * 0.42, -analysis.depth * 0.1, analysis.depth * 0.28);

  if (match.slot === "right") {
    return new THREE.Vector3(analysis.width * 0.2, 0, zOffset);
  }
  if (match.slot === "left") {
    return new THREE.Vector3(-analysis.width * 0.2, 0, zOffset);
  }
  return new THREE.Vector3(xOffset, 0, analysis.depth * 0.18 + zOffset);
}

function addDisplayFurniture(group, analysis, matches = []) {
  const sofaColor = analysis.accentColor;
  const woodColor = colorFromImageAverage(analysis.avg, 112, 0.5);
  const furnitureMatch = matches
    .filter((match) => match.features?.furniture)
    .sort((a, b) => b.features.furniture.confidence - a.features.furniture.confidence)[0];
  const sofaPosition = furniturePositionFromFeature(
    furnitureMatch?.features?.furniture,
    furnitureMatch,
    analysis,
    new THREE.Vector3(-analysis.width * 0.18, 0, analysis.depth * 0.22),
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
  table.position.set(0.15, 0, analysis.depth * 0.12);
  group.add(table);

  const cabinet = new THREE.Group();
  cabinet.add(place(box(2.4, 0.62, 0.38, woodColor), 0, 0.35, 0));
  cabinet.add(place(box(2.5, 0.06, 0.44, colors.woodDark), 0, 0.7, 0));
  cabinet.position.set(sofaPosition.x * -0.28, 0, -analysis.depth * 0.5 + 0.42);
  group.add(cabinet);

  const ceilingLight = box(1.8, 0.05, 0.08, colors.light, {
    emissive: colors.light,
    emissiveIntensity: 0.28,
  });
  ceilingLight.position.set(0, analysis.height - 0.16, -0.15);
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

  const panelPlacements = [
    {
      name: "现场图片参考墙 1",
      position: new THREE.Vector3(0, height * 0.56, -depth / 2 + wallThickness / 2 + 0.014),
      rotationY: 0,
      maxWidth: width * 0.76,
      maxHeight: height * 0.68,
    },
    {
      name: "现场图片参考墙 2",
      position: new THREE.Vector3(width / 2 - wallThickness / 2 - 0.014, height * 0.56, depth * 0.02),
      rotationY: -Math.PI / 2,
      maxWidth: depth * 0.58,
      maxHeight: height * 0.62,
    },
    {
      name: "现场图片参考墙 3",
      position: new THREE.Vector3(-width / 2 + wallThickness / 2 + 0.014, height * 0.56, depth * 0.02),
      rotationY: Math.PI / 2,
      maxWidth: depth * 0.58,
      maxHeight: height * 0.62,
    },
  ];

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
  const base = `识别到 ${detectedWallSegments.length} 段墙线 / ${detectedDoorOpenings.length} 处门洞`;
  return suffix ? `${base} · ${suffix}` : base;
}

function syncDetectedWallMeshStyles() {
  detectedWallMeshes.forEach((mesh, index) => {
    mesh.material.color.setHex(index === selectedDetectedWallIndex ? colors.green : colors.blue);
    mesh.material.opacity = index === selectedDetectedWallIndex ? 0.96 : 0.82;
  });
}

function updateWallEditor() {
  const segment =
    selectedDetectedWallIndex === null ? null : detectedWallResult?.segments?.[selectedDetectedWallIndex] ?? null;

  wallEditor?.classList.toggle("is-disabled", !segment);
  if (!segment) {
    if (wallSelection) wallSelection.textContent = detectedWallSegments.length > 0 ? "点击蓝色墙体" : "识别后点击蓝色墙体";
    if (wallLengthInput) wallLengthInput.value = "0";
    if (wallStartOffsetInput) wallStartOffsetInput.value = "0";
    if (wallEndOffsetInput) wallEndOffsetInput.value = "0";
    return;
  }

  const orientationName = segment.orientation === "horizontal" ? "横墙" : "竖墙";
  if (wallSelection) wallSelection.textContent = `${orientationName} #${selectedDetectedWallIndex + 1}`;
  if (wallLengthInput) wallLengthInput.value = worldLengthForSegment(segment, detectedWallResult).toFixed(1);
  if (wallStartOffsetInput) wallStartOffsetInput.value = (segment.startCorrectionMeters ?? 0).toFixed(1);
  if (wallEndOffsetInput) wallEndOffsetInput.value = (segment.endCorrectionMeters ?? 0).toFixed(1);
}

function selectDetectedWall(index) {
  if (!detectedWallResult?.segments?.[index]) return;
  selectedDetectedWallIndex = index;
  syncDetectedWallMeshStyles();
  updateWallEditor();
  updateSelection(`墙体 #${index + 1}`);
}

function updateDoorsAfterWallEdit() {
  if (!detectedWallResult?.inkMap) return;
  detectedWallResult.doors = estimateDoorOpenings(detectedWallResult.inkMap, detectedWallResult.segments);
  detectedDoorOpenings = detectedWallResult.doors;
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

  updateDoorsAfterWallEdit();
  renderDetectedWalls(detectedWallResult);
  setRecognitionStatus(wallSummaryText("已手动修正"));
  if (generated3DActive) build3DFromDetectedWalls();
}

function deleteSelectedWall() {
  if (selectedDetectedWallIndex === null || !detectedWallResult) return;

  detectedWallResult.segments.splice(selectedDetectedWallIndex, 1);
  selectedDetectedWallIndex = null;
  updateDoorsAfterWallEdit();
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

function usesFurnitureCollision(group) {
  return Boolean(group?.userData?.editable && group.userData.kind !== "light");
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
}

function build3DFromDetectedWalls() {
  if (!detectedWallResult || detectedWallResult.segments.length === 0) {
    setRecognitionStatus("先识别到墙线，再生成 3D");
    return;
  }

  clearGenerated3D();

  const wallHeight = Math.max(2.2, Number(wallHeightInput?.value || 2.8));
  const floorBounds = floorBoundsForDetectedResult(detectedWallResult);
  generatedModelGroup = new THREE.Group();

  generatedFloorMesh = box(floorBounds.width, 0.08, floorBounds.depth, floorFinishes[activeFloorFinish], {
    castShadow: false,
  });
  generatedFloorMesh.position.set(floorBounds.centerX, -0.04, floorBounds.centerZ);
  generatedModelGroup.add(generatedFloorMesh);

  detectedWallResult.segments.forEach((segment) => {
    const wallThickness = worldThicknessForFeature(segment, detectedWallResult, 0.1);
    const mesh = makeWallMeshFromSegment(
      segment,
      detectedWallResult,
      wallHeight,
      wallThickness,
      wallFinishes[activeWallFinish],
      wallHeight / 2,
    );
    mesh.userData.collider = "solid-wall";
    generatedWallMeshes.push(mesh);
    generatedModelGroup.add(mesh);
  });

  detectedWallResult.doors.forEach((opening) => {
    const wallThickness = worldThicknessForFeature(opening, detectedWallResult, 0.1);
    const lintel = makeDoorLintelFromOpening(opening, detectedWallResult, wallHeight, wallThickness);
    if (!lintel) return;
    lintel.userData.collider = "door-lintel";
    generatedDoorMeshes.push(lintel);
    generatedModelGroup.add(lintel);
  });

  addWallLengthAnnotations(generatedModelGroup, detectedWallResult, {
    y: wallHeight + 0.18,
    offset: 0.42,
    height: 0.28,
    renderOrder: 14,
  });

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
  setRecognitionStatus(
    wallSummaryText(
      collisionResult.blocked > 0 ? `${collisionNote}，${collisionResult.blocked} 件需手动调整` : collisionNote,
    ),
  );
  setView("orbit");
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
  detectedWallMeshes = [];
  selectedDetectedWallIndex = null;
  detectedWallResult = null;
  updateWallEditor();
}

function renderDetectedWalls(result) {
  clearDetectedWallOverlay();
  detectedWallGroup = new THREE.Group();
  detectedWallMeshes = [];

  result.segments.forEach((segment, index) => {
    const mesh = makeWallMeshFromSegment(
      segment,
      result,
      0.09,
      worldThicknessForFeature(segment, result, 0.08),
      colors.blue,
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

  addWallLengthAnnotations(detectedWallGroup, result, {
    y: 0.24,
    offset: 0.36,
    height: 0.26,
    renderOrder: 14,
  });

  scene.add(detectedWallGroup);
  detectedWallSegments = result.segments;
  detectedDoorOpenings = result.doors;
  detectedWallResult = result;
  if (selectedDetectedWallIndex !== null && !result.segments[selectedDetectedWallIndex]) {
    selectedDetectedWallIndex = null;
  }
  syncDetectedWallMeshStyles();
  updateWallEditor();
}

function detectWallsFromPlan() {
  if (!planCanvas) {
    setRecognitionStatus("请先导入图纸");
    return;
  }

  setRecognitionStatus("识别中...");
  const source = recognitionSourceForPlan();
  const result = estimateWallSegments(source.canvas);
  result.sourceRect = source.sourceRect;
  result.sourceLabel = source.label;
  clearGenerated3D();
  selectedDetectedWallIndex = null;
  renderDetectedWalls(result);
  setRecognitionStatus(wallSummaryText(source.sourceRect ? "来自框选区域" : ""));
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

  controls.update();

  if (!updateButtons) return;
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.modelView === view);
  });
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
    if (wallHit) {
      selectDetectedWall(wallHit.index);
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
      canvas.setPointerCapture?.(event.pointerId);
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

  if (event.pointerId !== dragPointerId) return;
  isDraggingModel = false;
  dragPointerId = null;
  controls.enabled = true;
  canvas.releasePointerCapture?.(event.pointerId);
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
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("keydown", (event) => handleWalkKey(event, true));
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

  detectWallsButton?.addEventListener("click", () => {
    detectWallsFromPlan();
  });

  clearWallsButton?.addEventListener("click", () => {
    clearDetectedWalls();
    setRecognitionStatus(planCanvas ? "可重新识别" : "等待识别");
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

  matchSitePhotosButton?.addEventListener("click", () => {
    refreshSitePhotoMatches();
    if (generated3DSource === "site-photo") {
      buildDisplayModelFromSitePhoto();
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

  deleteWallButton?.addEventListener("click", () => {
    deleteSelectedWall();
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
  updatePlanRegionControls();
  updateScaleControls();
  updateStageSizeButtons();

  markModelReady();
  requestAnimationFrame(animate);
}

try {
  init();
} catch (error) {
  console.error(error);
  showModelBootIssue("3D 模型启动失败", "请检查浏览器是否支持 WebGL，并打开 F12 查看具体报错。");
}
