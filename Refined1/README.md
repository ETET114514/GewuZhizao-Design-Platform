# Refined1 室内平面设计原型

Refined1 是可独立启动的建筑平面识别、二维修正和三维预览原型。它支持上传 PNG/JPG/WebP/SVG 图纸，识别墙体并分析门窗候选与闭合房间，然后在浏览器中修改、保存项目和导出 JSON。

## 首次安装

需要 Python 3.10～3.12。在本目录双击：

```text
setup.bat
```

安装脚本会创建本地 `.venv`，安装固定版本的 NumPy、OpenCV 和 ONNX Runtime，并验证主模型及离线 3D 文件。

当前精简版仅使用 ONNX Runtime，不需要 PyTorch。

## 启动

双击 `start-web.bat`，浏览器会打开：

```text
http://127.0.0.1:8010/index.html
```

服务状态：

```text
GET http://127.0.0.1:8010/api/health
```

## 识别接口

正式接口：

```text
POST /api/floorplan/recognize
```

返回 `floorplan-ai-v1` 结构，包括模型信息、墙体、门窗字段、几何洞口候选、房间、调试墙体蒙版和置信度状态。

兼容接口仍然保留：

```text
POST /api/segment
```

## 模型

精简版仅保留 `models/cubicasa5k-20260711-30epoch.onnx`。模型不可用时使用 OpenCV fallback。

可通过环境变量临时指定 ONNX：

```powershell
$env:FLOORPLAN_ONNX_MODEL = "D:\models\custom.onnx"
.\start-ai-cv.bat
```

## 离线依赖

- `vendor/three/`：Three.js、GLTFLoader 和 BufferGeometryUtils，3D 预览不再依赖 CDN。
- `scripts/`：运行环境验证脚本。

## 3D 渲染

3D 视图使用 sRGB 输出、ACES Filmic 色调映射、程序化环境光、冷暖双向照明和 PCF 软阴影，不依赖在线 HDRI。阴影范围会根据当前户型尺寸自动调整。

点击 3D 视图右上角“渲染”会输出当前相机视角的 2 倍分辨率 PNG（最长边限制为 4096 像素）。正式渲染图会自动隐藏图纸底图、网格、选择框和编辑辅助线；生成后可在预览窗口保存。

### 灯光

点击 3D 视图右上角“灯光”可自行添加点光源和线光源，并调整启用状态、颜色、色温（1000～20000K）、亮度（流明）、高度和位置。线光源还支持长度和方向，通过多个均匀分布的物理点光源模拟；局部阴影可按光源开启，运行时最多为 4 个局部光源分配阴影以控制显存和帧率。

内饰分类为 `lighting` 的占位件、目录资产或手动导入模型会自动绑定一个 3000K、800lm 的点光源。绑定光源随灯具移动，仍可单独调整颜色、色温、亮度和阴影。灯光数据保存在第 3 版项目文件的 `lightSources` 字段中；打开旧版项目时，已有灯具会自动补上默认点光源。

## 内饰资产接口

详细格式见 `assets/interiors/README.md`。推荐使用 glTF 2.0 的单文件 `.glb`，并在 `assets/interiors/catalog.json` 中登记分类、实际尺寸、放置方式和盒形碰撞体。

当前目录预置 21 个可扩展内饰分类和空资产目录。即使尚未放入模型，也可以从“内饰资源库”添加分类占位件；之后加入 GLB 和目录条目即可替换为真实模型。内饰放置、移动、旋转和缩放会检查旋转碰撞箱、高度区间、图纸边界及墙体占用。

## 测试文件

`tests/sample-floor-plan.svg` 是内置平面图，可通过页面“加载样例”使用。

第 4 阶段的真实图纸基准测试暂未执行；当前只完成运行链路、模型接入和依赖整理。

不安装 AI 运行依赖也可以执行服务契约单元测试：

```powershell
python -m unittest tests.test_server_contract
```
