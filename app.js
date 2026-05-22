const rooms = {
  living: {
    title: "客餐厅 DFC 模型",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=82",
    notes: ["墙面构件绑定木饰面规格，变更后自动反算面积。", "电视墙预留槽位已同步到施工节点和采购清单。"],
    materials: [
      {
        name: "木饰面构件",
        area: "电视墙 / 玄关",
        brand: "ENF 暖灰橡木 / 可替代",
        qty: "42 m²",
        budget: 28600,
        status: "pending",
      },
      {
        name: "地面面层",
        area: "地面通铺",
        brand: "微水泥 BM03 / 模型量取",
        qty: "61 m²",
        budget: 48200,
        status: "approved",
      },
      {
        name: "成品软装包",
        area: "客厅",
        brand: "模块沙发 + 边几 + 地毯",
        qty: "1 套",
        budget: 16800,
        status: "review",
      },
      {
        name: "照明线路",
        area: "客餐厅顶面",
        brand: "24V 磁吸轨道系统",
        qty: "18 m",
        budget: 9200,
        status: "pending",
      },
    ],
  },
  kitchen: {
    title: "厨房招采模型",
    image:
      "https://images.unsplash.com/photo-1556912173-3bb406ef7e8d?auto=format&fit=crop&w=1400&q=82",
    notes: ["岛台构件绑定岩板损耗率，报价单展示含损耗工程量。", "水电点位与洗碗机型号关联，避免现场返工。"],
    materials: [
      {
        name: "岩板台面包",
        area: "橱柜 / 岛台",
        brand: "12mm 大理石白 / 含加工",
        qty: "7.8 m",
        budget: 39200,
        status: "pending",
      },
      {
        name: "橱柜门板",
        area: "上下柜",
        brand: "U708 浅灰 / 拆单下料",
        qty: "24 m²",
        budget: 31800,
        status: "approved",
      },
      {
        name: "嵌入式设备",
        area: "水槽侧",
        brand: "洗碗机 13 套 / 预留尺寸",
        qty: "1 台",
        budget: 7600,
        status: "review",
      },
    ],
  },
  bath: {
    title: "主卫工程量模型",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=82",
    notes: ["墙地砖按铺贴面自动扣除门洞，减少工程量争议。", "洁具点位和安装节点进入施工端待办。"],
    materials: [
      {
        name: "墙地砖包",
        area: "主卫",
        brand: "600x1200 灰白石纹 / 含损耗",
        qty: "38 m²",
        budget: 21400,
        status: "approved",
      },
      {
        name: "智能马桶",
        area: "马桶区",
        brand: "即热式 / 305 坑距",
        qty: "1 台",
        budget: 6200,
        status: "pending",
      },
      {
        name: "恒温花洒",
        area: "淋浴区",
        brand: "暗装预埋 / 施工前置",
        qty: "1 套",
        budget: 4300,
        status: "pending",
      },
    ],
  },
  bedroom: {
    title: "主卧生产下料模型",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=82",
    notes: ["衣柜由模型生成板件清单，和供应商拆单系统对接。", "窗帘盒、灯带和柜体收口在同一版本里确认。"],
    materials: [
      {
        name: "地板面层",
        area: "卧室地面",
        brand: "栎木本色 / 含踢脚线",
        qty: "28 m²",
        budget: 23600,
        status: "approved",
      },
      {
        name: "定制衣柜",
        area: "衣帽区",
        brand: "无拉手系统 / 板件清单",
        qty: "9.6 m",
        budget: 46200,
        status: "pending",
      },
      {
        name: "窗帘软装包",
        area: "主卧窗边",
        brand: "亚麻混纺 / 遮光衬布",
        qty: "8.4 m",
        budget: 5800,
        status: "review",
      },
    ],
  },
};

const roleCopy = {
  owner: {
    action: "确认模型版本",
    icon: "check-circle-2",
    pending: "清单待确认",
    comment: {
      role: "业主",
      text: "这版可以，先按模型清单发起询价，报价回来再定品牌。",
      className: "owner",
    },
  },
  designer: {
    action: "发布清单版本",
    icon: "send",
    pending: "模型待回复",
    comment: {
      role: "设计师",
      text: "我已发布 DFC-V4，工程量和招标清单同步更新。",
      className: "designer",
    },
  },
};

let activeRoom = "living";
let activeRole = "owner";
let savingPercent = 8;

const formatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const roomTitle = document.querySelector("#roomTitle");
const noteOne = document.querySelector("#noteOne");
const noteTwo = document.querySelector("#noteTwo");
const materialRows = document.querySelector("#materialRows");
const approvedAmount = document.querySelector("#approvedAmount");
const approvalRatio = document.querySelector("#approvalRatio");
const pendingCount = document.querySelector("#pendingCount");
const pendingLabel = document.querySelector("#pendingLabel");
const purchaseProgress = document.querySelector("#purchaseProgress");
const primaryAction = document.querySelector("#primaryAction");
const savingRange = document.querySelector("#savingRange");
const savingValue = document.querySelector("#savingValue");
const messageList = document.querySelector("#messageList");
const addComment = document.querySelector("#addComment");

function getAllMaterials() {
  return Object.values(rooms).flatMap((room) => room.materials);
}

function money(value) {
  const discount = 1 - savingPercent / 100;
  return formatter.format(Math.round(value * discount));
}

function statusLabel(status) {
  if (status === "approved") return "已锁定";
  if (status === "review") return "待复核";
  return "待确认";
}

function actionIcon(status) {
  if (status === "approved") return "rotate-ccw";
  if (status === "review") return "check";
  return "check";
}

function renderRoom(syncModel = false) {
  const room = rooms[activeRoom];
  roomTitle.textContent = room.title;
  noteOne.textContent = room.notes[0];
  noteTwo.textContent = room.notes[1];

  materialRows.innerHTML = room.materials
    .map(
      (item, index) => `
        <tr>
          <td>
            <div class="material-name">
              <strong>${item.name}</strong>
              <span>${item.area}</span>
            </div>
          </td>
          <td>${item.brand}</td>
          <td>${item.qty}</td>
          <td>${money(item.budget)}</td>
          <td><span class="status-pill ${item.status}">${statusLabel(item.status)}</span></td>
          <td>
            <div class="row-actions">
              <button type="button" data-action="toggle" data-index="${index}" aria-label="切换状态" title="切换状态">
                <i data-lucide="${actionIcon(item.status)}"></i>
              </button>
              <button type="button" data-action="compare" data-index="${index}" aria-label="比价" title="比价">
                <i data-lucide="scale"></i>
              </button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  refreshIcons();
  renderMetrics();
  if (syncModel) {
    document.dispatchEvent(
      new CustomEvent("roomchange", {
        detail: {
          room: activeRoom,
          title: room.title,
        },
      }),
    );
  }
}

function renderMetrics() {
  const materials = getAllMaterials();
  const approved = materials.filter((item) => item.status === "approved");
  const pending = materials.filter((item) => item.status !== "approved");
  const approvedTotal = approved.reduce((sum, item) => sum + item.budget * (1 - savingPercent / 100), 0);
  const total = materials.reduce((sum, item) => sum + item.budget * (1 - savingPercent / 100), 0);
  const ratio = total > 0 ? Math.round((approvedTotal / total) * 100) : 0;
  const progress = Math.min(92, 28 + ratio);

  approvedAmount.textContent = formatter.format(Math.round(approvedTotal));
  approvalRatio.textContent = `${ratio}% 已锁定`;
  pendingCount.textContent = `${pending.length} 项`;
  pendingLabel.textContent = roleCopy[activeRole].pending;
  purchaseProgress.textContent = `${progress}%`;
}

function renderRole() {
  const copy = roleCopy[activeRole];
  primaryAction.innerHTML = `<i data-lucide="${copy.icon}"></i><span>${copy.action}</span>`;
  pendingLabel.textContent = copy.pending;
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.querySelectorAll(".room-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".room-tab").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeRoom = button.dataset.room;
    renderRoom(true);
  });
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeRole = button.dataset.role;
    renderRole();
    renderMetrics();
  });
});

materialRows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const material = rooms[activeRoom].materials[Number(button.dataset.index)];

  if (button.dataset.action === "compare") {
    material.status = "review";
  } else if (material.status === "approved") {
    material.status = "pending";
  } else {
    material.status = "approved";
  }

  renderRoom();
  document.dispatchEvent(
    new CustomEvent("materialaction", {
      detail: {
        name: material.name,
        status: material.status,
      },
    }),
  );
});

savingRange.addEventListener("input", (event) => {
  savingPercent = Number(event.target.value);
  savingValue.textContent = `${savingPercent}%`;
  renderRoom();
});

addComment.addEventListener("click", () => {
  const copy = roleCopy[activeRole].comment;
  const message = document.createElement("div");
  message.className = `message ${copy.className}`;
  message.innerHTML = `<span>${copy.role}</span><p>${copy.text}</p>`;
  messageList.append(message);
  messageList.scrollTop = messageList.scrollHeight;
});

primaryAction.addEventListener("click", () => {
  rooms[activeRoom].materials.forEach((item) => {
    if (item.status === "pending") {
      item.status = activeRole === "owner" ? "approved" : "review";
    }
  });
  renderRoom();
});

renderRole();
renderRoom();
