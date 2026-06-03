# 建筑平面生成能力

独立的建筑平面图识别测试项目。用于上传 PNG/JPG/WebP 或加载测试样例，生成墙体中心线、交点、断点、门洞、端头墙垛和闭合房间的可视化结果。

## 启动

双击 `start-web.bat`，然后打开：

```text
http://127.0.0.1:8010/index.html
```

如果需要启用 OpenCV / ONNX 后端分割，先安装依赖：

```bash
pip install -r requirements.txt
```

然后双击 `start-ai-cv.bat`。

## 测试文件

`tests/sample-floor-plan.svg` 是内置测试平面图，可直接在网页中点击“加载样例”使用，也可以通过上传测试。

## 模型

可选模型路径：

```text
models/wall-segmentation.onnx
```

没有模型时，页面会自动使用浏览器规则识别和 OpenCV fallback。
