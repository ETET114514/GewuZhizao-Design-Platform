# 商用优先的现场照片重建路线

## 目标

用手机现场照片或短视频抽帧生成可对照的室内几何证据，再和当前“建筑平面生成能力”输出的墙体、门、窗做差异比对。第一版不追求完整精美的 3D 资产，优先输出墙面、开口、门窗位置证据。

## 选型结论

主线：

- 几何重建：`VGGT-1B-Commercial`
- 高斯/可视化：`gsplat` 或现有 Nerfstudio/Splatfacto 服务
- 点云几何处理：`Open3D`
- 门窗检测训练：`MMDetection` 或 `Detectron2`

零审批兜底：

- 用 `COLMAP + Nerfstudio/Splatfacto + Open3D`。它不依赖 VGGT checkpoint，速度和弱纹理场景鲁棒性会差一些，但授权路径更传统。

## 授权边界

- 不使用 ZInD、ScanNet、Matterport3D、Structured3D 这类常见非商用/研究用途数据做产品训练。
- 训练数据只用三类来源：
  - 我们自己采集并取得授权的工地/样板间照片和视频。
  - 客户明确授权用于算法训练的现场图片。
  - 自建或购买授权明确的合成室内数据。
- VGGT 只使用 `facebook/VGGT-1B-Commercial`，不要使用原始 `facebook/VGGT-1B` checkpoint 做产品能力。

## 本地目录约定

```text
datasets/
  site_photos/
    raw/
      project_001/
    derived/
      vggt-scenes/
      annotations/
      synthetic/

third_party/
  vggt/
```

## 手机照片采集要求

- 每个房间至少 20-60 张图，绕墙一圈拍，门窗位置要多角度覆盖。
- 尽量保持相机水平，避免大面积纯白墙只拍一张。
- 每面墙至少有斜角和正面视角，门窗边缘不要只出现在画面边缘。
- 有条件时用短视频抽帧，比零散照片更容易恢复相机轨迹。

## VGGT 商业版试跑

先准备场景目录：

```powershell
python tools/prepare_vggt_scene.py datasets/site_photos/raw/project_001 datasets/site_photos/derived/vggt-scenes/project_001
```

安装 VGGT：

```powershell
git clone https://github.com/facebookresearch/vggt.git third_party/vggt
python -m pip install -r third_party/vggt/requirements.txt
```

使用商业 checkpoint 时，需要先在 Hugging Face 申请 `facebook/VGGT-1B-Commercial` 访问权限，并登录：

```powershell
huggingface-cli login
```

导出 COLMAP：

```powershell
python third_party/vggt/demo_colmap.py --scene_dir datasets/site_photos/derived/vggt-scenes/project_001
```

显存允许时加 BA：

```powershell
python third_party/vggt/demo_colmap.py --scene_dir datasets/site_photos/derived/vggt-scenes/project_001 --use_ba
```

## 后处理

1. 从 VGGT/COLMAP sparse 点云或深度图生成点云。
2. 用 Open3D 做平面分割，提取主要墙面。
3. 把墙面投影到顶视图，生成现场墙线证据。
4. 用 MMDetection/Detectron2 训练门、窗、开口检测器。
5. 将门窗检测框投影回对应墙面。
6. 和 `floorplan-ai-v1` 的墙、门、窗输出做匹配，生成缺失、错位、疑似误检提示。

## 第一版输出字段

```json
{
  "siteEvidence": {
    "source": "vggt-commercial",
    "walls": [],
    "doors": [],
    "windows": [],
    "openings": []
  },
  "mismatches": [
    {
      "type": "missing_window",
      "floorplanElementId": "wall-12",
      "siteEvidenceId": "window-3",
      "confidence": 0.82
    }
  ]
}
```

## 下一步

1. 先采集 3-5 个房间的手机照片作为商用安全样本。
2. 跑 `prepare_vggt_scene.py` 整理图片。
3. 申请 VGGT 商业 checkpoint。
4. 跑一次 COLMAP 导出，验证墙面点云质量。
5. 搭建门窗标注规范和小规模训练集。
