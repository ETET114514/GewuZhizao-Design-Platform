# 内饰资产导入规范

## 推荐格式

模型首选 `.glb`：单文件、纹理可内嵌、浏览器离线加载稳定。仍兼容 `.gltf`，但 `.gltf` 引用的 `.bin` 和纹理必须保持相对路径，直接从文件选择器导入时建议只使用资源内嵌的 GLTF。

模型约定：

- 使用 glTF 2.0。
- 单位为米，Y 轴向上。
- 模型原点放在落地点的平面中心。
- 建议正面朝 +Z；方向不一致时在建模软件中应用旋转后再导出。
- 纹理优先使用 PNG/JPEG/WebP 并打包进 GLB。
- 导出前应用缩放，删除隐藏网格和不需要的动画。

资产目录 [catalog.json](./catalog.json) 使用毫米描述尺寸和碰撞箱，正式字段约束见 [catalog.schema.json](./catalog.schema.json)。模型放入 `models/` 后，在 `assets` 中增加条目：

```json
{
  "id": "living.sofa.three-seat.001",
  "name": "三人沙发",
  "category": "seating",
  "subcategory": "sofa",
  "tags": ["客厅", "三人位"],
  "model": {
    "uri": "./models/living/sofa-three-seat-001.glb",
    "format": "glb"
  },
  "dimensionsMillimeters": {
    "width": 2100,
    "depth": 900,
    "height": 850
  },
  "collision": {
    "type": "box",
    "sizeMillimeters": {
      "width": 2140,
      "depth": 940,
      "height": 850
    },
    "centerMillimeters": {
      "x": 0,
      "y": 425,
      "z": 0
    },
    "clearanceMillimeters": 20,
    "scaleWithModel": true
  },
  "placement": {
    "mount": "floor",
    "defaultElevationMillimeters": 0,
    "rotationStepDegrees": 90,
    "allowWallOverlap": false
  }
}
```

`collision.type` 当前固定为 `box`。碰撞检查使用带旋转角和高度范围的盒体，会阻止内饰互相重叠；`floor` 类型默认也会阻止穿入墙体。壁挂和吊顶资产可将 `allowWallOverlap` 设为 `true`。

页面提供 `window.GewuInteriorAssets` 接口：

- `registerCatalog(catalog, options)`：运行时注册目录。
- `listAssets()`：列出已注册资产。
- `addAsset(assetId, placement)`：按 ID 添加资产。
- `addPlaceholder(category)`：在还没有模型时添加分类占位件。
- `findCollision(product)`：检查指定产品当前是否碰撞。

`placement` 可传 `planX`、`planY`（平面图像素坐标）、`elevationMeters` 和 `rotationDegrees`。通过界面导入时会自动寻找不重叠位置。

分类为 `lighting` 的资产添加到户型时，会自动绑定一个可调颜色、色温和亮度的默认点光源；光源位置跟随灯具。无需把光源节点预先烘焙进 GLB。
