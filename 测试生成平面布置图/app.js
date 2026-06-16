const svg = document.querySelector("#floorPlanSvg");
const sourcePlanPreview = document.querySelector("#sourcePlanPreview");
const sourcePlanInput = document.querySelector("#sourcePlanInput");
const showSourcePlanInput = document.querySelector("#showSourcePlan");
const showBinaryPlanInput = document.querySelector("#showBinaryPlan");
const showStructuralWallInput = document.querySelector("#showStructuralWall");
const sourceOpacityInput = document.querySelector("#sourceOpacity");
const clearSourcePlanButton = document.querySelector("#clearSourcePlan");
const styleSelect = document.querySelector("#layoutStyle");
const regenerateButton = document.querySelector("#regenerateButton");
const exportButton = document.querySelector("#exportButton");
const roomCount = document.querySelector("#roomCount");
const furnitureCount = document.querySelector("#furnitureCount");
const riskCount = document.querySelector("#riskCount");
const sourcePlanStatus = document.querySelector("#sourcePlanStatus");
const strategyList = document.querySelector("#strategyList");
const roomList = document.querySelector("#roomList");
const schemeList = document.querySelector("#schemeList");
const schemeTabs = document.querySelector("#schemeTabs");
const schemeStripStatus = document.querySelector("#schemeStripStatus");
const confirmTools = document.querySelector("#confirmTools");
const confirmationList = document.querySelector("#confirmationList");
const clearConfirmationsButton = document.querySelector("#clearConfirmations");
const calibrationTools = document.querySelector("#calibrationTools");
const calibrationLengthInput = document.querySelector("#calibrationLengthMm");
const calibrationStatus = document.querySelector("#calibrationStatus");
const outlineTools = document.querySelector("#outlineTools");
const outlineStatus = document.querySelector("#outlineStatus");
const mvpStatus = document.querySelector("#mvpStatus");
const aiModelProviderInput = document.querySelector("#aiModelProvider");
const runAiRecognitionButton = document.querySelector("#runAiRecognition");
const aiRecognitionStatus = document.querySelector("#aiRecognitionStatus");
const openAnnotationToolButton = document.querySelector("#openAnnotationTool");
const closeAnnotationToolButton = document.querySelector("#closeAnnotationTool");
const annotationToolOverlay = document.querySelector("#annotationToolOverlay");
const annotationToolFrame = document.querySelector("#annotationToolFrame");
const resultJson = document.querySelector("#resultJson");

if (aiModelProviderInput) {
  aiModelProviderInput.value = "cubicasa";
}

const ns = "http://www.w3.org/2000/svg";

const rooms = [
  {
    id: "livingDining",
    name: "客餐厅",
    type: "living",
    polygon: "44,48 448,48 448,210 390,210 390,470 458,470 458,570 390,570 390,1000 44,1000",
    bounds: { x: 44, y: 48, width: 414, height: 952 },
    reason: "最大连续开放空间，靠南窗和入户动线，适合作为客餐厅。",
  },
  {
    id: "kitchen",
    name: "厨房",
    type: "kitchen",
    polygon: "48,48 448,48 448,210 390,210 390,385 48,385",
    bounds: { x: 60, y: 62, width: 330, height: 300 },
    reason: "北侧长窗且靠近公共区，适合布置 L 型橱柜。",
  },
  {
    id: "bath",
    name: "卫生间",
    type: "bath",
    polygon: "408,230 565,230 565,472 408,472",
    bounds: { x: 408, y: 230, width: 157, height: 242 },
    reason: "小尺度独立房间，靠近卧室区，优先识别为卫浴。",
  },
  {
    id: "bedroomNorth",
    name: "北卧",
    type: "bedroom",
    polygon: "585,230 815,230 815,472 585,472",
    bounds: { x: 585, y: 230, width: 230, height: 242 },
    reason: "方正封闭房间并带北向窗，适合作为卧室。",
  },
  {
    id: "study",
    name: "书房",
    type: "study",
    polygon: "835,230 935,230 935,385 870,385 870,872 935,872 935,1000 685,1000 685,887 668,887 668,472 815,472 815,230",
    bounds: { x: 835, y: 230, width: 100, height: 642 },
    reason: "右上小房间尺度较窄，适合单人书房或储物。",
  },
  {
    id: "bedroomSouth",
    name: "南卧",
    type: "bedroom",
    polygon: "408,570 668,570 668,887 408,887",
    bounds: { x: 408, y: 570, width: 260, height: 317 },
    reason: "南侧带窗的完整房间，适合次卧。",
  },
  {
    id: "master",
    name: "主卧",
    type: "master",
    polygon: "685,472 935,472 935,887 685,887",
    bounds: { x: 685, y: 472, width: 250, height: 415 },
    reason: "右下最大独立卧室，适合布置双人床和整排衣柜。",
  },
];

const wallPaths = [
  "M24 24 H470 V210 H955 V1000 H668 V887 H44 V1000 H24 Z",
  "M44 48 H448 V210",
  "M78 24 V48 M176 24 V48",
  "M390 210 V472 H458 M390 472 V458 H458",
  "M408 230 H565 V472 H535 M408 230 V472 H458",
  "M585 230 H815 V472 H660 M585 230 V472 H668",
  "M835 230 H935 V385 H870 M935 385 V872 H685 V472 H815",
  "M408 570 V887 H668 V570 H492",
  "M685 472 V887 H935",
];

const openings = [
  { x1: 112, y1: 1000, x2: 590, y2: 1000, label: "南向长窗" },
  { x1: 410, y1: 887, x2: 610, y2: 887, label: "南卧窗" },
  { x1: 750, y1: 887, x2: 892, y2: 887, label: "主卧窗" },
  { x1: 470, y1: 218, x2: 540, y2: 218, label: "北向窗" },
  { x1: 614, y1: 218, x2: 740, y2: 218, label: "北卧窗" },
  { x1: 828, y1: 218, x2: 890, y2: 218, label: "书房窗" },
  { x1: 448, y1: 85, x2: 448, y2: 178, label: "厨房侧窗" },
];

const styleScale = {
  balanced: 1,
  compact: 0.88,
  comfort: 1.08,
};

const layoutSchemes = [
  {
    id: "comfort",
    name: "舒适通行版",
    style: "comfort",
    description: "减少压迫感，优先保留走道和活动区。",
    remove: ["living-shoe", "kitchen-island", "study-shelf"],
    add: [],
    weights: { clearance: 1.2, storage: 0.5, work: 0.5 },
  },
  {
    id: "storage",
    name: "高收纳版",
    style: "balanced",
    description: "增加柜体和收纳点，适合长期居住。",
    remove: [],
    add: [
      rectFurniture("living-sideboard", "livingDining", "边柜", 322, 910, 120, 38, "wood"),
      rectFurniture("south-low-cabinet", "bedroomSouth", "矮柜", 620, 772, 34, 86, "wood"),
      rectFurniture("master-storage", "master", "储物柜", 700, 840, 120, 34, "wood"),
    ],
    weights: { clearance: 0.7, storage: 1.3, work: 0.6 },
  },
  {
    id: "compact",
    name: "紧凑实用版",
    style: "compact",
    description: "缩小家具尺度，提高小户型容纳度。",
    remove: ["master-nightstand-b"],
    add: [rectFurniture("living-fold-table", "livingDining", "折叠桌", 310, 820, 80, 42, "wood")],
    weights: { clearance: 0.9, storage: 0.8, work: 0.6 },
  },
  {
    id: "office",
    name: "居家办公版",
    style: "balanced",
    description: "强化书桌和工作位，兼顾客厅临时办公。",
    remove: ["study-shelf"],
    add: [
      rectFurniture("living-workdesk", "livingDining", "办公桌", 100, 500, 120, 48, "wood"),
      rectFurniture("master-workdesk", "master", "办公桌", 820, 830, 92, 36, "wood"),
    ],
    weights: { clearance: 0.8, storage: 0.6, work: 1.4 },
  },
  {
    id: "family",
    name: "亲子成长版",
    style: "balanced",
    description: "增加学习桌和儿童收纳，适合家庭成长场景。",
    remove: ["north-desk"],
    add: [
      rectFurniture("north-child-desk", "bedroomNorth", "儿童书桌", 742, 316, 58, 88, "wood"),
      rectFurniture("south-toy-cabinet", "bedroomSouth", "玩具柜", 424, 834, 100, 30, "wood"),
    ],
    weights: { clearance: 0.9, storage: 0.9, work: 1.0 },
  },
];

const templateBounds = { x: 24, y: 24, width: 931, height: 976 };
const canvasBounds = { x: 0, y: 0, width: 1000, height: 1040 };
const semanticAreaBaseSize = {
  kitchen: { width: 310, height: 260 },
  bath: { width: 190, height: 190 },
  living: { width: 520, height: 360 },
  bedroom: { width: 330, height: 340 },
  balcony: { width: 210, height: 170 },
};
const furnitureSizeMm = {
  "confirmed-kitchen-cabinet-a": { width: 2400, height: 600 },
  "confirmed-kitchen-cabinet-b": { width: 600, height: 1800 },
  "confirmed-kitchen-counter": { width: 1200, height: 600 },
  "confirmed-bath-shower": { width: 900, height: 900 },
  "confirmed-bath-vanity": { width: 800, height: 500 },
  "confirmed-bath-toilet": { width: 700, height: 800 },
  "confirmed-living-sofa": { width: 2200, height: 900 },
  "confirmed-living-coffee": { width: 1000, height: 600 },
  "confirmed-living-tv": { width: 450, height: 1800 },
  "confirmed-living-dining": { width: 1600, height: 900 },
  "confirmed-bedroom-bed": { width: 1800, height: 2000 },
  "confirmed-bedroom-wardrobe": { width: 2400, height: 600 },
  "confirmed-bedroom-nightstand-a": { width: 500, height: 450 },
  "confirmed-bedroom-nightstand-b": { width: 500, height: 450 },
  "confirmed-balcony-laundry": { width: 1100, height: 600 },
  "confirmed-balcony-storage": { width: 600, height: 1500 },
  "confirmed-storage-living": { width: 1400, height: 450 },
  "confirmed-storage-bedroom": { width: 1200, height: 450 },
  "confirmed-office-living": { width: 1400, height: 600 },
  "confirmed-office-bedroom": { width: 1200, height: 550 },
  "confirmed-family-desk": { width: 1200, height: 550 },
  "confirmed-family-toy": { width: 1100, height: 450 },
};
const confirmationTypes = {
  planMin: { label: "平面左上", color: "#1f7a76" },
  planMax: { label: "平面右下", color: "#1f7a76" },
  entrance: { label: "入户门", color: "#d34534" },
  kitchen: { label: "厨房", color: "#9c6f43", roomType: "kitchen" },
  bath: { label: "卫生间", color: "#3d7894", roomType: "bath" },
  living: { label: "客餐厅", color: "#8764a5", roomType: "living" },
  bedroom: { label: "卧室", color: "#546fb0", roomType: "bedroom" },
  balcony: { label: "阳台", color: "#3a967d", roomType: "balcony" },
};

let generationIndex = 1;
let latestResult = null;
let generatedSchemes = [];
let uploadedSourcePlan = null;
let activeConfirmationType = null;
let confirmations = {};
let confirmationAreaScales = {};
let scaleCalibration = { start: null, end: null, lengthMm: 3000 };
let activeCalibrationPoint = null;
let roomOutlines = {};
let activeOutlineType = null;
let pendingOutlineStart = null;
let aiRecognitionResult = null;
let aiRecognitionBusy = false;

function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && value !== undefined) node.setAttribute(key, value);
  });
  children.forEach((child) => node.appendChild(child));
  return node;
}

function addText(parent, text, x, y, className) {
  const node = el("text", { x, y, class: className });
  node.textContent = text;
  parent.appendChild(node);
}

function rectFurniture(id, roomId, label, x, y, width, height, kind = "furniture", rotate = 0) {
  return { id, roomId, label, x, y, width, height, kind, rotate };
}

function scaled(value, style) {
  return Math.round(value * styleScale[style]);
}

function transformPoint(x, y, targetBounds = templateBounds) {
  const sx = targetBounds.width / templateBounds.width;
  const sy = targetBounds.height / templateBounds.height;
  return {
    x: targetBounds.x + (x - templateBounds.x) * sx,
    y: targetBounds.y + (y - templateBounds.y) * sy,
  };
}

function transformRect(item, targetBounds = templateBounds) {
  const origin = transformPoint(item.x, item.y, targetBounds);
  const sx = targetBounds.width / templateBounds.width;
  const sy = targetBounds.height / templateBounds.height;
  return {
    ...item,
    x: Math.round(origin.x),
    y: Math.round(origin.y),
    width: Math.max(8, Math.round(item.width * sx)),
    height: Math.max(8, Math.round(item.height * sy)),
    scale: Math.min(sx, sy),
  };
}

function transformPolygon(points, targetBounds = templateBounds) {
  return points
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      const point = transformPoint(x, y, targetBounds);
      return `${Math.round(point.x)},${Math.round(point.y)}`;
    })
    .join(" ");
}

function transformBounds(bounds, targetBounds = templateBounds) {
  const origin = transformPoint(bounds.x, bounds.y, targetBounds);
  const sx = targetBounds.width / templateBounds.width;
  const sy = targetBounds.height / templateBounds.height;
  return {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
    width: Math.round(bounds.width * sx),
    height: Math.round(bounds.height * sy),
  };
}

function createRoomsForPlan(targetBounds = templateBounds) {
  return rooms.map((room) => ({
    ...room,
    polygon: transformPolygon(room.polygon, targetBounds),
    bounds: transformBounds(room.bounds, targetBounds),
  }));
}

function generateFurniture(style, targetBounds = templateBounds, scheme = null) {
  const s = (value) => scaled(value, style);
  const baseFurniture = [
    rectFurniture("living-sofa", "livingDining", "三人沙发", 84, 655, s(230), s(72), "soft"),
    rectFurniture("living-coffee", "livingDining", "茶几", 150, 585, s(105), s(56), "wood"),
    rectFurniture("living-tv", "livingDining", "电视柜", 382, 610, s(22), s(160), "wood"),
    rectFurniture("living-dining", "livingDining", "餐桌", 150, 875, s(150), s(78), "wood"),
    rectFurniture("living-shoe", "livingDining", "玄关柜", 58, 910, s(38), s(130), "wood"),

    rectFurniture("kitchen-cabinet-a", "kitchen", "橱柜", 74, 68, s(250), s(36), "wood"),
    rectFurniture("kitchen-cabinet-b", "kitchen", "橱柜", 72, 112, s(38), s(190), "wood"),
    rectFurniture("kitchen-island", "kitchen", "备餐台", 200, 225, s(120), s(56), "wood"),

    rectFurniture("bath-shower", "bath", "淋浴", 422, 244, s(58), s(70), "accent"),
    rectFurniture("bath-vanity", "bath", "台盆", 494, 246, s(54), s(36), "wood"),
    rectFurniture("bath-toilet", "bath", "马桶", 504, 386, s(42), s(58), "furniture"),

    rectFurniture("north-bed", "bedroomNorth", "床", 628, 302, s(112), s(150), "soft"),
    rectFurniture("north-wardrobe", "bedroomNorth", "衣柜", 596, 242, s(165), s(34), "wood"),
    rectFurniture("north-desk", "bedroomNorth", "书桌", 762, 318, s(38), s(88), "wood"),

    rectFurniture("study-desk", "study", "书桌", 858, 248, s(58), s(112), "wood"),
    rectFurniture("study-shelf", "study", "书柜", 898, 410, s(28), s(190), "wood"),

    rectFurniture("south-bed", "bedroomSouth", "床", 452, 678, s(130), s(176), "soft"),
    rectFurniture("south-wardrobe", "bedroomSouth", "衣柜", 420, 590, s(170), s(34), "wood"),
    rectFurniture("south-desk", "bedroomSouth", "书桌", 608, 608, s(36), s(118), "wood"),

    rectFurniture("master-bed", "master", "双人床", 735, 620, s(150), s(205), "soft"),
    rectFurniture("master-wardrobe", "master", "整排衣柜", 704, 492, s(190), s(38), "wood"),
    rectFurniture("master-nightstand-a", "master", "床头柜", 704, 652, s(28), s(38), "wood"),
    rectFurniture("master-nightstand-b", "master", "床头柜", 890, 652, s(28), s(38), "wood"),
    rectFurniture("master-desk", "master", "梳妆台", 895, 760, s(32), s(92), "wood"),
  ];
  const removeIds = new Set(scheme?.remove ?? []);
  const additions = scheme?.add ?? [];
  return [...baseFurniture.filter((item) => !removeIds.has(item.id)), ...additions]
    .map((item) => transformRect(item, targetBounds))
    .map((item) => constrainFurnitureToBounds(item, targetBounds));
}

function generateConfirmedFurniture(style, planBounds, scheme = null) {
  const semanticTypes = ["kitchen", "bath", "living", "bedroom", "balcony"];
  if (!semanticTypes.some((type) => confirmations[type] || roomOutlines[type])) return null;

  const inArea = (id, type, label, rx, ry, width, height, kind = "furniture") => {
    const area = confirmationArea(type, planBounds);
    if (!area) return null;
    const localSize = furnitureSizeForArea(id, type, area, style, width, height);
    const maxWidth = Math.max(8, Math.round(area.width * 0.88));
    const maxHeight = Math.max(8, Math.round(area.height * 0.88));
    return constrainFurnitureToConfirmationArea(
      {
        id,
        roomId: `${type}-confirmed`,
        lockedType: type,
        label,
        x: Math.round(area.x + area.width * rx),
        y: Math.round(area.y + area.height * ry),
        width: Math.min(maxWidth, localSize.width),
        height: Math.min(maxHeight, localSize.height),
        kind,
        rotate: 0,
        scale: Number(localSize.scale.toFixed(3)),
        scaleBasis: localSize.scaleBasis,
        widthMm: localSize.widthMm,
        heightMm: localSize.heightMm,
        pixelsPerMm: localSize.pixelsPerMm,
        sizeAdjustedToArea: localSize.width > maxWidth || localSize.height > maxHeight,
      },
      planBounds,
    );
  };

  const items = [
    inArea("confirmed-kitchen-cabinet-a", "kitchen", "橱柜", 0.06, 0.08, 210, 34, "wood"),
    inArea("confirmed-kitchen-cabinet-b", "kitchen", "橱柜", 0.06, 0.25, 34, 150, "wood"),
    inArea("confirmed-kitchen-counter", "kitchen", "备餐台", 0.44, 0.58, 105, 46, "wood"),

    inArea("confirmed-bath-shower", "bath", "淋浴", 0.08, 0.08, 58, 62, "accent"),
    inArea("confirmed-bath-vanity", "bath", "台盆", 0.53, 0.1, 60, 32, "wood"),
    inArea("confirmed-bath-toilet", "bath", "马桶", 0.38, 0.55, 46, 58, "furniture"),

    inArea("confirmed-living-sofa", "living", "三人沙发", 0.08, 0.38, 205, 62, "soft"),
    inArea("confirmed-living-coffee", "living", "茶几", 0.27, 0.18, 90, 44, "wood"),
    inArea("confirmed-living-tv", "living", "电视柜", 0.72, 0.2, 28, 136, "wood"),
    inArea("confirmed-living-dining", "living", "餐桌", 0.12, 0.73, 140, 66, "wood"),

    inArea("confirmed-bedroom-bed", "bedroom", "双人床", 0.27, 0.32, 142, 178, "soft"),
    inArea("confirmed-bedroom-wardrobe", "bedroom", "衣柜", 0.12, 0.08, 176, 32, "wood"),
    inArea("confirmed-bedroom-nightstand-a", "bedroom", "床头柜", 0.11, 0.38, 30, 34, "wood"),
    inArea("confirmed-bedroom-nightstand-b", "bedroom", "床头柜", 0.76, 0.38, 30, 34, "wood"),

    inArea("confirmed-balcony-laundry", "balcony", "洗衣柜", 0.12, 0.46, 84, 32, "wood"),
    inArea("confirmed-balcony-storage", "balcony", "阳台柜", 0.58, 0.08, 32, 108, "wood"),
  ].filter(Boolean);

  if (scheme?.id === "storage") {
    items.push(
      inArea("confirmed-storage-living", "living", "边柜", 0.62, 0.76, 102, 32, "wood"),
      inArea("confirmed-storage-bedroom", "bedroom", "储物柜", 0.58, 0.84, 92, 32, "wood"),
    );
  }
  if (scheme?.id === "office") {
    items.push(
      inArea("confirmed-office-living", "living", "办公桌", 0.56, 0.08, 106, 40, "wood"),
      inArea("confirmed-office-bedroom", "bedroom", "书桌", 0.62, 0.72, 82, 34, "wood"),
    );
  }
  if (scheme?.id === "family") {
    items.push(
      inArea("confirmed-family-desk", "bedroom", "学习桌", 0.62, 0.72, 82, 34, "wood"),
      inArea("confirmed-family-toy", "living", "玩具柜", 0.64, 0.74, 88, 30, "wood"),
    );
  }
  if (scheme?.id === "comfort") {
    return items.filter((item) => !["confirmed-storage-living", "confirmed-storage-bedroom"].includes(item.id));
  }
  return items.filter(Boolean);
}

function furnitureSizeForArea(id, type, area, style, fallbackWidth, fallbackHeight) {
  const ratio = pixelsPerMm();
  const physicalSize = furnitureSizeMm[id];
  if (ratio && physicalSize) {
    const styleFactor = style === "compact" ? 0.92 : style === "comfort" ? 1.04 : 1;
    return {
      width: Math.max(8, Math.round(physicalSize.width * ratio * styleFactor)),
      height: Math.max(8, Math.round(physicalSize.height * ratio * styleFactor)),
      widthMm: physicalSize.width,
      heightMm: physicalSize.height,
      pixelsPerMm: Number(ratio.toFixed(5)),
      scale: clamp(ratio * 12, 0.45, 1.35),
      scaleBasis: "calibrated-mm",
    };
  }
  const localScale = furnitureScaleForArea(type, area, style);
  return {
    width: Math.max(8, Math.round(fallbackWidth * localScale)),
    height: Math.max(8, Math.round(fallbackHeight * localScale)),
    widthMm: null,
    heightMm: null,
    pixelsPerMm: null,
    scale: localScale,
    scaleBasis: "confirmation-area",
  };
}

function furnitureScaleForArea(type, area, style) {
  const baseSize = semanticAreaBaseSize[type] ?? { width: 300, height: 260 };
  const areaScale = Math.min(area.width / baseSize.width, area.height / baseSize.height);
  const styledScale = areaScale * (styleScale[style] ?? 1);
  return clamp(styledScale, 0.42, 1.45);
}

function constrainFurnitureToBounds(item, bounds) {
  const margin = Math.max(6, Math.round((item.scale ?? 1) * 10));
  const maxX = bounds.x + bounds.width - item.width - margin;
  const maxY = bounds.y + bounds.height - item.height - margin;
  return {
    ...item,
    x: Math.round(clamp(item.x, bounds.x + margin, Math.max(bounds.x + margin, maxX))),
    y: Math.round(clamp(item.y, bounds.y + margin, Math.max(bounds.y + margin, maxY))),
  };
}

function confirmationArea(type, planBounds) {
  const manualBounds = roomOutlines[type];
  if (manualBounds) {
    return {
      id: `${type}-area`,
      type,
      label: confirmationTypes[type].label,
      x: manualBounds.x,
      y: manualBounds.y,
      width: manualBounds.width,
      height: manualBounds.height,
      areaScale: 1,
      source: "manual-room-outline",
      areaMm2: areaMm2(manualBounds),
    };
  }
  const point = confirmations[type];
  if (!point) return null;
  const matchedRoom = matchedRoomForConfirmation(type, planBounds);
  if (matchedRoom && shouldUseMatchedRoomForType(type, matchedRoom, planBounds)) {
    const areaScale = confirmationAreaScales[type] ?? 1;
    const bounds = expandBoundsAroundCenter(matchedRoom.bounds, areaScale, planBounds);
    return {
      id: `${type}-area`,
      type,
      label: confirmationTypes[type].label,
      roomId: matchedRoom.id,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      areaScale: Number(areaScale.toFixed(2)),
      source: "room-candidate",
    };
  }
  const scale = Math.min(planBounds.width / templateBounds.width, planBounds.height / templateBounds.height);
  const preset = semanticAreaBaseSize[type];
  if (!preset) return null;
  const areaScale = confirmationAreaScales[type] ?? 1;
  const width = Math.max(80, preset.width * scale * areaScale);
  const height = Math.max(70, preset.height * scale * areaScale);
  return {
    id: `${type}-area`,
    type,
    label: confirmationTypes[type].label,
    x: Math.round(clamp(point.x - width / 2, planBounds.x, planBounds.x + planBounds.width - width)),
    y: Math.round(clamp(point.y - height / 2, planBounds.y, planBounds.y + planBounds.height - height)),
    width: Math.round(width),
    height: Math.round(height),
    areaScale: Number(areaScale.toFixed(2)),
    source: "point-radius",
  };
}

function confirmationAreas(planBounds) {
  return ["kitchen", "bath", "living", "bedroom", "balcony"].map((type) => confirmationArea(type, planBounds)).filter(Boolean);
}

function shouldUseMatchedRoomForType(type, room, planBounds) {
  if (!["kitchen", "bath", "living", "bedroom", "balcony"].includes(type)) return false;
  const areaRatio = (room.bounds.width * room.bounds.height) / Math.max(1, planBounds.width * planBounds.height);
  if (type === "living") return areaRatio >= 0.12;
  if (type === "bedroom") return areaRatio <= 0.32;
  if (type === "kitchen") return areaRatio <= 0.18;
  if (type === "bath") return areaRatio <= 0.12;
  if (type === "balcony") return areaRatio <= 0.16;
  return true;
}

function expandBoundsAroundCenter(bounds, scale, limitBounds) {
  const width = Math.min(limitBounds.width, Math.max(24, bounds.width * scale));
  const height = Math.min(limitBounds.height, Math.max(24, bounds.height * scale));
  const center = centerOfBounds(bounds);
  return {
    x: Math.round(clamp(center.x - width / 2, limitBounds.x, limitBounds.x + limitBounds.width - width)),
    y: Math.round(clamp(center.y - height / 2, limitBounds.y, limitBounds.y + limitBounds.height - height)),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function constrainFurnitureToConfirmationArea(item, planBounds) {
  if (!item.lockedType) return constrainFurnitureToBounds(item, planBounds);
  const area = confirmationArea(item.lockedType, planBounds);
  return constrainFurnitureToBounds(item, area ?? planBounds);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function centerOfBounds(bounds) {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function pointInBounds(point, bounds) {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

function nearestRoomForPoint(layoutRooms, point) {
  const containing = layoutRooms.find((room) => pointInBounds(point, room.bounds));
  if (containing) return containing;
  return layoutRooms
    .map((room) => {
      const center = centerOfBounds(room.bounds);
      const distance = Math.hypot(center.x - point.x, center.y - point.y);
      return { room, distance };
    })
    .sort((a, b) => a.distance - b.distance)[0]?.room;
}

function confirmationEntries() {
  return Object.entries(confirmations)
    .filter(([, point]) => point)
    .map(([type, point]) => ({ type, point, config: confirmationTypes[type] }));
}

function serializeConfirmations() {
  return confirmationEntries().map(({ type, point, config }) => ({
    type,
    label: config.label,
    x: Math.round(point.x),
    y: Math.round(point.y),
    areaScale: confirmationAreaScales[type] ?? null,
    roomId: point.roomId ?? null,
  }));
}

function roomCandidates(planBounds = currentPlanBounds()) {
  return createRoomsForPlan(planBounds);
}

function matchedRoomForConfirmation(type, planBounds = currentPlanBounds()) {
  const point = confirmations[type];
  if (!point) return null;
  const candidates = roomCandidates(planBounds);
  return candidates.find((room) => room.id === point.roomId) ?? nearestRoomForPoint(candidates, point);
}

function applyConfirmationsToRooms(layoutRooms) {
  const nextRooms = layoutRooms.map((room) => ({ ...room, confirmed: false }));
  confirmationEntries()
    .filter(({ type }) => !["entrance", "planMin", "planMax"].includes(type))
    .forEach(({ type, point, config }) => {
      const room = nextRooms.find((candidate) => candidate.id === point.roomId) ?? nearestRoomForPoint(nextRooms, point);
      if (!room) return;
      room.type = config.roomType ?? type;
      room.name = config.label;
      room.confirmed = true;
      room.confirmedBy = type;
      room.reason = `用户确认该区域为${config.label}，生成方案时按${config.label}规则约束家具。`;
    });
  return nextRooms;
}

function makeNoPlaceZones(planBounds) {
  const zones = [];
  const entrance = confirmations.entrance;
  if (entrance) {
    const scale = Math.min(planBounds.width / templateBounds.width, planBounds.height / templateBounds.height);
    const width = Math.max(70, 150 * scale);
    const height = Math.max(56, 120 * scale);
    zones.push({
      id: "entrance-clearance",
      label: "入户门禁放区",
      x: Math.round(clamp(entrance.x - width / 2, planBounds.x, planBounds.x + planBounds.width - width)),
      y: Math.round(clamp(entrance.y - height / 2, planBounds.y, planBounds.y + planBounds.height - height)),
      width: Math.round(width),
      height: Math.round(height),
    });
  }
  return zones;
}

function applyLayoutConstraints(furniture, planBounds, layoutRooms, noPlaceZones) {
  return furniture
    .map((item) => avoidNoPlaceZones(item, planBounds, noPlaceZones))
    .filter((item) => item && isFurnitureAllowedByConfirmedRoom(item, layoutRooms))
    .map((item) => constrainFurnitureToBounds(item, planBounds));
}

function avoidNoPlaceZones(item, planBounds, noPlaceZones) {
  if (!noPlaceZones.some((zone) => overlaps(item, zone))) return item;
  const step = Math.max(item.width, item.height, 42);
  const candidates = [
    { ...item, y: item.y + step },
    { ...item, x: item.x + step },
    { ...item, x: item.x - step },
    { ...item, y: item.y - step },
    { ...item, x: item.x + step, y: item.y + step },
  ].map((candidate) => constrainFurnitureToBounds(candidate, planBounds));
  return candidates.find((candidate) => !noPlaceZones.some((zone) => overlaps(candidate, zone))) ?? null;
}

function isFurnitureAllowedByConfirmedRoom(item, layoutRooms) {
  if (item.lockedType) return isFurnitureAllowedForType(item, item.lockedType);
  const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  const room = nearestRoomForPoint(layoutRooms, center);
  if (!room?.confirmed) return true;
  return isFurnitureAllowedForType(item, room.type);
}

function isFurnitureAllowedForType(item, type) {
  const text = `${item.id} ${item.label}`;
  if (type === "bath") return /淋浴|台盆|马桶|洗衣|shower|vanity|toilet/i.test(text);
  if (type === "kitchen") return /橱柜|备餐|厨房|冰箱|灶|水槽|cabinet|island/i.test(text);
  if (type === "balcony") return /洗衣|晾|花|柜|阳台|cabinet/i.test(text);
  if (type === "living") return /沙发|茶几|餐桌|电视|玄关|边柜|桌|玩具|sofa|table|tv/i.test(text);
  if (type === "bedroom") return /床|衣柜|书桌|床头|梳妆|矮柜|玩具|学习|储物|bed|wardrobe|desk|cabinet/i.test(text);
  return true;
}

function clearanceBox(item) {
  const scale = item.scale ?? 1;
  const pad = (item.label.includes("床") ? 22 : item.label.includes("餐桌") ? 28 : 16) * scale;
  return {
    x: item.x - pad,
    y: item.y - pad,
    width: item.width + pad * 2,
    height: item.height + pad * 2,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function evaluateRisks(furniture) {
  const risks = [];
  const clearances = furniture.map((item) => ({ item, box: clearanceBox(item) }));
  for (let i = 0; i < clearances.length; i += 1) {
    for (let j = i + 1; j < clearances.length; j += 1) {
      if (clearances[i].item.roomId !== clearances[j].item.roomId) continue;
      if (isCompatibleFurniturePair(clearances[i].item, clearances[j].item)) continue;
      if (!overlaps(clearances[i].box, clearances[j].box)) continue;
      risks.push({
        id: `${clearances[i].item.id}-${clearances[j].item.id}`,
        roomId: clearances[i].item.roomId,
        message: `${clearances[i].item.label} 与 ${clearances[j].item.label} 通行距离偏紧`,
        box: mergeBoxes(clearances[i].box, clearances[j].box),
      });
    }
  }
  return risks;
}

function isCompatibleFurniturePair(a, b) {
  const labels = [a.label, b.label].join("|");
  return [
    /沙发.*茶几|茶几.*沙发/,
    /床.*床头柜|床头柜.*床/,
    /床.*衣柜|衣柜.*床/,
    /床.*书桌|书桌.*床/,
    /衣柜.*书桌|书桌.*衣柜/,
    /双人床.*梳妆台|梳妆台.*双人床/,
    /橱柜.*橱柜/,
    /橱柜.*备餐台|备餐台.*橱柜/,
    /淋浴.*台盆|台盆.*淋浴/,
    /台盆.*马桶|马桶.*台盆/,
  ].some((pattern) => pattern.test(labels));
}

function mergeBoxes(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: maxX - x, height: maxY - y };
}

function drawBasePlan(layoutRooms = rooms) {
  svg.replaceChildren();
  svg.appendChild(el("rect", { x: 0, y: 0, width: 1000, height: 1040, fill: canvasBackgroundFill() }));
  updateSourcePlanPreview();

  const roomGroup = el("g", { id: "rooms" });
  layoutRooms.forEach((room) => {
    roomGroup.appendChild(el("polygon", { points: room.polygon, class: "room-fill" }));
    addText(roomGroup, room.name, room.bounds.x + room.bounds.width / 2, room.bounds.y + room.bounds.height / 2, "room-label");
  });
  svg.appendChild(roomGroup);

  if (uploadedSourcePlan) {
    const bounds = currentPlanBounds();
    svg.appendChild(el("rect", { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, class: "detected-plan-bounds" }));
    if (showStructuralWallInput?.checked) {
      drawStructuralWallModel();
    } else {
      drawSpaceRegions();
      drawHoughWallGeometry();
    }
    drawAiRecognitionOverlay();
    drawRoomOutlines();
    drawScaleCalibration();
    return;
  }

  const wallGroup = el("g", { id: "walls" });
  wallPaths.forEach((path) => wallGroup.appendChild(el("path", { d: path, class: "wall" })));
  svg.appendChild(wallGroup);

  const openingGroup = el("g", { id: "openings" });
  openings.forEach((opening) => {
    openingGroup.appendChild(el("line", { x1: opening.x1, y1: opening.y1, x2: opening.x2, y2: opening.y2, class: "opening" }));
    if (opening.y1 === opening.y2) {
      openingGroup.appendChild(el("line", { x1: opening.x1, y1: opening.y1 - 8, x2: opening.x2, y2: opening.y2 - 8, class: "opening" }));
      openingGroup.appendChild(el("line", { x1: opening.x1, y1: opening.y1 + 8, x2: opening.x2, y2: opening.y2 + 8, class: "opening" }));
    }
  });
  openingGroup.appendChild(el("path", { d: "M565 376 A62 62 0 0 0 535 440", class: "door-swing" }));
  openingGroup.appendChild(el("path", { d: "M815 382 A58 58 0 0 1 870 440", class: "door-swing" }));
  svg.appendChild(openingGroup);
}

function drawEmptyCanvas(message = "请先上传原平面图") {
  svg.replaceChildren();
  updateSourcePlanPreview();
  svg.appendChild(el("rect", { x: 0, y: 0, width: 1000, height: 1040, fill: canvasBackgroundFill() }));
  const text = el("text", {
    x: 500,
    y: 520,
    fill: "#657174",
    "font-size": 28,
    "font-weight": 700,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
  });
  text.textContent = message;
  svg.appendChild(text);
}

function drawSourceOnlyCanvas() {
  svg.replaceChildren();
  updateSourcePlanPreview();
  svg.appendChild(el("rect", { x: 0, y: 0, width: 1000, height: 1040, fill: canvasBackgroundFill() }));
  if (uploadedSourcePlan) {
    const bounds = currentPlanBounds();
    svg.appendChild(el("rect", { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, class: "detected-plan-bounds" }));
    if (showStructuralWallInput?.checked) {
      drawStructuralWallModel();
    } else {
      drawSpaceRegions();
      drawHoughWallGeometry();
    }
    drawAiRecognitionOverlay();
    if (!showStructuralWallInput?.checked) drawRoomCandidates();
    drawConfirmationAreas();
    drawRoomOutlines();
    drawScaleCalibration();
    drawNoPlaceZones();
    drawConfirmationMarkers();
  }
  if (!uploadedSourcePlan || !showSourcePlanInput.checked) {
    drawEmptyCanvas(uploadedSourcePlan ? "原平面图已隐藏" : "请先上传原平面图");
  }
}

function canvasBackgroundFill() {
  return uploadedSourcePlan && showSourcePlanInput.checked ? "transparent" : "#fbfdfc";
}

function updateSourcePlanPreview() {
  if (!sourcePlanPreview) return;
  const visible = Boolean(uploadedSourcePlan && showSourcePlanInput.checked);
  sourcePlanPreview.hidden = !visible;
  sourcePlanPreview.style.opacity = String(Number(sourceOpacityInput.value || 0) / 100);
  if (visible) {
    sourcePlanPreview.src = showBinaryPlanInput?.checked && uploadedSourcePlan.binaryDataUrl ? uploadedSourcePlan.binaryDataUrl : uploadedSourcePlan.dataUrl;
  } else {
    sourcePlanPreview.removeAttribute("src");
  }
}

function sourceImageDisplayBox(width, height) {
  if (!width || !height) return { ...canvasBounds };
  const imageRatio = width / height;
  const canvasRatio = canvasBounds.width / canvasBounds.height;
  if (imageRatio >= canvasRatio) {
    const displayWidth = canvasBounds.width;
    const displayHeight = displayWidth / imageRatio;
    return {
      x: 0,
      y: (canvasBounds.height - displayHeight) / 2,
      width: displayWidth,
      height: displayHeight,
    };
  }
  const displayHeight = canvasBounds.height;
  const displayWidth = displayHeight * imageRatio;
  return {
    x: (canvasBounds.width - displayWidth) / 2,
    y: 0,
    width: displayWidth,
    height: displayHeight,
  };
}

function imageBoundsToSvg(bounds, imageWidth, imageHeight) {
  const display = sourceImageDisplayBox(imageWidth, imageHeight);
  return {
    x: display.x + (bounds.x / imageWidth) * display.width,
    y: display.y + (bounds.y / imageHeight) * display.height,
    width: (bounds.width / imageWidth) * display.width,
    height: (bounds.height / imageHeight) * display.height,
  };
}

function imagePointToSvg(point, imageWidth, imageHeight) {
  const display = sourceImageDisplayBox(imageWidth, imageHeight);
  return {
    x: display.x + (point.x / imageWidth) * display.width,
    y: display.y + (point.y / imageHeight) * display.height,
  };
}

function rectanglePolygon(bounds) {
  return `${bounds.x},${bounds.y} ${bounds.x + bounds.width},${bounds.y} ${bounds.x + bounds.width},${bounds.y + bounds.height} ${bounds.x},${bounds.y + bounds.height}`;
}

function normalizeSvgBounds(bounds) {
  const x = clamp(Number(bounds?.x ?? 0), canvasBounds.x, canvasBounds.x + canvasBounds.width);
  const y = clamp(Number(bounds?.y ?? 0), canvasBounds.y, canvasBounds.y + canvasBounds.height);
  const width = clamp(Number(bounds?.width ?? 0), 1, canvasBounds.x + canvasBounds.width - x);
  const height = clamp(Number(bounds?.height ?? 0), 1, canvasBounds.y + canvasBounds.height - y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function normalizeSvgLine(line) {
  return {
    x1: Math.round(clamp(Number(line?.x1 ?? 0), canvasBounds.x, canvasBounds.x + canvasBounds.width)),
    y1: Math.round(clamp(Number(line?.y1 ?? 0), canvasBounds.y, canvasBounds.y + canvasBounds.height)),
    x2: Math.round(clamp(Number(line?.x2 ?? 0), canvasBounds.x, canvasBounds.x + canvasBounds.width)),
    y2: Math.round(clamp(Number(line?.y2 ?? 0), canvasBounds.y, canvasBounds.y + canvasBounds.height)),
  };
}

function aiBoundsToSvg(bounds, coordinateSystem) {
  if (coordinateSystem !== "image-pixels" || !uploadedSourcePlan) return normalizeSvgBounds(bounds);
  return normalizeSvgBounds(imageBoundsToSvg(bounds, uploadedSourcePlan.width, uploadedSourcePlan.height));
}

function aiLineToSvg(line, coordinateSystem) {
  if (coordinateSystem !== "image-pixels" || !uploadedSourcePlan) return normalizeSvgLine(line);
  const start = imagePointToSvg({ x: line.x1, y: line.y1 }, uploadedSourcePlan.width, uploadedSourcePlan.height);
  const end = imagePointToSvg({ x: line.x2, y: line.y2 }, uploadedSourcePlan.width, uploadedSourcePlan.height);
  return normalizeSvgLine({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
}

function normalizeAiRecognitionResult(raw, provider, mode = "remote") {
  const coordinateSystem = raw?.coordinateSystem ?? "svg-1000x1040";
  const normalizedRooms = (raw?.rooms ?? []).map((room, index) => {
    const bounds = aiBoundsToSvg(room.bounds, coordinateSystem);
    return {
      id: room.id ?? `${provider}-room-${index + 1}`,
      type: room.type ?? "unknown",
      label: room.label ?? room.name ?? room.type ?? `空间${index + 1}`,
      bounds,
      polygon: room.polygon ?? rectanglePolygon(bounds),
      confidence: Number(clamp(room.confidence ?? 0.62, 0, 1).toFixed(2)),
      source: room.source ?? provider,
    };
  });
  return {
    schemaVersion: "floorplan-ai-v1",
    provider,
    model: raw?.model ?? provider,
    mode: raw?.mode ?? mode,
    transport: mode,
    status: raw?.status ?? "ok",
    coordinateSystem: "svg-1000x1040",
    generatedAt: new Date().toISOString(),
    confidence: {
      overall: Number(clamp(raw?.confidence?.overall ?? 0.62, 0, 1).toFixed(2)),
      rooms: Number(clamp(raw?.confidence?.rooms ?? 0.64, 0, 1).toFixed(2)),
      walls: Number(clamp(raw?.confidence?.walls ?? 0.58, 0, 1).toFixed(2)),
      openings: Number(clamp(raw?.confidence?.openings ?? 0.42, 0, 1).toFixed(2)),
    },
    rooms: normalizedRooms,
    walls: (raw?.walls ?? []).map((wall, index) => ({
      id: wall.id ?? `${provider}-wall-${index + 1}`,
      line: aiLineToSvg(wall.line ?? wall, coordinateSystem),
      thickness: Math.round(clamp(wall.thickness ?? 120, 60, 320)),
      confidence: Number(clamp(wall.confidence ?? 0.6, 0, 1).toFixed(2)),
      source: wall.source ?? provider,
    })),
    doors: (raw?.doors ?? []).map((door, index) => ({
      id: door.id ?? `${provider}-door-${index + 1}`,
      line: aiLineToSvg(door.line ?? door, coordinateSystem),
      swing: door.swing ?? null,
      confidence: Number(clamp(door.confidence ?? 0.5, 0, 1).toFixed(2)),
      source: door.source ?? provider,
    })),
    windows: (raw?.windows ?? []).map((windowItem, index) => ({
      id: windowItem.id ?? `${provider}-window-${index + 1}`,
      line: aiLineToSvg(windowItem.line ?? windowItem, coordinateSystem),
      confidence: Number(clamp(windowItem.confidence ?? 0.48, 0, 1).toFixed(2)),
      source: windowItem.source ?? provider,
    })),
    fixtures: (raw?.fixtures ?? []).map((fixture, index) => {
      const bounds = aiBoundsToSvg(fixture.bounds, coordinateSystem);
      return {
        id: fixture.id ?? `${provider}-fixture-${index + 1}`,
        type: fixture.type ?? "fixture",
        label: fixture.label ?? fixture.type ?? "构件",
        bounds,
        confidence: Number(clamp(fixture.confidence ?? 0.45, 0, 1).toFixed(2)),
        source: fixture.source ?? provider,
      };
    }),
    postprocess: {
      inputCoordinateSystem: coordinateSystem,
      normalizedTo: "svg-1000x1040",
      fallbackFromCv: mode === "mock",
    },
  };
}

function makeMockAiRecognition(provider = "mock") {
  const planBounds = currentPlanBounds();
  const structuralModel = uploadedSourcePlan?.analysis?.structuralWallModel;
  const outlineRooms = serializeRoomOutlines().map((outline, index) => ({
    id: `manual-${outline.type}-${index + 1}`,
    type: outline.type,
    label: outline.label,
    bounds: outline.bounds,
    confidence: 0.86,
    source: "manual-outline",
  }));
  const structuralRooms = (structuralModel?.roomPolygons ?? []).slice(0, 10).map((room, index) => ({
    id: `structural-${room.id ?? index + 1}`,
    type: room.type ?? "unknown",
    label: room.label ?? `结构房间${index + 1}`,
    bounds: room.bounds,
    polygon: room.polygon,
    confidence: Math.max(0.48, room.confidence ?? 0.5),
    source: "structural-wall-mode",
  }));
  const candidateRooms = roomCandidates(planBounds)
    .slice(0, 8)
    .map((room, index) => ({
      id: `cv-${room.type}-${index + 1}`,
      type: room.type,
      label: confirmationTypes[room.type]?.label ?? room.name ?? room.type,
      bounds: room.bounds,
      confidence: 0.54,
      source: "cv-room-candidate",
    }));
  const sourceRooms = outlineRooms.length ? outlineRooms : structuralRooms.length ? structuralRooms : candidateRooms;
  const structuralWalls = (structuralModel?.centerLines ?? []).slice(0, 42).map((line, index) => ({
      id: `structural-center-wall-${index + 1}`,
      line,
      thickness: 140,
      confidence: Math.max(0.5, line.score ?? 0.55),
      source: "structural-wall-mode",
    }));
  const cvWalls = [
    ...(uploadedSourcePlan?.analysis?.hough?.wallDoubleLines ?? []).slice(0, 28).map((wall, index) => ({
      id: `cv-double-wall-${index + 1}`,
      line: wall.centerLine ?? wall.lineA,
      thickness: Math.round(wall.gapSvgPx ?? 120),
      confidence: 0.62,
      source: "cv-double-line-wall",
    })),
    ...(uploadedSourcePlan?.analysis?.hough?.singleLineWalls ?? []).slice(0, 12).map((wall, index) => ({
      id: `cv-single-wall-${index + 1}`,
      line: wall.centerLine,
      thickness: Math.round(wall.inferredWallThicknessSvgPx ?? 120),
      confidence: 0.5,
      source: "cv-single-line-wall",
    })),
  ];
  const walls = structuralWalls.length ? structuralWalls : cvWalls;
  const entrance = confirmations.entrance;
  const doors = entrance
    ? [
        {
          id: "manual-entrance-door",
          line: { x1: entrance.x - 28, y1: entrance.y, x2: entrance.x + 28, y2: entrance.y },
          confidence: 0.9,
          source: "manual-confirmation",
        },
      ]
    : [];
  const windows = openings.slice(0, 6).map((opening, index) => {
    const start = transformPoint(opening.x1, opening.y1, planBounds);
    const end = transformPoint(opening.x2, opening.y2, planBounds);
    return {
      id: `template-window-${index + 1}`,
      line: { x1: start.x, y1: start.y, x2: end.x, y2: end.y },
      confidence: 0.38,
      source: "template-window-prior",
    };
  });
  const fixtures = Object.entries(confirmations)
    .filter(([type]) => ["kitchen", "bath", "balcony"].includes(type))
    .map(([type, point], index) => {
      const size = type === "bath" ? 64 : 84;
      return {
        id: `manual-fixture-zone-${index + 1}`,
        type,
        label: confirmationTypes[type]?.label ?? type,
        bounds: { x: point.x - size / 2, y: point.y - size / 2, width: size, height: size },
        confidence: 0.72,
        source: "manual-confirmation",
      };
    });
  return normalizeAiRecognitionResult(
    {
      model: `${provider}-floorplan-semantic-mock`,
      confidence: { overall: outlineRooms.length ? 0.72 : 0.58, rooms: outlineRooms.length ? 0.82 : 0.58, walls: walls.length ? 0.62 : 0.35, openings: doors.length ? 0.7 : 0.38 },
      rooms: sourceRooms,
      walls,
      doors,
      windows,
      fixtures,
    },
    provider,
    "mock",
  );
}

function recognitionEndpoints() {
  const endpoints = [];
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    endpoints.push("/api/floorplan/recognize");
  }
  endpoints.push("http://127.0.0.1:8000/api/floorplan/recognize");
  endpoints.push("http://127.0.0.1:8787/api/floorplan/recognize");
  endpoints.push("http://127.0.0.1:8796/api/floorplan/recognize");
  return [...new Set(endpoints)];
}

function recognitionEndpoint() {
  return recognitionEndpoints()[0];
}

function annotationToolUrl() {
  return window.location.protocol === "http:" || window.location.protocol === "https:"
    ? "../annotation.html"
    : "http://127.0.0.1:8000/annotation.html";
}

async function requestRemoteAiRecognition(provider) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(recognitionEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        schemaVersion: "floorplan-ai-v1",
        provider,
        image: uploadedSourcePlan.dataUrl,
        imageMeta: {
          name: uploadedSourcePlan.name,
          width: uploadedSourcePlan.width,
          height: uploadedSourcePlan.height,
        },
        hints: {
          confirmations: serializeConfirmations(),
          roomOutlines: serializeRoomOutlines(),
          scaleCalibration: serializeScaleCalibration(),
          cvAnalysis: {
            planBoundsSvg: uploadedSourcePlan.analysis?.planBoundsSvg,
            hough: uploadedSourcePlan.analysis?.hough?.parameters,
            spaceRegions: uploadedSourcePlan.analysis?.spaceRegions?.parameters,
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`AI服务返回 ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestRemoteAiRecognitionWithFallback(provider) {
  const payload = {
    schemaVersion: "floorplan-ai-v1",
    provider,
    image: uploadedSourcePlan.dataUrl,
    imageMeta: {
      name: uploadedSourcePlan.name,
      width: uploadedSourcePlan.width,
      height: uploadedSourcePlan.height,
    },
    hints: {
      confirmations: serializeConfirmations(),
      roomOutlines: serializeRoomOutlines(),
      scaleCalibration: serializeScaleCalibration(),
      cvAnalysis: {
        planBoundsSvg: uploadedSourcePlan.analysis?.planBoundsSvg,
        hough: uploadedSourcePlan.analysis?.hough?.parameters,
        spaceRegions: uploadedSourcePlan.analysis?.spaceRegions?.parameters,
      },
    },
  };
  let lastError = null;
  for (const endpoint of recognitionEndpoints()) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const result = await response.json();
      result.endpoint = endpoint;
      return result;
    } catch (error) {
      lastError = error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
  throw lastError ?? new Error("AI recognition service unavailable");
}

function setAiRecognitionBusy(isBusy) {
  aiRecognitionBusy = isBusy;
  if (runAiRecognitionButton) runAiRecognitionButton.disabled = isBusy || !uploadedSourcePlan;
}

function updateAiRecognitionStatus(message = "") {
  if (!aiRecognitionStatus) return;
  if (message) {
    aiRecognitionStatus.textContent = message;
    return;
  }
  if (!uploadedSourcePlan) {
    aiRecognitionStatus.textContent = "上传图纸后，可先跑通标准AI识别输出。";
    if (runAiRecognitionButton) runAiRecognitionButton.disabled = true;
    return;
  }
  if (!aiRecognitionResult) {
    aiRecognitionStatus.textContent = "已就绪：可运行 Mock、DeepFloorplan、U-Net 或 CubiCasa5K 兼容通路。";
    if (runAiRecognitionButton) runAiRecognitionButton.disabled = false;
    return;
  }
  const modeLabel =
    aiRecognitionResult.mode === "mock"
      ? "Mock/兜底"
      : aiRecognitionResult.status === "fallback" || /fallback/i.test(aiRecognitionResult.mode)
        ? "远程服务/Fallback"
        : "远程模型";
  aiRecognitionStatus.textContent = `${aiRecognitionResult.provider} · ${modeLabel} · 房间 ${aiRecognitionResult.rooms.length} / 墙线 ${aiRecognitionResult.walls.length} / 门 ${aiRecognitionResult.doors.length} / 窗 ${aiRecognitionResult.windows.length} · 置信度 ${Math.round(aiRecognitionResult.confidence.overall * 100)}%`;
  if (runAiRecognitionButton) runAiRecognitionButton.disabled = false;
}

function serializeAiRecognition() {
  return aiRecognitionResult
    ? {
        schemaVersion: aiRecognitionResult.schemaVersion,
        provider: aiRecognitionResult.provider,
        model: aiRecognitionResult.model,
        mode: aiRecognitionResult.mode,
        status: aiRecognitionResult.status,
        coordinateSystem: aiRecognitionResult.coordinateSystem,
        confidence: aiRecognitionResult.confidence,
        rooms: aiRecognitionResult.rooms,
        walls: aiRecognitionResult.walls,
        doors: aiRecognitionResult.doors,
        windows: aiRecognitionResult.windows,
        fixtures: aiRecognitionResult.fixtures,
        postprocess: aiRecognitionResult.postprocess,
      }
    : null;
}

async function runAiRecognition() {
  if (!uploadedSourcePlan) {
    updateAiRecognitionStatus("请先上传原平面图，再运行AI识别。");
    return;
  }
  const provider = aiModelProviderInput?.value ?? "mock";
  setAiRecognitionBusy(true);
  updateAiRecognitionStatus(`${provider} 识别中：正在生成 floorplan-ai-v1 标准输出...`);
  try {
    let result;
    if (provider === "mock") {
      result = makeMockAiRecognition(provider);
    } else {
      try {
        const raw = await requestRemoteAiRecognitionWithFallback(provider);
        result = normalizeAiRecognitionResult(raw, provider, "remote");
      } catch (error) {
        result = makeMockAiRecognition(provider);
        result.status = "fallback";
        result.error = error.message;
        updateAiRecognitionStatus(`${provider} 本地服务不可用，已临时使用Mock标准输出。`);
      }
    }
    aiRecognitionResult = result;
    uploadedSourcePlan.aiRecognition = result;
    if (uploadedSourcePlan.analysis) uploadedSourcePlan.analysis.aiRecognition = result;
    setAiRecognitionBusy(false);
    updateAiRecognitionStatus();
    if (latestResult) {
      renderLatestLayout();
    } else {
      drawSourceOnlyCanvas();
      resetResultPanel("AI识别结果已生成，可继续确认或生成布置");
    }
  } catch (error) {
    setAiRecognitionBusy(false);
    updateAiRecognitionStatus(`AI识别失败：${error.message}`);
  }
}

function openAnnotationTool() {
  if (!annotationToolOverlay || !annotationToolFrame) return;
  const url = annotationToolUrl();
  const separator = url.includes("?") ? "&" : "?";
  annotationToolFrame.src = `${url}${separator}_=${Date.now()}`;
  annotationToolOverlay.hidden = false;
}

function closeAnnotationTool() {
  if (!annotationToolOverlay) return;
  annotationToolOverlay.hidden = true;
}

function padBounds(bounds, ratio = 0.03) {
  const padX = Math.max(12, bounds.width * ratio);
  const padY = Math.max(12, bounds.height * ratio);
  const x = Math.max(canvasBounds.x, bounds.x - padX);
  const y = Math.max(canvasBounds.y, bounds.y - padY);
  const maxX = Math.min(canvasBounds.x + canvasBounds.width, bounds.x + bounds.width + padX);
  const maxY = Math.min(canvasBounds.y + canvasBounds.height, bounds.y + bounds.height + padY);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(maxX - x),
    height: Math.round(maxY - y),
  };
}

function analyzeSourcePlanImage(image) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const displayBounds = sourceImageDisplayBox(imageWidth, imageHeight);
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(imageWidth, imageHeight));
  const width = Math.max(1, Math.round(imageWidth * scale));
  const height = Math.max(1, Math.round(imageHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const denoise = { method: "edge-aware-non-local-means", patchRadius: 1, searchRadius: 2, strength: 18, edgePreserveThreshold: 28 };
  const denoised = applyNonLocalMeansDenoisePixels(pixels, width, height, denoise);
  const frequencyFilter = { method: "projection-periodic-notch", enabled: true, strength: 0.45, periodicityThreshold: 0.16 };
  const frequencyFiltered = applyPeriodicNoiseFilterPixels(denoised.pixels, width, height, frequencyFilter);
  const sharpening = { method: "laplacian-edge-overlay", laplacianAmount: 0.85, contrastGain: 1.06 };
  const sharpenedPixels = applyLaplacianSharpenPixels(frequencyFiltered.pixels, width, height, sharpening.laplacianAmount, sharpening.contrastGain);
  const preprocessing = binarizePlanPixels(sharpenedPixels, width, height);
  const dark = preprocessing.dark;

  const binaryCanvas = document.createElement("canvas");
  binaryCanvas.width = width;
  binaryCanvas.height = height;
  binaryCanvas.getContext("2d").putImageData(preprocessing.imageData, 0, 0);
  const binaryDataUrl = binaryCanvas.toDataURL("image/png");

  return analyzeBinaryPlanMask({
    dark,
    width,
    height,
    imageWidth,
    imageHeight,
    displayBounds,
    scale,
    preprocessing: {
      mode: "laplacian-sharpen-grayscale-otsu-binary",
      denoise: {
        ...denoise,
        edgePixelRatio: denoised.edgePixelRatio,
      },
      frequencyFilter: {
        ...frequencyFilter,
        applied: frequencyFiltered.applied,
        rowPeriodScore: frequencyFiltered.rowPeriodScore,
        columnPeriodScore: frequencyFiltered.columnPeriodScore,
      },
      sharpening,
      threshold: preprocessing.threshold,
      darkPixelRatio: preprocessing.darkPixelRatio,
      analysisScale: Number(scale.toFixed(4)),
      analysisSize: { width, height },
    },
    binaryDataUrl,
  });
}

function binarizePlanPixels(pixels, width, height) {
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    const alpha = pixels[offset + 3];
    const value =
      alpha > 40
        ? Math.round(pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114)
        : 255;
    gray[index] = value;
    histogram[value] += 1;
  }
  const threshold = clamp(otsuThreshold(histogram, gray.length), 96, 220);
  const dark = new Uint8Array(width * height);
  const binary = new ImageData(width, height);
  let darkCount = 0;
  for (let index = 0; index < dark.length; index += 1) {
    const offset = index * 4;
    const isDark = gray[index] <= threshold;
    dark[index] = isDark ? 1 : 0;
    if (isDark) darkCount += 1;
    binary.data[offset] = isDark ? 214 : 255;
    binary.data[offset + 1] = isDark ? 57 : 255;
    binary.data[offset + 2] = isDark ? 45 : 255;
    binary.data[offset + 3] = 255;
  }
  return {
    dark,
    imageData: binary,
    threshold,
    darkPixelRatio: Number((darkCount / Math.max(1, dark.length)).toFixed(4)),
  };
}

function applyNonLocalMeansDenoisePixels(pixels, width, height, options = {}) {
  const patchRadius = options.patchRadius ?? 1;
  const searchRadius = options.searchRadius ?? 2;
  const strength = options.strength ?? 18;
  const edgeThreshold = options.edgePreserveThreshold ?? 28;
  const gray = grayscaleFromPixels(pixels, width, height);
  const output = new Uint8ClampedArray(pixels.length);
  let edgePixels = 0;
  const h2 = Math.max(1, strength * strength * (patchRadius * 2 + 1) ** 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const gradient = localGradient(gray, width, height, x, y);
      const edgeBlend = gradient > edgeThreshold ? 0.18 : 1;
      if (gradient > edgeThreshold) edgePixels += 1;

      let totalWeight = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
        for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const distance = patchDistance(gray, width, height, x, y, nx, ny, patchRadius);
          const weight = Math.exp(-distance / h2);
          const nOffset = (ny * width + nx) * 4;
          totalWeight += weight;
          sumR += pixels[nOffset] * weight;
          sumG += pixels[nOffset + 1] * weight;
          sumB += pixels[nOffset + 2] * weight;
        }
      }

      const denoisedR = sumR / Math.max(1e-6, totalWeight);
      const denoisedG = sumG / Math.max(1e-6, totalWeight);
      const denoisedB = sumB / Math.max(1e-6, totalWeight);
      output[offset] = pixels[offset] * (1 - edgeBlend) + denoisedR * edgeBlend;
      output[offset + 1] = pixels[offset + 1] * (1 - edgeBlend) + denoisedG * edgeBlend;
      output[offset + 2] = pixels[offset + 2] * (1 - edgeBlend) + denoisedB * edgeBlend;
      output[offset + 3] = pixels[offset + 3];
    }
  }

  return {
    pixels: output,
    edgePixelRatio: Number((edgePixels / Math.max(1, width * height)).toFixed(4)),
  };
}

function applyPeriodicNoiseFilterPixels(pixels, width, height, options = {}) {
  const gray = grayscaleFromPixels(pixels, width, height);
  const rowProfile = centeredProjectionProfile(gray, width, height, "row");
  const columnProfile = centeredProjectionProfile(gray, width, height, "column");
  const rowPeriodScore = periodicEnergyScore(rowProfile);
  const columnPeriodScore = periodicEnergyScore(columnProfile);
  const threshold = options.periodicityThreshold ?? 0.16;
  const applied = Boolean(options.enabled && (rowPeriodScore > threshold || columnPeriodScore > threshold));
  if (!applied) {
    return {
      pixels,
      applied: false,
      rowPeriodScore,
      columnPeriodScore,
    };
  }

  const output = new Uint8ClampedArray(pixels.length);
  output.set(pixels);
  const strength = options.strength ?? 0.45;
  const rowCorrection = smoothProfile(rowProfile, 9).map((value, index) => rowProfile[index] - value);
  const columnCorrection = smoothProfile(columnProfile, 9).map((value, index) => columnProfile[index] - value);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const gradient = localGradient(gray, width, height, x, y);
      if (gradient > 24) continue;
      const correction = (rowCorrection[y] * (rowPeriodScore > threshold ? 1 : 0) + columnCorrection[x] * (columnPeriodScore > threshold ? 1 : 0)) * strength;
      output[offset] = clamp(output[offset] - correction, 0, 255);
      output[offset + 1] = clamp(output[offset + 1] - correction, 0, 255);
      output[offset + 2] = clamp(output[offset + 2] - correction, 0, 255);
    }
  }
  return {
    pixels: output,
    applied,
    rowPeriodScore,
    columnPeriodScore,
  };
}

function grayscaleFromPixels(pixels, width, height) {
  const gray = new Uint8Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] =
      pixels[offset + 3] > 40
        ? Math.round(pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114)
        : 255;
  }
  return gray;
}

function localGradient(gray, width, height, x, y) {
  const center = gray[y * width + x];
  const left = gray[y * width + Math.max(0, x - 1)];
  const right = gray[y * width + Math.min(width - 1, x + 1)];
  const top = gray[Math.max(0, y - 1) * width + x];
  const bottom = gray[Math.min(height - 1, y + 1) * width + x];
  return Math.max(Math.abs(center - left), Math.abs(center - right), Math.abs(center - top), Math.abs(center - bottom));
}

function patchDistance(gray, width, height, ax, ay, bx, by, radius) {
  let distance = 0;
  let count = 0;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const x1 = clamp(ax + dx, 0, width - 1);
      const y1 = clamp(ay + dy, 0, height - 1);
      const x2 = clamp(bx + dx, 0, width - 1);
      const y2 = clamp(by + dy, 0, height - 1);
      const diff = gray[y1 * width + x1] - gray[y2 * width + x2];
      distance += diff * diff;
      count += 1;
    }
  }
  return distance / Math.max(1, count);
}

function centeredProjectionProfile(gray, width, height, axis) {
  const length = axis === "row" ? height : width;
  const span = axis === "row" ? width : height;
  const profile = new Array(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (let j = 0; j < span; j += 1) {
      const x = axis === "row" ? j : i;
      const y = axis === "row" ? i : j;
      sum += gray[y * width + x];
    }
    profile[i] = sum / span;
  }
  const mean = profile.reduce((sum, value) => sum + value, 0) / Math.max(1, profile.length);
  return profile.map((value) => value - mean);
}

function periodicEnergyScore(profile) {
  if (profile.length < 16) return 0;
  const smooth = smoothProfile(profile, 17);
  const high = profile.map((value, index) => value - smooth[index]);
  const highEnergy = high.reduce((sum, value) => sum + value * value, 0);
  const totalEnergy = profile.reduce((sum, value) => sum + value * value, 0);
  return Number((highEnergy / Math.max(1, totalEnergy)).toFixed(4));
}

function smoothProfile(profile, radius) {
  return profile.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const next = index + offset;
      if (next < 0 || next >= profile.length) continue;
      sum += profile[next];
      count += 1;
    }
    return sum / Math.max(1, count);
  });
}

function applyLaplacianSharpenPixels(pixels, width, height, amount = 0.85, contrastGain = 1.06) {
  const output = new Uint8ClampedArray(pixels.length);
  output.set(pixels);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const top = index - width * 4;
      const bottom = index + width * 4;
      const left = index - 4;
      const right = index + 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = pixels[index + channel];
        const laplacian = center * 4 - pixels[top + channel] - pixels[bottom + channel] - pixels[left + channel] - pixels[right + channel];
        const sharpened = center + laplacian * amount;
        output[index + channel] = clamp((sharpened - 128) * contrastGain + 128, 0, 255);
      }
      output[index + 3] = pixels[index + 3];
    }
  }
  return output;
}

function otsuThreshold(histogram, total) {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];
  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = -1;
  let threshold = 170;
  for (let i = 0; i < 256; i += 1) {
    weightBackground += histogram[i];
    if (!weightBackground) continue;
    const weightForeground = total - weightBackground;
    if (!weightForeground) break;
    sumBackground += i * histogram[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  return threshold;
}

function analyzeBinaryPlanMask({ dark, width, height, imageWidth, imageHeight, displayBounds, scale, preprocessing, binaryDataUrl }) {
  const visited = new Uint8Array(width * height);
  let best = null;
  const components = [];
  const stack = [];
  for (let start = 0; start < dark.length; start += 1) {
    if (!dark[start] || visited[start]) continue;
    visited[start] = 1;
    stack.length = 0;
    stack.push(start);
    let count = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    while (stack.length) {
      const current = stack.pop();
      const x = current % width;
      const y = Math.floor(current / width);
      count += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const next of neighbors) {
        if (next < 0 || next >= dark.length || visited[next] || !dark[next]) continue;
        if ((next === current - 1 && x === 0) || (next === current + 1 && x === width - 1)) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    const component = { count, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
    const largeEnough = component.width > width * 0.08 && component.height > height * 0.08;
    if (largeEnough && (!best || component.count > best.count)) best = component;
    if (isPlanLineComponent(component, width, height)) components.push(component);
  }

  const mergedComponent = mergePlanLineComponents(components, width, height);

  if (!mergedComponent && !best) {
    const hough = detectHoughWallGeometry(dark, width, height, scale, imageWidth, imageHeight, null);
    const spaceRegions = growSpaceRegions(dark, width, height, scale, imageWidth, imageHeight, null);
    const fallbackBounds = padBounds(displayBounds, 0);
    const structuralWallModel = buildStructuralWallModel(hough, spaceRegions, fallbackBounds);
    return {
      mode: "full-image-fallback",
      imageBounds: { x: 0, y: 0, width: imageWidth, height: imageHeight },
      displayBounds,
      planBoundsSvg: fallbackBounds,
      preprocessing,
      hough,
      spaceRegions,
      structuralWallModel,
      binaryDataUrl,
    };
  }

  const sourceComponent = mergedComponent ?? best;
  const hough = detectHoughWallGeometry(dark, width, height, scale, imageWidth, imageHeight, sourceComponent);
  const spaceRegions = growSpaceRegions(dark, width, height, scale, imageWidth, imageHeight, sourceComponent);
  const imageBounds = {
    x: sourceComponent.minX / scale,
    y: sourceComponent.minY / scale,
    width: sourceComponent.width / scale,
    height: sourceComponent.height / scale,
  };
  const planBoundsSvg = padBounds(imageBoundsToSvg(imageBounds, imageWidth, imageHeight));
  const structuralWallModel = buildStructuralWallModel(hough, spaceRegions, planBoundsSvg);
  return {
    mode: mergedComponent ? "merged-plan-line-components" : "largest-dark-line-component",
    imageBounds: {
      x: Math.round(imageBounds.x),
      y: Math.round(imageBounds.y),
      width: Math.round(imageBounds.width),
      height: Math.round(imageBounds.height),
    },
    displayBounds: {
      x: Math.round(displayBounds.x),
      y: Math.round(displayBounds.y),
      width: Math.round(displayBounds.width),
      height: Math.round(displayBounds.height),
    },
    planBoundsSvg,
    darkPixelCount: sourceComponent.count,
    componentCount: components.length,
    preprocessing,
    hough,
    spaceRegions,
    structuralWallModel,
    binaryDataUrl,
  };
}

function detectHoughWallGeometry(dark, width, height, scale, imageWidth, imageHeight, region = null) {
  const searchRegion = region
    ? {
        minX: Math.max(0, Math.floor(region.minX - 8)),
        minY: Math.max(0, Math.floor(region.minY - 8)),
        maxX: Math.min(width - 1, Math.ceil(region.maxX + 8)),
        maxY: Math.min(height - 1, Math.ceil(region.maxY + 8)),
      }
    : { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  const edgePoints = collectBinaryEdgePoints(dark, width, height, searchRegion);
  const houghPeaks = houghLinePeaks(edgePoints, width, height);
  const rawSegments = [];
  houghPeaks.forEach((peak) => {
    rawSegments.push(...segmentsForHoughPeak(edgePoints, peak, width, height));
  });
  const houghMergedSegments = mergeNearbyLineSegments(rawSegments).slice(0, 220);
  const contourSupplementSegments = extractRegionContourWallSegments(dark, width, height, searchRegion, houghMergedSegments).slice(0, 160);
  const combinedWallCandidates = [...houghMergedSegments, ...contourSupplementSegments];
  const orthogonalWallSegments = snapOrthogonalWallSegments(combinedWallCandidates, 11);
  const mergedSegments = mergeNearbyLineSegments(orthogonalWallSegments).slice(0, 240);
  const wallPairs = detectDoubleLineWalls(mergedSegments).slice(0, 120);
  const singleLineWalls = inferSingleLineWalls(mergedSegments, wallPairs, dark, width, height).slice(0, 120);
  return {
    parameters: {
      method: "sensitive-hough-contour-supplement-wall-detection",
      thetaStepDeg: 1,
      rhoStepPx: 2,
      houghVoteThresholdRatio: 0.006,
      edgePointCount: edgePoints.length,
      peakCount: houghPeaks.length,
      rawSegmentCount: rawSegments.length,
      houghMergedSegmentCount: houghMergedSegments.length,
      contourSupplementSegmentCount: contourSupplementSegments.length,
      orthogonalWallSegmentCount: orthogonalWallSegments.length,
      discardedNonOrthogonalSegmentCount: combinedWallCandidates.length - orthogonalWallSegments.length,
      mergedSegmentCount: mergedSegments.length,
      wallDoubleLineCount: wallPairs.length,
      singleLineWallCount: singleLineWalls.length,
      analysisRegion: searchRegion,
    },
    rawLineSegments: rawSegments.slice(0, 120).map((segment, index) => serializeAnalysisSegment(segment, index, scale, imageWidth, imageHeight)),
    houghMergedLineSegments: houghMergedSegments.map((segment, index) => serializeAnalysisSegment(segment, index, scale, imageWidth, imageHeight)),
    contourSupplementSegments: contourSupplementSegments.map((segment, index) => serializeAnalysisSegment(segment, index, scale, imageWidth, imageHeight)),
    mergedLineSegments: mergedSegments.map((segment, index) => serializeAnalysisSegment(segment, index, scale, imageWidth, imageHeight)),
    wallDoubleLines: wallPairs.map((wall, index) => serializeWallDoubleLine(wall, index, scale, imageWidth, imageHeight)),
    singleLineWalls: singleLineWalls.map((wall, index) => serializeSingleLineWall(wall, index, scale, imageWidth, imageHeight)),
  };
}

function growSpaceRegions(dark, width, height, scale, imageWidth, imageHeight, region = null) {
  const searchRegion = region
    ? {
        minX: Math.max(0, Math.floor(region.minX + 2)),
        minY: Math.max(0, Math.floor(region.minY + 2)),
        maxX: Math.min(width - 1, Math.ceil(region.maxX - 2)),
        maxY: Math.min(height - 1, Math.ceil(region.maxY - 2)),
      }
    : { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  const barrier = dilateBinaryMask(dark, width, height, 2);
  const labels = new Int32Array(width * height);
  const rawRegions = [];
  const stack = [];
  let label = 0;
  const regionArea = Math.max(1, (searchRegion.maxX - searchRegion.minX + 1) * (searchRegion.maxY - searchRegion.minY + 1));
  const minArea = Math.max(120, Math.round(regionArea * 0.0045));

  for (let y = searchRegion.minY; y <= searchRegion.maxY; y += 1) {
    for (let x = searchRegion.minX; x <= searchRegion.maxX; x += 1) {
      const start = y * width + x;
      if (barrier[start] || labels[start]) continue;
      label += 1;
      labels[start] = label;
      stack.length = 0;
      stack.push(start);
      let count = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;
      let touchesEdge = false;

      while (stack.length) {
        const current = stack.pop();
        const cx = current % width;
        const cy = Math.floor(current / width);
        count += 1;
        sumX += cx;
        sumY += cy;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
        if (cx === searchRegion.minX || cx === searchRegion.maxX || cy === searchRegion.minY || cy === searchRegion.maxY) {
          touchesEdge = true;
        }

        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const next of neighbors) {
          if (next < 0 || next >= labels.length || labels[next] || barrier[next]) continue;
          const nx = next % width;
          const ny = Math.floor(next / width);
          if (nx < searchRegion.minX || nx > searchRegion.maxX || ny < searchRegion.minY || ny > searchRegion.maxY) continue;
          if ((next === current - 1 && cx === 0) || (next === current + 1 && cx === width - 1)) continue;
          labels[next] = label;
          stack.push(next);
        }
      }

      rawRegions.push({
        label,
        count,
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        centroid: { x: sumX / Math.max(1, count), y: sumY / Math.max(1, count) },
        touchesEdge,
      });
    }
  }

  const keptRaw = rawRegions
    .filter((item) => {
      const usefulSize = item.width >= 14 && item.height >= 14;
      const usefulArea = item.count >= minArea;
      const notThinGap = item.count / Math.max(1, item.width * item.height) > 0.18;
      const notDominantOutside = !(item.touchesEdge && item.count > regionArea * 0.42);
      return usefulSize && usefulArea && notThinGap && notDominantOutside;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 32);

  const labelToRegionId = new Map();
  keptRaw.forEach((item, index) => {
    labelToRegionId.set(item.label, `space-${index + 1}`);
  });

  const adjacencyCounts = detectSpaceAdjacency(labels, barrier, width, height, searchRegion, labelToRegionId);
  const regions = keptRaw.map((item, index) => {
    const id = `space-${index + 1}`;
    const bounds = analysisBoundsToSvg(item, scale, imageWidth, imageHeight);
    const centroid = imagePointToSvg({ x: item.centroid.x / scale, y: item.centroid.y / scale }, imageWidth, imageHeight);
    const svgAreaScale = svgAreaScaleForImage(imageWidth, imageHeight);
    const adjacent = adjacencyCounts
      .filter((edge) => edge.a === id || edge.b === id)
      .map((edge) => ({
        regionId: edge.a === id ? edge.b : edge.a,
        sharedWallSamples: edge.count,
      }))
      .sort((a, b) => b.sharedWallSamples - a.sharedWallSamples);
    return {
      id,
      label: `空间${index + 1}`,
      bounds,
      centroid: { x: Math.round(centroid.x), y: Math.round(centroid.y) },
      areaAnalysisPx: item.count,
      areaSvgPx2: Math.round(item.count * svgAreaScale),
      touchesAnalysisEdge: item.touchesEdge,
      adjacentRegionIds: adjacent.map((edge) => edge.regionId),
      adjacency: adjacent,
    };
  });

  return {
    parameters: {
      method: "region-growing-on-binary-free-space",
      barrierDilationPx: 2,
      minAreaAnalysisPx: minArea,
      rawRegionCount: rawRegions.length,
      regionCount: regions.length,
      adjacencyCount: adjacencyCounts.length,
      analysisRegion: searchRegion,
    },
    regions,
    adjacency: adjacencyCounts,
  };
}

function buildStructuralWallModel(hough, spaceRegions, planBounds) {
  const rawCandidates = structuralWallCandidates(hough, planBounds);
  const scoredCandidates = rawCandidates.map((segment) => scoreStructuralSegment(segment, rawCandidates, planBounds));
  const trusted = scoredCandidates
    .filter((segment) => segment.score >= 0.54)
    .sort((a, b) => b.score - a.score || b.lengthPx - a.lengthPx);
  const centerLines = mergeStructuralSegments(trusted, planBounds)
    .map((segment, index) => ({
      id: `struct-wall-${index + 1}`,
      axis: segment.axis,
      x1: Math.round(segment.x1),
      y1: Math.round(segment.y1),
      x2: Math.round(segment.x2),
      y2: Math.round(segment.y2),
      lengthPx: Number(segment.lengthPx.toFixed(1)),
      score: Number(segment.score.toFixed(2)),
      source: segment.source,
      reason: segment.reason,
    }))
    .sort((a, b) => b.lengthPx - a.lengthPx)
    .slice(0, 80);
  const preliminaryRooms = structuralRoomPolygons(spaceRegions, centerLines, planBounds, null);
  const footprint = extractStructuralFootprint(centerLines, preliminaryRooms, planBounds);
  const roomPolygons = structuralRoomPolygons(spaceRegions, centerLines, planBounds, footprint);
  return {
    parameters: {
      method: "structural-wall-mode-filter-centerline-footprint-polygonize",
      inputCandidateCount: rawCandidates.length,
      trustedCandidateCount: trusted.length,
      centerLineCount: centerLines.length,
      roomPolygonCount: roomPolygons.length,
      footprintAreaSvgPx2: footprint?.areaSvgPx2 ?? null,
      discardedCandidateCount: Math.max(0, rawCandidates.length - trusted.length),
      minSegmentScore: 0.54,
      minLongWallRatio: 0.11,
      planBounds,
    },
    centerLines,
    footprint,
    roomPolygons,
    discardedPreview: scoredCandidates
      .filter((segment) => segment.score < 0.54)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((segment, index) => ({
        id: `discarded-${index + 1}`,
        axis: segment.axis,
        lengthPx: Number(segment.lengthPx.toFixed(1)),
        score: Number(segment.score.toFixed(2)),
        source: segment.source,
        reason: segment.reason,
      })),
  };
}

function structuralWallCandidates(hough, planBounds) {
  const candidates = [];
  (hough?.wallDoubleLines ?? []).forEach((wall) => {
    const segment = structuralSegmentFromLine(wall.centerLine, "double-line-wall", planBounds);
    if (!segment) return;
    candidates.push({
      ...segment,
      source: "double-line-wall",
      baseConfidence: 0.78,
      thicknessPx: wall.wallThicknessAnalysisPx,
    });
  });
  (hough?.singleLineWalls ?? []).forEach((wall) => {
    const segment = structuralSegmentFromLine(wall.centerLine, "single-line-wall", planBounds);
    if (!segment) return;
    candidates.push({
      ...segment,
      source: "single-line-wall",
      baseConfidence: wall.confidence ?? 0.5,
      thicknessPx: wall.inferredWallThicknessSvgPx,
    });
  });
  (hough?.mergedLineSegments ?? []).forEach((line) => {
    const segment = structuralSegmentFromLine(line, "long-orthogonal-line", planBounds);
    if (!segment) return;
    const longEnough = segment.lengthPx >= Math.max(planBounds.width, planBounds.height) * 0.18;
    const nearBorder = structuralBorderScore(segment, planBounds) > 0;
    if (!longEnough && !nearBorder) return;
    candidates.push({
      ...segment,
      source: "long-orthogonal-line",
      baseConfidence: longEnough ? 0.5 : 0.42,
      thicknessPx: null,
    });
  });
  return candidates;
}

function structuralSegmentFromLine(line, source, planBounds) {
  if (!line) return null;
  const angle = normalizeAngleDeg(line.angle ?? angleFromSvgLine(line));
  const horizontal = angle <= 8 || angle >= 172;
  const vertical = Math.abs(angle - 90) <= 8;
  if (!horizontal && !vertical) return null;
  const clipped = clipLineToBounds(line, planBounds);
  const lengthPx = Math.hypot(clipped.x2 - clipped.x1, clipped.y2 - clipped.y1);
  const minLength = Math.max(34, Math.max(planBounds.width, planBounds.height) * 0.055);
  if (lengthPx < minLength) return null;
  if (horizontal) {
    const x1 = Math.min(clipped.x1, clipped.x2);
    const x2 = Math.max(clipped.x1, clipped.x2);
    const y = (clipped.y1 + clipped.y2) / 2;
    return { axis: "horizontal", x1, y1: y, x2, y2: y, fixed: y, min: x1, max: x2, lengthPx, source };
  }
  const y1 = Math.min(clipped.y1, clipped.y2);
  const y2 = Math.max(clipped.y1, clipped.y2);
  const x = (clipped.x1 + clipped.x2) / 2;
  return { axis: "vertical", x1: x, y1, x2: x, y2, fixed: x, min: y1, max: y2, lengthPx, source };
}

function angleFromSvgLine(line) {
  return (Math.atan2((line.y2 ?? 0) - (line.y1 ?? 0), (line.x2 ?? 0) - (line.x1 ?? 0)) * 180) / Math.PI;
}

function clipLineToBounds(line, bounds) {
  const x1 = clamp(line.x1, bounds.x, bounds.x + bounds.width);
  const x2 = clamp(line.x2, bounds.x, bounds.x + bounds.width);
  const y1 = clamp(line.y1, bounds.y, bounds.y + bounds.height);
  const y2 = clamp(line.y2, bounds.y, bounds.y + bounds.height);
  return { x1, y1, x2, y2 };
}

function scoreStructuralSegment(segment, allSegments, planBounds) {
  const maxDimension = Math.max(planBounds.width, planBounds.height);
  const lengthScore = clamp(segment.lengthPx / Math.max(1, maxDimension * 0.42), 0, 1) * 0.34;
  const borderScore = structuralBorderScore(segment, planBounds) * 0.2;
  const connectionScore = structuralConnectionScore(segment, allSegments) * 0.27;
  const sourceScore =
    segment.source === "double-line-wall"
      ? 0.24
      : segment.source === "single-line-wall"
        ? clamp(segment.baseConfidence, 0, 1) * 0.18
        : clamp(segment.baseConfidence, 0, 1) * 0.12;
  const repeatedPenalty = structuralRepeatedLinePenalty(segment, allSegments);
  const score = clamp(lengthScore + borderScore + connectionScore + sourceScore - repeatedPenalty, 0, 1);
  const reasons = [];
  if (lengthScore > 0.2) reasons.push("long-main-line");
  if (borderScore > 0) reasons.push("near-plan-border");
  if (connectionScore > 0.12) reasons.push("perpendicular-connected");
  if (segment.source === "double-line-wall") reasons.push("double-line-center");
  if (repeatedPenalty > 0) reasons.push("repeated-thin-line-penalty");
  return {
    ...segment,
    score,
    reason: reasons.join("+") || "low-structure-support",
  };
}

function structuralBorderScore(segment, bounds) {
  const tolerance = Math.max(18, Math.min(bounds.width, bounds.height) * 0.035);
  const value =
    segment.axis === "horizontal"
      ? Math.min(Math.abs(segment.fixed - bounds.y), Math.abs(segment.fixed - (bounds.y + bounds.height)))
      : Math.min(Math.abs(segment.fixed - bounds.x), Math.abs(segment.fixed - (bounds.x + bounds.width)));
  return value <= tolerance ? 1 : 0;
}

function structuralConnectionScore(segment, allSegments) {
  const perpendicular = allSegments.filter((candidate) => candidate.axis !== segment.axis);
  const endpoints = [
    { x: segment.x1, y: segment.y1 },
    { x: segment.x2, y: segment.y2 },
  ];
  let connections = 0;
  endpoints.forEach((point) => {
    if (perpendicular.some((candidate) => pointTouchesStructuralSegment(point, candidate, 26))) connections += 1;
  });
  const crossings = perpendicular.filter((candidate) => structuralSegmentsIntersect(segment, candidate, 16)).length;
  return clamp(connections / 2 + Math.min(3, crossings) / 6, 0, 1);
}

function pointTouchesStructuralSegment(point, segment, tolerance) {
  if (segment.axis === "horizontal") {
    return Math.abs(point.y - segment.fixed) <= tolerance && point.x >= segment.min - tolerance && point.x <= segment.max + tolerance;
  }
  return Math.abs(point.x - segment.fixed) <= tolerance && point.y >= segment.min - tolerance && point.y <= segment.max + tolerance;
}

function structuralSegmentsIntersect(a, b, tolerance) {
  const horizontal = a.axis === "horizontal" ? a : b.axis === "horizontal" ? b : null;
  const vertical = a.axis === "vertical" ? a : b.axis === "vertical" ? b : null;
  if (!horizontal || !vertical) return false;
  return (
    vertical.fixed >= horizontal.min - tolerance &&
    vertical.fixed <= horizontal.max + tolerance &&
    horizontal.fixed >= vertical.min - tolerance &&
    horizontal.fixed <= vertical.max + tolerance
  );
}

function structuralRepeatedLinePenalty(segment, allSegments) {
  const nearParallels = allSegments.filter((candidate) => {
    if (candidate === segment || candidate.axis !== segment.axis) return false;
    if (Math.abs(candidate.fixed - segment.fixed) > 18) return false;
    const overlap = Math.min(segment.max, candidate.max) - Math.max(segment.min, candidate.min);
    return overlap > Math.min(segment.lengthPx, candidate.lengthPx) * 0.5;
  });
  const manyShortRepeats = nearParallels.length >= 5 && segment.lengthPx < 150;
  return manyShortRepeats ? 0.24 : nearParallels.length >= 4 ? 0.1 : 0;
}

function mergeStructuralSegments(segments, planBounds) {
  const merged = [];
  ["horizontal", "vertical"].forEach((axis) => {
    const axisSegments = segments.filter((segment) => segment.axis === axis).sort((a, b) => a.fixed - b.fixed || a.min - b.min);
    const groups = [];
    axisSegments.forEach((segment) => {
      const group = groups.find((item) => Math.abs(item.fixed - segment.fixed) <= 12);
      if (group) {
        group.items.push(segment);
        group.fixed = weightedAverage(group.items.map((item) => [item.fixed, item.lengthPx * Math.max(0.15, item.score)]));
      } else {
        groups.push({ fixed: segment.fixed, items: [segment] });
      }
    });
    groups.forEach((group) => {
      const ranges = group.items
        .map((item) => ({ min: item.min, max: item.max, score: item.score, source: item.source, lengthPx: item.lengthPx }))
        .sort((a, b) => a.min - b.min);
      const combinedRanges = [];
      ranges.forEach((range) => {
        const last = combinedRanges[combinedRanges.length - 1];
        if (last && range.min - last.max <= 38) {
          last.max = Math.max(last.max, range.max);
          last.score = Math.max(last.score, range.score);
          last.sources.add(range.source);
          last.weight += range.lengthPx * Math.max(0.15, range.score);
        } else {
          combinedRanges.push({ ...range, sources: new Set([range.source]), weight: range.lengthPx * Math.max(0.15, range.score) });
        }
      });
      combinedRanges.forEach((range) => {
        const lengthPx = range.max - range.min;
        if (lengthPx < Math.max(48, Math.max(planBounds.width, planBounds.height) * 0.07)) return;
        const score = clamp(range.score + Math.min(0.14, (group.items.length - 1) * 0.03), 0, 1);
        if (axis === "horizontal") {
          merged.push({
            axis,
            x1: range.min,
            y1: group.fixed,
            x2: range.max,
            y2: group.fixed,
            fixed: group.fixed,
            min: range.min,
            max: range.max,
            lengthPx,
            score,
            source: Array.from(range.sources).join("+"),
            reason: "merged-structural-centerline",
          });
        } else {
          merged.push({
            axis,
            x1: group.fixed,
            y1: range.min,
            x2: group.fixed,
            y2: range.max,
            fixed: group.fixed,
            min: range.min,
            max: range.max,
            lengthPx,
            score,
            source: Array.from(range.sources).join("+"),
            reason: "merged-structural-centerline",
          });
        }
      });
    });
  });
  const connected = merged.filter((segment) => structuralConnectionScore(segment, merged) > 0.08 || structuralBorderScore(segment, planBounds) > 0 || segment.lengthPx > Math.max(planBounds.width, planBounds.height) * 0.32);
  return filterStructuralNetworkComponents(connected, planBounds);
}

function weightedAverage(items) {
  const weight = items.reduce((sum, item) => sum + item[1], 0);
  return items.reduce((sum, item) => sum + item[0] * item[1], 0) / Math.max(1e-6, weight);
}

function extractStructuralFootprint(centerLines, roomPolygons, planBounds) {
  const cellSize = Math.max(8, Math.round(Math.min(planBounds.width, planBounds.height) / 72));
  const cols = Math.max(6, Math.ceil(planBounds.width / cellSize));
  const rows = Math.max(6, Math.ceil(planBounds.height / cellSize));
  let mask = new Uint8Array(cols * rows);
  const markCell = (cx, cy, radius = 0) => {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        mask[y * cols + x] = 1;
      }
    }
  };
  const toCell = (x, y) => ({
    x: Math.floor((x - planBounds.x) / cellSize),
    y: Math.floor((y - planBounds.y) / cellSize),
  });

  centerLines.forEach((line) => {
    const length = Math.max(1, Math.hypot(line.x2 - line.x1, line.y2 - line.y1));
    const steps = Math.max(2, Math.ceil(length / (cellSize * 0.65)));
    const radius = line.score >= 0.72 ? 2 : 1;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const cell = toCell(line.x1 + (line.x2 - line.x1) * t, line.y1 + (line.y2 - line.y1) * t);
      markCell(cell.x, cell.y, radius);
    }
  });

  roomPolygons
    .filter((room) => room.sideSupportScore >= 0.72 || (room.confidence >= 0.78 && room.edgeContact?.count === 0))
    .forEach((room) => {
    const minCell = toCell(room.bounds.x, room.bounds.y);
    const maxCell = toCell(room.bounds.x + room.bounds.width, room.bounds.y + room.bounds.height);
    for (let y = Math.max(0, minCell.y - 1); y <= Math.min(rows - 1, maxCell.y + 1); y += 1) {
      for (let x = Math.max(0, minCell.x - 1); x <= Math.min(cols - 1, maxCell.x + 1); x += 1) {
        mask[y * cols + x] = 1;
      }
    }
  });

  mask = closeFootprintMask(mask, cols, rows, 2);
  mask = keepLargestFootprintComponents(mask, cols, rows);
  const polygon = footprintMaskBoundaryPolygon(mask, cols, rows, cellSize, planBounds);
  if (!polygon?.length) return fallbackStructuralFootprint(centerLines, planBounds);
  const bounds = boundsFromPoints(polygon);
  const area = polygonArea(polygon);
  const compactness = area / Math.max(1, bounds.width * bounds.height);
  return {
    method: "grid-occupancy-orthogonal-envelope",
    coordinateSystem: "svg-1000x1040",
    cellSize,
    bounds: normalizeSvgBounds(bounds),
    polygon: pointsToPolygon(polygon),
    points: polygon.map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) })),
    areaSvgPx2: Math.round(area),
    compactness: Number(compactness.toFixed(3)),
    confidence: Number(clamp(0.42 + compactness * 0.3 + Math.min(0.22, centerLines.length / 140), 0, 0.92).toFixed(2)),
  };
}

function closeFootprintMask(mask, cols, rows, radius) {
  return erodeFootprintMask(dilateFootprintMask(mask, cols, rows, radius), cols, rows, Math.max(1, radius - 1));
}

function dilateFootprintMask(mask, cols, rows, radius) {
  const output = new Uint8Array(mask.length);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y * cols + x]) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          output[ny * cols + nx] = 1;
        }
      }
    }
  }
  return output;
}

function erodeFootprintMask(mask, cols, rows, radius) {
  const output = new Uint8Array(mask.length);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let filled = true;
      for (let dy = -radius; dy <= radius && filled; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || !mask[ny * cols + nx]) {
            filled = false;
            break;
          }
        }
      }
      output[y * cols + x] = filled ? 1 : 0;
    }
  }
  return output;
}

function keepLargestFootprintComponents(mask, cols, rows) {
  const labels = new Int32Array(mask.length);
  const components = [];
  const stack = [];
  let label = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || labels[start]) continue;
    label += 1;
    labels[start] = label;
    stack.length = 0;
    stack.push(start);
    let count = 0;
    while (stack.length) {
      const current = stack.pop();
      count += 1;
      const x = current % cols;
      const y = Math.floor(current / cols);
      const neighbors = [current - 1, current + 1, current - cols, current + cols];
      for (const next of neighbors) {
        if (next < 0 || next >= mask.length || !mask[next] || labels[next]) continue;
        const nx = next % cols;
        if ((next === current - 1 && x === 0) || (next === current + 1 && x === cols - 1)) continue;
        labels[next] = label;
        stack.push(next);
      }
    }
    components.push({ label, count });
  }
  if (!components.length) return mask;
  components.sort((a, b) => b.count - a.count);
  const minKeep = Math.max(4, components[0].count * 0.18);
  const keepLabels = new Set(components.filter((component) => component.count >= minKeep).slice(0, 4).map((component) => component.label));
  const output = new Uint8Array(mask.length);
  labels.forEach((value, index) => {
    if (keepLabels.has(value)) output[index] = 1;
  });
  return output;
}

function footprintRowIntervals(mask, cols, rows) {
  const intervals = [];
  for (let y = 0; y < rows; y += 1) {
    let min = cols;
    let max = -1;
    let count = 0;
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y * cols + x]) continue;
      min = Math.min(min, x);
      max = Math.max(max, x);
      count += 1;
    }
    if (count >= 2) intervals.push({ row: y, min, max, count });
  }
  return intervals;
}

function footprintMaskBoundaryPolygon(mask, cols, rows, cellSize, planBounds) {
  const edgeMap = new Map();
  const addEdge = (from, to) => {
    const key = `${from.x},${from.y}`;
    if (!edgeMap.has(key)) edgeMap.set(key, []);
    edgeMap.get(key).push({ from, to, used: false });
  };
  const filled = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && Boolean(mask[y * cols + x]);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!filled(x, y)) continue;
      if (!filled(x, y - 1)) addEdge({ x, y }, { x: x + 1, y });
      if (!filled(x + 1, y)) addEdge({ x: x + 1, y }, { x: x + 1, y: y + 1 });
      if (!filled(x, y + 1)) addEdge({ x: x + 1, y: y + 1 }, { x, y: y + 1 });
      if (!filled(x - 1, y)) addEdge({ x, y: y + 1 }, { x, y });
    }
  }
  const loops = [];
  edgeMap.forEach((edges) => {
    edges.forEach((edge) => {
      if (edge.used) return;
      const loop = [];
      let current = edge;
      for (let guard = 0; guard < cols * rows * 6; guard += 1) {
        current.used = true;
        loop.push(current.from);
        const nextKey = `${current.to.x},${current.to.y}`;
        const candidates = edgeMap.get(nextKey) ?? [];
        const next = candidates.find((candidate) => !candidate.used);
        if (!next) {
          loop.push(current.to);
          break;
        }
        current = next;
        if (current.from.x === edge.from.x && current.from.y === edge.from.y) break;
      }
      if (loop.length >= 4) loops.push(simplifyGridPolygon(loop));
    });
  });
  if (!loops.length) return null;
  const scaledLoops = loops
    .map((loop) =>
      loop.map((point) => ({
        x: clamp(planBounds.x + point.x * cellSize, planBounds.x, planBounds.x + planBounds.width),
        y: clamp(planBounds.y + point.y * cellSize, planBounds.y, planBounds.y + planBounds.height),
      })),
    )
    .filter((loop) => Math.abs(polygonArea(loop)) > 1000);
  if (!scaledLoops.length) return null;
  scaledLoops.sort((a, b) => polygonArea(b) - polygonArea(a));
  return removeDuplicatePolygonPoints(scaledLoops[0]);
}

function simplifyGridPolygon(points) {
  const withoutDuplicates = removeDuplicatePolygonPoints(points);
  const simplified = [];
  withoutDuplicates.forEach((point) => {
    simplified.push(point);
    while (simplified.length >= 3) {
      const a = simplified[simplified.length - 3];
      const b = simplified[simplified.length - 2];
      const c = simplified[simplified.length - 1];
      const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
      if (!collinear) break;
      simplified.splice(simplified.length - 2, 1);
    }
  });
  return simplified;
}

function mergeFootprintBands(intervals, cellSize, planBounds) {
  const bands = [];
  intervals.forEach((interval) => {
    const x1 = planBounds.x + interval.min * cellSize;
    const x2 = planBounds.x + (interval.max + 1) * cellSize;
    const y1 = planBounds.y + interval.row * cellSize;
    const y2 = planBounds.y + (interval.row + 1) * cellSize;
    const last = bands[bands.length - 1];
    if (last && Math.abs(last.x1 - x1) <= cellSize && Math.abs(last.x2 - x2) <= cellSize && Math.abs(last.y2 - y1) <= cellSize * 1.2) {
      last.x1 = weightedAverage([[last.x1, 3], [x1, 1]]);
      last.x2 = weightedAverage([[last.x2, 3], [x2, 1]]);
      last.y2 = y2;
    } else {
      bands.push({ x1, x2, y1, y2 });
    }
  });
  return bands.map((band) => ({
    x1: clamp(Math.round(band.x1), planBounds.x, planBounds.x + planBounds.width),
    x2: clamp(Math.round(band.x2), planBounds.x, planBounds.x + planBounds.width),
    y1: clamp(Math.round(band.y1), planBounds.y, planBounds.y + planBounds.height),
    y2: clamp(Math.round(band.y2), planBounds.y, planBounds.y + planBounds.height),
  }));
}

function footprintBandsToPolygon(bands) {
  const left = [];
  const right = [];
  bands.forEach((band, index) => {
    if (index === 0) {
      left.push({ x: band.x1, y: band.y1 });
      right.push({ x: band.x2, y: band.y1 });
    }
    left.push({ x: band.x1, y: band.y2 });
    right.push({ x: band.x2, y: band.y2 });
  });
  return removeDuplicatePolygonPoints([...left, ...right.reverse()]);
}

function fallbackStructuralFootprint(centerLines, planBounds) {
  const bounds = centerLines.length ? padBounds(boundsFromStructuralSegments(centerLines), 0.025) : planBounds;
  const clipped = normalizeSvgBounds({
    x: clamp(bounds.x, planBounds.x, planBounds.x + planBounds.width),
    y: clamp(bounds.y, planBounds.y, planBounds.y + planBounds.height),
    width: Math.min(bounds.width, planBounds.width),
    height: Math.min(bounds.height, planBounds.height),
  });
  const points = [
    { x: clipped.x, y: clipped.y },
    { x: clipped.x + clipped.width, y: clipped.y },
    { x: clipped.x + clipped.width, y: clipped.y + clipped.height },
    { x: clipped.x, y: clipped.y + clipped.height },
  ];
  return {
    method: "fallback-centerline-bounds",
    coordinateSystem: "svg-1000x1040",
    cellSize: null,
    bounds: clipped,
    polygon: pointsToPolygon(points),
    points,
    areaSvgPx2: Math.round(clipped.width * clipped.height),
    compactness: 1,
    confidence: 0.36,
  };
}

function structuralFootprintFit(bounds, footprint) {
  if (!footprint?.points?.length) return { centerInside: true, overlapRatio: 1 };
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const samples = [
    center,
    { x: bounds.x + bounds.width * 0.25, y: bounds.y + bounds.height * 0.25 },
    { x: bounds.x + bounds.width * 0.75, y: bounds.y + bounds.height * 0.25 },
    { x: bounds.x + bounds.width * 0.25, y: bounds.y + bounds.height * 0.75 },
    { x: bounds.x + bounds.width * 0.75, y: bounds.y + bounds.height * 0.75 },
  ];
  const insideCount = samples.filter((point) => pointInPolygon(point, footprint.points)).length;
  return {
    centerInside: pointInPolygon(center, footprint.points),
    overlapRatio: Number((insideCount / samples.length).toFixed(2)),
  };
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / Math.max(1e-6, b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function boundsFromPoints(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x, y, width: maxX - x, height: maxY - y };
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area / 2);
}

function pointsToPolygon(points) {
  return points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(" ");
}

function removeDuplicatePolygonPoints(points) {
  const result = [];
  points.forEach((point) => {
    const last = result[result.length - 1];
    if (!last || Math.abs(last.x - point.x) > 1 || Math.abs(last.y - point.y) > 1) result.push(point);
  });
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.abs(first.x - last.x) <= 1 && Math.abs(first.y - last.y) <= 1) result.pop();
  }
  return result;
}

function filterStructuralNetworkComponents(segments, planBounds) {
  if (segments.length <= 3) return segments;
  const parent = Array.from({ length: segments.length }, (_, index) => index);
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const unite = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (structuralSegmentsConnected(segments[i], segments[j], 20)) unite(i, j);
    }
  }
  const groups = new Map();
  segments.forEach((segment, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(segment);
  });
  const maxDimension = Math.max(planBounds.width, planBounds.height);
  const kept = [];
  groups.forEach((items) => {
    const totalLength = items.reduce((sum, item) => sum + item.lengthPx, 0);
    const borderCount = items.filter((item) => structuralBorderScore(item, planBounds) > 0).length;
    const bounds = boundsFromStructuralSegments(items);
    const spanScore = Math.max(bounds.width / Math.max(1, planBounds.width), bounds.height / Math.max(1, planBounds.height));
    const hasLongMainLine = items.some((item) => item.lengthPx >= maxDimension * 0.34);
    const isMainNetwork = totalLength >= maxDimension * 0.62 && spanScore >= 0.22;
    const isBorderNetwork = borderCount > 0 && totalLength >= maxDimension * 0.28;
    if (isMainNetwork || isBorderNetwork || hasLongMainLine) kept.push(...items);
  });
  return kept.length ? kept : segments.slice(0, Math.max(4, Math.round(segments.length * 0.45)));
}

function structuralSegmentsConnected(a, b, tolerance) {
  if (a.axis !== b.axis) return structuralSegmentsIntersect(a, b, tolerance);
  if (Math.abs(a.fixed - b.fixed) > tolerance) return false;
  const overlap = Math.min(a.max, b.max) - Math.max(a.min, b.min);
  const gap = Math.max(a.min, b.min) - Math.min(a.max, b.max);
  return overlap > -tolerance || gap <= tolerance;
}

function boundsFromStructuralSegments(segments) {
  const xs = segments.flatMap((segment) => [segment.x1, segment.x2]);
  const ys = segments.flatMap((segment) => [segment.y1, segment.y2]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x, y, width: maxX - x, height: maxY - y };
}

function structuralRoomPolygons(spaceRegions, centerLines, planBounds, footprint = null) {
  const planArea = Math.max(1, planBounds.width * planBounds.height);
  const candidates = (spaceRegions?.regions ?? [])
    .map((region) => {
      const bounds = normalizeSvgBounds(region.bounds);
      const area = Math.max(1, bounds.width * bounds.height);
      const ratio = Math.max(bounds.width / Math.max(1, bounds.height), bounds.height / Math.max(1, bounds.width));
      const sideSupport = structuralRoomSideSupport(bounds, centerLines);
      const areaScore = clamp(area / (planArea * 0.12), 0, 1);
      const shapeScore = ratio <= 5.2 ? 0.18 : -0.18;
      const edgePenalty = region.touchesAnalysisEdge && area > planArea * 0.18 ? 0.2 : 0;
      const edgeContact = structuralPlanEdgeContact(bounds, planBounds);
      const footprintFit = structuralFootprintFit(bounds, footprint);
      const smallObjectPenalty = structuralSmallObjectPenalty(bounds, area, planArea, sideSupport);
      const exteriorPenalty = structuralExteriorVoidPenalty(bounds, area, planArea, sideSupport, edgeContact);
      const footprintPenalty = footprint && footprintFit.overlapRatio < 0.55 ? 0.36 : footprint && footprintFit.centerInside === false ? 0.18 : 0;
      const score = clamp(sideSupport.score * 0.58 + areaScore * 0.28 + shapeScore - edgePenalty - smallObjectPenalty - exteriorPenalty - footprintPenalty, 0, 1);
      return {
        id: region.id.replace("space", "struct-room"),
        label: region.label,
        type: "unknown",
        polygon: rectanglePolygon(bounds),
        bounds,
        areaSvgPx2: Math.round(area),
        sourceSpaceId: region.id,
        sideSupport: sideSupport.sides,
        sideSupportScore: Number(sideSupport.score.toFixed(2)),
        edgeContact,
        footprintFit,
        penalties: {
          smallObject: Number(smallObjectPenalty.toFixed(2)),
          exteriorVoid: Number(exteriorPenalty.toFixed(2)),
          footprint: Number(footprintPenalty.toFixed(2)),
        },
        confidence: Number(score.toFixed(2)),
      };
    })
    .filter((room) => {
      const area = room.areaSvgPx2;
      const minArea = Math.max(1800, planArea * 0.012);
      const notTooSmall = area >= minArea && room.bounds.width >= 36 && room.bounds.height >= 36;
      const notHugeOutside = !(area > planArea * 0.55);
      const notExteriorVoid = !(room.edgeContact.count >= 2 && room.sideSupportScore < 0.62 && area > planArea * 0.045);
      const notFurnitureBox = !(area < planArea * 0.035 && room.sideSupportScore < 0.72);
      const insideFootprint = !footprint || room.footprintFit.overlapRatio >= 0.42 || room.footprintFit.centerInside;
      return notTooSmall && notHugeOutside && notExteriorVoid && notFurnitureBox && insideFootprint && room.confidence >= 0.38;
    })
    .sort((a, b) => b.confidence - a.confidence || b.areaSvgPx2 - a.areaSvgPx2)
    .slice(0, 18);
  return suppressNestedStructuralRooms(candidates).slice(0, 14);
}

function structuralRoomSideSupport(bounds, centerLines) {
  const tolerance = 28;
  const sides = {
    top: sideCoverage("horizontal", bounds.y, bounds.x, bounds.x + bounds.width, centerLines, tolerance),
    bottom: sideCoverage("horizontal", bounds.y + bounds.height, bounds.x, bounds.x + bounds.width, centerLines, tolerance),
    left: sideCoverage("vertical", bounds.x, bounds.y, bounds.y + bounds.height, centerLines, tolerance),
    right: sideCoverage("vertical", bounds.x + bounds.width, bounds.y, bounds.y + bounds.height, centerLines, tolerance),
  };
  const values = Object.values(sides);
  return {
    sides,
    score: values.reduce((sum, value) => sum + Math.min(1, value), 0) / 4,
  };
}

function structuralPlanEdgeContact(bounds, planBounds) {
  const tolerance = Math.max(14, Math.min(planBounds.width, planBounds.height) * 0.025);
  const sides = {
    top: Math.abs(bounds.y - planBounds.y) <= tolerance,
    bottom: Math.abs(bounds.y + bounds.height - (planBounds.y + planBounds.height)) <= tolerance,
    left: Math.abs(bounds.x - planBounds.x) <= tolerance,
    right: Math.abs(bounds.x + bounds.width - (planBounds.x + planBounds.width)) <= tolerance,
  };
  return {
    ...sides,
    count: Object.values(sides).filter(Boolean).length,
  };
}

function structuralSmallObjectPenalty(bounds, area, planArea, sideSupport) {
  const smallArea = area < planArea * 0.028;
  const compactFurnitureLike = Math.max(bounds.width / Math.max(1, bounds.height), bounds.height / Math.max(1, bounds.width)) < 2.4;
  const weakWalls = sideSupport.score < 0.68;
  return smallArea && compactFurnitureLike && weakWalls ? 0.24 : smallArea && weakWalls ? 0.14 : 0;
}

function structuralExteriorVoidPenalty(bounds, area, planArea, sideSupport, edgeContact) {
  const largeAtCanvasCorner = edgeContact.count >= 2 && area > planArea * 0.045;
  const weakWallBox = sideSupport.score < 0.66;
  return largeAtCanvasCorner && weakWallBox ? 0.32 : edgeContact.count >= 1 && sideSupport.score < 0.48 ? 0.16 : 0;
}

function suppressNestedStructuralRooms(rooms) {
  const kept = [];
  const sorted = rooms.slice().sort((a, b) => b.areaSvgPx2 - a.areaSvgPx2);
  sorted.forEach((room) => {
    const nestedInExisting = kept.some((larger) => {
      const overlap = rectOverlapArea(room.bounds, larger.bounds);
      const containment = overlap / Math.max(1, room.areaSvgPx2);
      const muchSmaller = room.areaSvgPx2 < larger.areaSvgPx2 * 0.42;
      const weakOrInterior = room.sideSupportScore < 0.8 || room.edgeContact.count === 0;
      return containment > 0.82 && muchSmaller && weakOrInterior;
    });
    if (!nestedInExisting) kept.push(room);
  });
  return kept.sort((a, b) => b.confidence - a.confidence || b.areaSvgPx2 - a.areaSvgPx2);
}

function rectOverlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

function sideCoverage(axis, fixed, min, max, centerLines, tolerance) {
  const spans = centerLines
    .filter((line) => line.axis === axis && Math.abs((axis === "horizontal" ? line.y1 : line.x1) - fixed) <= tolerance)
    .map((line) => ({
      min: axis === "horizontal" ? Math.min(line.x1, line.x2) : Math.min(line.y1, line.y2),
      max: axis === "horizontal" ? Math.max(line.x1, line.x2) : Math.max(line.y1, line.y2),
    }))
    .filter((span) => Math.min(max, span.max) - Math.max(min, span.min) > 0)
    .sort((a, b) => a.min - b.min);
  if (!spans.length) return 0;
  let covered = 0;
  let currentMin = null;
  let currentMax = null;
  spans.forEach((span) => {
    const start = Math.max(min, span.min);
    const end = Math.min(max, span.max);
    if (currentMin === null) {
      currentMin = start;
      currentMax = end;
    } else if (start <= currentMax + 12) {
      currentMax = Math.max(currentMax, end);
    } else {
      covered += currentMax - currentMin;
      currentMin = start;
      currentMax = end;
    }
  });
  if (currentMin !== null) covered += currentMax - currentMin;
  return clamp(covered / Math.max(1, max - min), 0, 1);
}

function extractRegionContourWallSegments(dark, width, height, region, existingSegments = []) {
  const barrier = dilateBinaryMask(dark, width, height, 1);
  const candidates = [];
  for (let y = region.minY; y <= region.maxY; y += 1) {
    let runStart = null;
    for (let x = region.minX; x <= region.maxX + 1; x += 1) {
      const active =
        x <= region.maxX &&
        barrier[y * width + x] &&
        (isFreeAt(x, y - 2, barrier, width, height, region) || isFreeAt(x, y + 2, barrier, width, height, region));
      if (active && runStart === null) {
        runStart = x;
      } else if ((!active || x > region.maxX) && runStart !== null) {
        const runEnd = x - 1;
        if (runEnd - runStart + 1 >= 12) {
          candidates.push(createAnalysisSegment({ x: runStart, y }, { x: runEnd, y }, 0, 0, 90, runEnd - runStart + 1));
        }
        runStart = null;
      }
    }
  }

  for (let x = region.minX; x <= region.maxX; x += 1) {
    let runStart = null;
    for (let y = region.minY; y <= region.maxY + 1; y += 1) {
      const active =
        y <= region.maxY &&
        barrier[y * width + x] &&
        (isFreeAt(x - 2, y, barrier, width, height, region) || isFreeAt(x + 2, y, barrier, width, height, region));
      if (active && runStart === null) {
        runStart = y;
      } else if ((!active || y > region.maxY) && runStart !== null) {
        const runEnd = y - 1;
        if (runEnd - runStart + 1 >= 12) {
          candidates.push(createAnalysisSegment({ x, y: runStart }, { x, y: runEnd }, 0, 0, 0, runEnd - runStart + 1));
        }
        runStart = null;
      }
    }
  }

  return mergeNearbyLineSegments(candidates)
    .filter((segment) => segment.length >= 20)
    .filter((segment) => !isLineCoveredBySegments(segment, existingSegments))
    .sort((a, b) => b.length - a.length);
}

function snapOrthogonalWallSegments(segments, tolerance = 10) {
  return segments
    .map((segment) => snapOrthogonalSegment(segment, tolerance))
    .filter(Boolean)
    .filter((segment) => segment.length >= 18);
}

function snapOrthogonalSegment(segment, tolerance = 10) {
  const normalized = normalizeAngleDeg(segment.angle);
  const horizontal = normalized <= tolerance || normalized >= 180 - tolerance;
  const vertical = Math.abs(normalized - 90) <= tolerance;
  if (!horizontal && !vertical) return null;
  if (horizontal) {
    const x1 = Math.min(segment.x1, segment.x2);
    const x2 = Math.max(segment.x1, segment.x2);
    const y = (segment.y1 + segment.y2) / 2;
    return {
      ...createAnalysisSegment({ x: x1, y }, { x: x2, y }, segment.votes, segment.rho, segment.thetaDeg, segment.support),
      snapped: true,
      snappedAxis: "horizontal",
      sourceAngle: Number(segment.angle.toFixed(1)),
    };
  }
  const y1 = Math.min(segment.y1, segment.y2);
  const y2 = Math.max(segment.y1, segment.y2);
  const x = (segment.x1 + segment.x2) / 2;
  return {
    ...createAnalysisSegment({ x, y: y1 }, { x, y: y2 }, segment.votes, segment.rho, segment.thetaDeg, segment.support),
    snapped: true,
    snappedAxis: "vertical",
    sourceAngle: Number(segment.angle.toFixed(1)),
  };
}

function isFreeAt(x, y, barrier, width, height, region) {
  return x >= region.minX && x <= region.maxX && y >= region.minY && y <= region.maxY && x >= 0 && y >= 0 && x < width && y < height && !barrier[y * width + x];
}

function isLineCoveredBySegments(segment, existingSegments) {
  return existingSegments.some((existing) => {
    if (angleDifferenceDeg(segment.angle, existing.angle) > 7) return false;
    const axis = lineAxis(segment.angle);
    const segmentMid = segmentMidpoint(segment);
    const existingMid = segmentMidpoint(existing);
    const offsetDistance = Math.abs((existingMid.x - segmentMid.x) * axis.normalX + (existingMid.y - segmentMid.y) * axis.normalY);
    if (offsetDistance > 8) return false;
    const a = projectedRange(segment, axis);
    const b = projectedRange(existing, axis);
    const overlap = Math.min(a.max, b.max) - Math.max(a.min, b.min);
    return overlap >= Math.min(segment.length, existing.length) * 0.55;
  });
}

function dilateBinaryMask(mask, width, height, radius) {
  const result = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.hypot(dx, dy) > radius + 0.25) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          result[ny * width + nx] = 1;
        }
      }
    }
  }
  return result;
}

function detectSpaceAdjacency(labels, barrier, width, height, region, labelToRegionId) {
  const pairCounts = new Map();
  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const index = y * width + x;
      if (!barrier[index]) continue;
      const nearbyLabels = new Set();
      for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -3; dx <= 3; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < region.minX || nx > region.maxX || ny < region.minY || ny > region.maxY) continue;
          const label = labels[ny * width + nx];
          if (labelToRegionId.has(label)) nearbyLabels.add(labelToRegionId.get(label));
        }
      }
      const ids = Array.from(nearbyLabels).sort();
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          const key = `${ids[i]}|${ids[j]}`;
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return Array.from(pairCounts.entries())
    .map(([key, count]) => {
      const [a, b] = key.split("|");
      return { a, b, count };
    })
    .filter((edge) => edge.count >= 4)
    .sort((a, b) => b.count - a.count);
}

function analysisBoundsToSvg(bounds, scale, imageWidth, imageHeight) {
  return imageBoundsToSvg(
    {
      x: bounds.minX / scale,
      y: bounds.minY / scale,
      width: bounds.width / scale,
      height: bounds.height / scale,
    },
    imageWidth,
    imageHeight,
  );
}

function svgAreaScaleForImage(imageWidth, imageHeight) {
  const display = sourceImageDisplayBox(imageWidth, imageHeight);
  return (display.width / imageWidth) * (display.height / imageHeight);
}

function collectBinaryEdgePoints(dark, width, height, region) {
  const points = [];
  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const index = y * width + x;
      if (!dark[index]) continue;
      const touchesBackground =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !dark[index - 1] ||
        !dark[index + 1] ||
        !dark[index - width] ||
        !dark[index + width];
      if (touchesBackground) points.push({ x, y });
    }
  }
  if (points.length <= 36000) return points;
  const stride = Math.ceil(points.length / 36000);
  return points.filter((_, index) => index % stride === 0);
}

function houghLinePeaks(points, width, height) {
  if (!points.length) return [];
  const thetaCount = 180;
  const rhoStep = 2;
  const rhoMax = Math.ceil(Math.hypot(width, height));
  const rhoBins = Math.ceil((rhoMax * 2) / rhoStep) + 1;
  const accumulator = new Uint16Array(thetaCount * rhoBins);
  const trig = Array.from({ length: thetaCount }, (_, thetaDeg) => {
    const theta = (thetaDeg * Math.PI) / 180;
    return { thetaDeg, cos: Math.cos(theta), sin: Math.sin(theta) };
  });
  points.forEach((point) => {
    trig.forEach(({ cos, sin }, thetaDeg) => {
      const rho = point.x * cos + point.y * sin;
      const rhoIndex = Math.round((rho + rhoMax) / rhoStep);
      accumulator[thetaDeg * rhoBins + rhoIndex] += 1;
    });
  });
  const threshold = Math.max(12, Math.min(96, Math.round(points.length * 0.006)));
  const candidates = [];
  for (let thetaDeg = 0; thetaDeg < thetaCount; thetaDeg += 1) {
    for (let rhoIndex = 0; rhoIndex < rhoBins; rhoIndex += 1) {
      const votes = accumulator[thetaDeg * rhoBins + rhoIndex];
      if (votes < threshold) continue;
      candidates.push({
        thetaDeg,
        theta: (thetaDeg * Math.PI) / 180,
        rho: rhoIndex * rhoStep - rhoMax,
        votes,
      });
    }
  }
  candidates.sort((a, b) => b.votes - a.votes);
  const peaks = [];
  candidates.forEach((candidate) => {
    const duplicate = peaks.some(
      (peak) => angleDifferenceDeg(peak.thetaDeg, candidate.thetaDeg) <= 4 && Math.abs(peak.rho - candidate.rho) <= 7,
    );
    if (!duplicate) peaks.push(candidate);
  });
  return peaks.slice(0, 140);
}

function segmentsForHoughPeak(points, peak, width, height) {
  const cos = Math.cos(peak.theta);
  const sin = Math.sin(peak.theta);
  const dirX = -sin;
  const dirY = cos;
  const supported = [];
  points.forEach((point) => {
    const distance = Math.abs(point.x * cos + point.y * sin - peak.rho);
    if (distance <= 1.8) supported.push({ t: point.x * dirX + point.y * dirY });
  });
  if (supported.length < 10) return [];
  supported.sort((a, b) => a.t - b.t);
  const groups = [];
  let group = [supported[0]];
  for (let i = 1; i < supported.length; i += 1) {
    if (supported[i].t - supported[i - 1].t <= 10) {
      group.push(supported[i]);
    } else {
      groups.push(group);
      group = [supported[i]];
    }
  }
  groups.push(group);
  const segments = [];
  groups.forEach((items) => {
    const t1 = items[0].t;
    const t2 = items[items.length - 1].t;
    const length = Math.abs(t2 - t1);
    if (length < 14 || items.length < 5) return;
    const start = clampPointToAnalysisImage({ x: cos * peak.rho + dirX * t1, y: sin * peak.rho + dirY * t1 }, width, height);
    const end = clampPointToAnalysisImage({ x: cos * peak.rho + dirX * t2, y: sin * peak.rho + dirY * t2 }, width, height);
    segments.push(createAnalysisSegment(start, end, peak.votes, peak.rho, peak.thetaDeg, items.length));
  });
  return segments;
}

function clampPointToAnalysisImage(point, width, height) {
  return {
    x: clamp(point.x, 0, width - 1),
    y: clamp(point.y, 0, height - 1),
  };
}

function createAnalysisSegment(start, end, votes = 0, rho = 0, thetaDeg = 0, support = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const angle = normalizeAngleDeg((Math.atan2(dy, dx) * 180) / Math.PI);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, angle, length, votes, rho, thetaDeg, support };
}

function mergeNearbyLineSegments(segments) {
  let current = segments.filter((segment) => segment.length >= 14).sort((a, b) => b.length - a.length);
  for (let pass = 0; pass < 6; pass += 1) {
    const used = new Set();
    const next = [];
    for (let i = 0; i < current.length; i += 1) {
      if (used.has(i)) continue;
      let base = current[i];
      used.add(i);
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < current.length; j += 1) {
          if (used.has(j)) continue;
          if (!canMergeLineSegments(base, current[j])) continue;
          base = mergeLineSegmentPair(base, current[j]);
          used.add(j);
          changed = true;
        }
      }
      next.push(base);
    }
    if (next.length === current.length) break;
    current = next.sort((a, b) => b.length - a.length);
  }
  return current.filter((segment) => segment.length >= 18).sort((a, b) => b.length - a.length);
}

function canMergeLineSegments(a, b) {
  if (angleDifferenceDeg(a.angle, b.angle) > 6) return false;
  const axis = lineAxis(a.angle);
  const aMid = segmentMidpoint(a);
  const bMid = segmentMidpoint(b);
  const offsetDistance = Math.abs((bMid.x - aMid.x) * axis.normalX + (bMid.y - aMid.y) * axis.normalY);
  if (offsetDistance > 7.5) return false;
  const aRange = projectedRange(a, axis);
  const bRange = projectedRange(b, axis);
  const gap = Math.max(aRange.min, bRange.min) - Math.min(aRange.max, bRange.max);
  const endpointDistance = closestEndpointDistance(a, b);
  return gap <= 24 || endpointDistance <= 30;
}

function mergeLineSegmentPair(a, b) {
  const axis = lineAxis(a.angle);
  const points = [
    { x: a.x1, y: a.y1 },
    { x: a.x2, y: a.y2 },
    { x: b.x1, y: b.y1 },
    { x: b.x2, y: b.y2 },
  ];
  const projected = points.map((point) => point.x * axis.dirX + point.y * axis.dirY);
  const offsets = points.map((point) => point.x * axis.normalX + point.y * axis.normalY);
  const minT = Math.min(...projected);
  const maxT = Math.max(...projected);
  const offset = offsets.reduce((sum, value) => sum + value, 0) / offsets.length;
  const start = { x: axis.dirX * minT + axis.normalX * offset, y: axis.dirY * minT + axis.normalY * offset };
  const end = { x: axis.dirX * maxT + axis.normalX * offset, y: axis.dirY * maxT + axis.normalY * offset };
  return createAnalysisSegment(start, end, Math.max(a.votes, b.votes), (a.rho + b.rho) / 2, a.thetaDeg, a.support + b.support);
}

function detectDoubleLineWalls(segments) {
  const walls = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (angleDifferenceDeg(a.angle, b.angle) > 3) continue;
      const axis = lineAxis(a.angle);
      const aMid = segmentMidpoint(a);
      const bMid = segmentMidpoint(b);
      const distance = Math.abs((bMid.x - aMid.x) * axis.normalX + (bMid.y - aMid.y) * axis.normalY);
      if (distance < 3 || distance > 22) continue;
      const aRange = projectedRange(a, axis);
      const bRange = projectedRange(b, axis);
      const overlap = Math.min(aRange.max, bRange.max) - Math.max(aRange.min, bRange.min);
      if (overlap < Math.max(34, Math.min(a.length, b.length) * 0.28)) continue;
      const minT = Math.max(aRange.min, bRange.min);
      const maxT = Math.min(aRange.max, bRange.max);
      const centerOffset =
        ((aMid.x * axis.normalX + aMid.y * axis.normalY) + (bMid.x * axis.normalX + bMid.y * axis.normalY)) / 2;
      const centerLine = createAnalysisSegment(
        { x: axis.dirX * minT + axis.normalX * centerOffset, y: axis.dirY * minT + axis.normalY * centerOffset },
        { x: axis.dirX * maxT + axis.normalX * centerOffset, y: axis.dirY * maxT + axis.normalY * centerOffset },
        Math.max(a.votes, b.votes),
        centerOffset,
        a.thetaDeg,
        a.support + b.support,
      );
      walls.push({ segmentA: a, segmentB: b, centerLine, distance, overlap, angle: a.angle });
    }
  }
  return walls.sort((a, b) => b.overlap - a.overlap);
}

function inferSingleLineWalls(segments, doubleLineWalls, dark, width, height) {
  const pairedSegments = new Set();
  doubleLineWalls.forEach((wall) => {
    pairedSegments.add(wall.segmentA);
    pairedSegments.add(wall.segmentB);
  });
  return segments
    .filter((segment) => segment.length >= 42 && !pairedSegments.has(segment) && isNearlyOrthogonalAngle(segment.angle, 10))
    .map((segment) => {
      const lineWidth = estimateSegmentStrokeWidth(segment, dark, width, height);
      const enclosure = enclosureScore(segment, segments);
      const straightnessScore = clamp(segment.support / Math.max(1, segment.length), 0, 1);
      const confidence = clamp(0.28 + lineWidth.confidence * 0.38 + enclosure.score * 0.26 + straightnessScore * 0.08, 0, 1);
      const inferredThickness = Math.round(clamp(lineWidth.width * (enclosure.score > 0.55 ? 3.1 : 2.45), 6, 38));
      return {
        centerLine: segment,
        lineWidthAnalysisPx: lineWidth.width,
        inferredWallThicknessAnalysisPx: inferredThickness,
        enclosureScore: enclosure.score,
        endpointConnections: enclosure.endpointConnections,
        confidence,
        reason: enclosure.score > 0.5 ? "line-width-and-enclosed-endpoints" : "line-width-main-structure",
      };
    })
    .filter((wall) => wall.lineWidthAnalysisPx >= 1.8 && wall.confidence >= 0.48)
    .sort((a, b) => b.confidence - a.confidence || b.centerLine.length - a.centerLine.length);
}

function isNearlyOrthogonalAngle(angle, tolerance = 8) {
  const normalized = normalizeAngleDeg(angle);
  return normalized <= tolerance || Math.abs(normalized - 90) <= tolerance || normalized >= 180 - tolerance;
}

function estimateSegmentStrokeWidth(segment, dark, width, height) {
  const axis = lineAxis(segment.angle);
  const samples = [];
  const count = Math.max(4, Math.min(18, Math.round(segment.length / 18)));
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : (i + 0.5) / count;
    const point = {
      x: segment.x1 + (segment.x2 - segment.x1) * t,
      y: segment.y1 + (segment.y2 - segment.y1) * t,
    };
    const widthAtPoint = darkRunWidthAlongNormal(point, axis, dark, width, height);
    if (widthAtPoint > 0) samples.push(widthAtPoint);
  }
  if (!samples.length) return { width: 1, confidence: 0 };
  samples.sort((a, b) => a - b);
  const middle = samples.slice(Math.floor(samples.length * 0.25), Math.ceil(samples.length * 0.75));
  const widthEstimate = middle.reduce((sum, value) => sum + value, 0) / Math.max(1, middle.length);
  return {
    width: Number(widthEstimate.toFixed(2)),
    confidence: clamp(samples.length / count, 0, 1),
  };
}

function darkRunWidthAlongNormal(point, axis, dark, width, height) {
  const center = nearestDarkPixel(point, dark, width, height);
  if (!center) return 0;
  let left = 0;
  let right = 0;
  for (let step = 1; step <= 18; step += 1) {
    const x = Math.round(center.x - axis.normalX * step);
    const y = Math.round(center.y - axis.normalY * step);
    if (!isDarkAt(x, y, dark, width, height)) break;
    left = step;
  }
  for (let step = 1; step <= 18; step += 1) {
    const x = Math.round(center.x + axis.normalX * step);
    const y = Math.round(center.y + axis.normalY * step);
    if (!isDarkAt(x, y, dark, width, height)) break;
    right = step;
  }
  return left + right + 1;
}

function nearestDarkPixel(point, dark, width, height) {
  const cx = Math.round(point.x);
  const cy = Math.round(point.y);
  for (let radius = 0; radius <= 3; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (isDarkAt(x, y, dark, width, height)) return { x, y };
      }
    }
  }
  return null;
}

function isDarkAt(x, y, dark, width, height) {
  return x >= 0 && y >= 0 && x < width && y < height && Boolean(dark[y * width + x]);
}

function enclosureScore(segment, segments) {
  const start = { x: segment.x1, y: segment.y1 };
  const end = { x: segment.x2, y: segment.y2 };
  const startConnections = countEndpointConnections(start, segment, segments);
  const endConnections = countEndpointConnections(end, segment, segments);
  const bothEndsConnected = startConnections > 0 && endConnections > 0 ? 0.5 : 0;
  const totalConnections = Math.min(4, startConnections + endConnections) / 4;
  return {
    score: clamp(bothEndsConnected + totalConnections * 0.5, 0, 1),
    endpointConnections: { start: startConnections, end: endConnections },
  };
}

function countEndpointConnections(point, source, segments) {
  return segments.filter((candidate) => {
    if (candidate === source) return false;
    if (angleDifferenceDeg(candidate.angle, source.angle) < 28) return false;
    const endpoints = [
      { x: candidate.x1, y: candidate.y1 },
      { x: candidate.x2, y: candidate.y2 },
    ];
    const endpointNear = endpoints.some((endpoint) => Math.hypot(endpoint.x - point.x, endpoint.y - point.y) <= 22);
    if (endpointNear) return true;
    return pointToSegmentDistance(point, candidate) <= 8;
  }).length;
}

function pointToSegmentDistance(point, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - segment.x1, point.y - segment.y1);
  const t = clamp(((point.x - segment.x1) * dx + (point.y - segment.y1) * dy) / lengthSquared, 0, 1);
  const x = segment.x1 + dx * t;
  const y = segment.y1 + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

function serializeAnalysisSegment(segment, index, scale, imageWidth, imageHeight) {
  const start = imagePointToSvg({ x: segment.x1 / scale, y: segment.y1 / scale }, imageWidth, imageHeight);
  const end = imagePointToSvg({ x: segment.x2 / scale, y: segment.y2 / scale }, imageWidth, imageHeight);
  return {
    id: `line-${index + 1}`,
    x1: Math.round(start.x),
    y1: Math.round(start.y),
    x2: Math.round(end.x),
    y2: Math.round(end.y),
    angle: Number(segment.angle.toFixed(1)),
    lengthPx: Number(Math.hypot(end.x - start.x, end.y - start.y).toFixed(1)),
    support: segment.support,
    votes: segment.votes,
    snappedAxis: segment.snappedAxis ?? null,
    sourceAngle: segment.sourceAngle ?? null,
  };
}

function serializeSingleLineWall(wall, index, scale, imageWidth, imageHeight) {
  return {
    id: `single-line-wall-${index + 1}`,
    confidence: Number(wall.confidence.toFixed(2)),
    reason: wall.reason,
    lineWidthAnalysisPx: Number(wall.lineWidthAnalysisPx.toFixed(2)),
    inferredWallThicknessAnalysisPx: wall.inferredWallThicknessAnalysisPx,
    inferredWallThicknessSvgPx: Number((wall.inferredWallThicknessAnalysisPx / scale).toFixed(1)),
    enclosureScore: Number(wall.enclosureScore.toFixed(2)),
    endpointConnections: wall.endpointConnections,
    centerLine: serializeAnalysisSegment(wall.centerLine, index, scale, imageWidth, imageHeight),
  };
}

function serializeWallDoubleLine(wall, index, scale, imageWidth, imageHeight) {
  return {
    id: `wall-double-${index + 1}`,
    angle: Number(wall.angle.toFixed(1)),
    wallThicknessAnalysisPx: Number(wall.distance.toFixed(1)),
    overlapAnalysisPx: Number(wall.overlap.toFixed(1)),
    centerLine: serializeAnalysisSegment(wall.centerLine, index, scale, imageWidth, imageHeight),
    lineA: serializeAnalysisSegment(wall.segmentA, index, scale, imageWidth, imageHeight),
    lineB: serializeAnalysisSegment(wall.segmentB, index, scale, imageWidth, imageHeight),
  };
}

function projectedRange(segment, axis) {
  const p1 = segment.x1 * axis.dirX + segment.y1 * axis.dirY;
  const p2 = segment.x2 * axis.dirX + segment.y2 * axis.dirY;
  return { min: Math.min(p1, p2), max: Math.max(p1, p2) };
}

function lineAxis(angleDeg) {
  const angle = (angleDeg * Math.PI) / 180;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  return { dirX, dirY, normalX: -dirY, normalY: dirX };
}

function segmentMidpoint(segment) {
  return { x: (segment.x1 + segment.x2) / 2, y: (segment.y1 + segment.y2) / 2 };
}

function closestEndpointDistance(a, b) {
  const endpointsA = [
    { x: a.x1, y: a.y1 },
    { x: a.x2, y: a.y2 },
  ];
  const endpointsB = [
    { x: b.x1, y: b.y1 },
    { x: b.x2, y: b.y2 },
  ];
  return Math.min(
    ...endpointsA.flatMap((pa) => endpointsB.map((pb) => Math.hypot(pa.x - pb.x, pa.y - pb.y))),
  );
}

function normalizeAngleDeg(angle) {
  const normalized = ((angle % 180) + 180) % 180;
  return normalized >= 180 ? normalized - 180 : normalized;
}

function angleDifferenceDeg(a, b) {
  const diff = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return Math.min(diff, 180 - diff);
}

function isPlanLineComponent(component, width, height) {
  const area = component.width * component.height;
  const density = component.count / Math.max(1, area);
  const longEnough = component.width > width * 0.06 || component.height > height * 0.06;
  const notTinyText = component.count > 18 && area > 90;
  const notHugeTitle = !(density > 0.35 && component.width < width * 0.18 && component.height < height * 0.12);
  const notBottomCaption = component.minY > height * 0.86 && component.height < height * 0.1;
  return notTinyText && longEnough && notHugeTitle && !notBottomCaption;
}

function mergePlanLineComponents(components, width, height) {
  if (!components.length) return null;
  const sorted = components.slice().sort((a, b) => b.count - a.count);
  const strong = sorted.filter((component) => component.count >= Math.max(20, sorted[0].count * 0.05));
  if (!strong.length) return null;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  strong.forEach((component) => {
    minX = Math.min(minX, component.minX);
    minY = Math.min(minY, component.minY);
    maxX = Math.max(maxX, component.maxX);
    maxY = Math.max(maxY, component.maxY);
    count += component.count;
  });
  const merged = { count, minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
  if (merged.width < width * 0.18 || merged.height < height * 0.18) return null;
  return merged;
}

function currentPlanBounds() {
  if (confirmations.planMin && confirmations.planMax) {
    const x = Math.min(confirmations.planMin.x, confirmations.planMax.x);
    const y = Math.min(confirmations.planMin.y, confirmations.planMax.y);
    const maxX = Math.max(confirmations.planMin.x, confirmations.planMax.x);
    const maxY = Math.max(confirmations.planMin.y, confirmations.planMax.y);
    return padBounds({ x, y, width: maxX - x, height: maxY - y }, 0);
  }
  return uploadedSourcePlan?.analysis?.planBoundsSvg ?? templateBounds;
}

function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const maxX = Math.max(a.x, b.x);
  const maxY = Math.max(a.y, b.y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(8, Math.round(maxX - x)),
    height: Math.max(8, Math.round(maxY - y)),
  };
}

function calibrationLengthMm() {
  return Math.max(100, Number(calibrationLengthInput?.value || scaleCalibration.lengthMm || 3000));
}

function calibrationDistancePx() {
  if (!scaleCalibration.start || !scaleCalibration.end) return 0;
  return Math.hypot(scaleCalibration.end.x - scaleCalibration.start.x, scaleCalibration.end.y - scaleCalibration.start.y);
}

function pixelsPerMm() {
  const distance = calibrationDistancePx();
  const length = calibrationLengthMm();
  return distance > 0 && length > 0 ? distance / length : null;
}

function mmToSvg(mm) {
  const ratio = pixelsPerMm();
  return ratio ? Math.max(1, Math.round(mm * ratio)) : null;
}

function serializeScaleCalibration() {
  const ratio = pixelsPerMm();
  return {
    start: scaleCalibration.start,
    end: scaleCalibration.end,
    lengthMm: calibrationLengthMm(),
    distancePx: Number(calibrationDistancePx().toFixed(2)),
    pixelsPerMm: ratio ? Number(ratio.toFixed(5)) : null,
    mmPerPixel: ratio ? Number((1 / ratio).toFixed(2)) : null,
  };
}

function serializeRoomOutlines() {
  return Object.entries(roomOutlines).map(([type, bounds]) => ({
    type,
    label: confirmationTypes[type]?.label ?? type,
    bounds,
    areaMm2: areaMm2(bounds),
  }));
}

function areaMm2(bounds) {
  const ratio = pixelsPerMm();
  if (!ratio) return null;
  return Math.round((bounds.width / ratio) * (bounds.height / ratio));
}

function svgPointFromEvent(event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvasBounds.width,
    y: ((event.clientY - rect.top) / rect.height) * canvasBounds.height,
  };
}

function setActiveConfirmationType(type) {
  activeConfirmationType = activeConfirmationType === type ? null : type;
  activeCalibrationPoint = null;
  activeOutlineType = null;
  pendingOutlineStart = null;
  renderConfirmationPanel();
}

function setActiveCalibrationPoint(pointType) {
  activeCalibrationPoint = activeCalibrationPoint === pointType ? null : pointType;
  activeConfirmationType = null;
  activeOutlineType = null;
  pendingOutlineStart = null;
  renderConfirmationPanel();
}

function setScaleCalibrationPoint(pointType, point) {
  scaleCalibration = {
    ...scaleCalibration,
    [pointType]: { x: Math.round(point.x), y: Math.round(point.y) },
    lengthMm: calibrationLengthMm(),
  };
  activeCalibrationPoint = null;
  renderConfirmationPanel();
  if (latestResult) {
    generateLayout();
  } else {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已完成尺寸标定，可继续确认房间轮廓或生成布置" : "等待上传原平面图");
  }
}

function setActiveOutlineType(type) {
  activeOutlineType = activeOutlineType === type ? null : type;
  activeConfirmationType = null;
  activeCalibrationPoint = null;
  pendingOutlineStart = null;
  renderConfirmationPanel();
}

function setRoomOutlinePoint(type, point) {
  const normalizedPoint = { x: Math.round(point.x), y: Math.round(point.y) };
  if (!pendingOutlineStart) {
    pendingOutlineStart = normalizedPoint;
    renderConfirmationPanel();
    drawSourceOnlyCanvas();
    return;
  }
  roomOutlines[type] = rectFromPoints(pendingOutlineStart, normalizedPoint);
  pendingOutlineStart = null;
  activeOutlineType = null;
  renderConfirmationPanel();
  if (latestResult) {
    generateLayout();
  } else {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已确认房间轮廓，可继续确认或生成布置" : "等待上传原平面图");
  }
}

function setConfirmationPoint(type, point) {
  const matchedRoom = ["kitchen", "bath", "living", "bedroom", "balcony"].includes(type)
    ? nearestRoomForPoint(roomCandidates(currentPlanBounds()), point)
    : null;
  confirmations[type] = {
    x: Math.round(point.x),
    y: Math.round(point.y),
    roomId: matchedRoom?.id ?? null,
  };
  activeConfirmationType = null;
  renderConfirmationPanel();
  if (latestResult) {
    generateLayout();
  } else {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已确认关键点，可继续确认或生成布置" : "等待上传原平面图");
  }
}

function drawConfirmationMarkers() {
  const entries = confirmationEntries();
  if (!entries.length) return;
  const group = el("g", { id: "confirmationMarkers" });
  entries.forEach(({ point, config }) => {
    group.appendChild(el("circle", { cx: point.x, cy: point.y, r: 12, fill: config.color, class: "confirmation-marker" }));
    addText(group, config.label, point.x, point.y - 18, "confirmation-marker-label");
  });
  svg.appendChild(group);
}

function drawNoPlaceZones(noPlaceZones = makeNoPlaceZones(currentPlanBounds())) {
  if (!noPlaceZones.length) return;
  const group = el("g", { id: "noPlaceZones" });
  noPlaceZones.forEach((zone) => {
    group.appendChild(el("rect", { x: zone.x, y: zone.y, width: zone.width, height: zone.height, rx: 6, class: "no-place-zone" }));
    addText(group, zone.label, zone.x + zone.width / 2, zone.y + zone.height / 2, "confirmation-marker-label");
  });
  svg.appendChild(group);
}

function drawConfirmationAreas(areas = confirmationAreas(currentPlanBounds())) {
  if (!areas.length) return;
  const group = el("g", { id: "confirmationAreas" });
  areas.forEach((area) => {
    group.appendChild(el("rect", { x: area.x, y: area.y, width: area.width, height: area.height, rx: 6, class: "confirmation-area" }));
  });
  svg.appendChild(group);
}

function drawRoomOutlines() {
  const entries = Object.entries(roomOutlines);
  if (!entries.length && !pendingOutlineStart) return;
  const group = el("g", { id: "manualRoomOutlines" });
  entries.forEach(([type, bounds]) => {
    group.appendChild(
      el("rect", {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        rx: 6,
        class: "manual-room-outline",
      }),
    );
    addText(group, `${confirmationTypes[type]?.label ?? type}轮廓`, bounds.x + bounds.width / 2, bounds.y + 18, "confirmation-marker-label");
  });
  if (pendingOutlineStart) {
    group.appendChild(el("circle", { cx: pendingOutlineStart.x, cy: pendingOutlineStart.y, r: 9, class: "calibration-point" }));
    addText(group, "轮廓起点", pendingOutlineStart.x, pendingOutlineStart.y - 16, "confirmation-marker-label");
  }
  svg.appendChild(group);
}

function drawScaleCalibration() {
  if (!scaleCalibration.start && !scaleCalibration.end) return;
  const group = el("g", { id: "scaleCalibration" });
  if (scaleCalibration.start) {
    group.appendChild(el("circle", { cx: scaleCalibration.start.x, cy: scaleCalibration.start.y, r: 8, class: "calibration-point" }));
    addText(group, "标定起点", scaleCalibration.start.x, scaleCalibration.start.y - 16, "calibration-label");
  }
  if (scaleCalibration.end) {
    group.appendChild(el("circle", { cx: scaleCalibration.end.x, cy: scaleCalibration.end.y, r: 8, class: "calibration-point" }));
    addText(group, "标定终点", scaleCalibration.end.x, scaleCalibration.end.y - 16, "calibration-label");
  }
  if (scaleCalibration.start && scaleCalibration.end) {
    group.appendChild(
      el("line", {
        x1: scaleCalibration.start.x,
        y1: scaleCalibration.start.y,
        x2: scaleCalibration.end.x,
        y2: scaleCalibration.end.y,
        class: "calibration-line",
      }),
    );
    addText(
      group,
      `${calibrationLengthMm()}mm`,
      (scaleCalibration.start.x + scaleCalibration.end.x) / 2,
      (scaleCalibration.start.y + scaleCalibration.end.y) / 2 - 10,
      "calibration-label",
    );
  }
  svg.appendChild(group);
}

function drawHoughWallGeometry() {
  const hough = uploadedSourcePlan?.analysis?.hough;
  if (!hough) return;
  const group = el("g", { id: "houghWallGeometry" });
  (hough.mergedLineSegments ?? []).slice(0, 90).forEach((line) => {
    group.appendChild(el("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "hough-line" }));
  });
  (hough.contourSupplementSegments ?? []).slice(0, 80).forEach((line) => {
    group.appendChild(el("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "contour-wall-fill" }));
  });
  (hough.wallDoubleLines ?? []).slice(0, 80).forEach((wall) => {
    group.appendChild(el("line", { x1: wall.lineA.x1, y1: wall.lineA.y1, x2: wall.lineA.x2, y2: wall.lineA.y2, class: "wall-double-line" }));
    group.appendChild(el("line", { x1: wall.lineB.x1, y1: wall.lineB.y1, x2: wall.lineB.x2, y2: wall.lineB.y2, class: "wall-double-line" }));
  });
  (hough.singleLineWalls ?? []).slice(0, 80).forEach((wall) => {
    const line = wall.centerLine;
    group.appendChild(
      el("line", {
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        class: "single-line-wall",
        "stroke-width": Math.round(clamp(wall.inferredWallThicknessSvgPx, 4, 18)),
      }),
    );
  });
  svg.appendChild(group);
}

function drawStructuralWallModel() {
  const model = uploadedSourcePlan?.analysis?.structuralWallModel;
  if (!model) return;
  const group = el("g", { id: "structuralWallModel" });
  if (model.footprint?.polygon) {
    group.appendChild(el("polygon", { points: model.footprint.polygon, class: "structural-footprint" }));
    addText(
      group,
      `户型外轮廓 ${Math.round((model.footprint.confidence ?? 0) * 100)}%`,
      model.footprint.bounds.x + model.footprint.bounds.width / 2,
      model.footprint.bounds.y + 18,
      "structural-footprint-label",
    );
  }
  (model.roomPolygons ?? []).forEach((room) => {
    group.appendChild(el("polygon", { points: room.polygon, class: "structural-room-polygon" }));
    addText(
      group,
      `${room.label} ${Math.round((room.confidence ?? 0) * 100)}%`,
      room.bounds.x + room.bounds.width / 2,
      room.bounds.y + room.bounds.height / 2,
      "structural-room-label",
    );
  });
  (model.centerLines ?? []).forEach((line) => {
    group.appendChild(
      el("line", {
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        class: `structural-wall-centerline${line.score < 0.66 ? " low-confidence" : ""}`,
      }),
    );
  });
  svg.appendChild(group);
}

function drawSpaceRegions() {
  const spaceRegions = uploadedSourcePlan?.analysis?.spaceRegions;
  if (!spaceRegions?.regions?.length) return;
  const palette = ["#73c9b7", "#8eb7e8", "#e9be72", "#c9a5e8", "#93d27c", "#e89595", "#81c7dc", "#d4cf73"];
  const group = el("g", { id: "spaceRegions" });
  spaceRegions.regions.slice(0, 24).forEach((region, index) => {
    const color = palette[index % palette.length];
    group.appendChild(
      el("rect", {
        x: Math.round(region.bounds.x),
        y: Math.round(region.bounds.y),
        width: Math.round(region.bounds.width),
        height: Math.round(region.bounds.height),
        rx: 6,
        class: "space-region",
        fill: color,
      }),
    );
    addText(group, `${region.label} ${region.areaSvgPx2}`, region.centroid.x, region.centroid.y, "space-region-label");
  });
  svg.appendChild(group);
}

function drawAiRecognitionOverlay() {
  const recognition = aiRecognitionResult ?? uploadedSourcePlan?.aiRecognition ?? uploadedSourcePlan?.analysis?.aiRecognition;
  if (!recognition) return;
  const group = el("g", { id: "aiRecognitionOverlay" });
  (recognition.rooms ?? []).forEach((room) => {
    group.appendChild(el("polygon", { points: room.polygon ?? rectanglePolygon(room.bounds), class: "ai-room-mask" }));
    addText(
      group,
      `${room.label ?? room.type} ${Math.round((room.confidence ?? 0) * 100)}%`,
      room.bounds.x + room.bounds.width / 2,
      room.bounds.y + room.bounds.height / 2,
      "ai-recognition-label",
    );
  });
  (recognition.walls ?? []).slice(0, 70).forEach((wall) => {
    const line = wall.line;
    group.appendChild(el("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "ai-wall-line" }));
  });
  (recognition.doors ?? []).forEach((door) => {
    const line = door.line;
    group.appendChild(el("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "ai-door-line" }));
  });
  (recognition.windows ?? []).forEach((windowItem) => {
    const line = windowItem.line;
    group.appendChild(el("line", { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "ai-window-line" }));
  });
  (recognition.fixtures ?? []).forEach((fixture) => {
    group.appendChild(
      el("rect", {
        x: fixture.bounds.x,
        y: fixture.bounds.y,
        width: fixture.bounds.width,
        height: fixture.bounds.height,
        rx: 5,
        class: "ai-fixture",
      }),
    );
    addText(
      group,
      fixture.label,
      fixture.bounds.x + fixture.bounds.width / 2,
      fixture.bounds.y + fixture.bounds.height / 2,
      "ai-recognition-label",
    );
  });
  svg.appendChild(group);
}

function drawRoomCandidates(candidates = roomCandidates(currentPlanBounds())) {
  if (!uploadedSourcePlan || !candidates.length) return;
  const confirmedRoomIds = new Set(Object.values(confirmations).map((point) => point?.roomId).filter(Boolean));
  const group = el("g", { id: "roomCandidates" });
  candidates.forEach((room) => {
    group.appendChild(
      el("rect", {
        x: room.bounds.x,
        y: room.bounds.y,
        width: room.bounds.width,
        height: room.bounds.height,
        rx: 6,
        class: `room-candidate${confirmedRoomIds.has(room.id) ? " confirmed" : ""}`,
      }),
    );
  });
  svg.appendChild(group);
}

function renderConfirmationPanel() {
  confirmTools?.querySelectorAll("[data-confirm-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.confirmType === activeConfirmationType);
  });
  calibrationTools?.querySelectorAll("[data-calibration-point]").forEach((button) => {
    button.classList.toggle("active", button.dataset.calibrationPoint === activeCalibrationPoint);
  });
  outlineTools?.querySelectorAll("[data-outline-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.outlineType === activeOutlineType);
  });
  const entries = confirmationEntries();
  const outlineEntries = serializeRoomOutlines();
  updateMeasurementStatus();
  if (mvpStatus) {
    if (activeCalibrationPoint) {
      mvpStatus.textContent = `请在画布上点击尺寸标定${activeCalibrationPoint === "start" ? "起点" : "终点"}。`;
    } else if (activeOutlineType) {
      mvpStatus.textContent = pendingOutlineStart
        ? `请在画布上点击“${confirmationTypes[activeOutlineType].label}”轮廓对角点。`
        : `请在画布上点击“${confirmationTypes[activeOutlineType].label}”轮廓第一点。`;
    } else if (activeConfirmationType) {
      mvpStatus.textContent = `请在画布上点击“${confirmationTypes[activeConfirmationType].label}”位置。`;
    } else if (confirmations.planMin && !confirmations.planMax) {
      mvpStatus.textContent = "已确认平面左上，请继续确认平面右下。";
    } else if (confirmations.planMax && !confirmations.planMin) {
      mvpStatus.textContent = "已确认平面右下，请继续确认平面左上。";
    } else if (entries.length || outlineEntries.length) {
      mvpStatus.textContent = `已确认 ${entries.length} 个关键点、${outlineEntries.length} 个房间轮廓，可继续确认或生成方案。`;
    } else {
      mvpStatus.textContent = "上传平面图后，先确认入户门、厨房、卫生间等关键点。";
    }
  }
  confirmationList?.replaceChildren(
    ...entries.map(({ type, point, config }) => {
      const item = document.createElement("div");
      item.className = "confirmation-item";
      const label = document.createElement("span");
      label.textContent = config.label;
      const actions = document.createElement("div");
      actions.className = "confirmation-actions";
      const coords = document.createElement("strong");
      coords.textContent = point.roomId ? `${point.roomId}` : `${Math.round(point.x)}, ${Math.round(point.y)}`;
      actions.appendChild(coords);
      if (["kitchen", "bath", "living", "bedroom", "balcony"].includes(type)) {
        const shrink = document.createElement("button");
        shrink.type = "button";
        shrink.textContent = "缩小";
        shrink.dataset.areaAdjust = "-1";
        shrink.dataset.confirmType = type;
        const grow = document.createElement("button");
        grow.type = "button";
        grow.textContent = "扩大";
        grow.dataset.areaAdjust = "1";
        grow.dataset.confirmType = type;
        actions.append(shrink, grow);
      }
      item.dataset.confirmType = type;
      item.append(label, actions);
      return item;
    }),
    ...outlineEntries.map((outline) => {
      const item = document.createElement("div");
      item.className = "confirmation-item";
      const label = document.createElement("span");
      label.textContent = `${outline.label}轮廓`;
      const actions = document.createElement("div");
      actions.className = "confirmation-actions";
      const coords = document.createElement("strong");
      coords.textContent = `${outline.bounds.width} x ${outline.bounds.height}`;
      actions.appendChild(coords);
      item.append(label, actions);
      return item;
    }),
  );
}

function updateMeasurementStatus() {
  if (scaleCalibration.lengthMm !== calibrationLengthMm()) {
    scaleCalibration.lengthMm = calibrationLengthMm();
  }
  const ratio = pixelsPerMm();
  if (calibrationStatus) {
    calibrationStatus.textContent = ratio
      ? `已标定：${calibrationLengthMm()}mm = ${calibrationDistancePx().toFixed(1)}px，1px ≈ ${(1 / ratio).toFixed(1)}mm。`
      : "未标定时，家具仍按功能区比例换算。";
  }
  if (outlineStatus) {
    const count = Object.keys(roomOutlines).length;
    outlineStatus.textContent = pendingOutlineStart
      ? "已选择轮廓第一点，请继续点击对角点。"
      : count
        ? `已确认 ${count} 个房间轮廓，生成时优先使用手动轮廓。`
        : "点击一个轮廓按钮后，在画布上点左上和右下两点。";
  }
}

function adjustConfirmationArea(type, direction) {
  const current = confirmationAreaScales[type] ?? 1;
  confirmationAreaScales[type] = Number(clamp(current + direction * 0.18, 0.55, 2.2).toFixed(2));
  renderConfirmationPanel();
  if (latestResult) {
    generateLayout();
  } else {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已调整确认区域，可继续确认或生成布置" : "等待上传原平面图");
  }
}

function buildPlanModel(layoutRooms, planBounds) {
  return {
    type: "structured-floor-plan",
    coordinateSystem: "svg-1000x1040",
    recognitionMode: uploadedSourcePlan?.analysis?.mode ?? "template",
    layoutMode: confirmationEntries().some(({ type }) => ["kitchen", "bath", "living", "bedroom", "balcony"].includes(type))
      ? "confirmation-driven"
      : "template-adaptive",
    furnitureScaleBasis: "generated-plan-and-confirmation-area",
    scaleCalibration: serializeScaleCalibration(),
    aiRecognition: serializeAiRecognition(),
    structuralWallModel: uploadedSourcePlan?.analysis?.structuralWallModel ?? null,
    planBounds,
    confirmations: serializeConfirmations(),
    roomOutlines: serializeRoomOutlines(),
    noPlaceZones: makeNoPlaceZones(planBounds),
    confirmationAreas: confirmationAreas(planBounds),
    roomCandidates: roomCandidates(planBounds).map((room) => ({
      id: room.id,
      type: room.type,
      bounds: room.bounds,
    })),
    rooms: layoutRooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      polygon: room.polygon
        .split(" ")
        .map((point) => point.split(",").map((value) => Number(value))),
      bounds: room.bounds,
      reason: room.reason,
    })),
    openings: openings.map((opening, index) => ({
      id: `opening-${index + 1}`,
      label: opening.label,
      line: [transformPoint(opening.x1, opening.y1, planBounds), transformPoint(opening.x2, opening.y2, planBounds)],
    })),
  };
}

function scoreScheme(furniture, risks, planBounds, scheme) {
  const area = Math.max(1, planBounds.width * planBounds.height);
  const furnitureArea = furniture.reduce((sum, item) => sum + item.width * item.height, 0);
  const density = furnitureArea / area;
  const storageCount = furniture.filter((item) => /柜|cabinet|wardrobe|storage/i.test(`${item.id} ${item.label}`)).length;
  const workCount = furniture.filter((item) => /桌|desk|work/i.test(`${item.id} ${item.label}`)).length;
  const riskPenalty = risks.length * 12 * (scheme.weights.clearance ?? 1);
  const densityPenalty = Math.max(0, density - 0.3) * 150;
  const countPenalty = Math.max(0, furniture.length - 24) * 1.2;
  const storageBonus = Math.min(8, storageCount * 0.55 * (scheme.weights.storage ?? 1));
  const workBonus = Math.min(7, workCount * 0.65 * (scheme.weights.work ?? 1));
  const comfortBonus = scheme.id === "comfort" ? 3 : scheme.id === "family" ? 2 : 0;
  const score = Math.round(clamp(88 - riskPenalty - densityPenalty - countPenalty + storageBonus + workBonus + comfortBonus, 0, 98));
  return { score, density: Number(density.toFixed(3)), storageCount, workCount };
}

function drawFurniture(furniture, risks) {
  const clearanceGroup = el("g", { id: "clearances" });
  furniture.forEach((item) => {
    const box = clearanceBox(item);
    clearanceGroup.appendChild(el("rect", { x: box.x, y: box.y, width: box.width, height: box.height, rx: 4, class: "clearance" }));
  });
  svg.appendChild(clearanceGroup);

  const furnitureGroup = el("g", { id: "furniture" });
  furniture.forEach((item) => {
    const group = el("g", {
      transform: item.rotate ? `rotate(${item.rotate} ${item.x + item.width / 2} ${item.y + item.height / 2})` : null,
    });
    group.appendChild(el("rect", { x: item.x, y: item.y, width: item.width, height: item.height, rx: 6, class: `furniture ${item.kind}` }));
    addText(group, item.label, item.x + item.width / 2, item.y + item.height / 2, "furniture-label");
    furnitureGroup.appendChild(group);
  });
  svg.appendChild(furnitureGroup);

  const riskGroup = el("g", { id: "risks" });
  risks.forEach((risk) => {
    riskGroup.appendChild(el("rect", { x: risk.box.x, y: risk.box.y, width: risk.box.width, height: risk.box.height, rx: 4, class: "risk" }));
  });
  svg.appendChild(riskGroup);
  if (!showStructuralWallInput?.checked) drawRoomCandidates(latestResult?.roomCandidates ?? roomCandidates(currentPlanBounds()));
  drawConfirmationAreas(latestResult?.confirmationAreas ?? confirmationAreas(currentPlanBounds()));
  if (showStructuralWallInput?.checked) {
    drawStructuralWallModel();
  } else {
    drawSpaceRegions();
    drawHoughWallGeometry();
  }
  drawAiRecognitionOverlay();
  drawRoomOutlines();
  drawScaleCalibration();
  drawNoPlaceZones(latestResult?.noPlaceZones ?? makeNoPlaceZones(currentPlanBounds()));
  drawConfirmationMarkers();
}

function updateInspector(result) {
  roomCount.textContent = String(result.rooms.length);
  furnitureCount.textContent = String(result.furniture.length);
  riskCount.textContent = String(result.risks.length);
  renderSchemeList();

  strategyList.replaceChildren(
    ...[
      `当前方案：${result.scheme.name}，评分 ${result.metrics.score}。`,
      result.scheme.description,
      "上传图先识别有效平面范围，再生成结构化房间模型。",
      `已使用 ${result.confirmations.length} 个用户确认点和 ${result.noPlaceZones.length} 个禁放区。`,
      "每套方案独立增删家具、评估通行风险、收纳量和工作位。",
      "点击方案卡片可切换预览，导出 JSON 会保留所有候选方案。",
    ].map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }),
  );

  roomList.replaceChildren(
    ...result.rooms.map((room) => {
      const item = document.createElement("article");
      item.className = "room-item";
      const title = document.createElement("strong");
      title.textContent = room.name;
      const count = document.createElement("span");
      count.textContent = `${result.furniture.filter((furniture) => furniture.roomId === room.id).length} 件`;
      const reason = document.createElement("small");
      reason.textContent = room.reason;
      item.append(title, count, reason);
      return item;
    }),
  );

  resultJson.textContent = JSON.stringify(result, null, 2);
}

function renderSchemeList() {
  if (!generatedSchemes.length) {
    schemeList?.replaceChildren();
    schemeTabs?.replaceChildren();
    if (schemeStripStatus) schemeStripStatus.textContent = "生成后可在这里切换多个方案";
    return;
  }
  if (schemeStripStatus) {
    schemeStripStatus.textContent = `已生成 ${generatedSchemes.length} 套方案，当前：${latestResult.scheme.name}`;
  }
  const makeButton = (result, compact = false) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${compact ? "scheme-tab" : "scheme-card"}${latestResult?.scheme.id === result.scheme.id ? " active" : ""}`;
    button.dataset.schemeId = result.scheme.id;
    const title = document.createElement("strong");
    title.textContent = `${result.scheme.name} · ${result.metrics.score}分`;
    const detail = document.createElement("span");
    detail.textContent = compact
      ? `${result.furniture.length}件 / 风险${result.risks.length}`
      : `${result.furniture.length} 件家具 / ${result.risks.length} 个风险 / 收纳 ${result.metrics.storageCount} / 工作位 ${result.metrics.workCount}`;
    button.append(title, detail);
    return button;
  };
  schemeList?.replaceChildren(...generatedSchemes.map((result) => makeButton(result)));
  schemeTabs?.replaceChildren(...generatedSchemes.map((result) => makeButton(result, true)));
}

function selectScheme(schemeId) {
  const next = generatedSchemes.find((result) => result.scheme.id === schemeId);
  if (!next) return;
  latestResult = next;
  drawBasePlan(latestResult.rooms);
  drawFurniture(latestResult.furniture, latestResult.risks);
  updateInspector(latestResult);
  exportButton.disabled = false;
}

function resetResultPanel(message = "等待生成家具布置") {
  roomCount.textContent = "0";
  furnitureCount.textContent = "0";
  riskCount.textContent = "0";
  strategyList.replaceChildren();
  roomList.replaceChildren();
  schemeList?.replaceChildren();
  schemeTabs?.replaceChildren();
  if (schemeStripStatus) schemeStripStatus.textContent = message;
  resultJson.textContent = JSON.stringify(
    {
      title: "测试生成平面布置图",
      status: message,
      sourcePlan: currentSourcePlanMeta(),
      scaleCalibration: serializeScaleCalibration(),
      aiRecognition: serializeAiRecognition(),
      structuralWallModel: uploadedSourcePlan?.analysis?.structuralWallModel ?? null,
      roomOutlines: serializeRoomOutlines(),
      rooms: [],
      furniture: [],
      risks: [],
    },
    null,
    2,
  );
  exportButton.disabled = true;
}

function updateSourcePlanStatus() {
  if (!sourcePlanStatus) return;
  if (!uploadedSourcePlan) {
    sourcePlanStatus.textContent = "尚未上传原平面图";
    clearSourcePlanButton.disabled = true;
    return;
  }
  const bounds = uploadedSourcePlan.analysis?.planBoundsSvg;
  const analysisText = bounds ? ` · 有效平面 ${bounds.width} x ${bounds.height}` : "";
  const preprocessing = uploadedSourcePlan.analysis?.preprocessing;
  const denoiseText = preprocessing?.denoise ? ` · NLM降噪 ${preprocessing.denoise.strength}` : "";
  const frequencyText = preprocessing?.frequencyFilter
    ? ` · 周期滤波${preprocessing.frequencyFilter.applied ? "已启用" : "未触发"}`
    : "";
  const sharpenText = preprocessing?.sharpening ? ` · 拉普拉斯锐化 ${preprocessing.sharpening.laplacianAmount}` : "";
  const binaryText = preprocessing
    ? `${denoiseText}${frequencyText}${sharpenText} · 二值阈值 ${preprocessing.threshold} / 黑像素 ${(preprocessing.darkPixelRatio * 100).toFixed(1)}%`
    : "";
  const hough = uploadedSourcePlan.analysis?.hough?.parameters;
  const houghText = hough
    ? ` · 霍夫线 ${hough.mergedSegmentCount} / 补线 ${hough.contourSupplementSegmentCount ?? 0} / 正交墙 ${hough.orthogonalWallSegmentCount ?? 0} / 双线墙 ${hough.wallDoubleLineCount} / 单线墙 ${hough.singleLineWallCount ?? 0}`
    : "";
  const spaces = uploadedSourcePlan.analysis?.spaceRegions?.parameters;
  const spaceText = spaces ? ` · 空间 ${spaces.regionCount} / 邻接 ${spaces.adjacencyCount}` : "";
  const structural = uploadedSourcePlan.analysis?.structuralWallModel?.parameters;
  const footprint = uploadedSourcePlan.analysis?.structuralWallModel?.footprint;
  const structuralText = structural
    ? ` · 结构墙 ${structural.centerLineCount} / 外轮廓 ${footprint ? Math.round(footprint.areaSvgPx2) : 0} / 闭合房间 ${structural.roomPolygonCount} / 过滤 ${structural.discardedCandidateCount}`
    : "";
  sourcePlanStatus.textContent = `${uploadedSourcePlan.name} · ${uploadedSourcePlan.width} x ${uploadedSourcePlan.height}${analysisText}${binaryText}${houghText}${spaceText}${structuralText} · 已作为底图叠加`;
  clearSourcePlanButton.disabled = false;
}

function currentSourcePlanMeta() {
  return uploadedSourcePlan
    ? {
        name: uploadedSourcePlan.name,
        width: uploadedSourcePlan.width,
        height: uploadedSourcePlan.height,
        visible: showSourcePlanInput.checked,
        binaryVisible: Boolean(showBinaryPlanInput?.checked),
        structuralWallModeVisible: Boolean(showStructuralWallInput?.checked),
        opacity: Number(sourceOpacityInput.value || 0) / 100,
        analysis: uploadedSourcePlan.analysis
          ? {
              mode: uploadedSourcePlan.analysis.mode,
              preprocessing: uploadedSourcePlan.analysis.preprocessing,
              hough: uploadedSourcePlan.analysis.hough,
              spaceRegions: uploadedSourcePlan.analysis.spaceRegions,
              structuralWallModel: uploadedSourcePlan.analysis.structuralWallModel,
              aiRecognition: serializeAiRecognition(),
              imageBounds: uploadedSourcePlan.analysis.imageBounds,
              displayBounds: uploadedSourcePlan.analysis.displayBounds,
              planBoundsSvg: uploadedSourcePlan.analysis.planBoundsSvg,
            }
          : null,
      }
    : null;
}

function renderLatestLayout() {
  if (!latestResult) {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已上传原图，等待生成家具布置" : "等待上传原平面图");
    return;
  }
  const sourcePlan = currentSourcePlanMeta();
  generatedSchemes.forEach((result) => {
    result.sourcePlan = sourcePlan;
    if (result.planModel) result.planModel.aiRecognition = serializeAiRecognition();
  });
  latestResult.sourcePlan = sourcePlan;
  if (latestResult.planModel) latestResult.planModel.aiRecognition = serializeAiRecognition();
  drawBasePlan(latestResult.rooms);
  drawFurniture(latestResult.furniture, latestResult.risks);
  updateInspector(latestResult);
}

function generateLayout() {
  const baseStyle = styleSelect.value;
  const planBounds = currentPlanBounds();
  const generatedRooms = applyConfirmationsToRooms(createRoomsForPlan(planBounds));
  const noPlaceZones = makeNoPlaceZones(planBounds);
  const semanticAreas = confirmationAreas(planBounds);
  const candidates = roomCandidates(planBounds);
  const planModel = buildPlanModel(generatedRooms, planBounds);
  generatedSchemes = layoutSchemes
    .map((scheme) => {
      const style = scheme.id === "comfort" || scheme.id === "compact" ? scheme.style : baseStyle;
      const rawFurniture = generateConfirmedFurniture(style, planBounds, scheme) ?? generateFurniture(style, planBounds, scheme);
      const furniture = applyLayoutConstraints(rawFurniture, planBounds, generatedRooms, noPlaceZones);
      const risks = evaluateRisks(furniture);
      const metrics = scoreScheme(furniture, risks, planBounds, scheme);
      return {
        title: "测试生成平面布置图",
        source: "user-provided-wall-plan",
        generationIndex,
        style,
        scheme: {
          id: scheme.id,
          name: scheme.name,
          description: scheme.description,
          weights: scheme.weights,
        },
        metrics,
        planBounds,
        sourcePlan: currentSourcePlanMeta(),
        scaleCalibration: serializeScaleCalibration(),
        confirmations: serializeConfirmations(),
        roomOutlines: serializeRoomOutlines(),
        noPlaceZones,
        confirmationAreas: semanticAreas,
        roomCandidates: candidates,
        planModel,
        rooms: generatedRooms,
        furniture,
        risks,
      };
    })
    .sort((a, b) => b.metrics.score - a.metrics.score);
  latestResult = generatedSchemes[0];
  generationIndex += 1;
  drawBasePlan(latestResult.rooms);
  drawFurniture(latestResult.furniture, latestResult.risks);
  updateInspector(latestResult);
  exportButton.disabled = false;
}

function loadSourcePlan(file) {
  if (!file) return;
  if (!file.type.startsWith("image/") && !/\.(svg|png|jpe?g|webp)$/i.test(file.name)) {
    sourcePlanStatus.textContent = "请选择 PNG、JPG、WebP 或 SVG 原平面图";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || "");
    const image = new Image();
    image.onload = () => {
      aiRecognitionResult = null;
      uploadedSourcePlan = {
        name: file.name,
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0,
        dataUrl,
        analysis: analyzeSourcePlanImage(image),
      };
      uploadedSourcePlan.binaryDataUrl = uploadedSourcePlan.analysis?.binaryDataUrl ?? null;
      updateSourcePlanStatus();
      updateAiRecognitionStatus();
      latestResult = null;
      generatedSchemes = [];
      confirmations = {};
      confirmationAreaScales = {};
      scaleCalibration = { start: null, end: null, lengthMm: calibrationLengthMm() };
      roomOutlines = {};
      activeConfirmationType = null;
      activeCalibrationPoint = null;
      activeOutlineType = null;
      pendingOutlineStart = null;
      renderConfirmationPanel();
      updateSourcePlanPreview();
      drawSourceOnlyCanvas();
      resetResultPanel("已上传原图，等待生成家具布置");
    };
    image.onerror = () => {
      sourcePlanStatus.textContent = "原平面图读取失败，请换一张图片测试";
    };
    image.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function exportResult() {
  if (!latestResult) return;
  const payload = {
    selectedSchemeId: latestResult.scheme.id,
    selected: latestResult,
    schemes: generatedSchemes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `furniture-layout-${latestResult.scheme.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

sourcePlanInput.addEventListener("change", (event) => {
  loadSourcePlan(event.target.files?.[0]);
});
confirmTools?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-confirm-type]");
  if (!button) return;
  if (!uploadedSourcePlan) {
    if (mvpStatus) mvpStatus.textContent = "请先上传平面图，再确认关键空间。";
    return;
  }
  setActiveConfirmationType(button.dataset.confirmType);
});
calibrationTools?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-calibration-point]");
  if (!button) return;
  if (!uploadedSourcePlan) {
    if (mvpStatus) mvpStatus.textContent = "请先上传平面图，再进行尺寸标定。";
    return;
  }
  setActiveCalibrationPoint(button.dataset.calibrationPoint);
});
calibrationLengthInput?.addEventListener("change", () => {
  scaleCalibration.lengthMm = calibrationLengthMm();
  renderConfirmationPanel();
  if (latestResult) {
    generateLayout();
  } else {
    drawSourceOnlyCanvas();
    resetResultPanel(uploadedSourcePlan ? "已更新标定长度，可继续确认或生成布置" : "等待上传原平面图");
  }
});
outlineTools?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-outline-type]");
  if (!button) return;
  if (!uploadedSourcePlan) {
    if (mvpStatus) mvpStatus.textContent = "请先上传平面图，再确认房间轮廓。";
    return;
  }
  setActiveOutlineType(button.dataset.outlineType);
});
confirmationList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-area-adjust]");
  if (!button) return;
  event.stopPropagation();
  adjustConfirmationArea(button.dataset.confirmType, Number(button.dataset.areaAdjust));
});
svg.addEventListener("click", (event) => {
  const point = svgPointFromEvent(event);
  if (activeCalibrationPoint) {
    setScaleCalibrationPoint(activeCalibrationPoint, point);
    return;
  }
  if (activeOutlineType) {
    setRoomOutlinePoint(activeOutlineType, point);
    return;
  }
  if (!activeConfirmationType) return;
  setConfirmationPoint(activeConfirmationType, point);
});
showSourcePlanInput.addEventListener("change", renderLatestLayout);
showBinaryPlanInput?.addEventListener("change", renderLatestLayout);
showStructuralWallInput?.addEventListener("change", renderLatestLayout);
sourceOpacityInput.addEventListener("input", renderLatestLayout);
schemeList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scheme-id]");
  if (!button) return;
  selectScheme(button.dataset.schemeId);
});
schemeTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scheme-id]");
  if (!button) return;
  selectScheme(button.dataset.schemeId);
});
clearSourcePlanButton.addEventListener("click", () => {
  uploadedSourcePlan = null;
  aiRecognitionResult = null;
  latestResult = null;
  generatedSchemes = [];
  confirmations = {};
  confirmationAreaScales = {};
  scaleCalibration = { start: null, end: null, lengthMm: calibrationLengthMm() };
  roomOutlines = {};
  activeConfirmationType = null;
  activeCalibrationPoint = null;
  activeOutlineType = null;
  pendingOutlineStart = null;
  sourcePlanInput.value = "";
  renderConfirmationPanel();
  updateSourcePlanPreview();
  updateSourcePlanStatus();
  updateAiRecognitionStatus();
  drawEmptyCanvas();
  resetResultPanel("等待上传原平面图");
});
clearConfirmationsButton?.addEventListener("click", () => {
  confirmations = {};
  confirmationAreaScales = {};
  scaleCalibration = { start: null, end: null, lengthMm: calibrationLengthMm() };
  roomOutlines = {};
  activeConfirmationType = null;
  activeCalibrationPoint = null;
  activeOutlineType = null;
  pendingOutlineStart = null;
  generatedSchemes = [];
  latestResult = null;
  renderConfirmationPanel();
  drawSourceOnlyCanvas();
  resetResultPanel(uploadedSourcePlan ? "已清空确认，可重新确认关键空间" : "等待上传原平面图");
});
regenerateButton.addEventListener("click", generateLayout);
runAiRecognitionButton?.addEventListener("click", runAiRecognition);
openAnnotationToolButton?.addEventListener("click", openAnnotationTool);
closeAnnotationToolButton?.addEventListener("click", closeAnnotationTool);
annotationToolOverlay?.addEventListener("click", (event) => {
  if (event.target === annotationToolOverlay) closeAnnotationTool();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && annotationToolOverlay && !annotationToolOverlay.hidden) {
    closeAnnotationTool();
  }
});
styleSelect.addEventListener("change", () => {
  if (latestResult) {
    generateLayout();
    return;
  }
  renderLatestLayout();
});
exportButton.addEventListener("click", exportResult);

updateSourcePlanStatus();
updateAiRecognitionStatus();
updateSourcePlanPreview();
renderConfirmationPanel();
drawEmptyCanvas();
resetResultPanel("等待上传原平面图");
