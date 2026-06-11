# 测试生成平面布置图

这是一个独立静态测试页面，用于验证“墙体平面 -> 家具布置平面图”的生成能力。

## 打开方式

直接双击 `index.html`，或在浏览器中打开：

```text
测试生成平面布置图/index.html
```

## 文件说明

- `index.html`：测试页面结构
- `styles.css`：平面图、家具、检测面板样式
- `app.js`：墙体底图、房间识别结果、家具生成规则和 JSON 导出逻辑

## AI识别接口 MVP

- 页面新增“AI识别接口”面板，可选择 Mock、DeepFloorplan、U-Net、CubiCasa5K 兼容通路
- Mock 会把当前 OpenCV/霍夫/手动轮廓结果转成统一的 `floorplan-ai-v1` 结构
- DeepFloorplan、U-Net、CubiCasa5K 通路会调用本地 Python 推理服务：

```text
POST http://127.0.0.1:8787/api/floorplan/recognize
```

启动方式：

```text
pip install -r requirements-floorplan-ai.txt
start-floorplan-ai-service.bat
```

模型文件放置约定：

```text
models/deepfloorplan.onnx
models/floorplan-unet.onnx
models/cubicasa5k.onnx
```

如果没有模型权重，服务会使用 OpenCV fallback 返回同样的 `floorplan-ai-v1` 结构。

返回字段统一为：

```json
{
  "schemaVersion": "floorplan-ai-v1",
  "coordinateSystem": "svg-1000x1040",
  "rooms": [],
  "walls": [],
  "doors": [],
  "windows": [],
  "fixtures": [],
  "confidence": {}
}
```

- 如果本地服务不可用，页面会自动退回 Mock 标准输出，保证前端调试不中断

## 结构墙模式

- 顶部“结构墙模式”默认开启
- 该模式会先过滤家具线、文字线、楼梯/窗格等重复细线，再输出可信墙体中心线
- 结构墙结果会生成 `structuralWallModel.centerLines`、`structuralWallModel.footprint` 和 `structuralWallModel.roomPolygons`
- `footprint` 使用结构墙和初筛房间生成正交户型外轮廓，再反向过滤外部空白区
- 关闭“结构墙模式”后，可回看原始霍夫线、双线墙、单线墙和区域生长碎片

## 当前能力

- 复刻用户提供的墙体平面轮廓
- 自动标注客餐厅、厨房、卫生间、卧室、书房、主卧
- 生成沙发、茶几、餐桌、橱柜、床、衣柜、书桌、卫浴等家具
- 按家具通行缓冲框检测局部拥挤风险
- 支持切换均衡、紧凑、舒适三种布置尺度
- 支持导出测试 JSON

## 新增多方案流程

- 上传新平面图后，先清空旧方案，只显示原图
- 在“MVP确认”中选择入户门、厨房、卫生间、客餐厅、卧室、阳台，然后在画布上点击对应位置
- 入户门会生成禁放区，确认后的房间会启用对应家具白名单
- 如果已确认厨房、卫生间、客餐厅、卧室、阳台，家具会进入 `confirmation-driven` 模式，围绕确认点生成，不再套用旧模板家具
- 点击“生成布置”后，自动识别有效平面范围
- 输出结构化户型数据 `planModel`
- 一次生成 5 套候选方案：
  - 舒适通行版
  - 高收纳版
  - 紧凑实用版
  - 居家办公版
  - 亲子成长版
- 每套方案独立评分，可点击右侧方案卡片切换预览
- 导出 JSON 会包含当前选中方案和全部候选方案

## MVP 使用步骤

1. 上传原平面图
2. 点“MVP确认”中的关键空间按钮
3. 在画布上点击对应位置，至少确认入户门、厨房、卫生间
4. 如果淡绿色确认区域没有覆盖真实房间，在确认列表中点“扩大”或“缩小”
5. 点击“生成布置”
6. 在顶部方案条或右侧方案卡片中切换方案
