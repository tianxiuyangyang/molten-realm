# 熔火王座 · 赤境之门 · 星渊回廊

一个使用 Three.js 实时渲染的三场景幻想世界，无需构建工具或后端。

在线预览：[赤境之门](https://tianxiuyangyang.github.io/molten-realm/?region=portal) · [熔火王座](https://tianxiuyangyang.github.io/molten-realm/?region=citadel) · [星渊回廊](https://tianxiuyangyang.github.io/molten-realm/?region=scifi)。

原有「熔火王座」和「赤境之门」继续保留；新增「星渊回廊」位于同一个 Three.js 世界中的独立区域，原点为 `[840, 0, 0]`。新区域依据 `444.jpg` 搭建深空星幕、白色引力汇聚核心、青绿色流体星带、绿色潮汐地貌、远景信标与微型探索者。该区域使用非体素的平滑几何、程序化 shader、实时粒子和受控辉光，保持真实感科幻风格。

入口为 `index.html`。在项目目录启动静态服务：

```powershell
cd molten-realm
python -m http.server 4173
```

也可以直接双击项目根目录的 `start-preview.bat`，它会启动本地服务并打开预览。不要直接双击 `index.html`，因为 Chrome 会阻止 `file:///` 页面加载 Three.js ES modules。

打开 [赤境之门](http://localhost:4173/?region=portal)（默认区域）、[熔火王座](http://localhost:4173/?region=citadel) 或 [星渊回廊](http://localhost:4173/?region=scifi)。通过页面区域选择切换观察位置。

- 鼠标或触摸旋转、缩放观察；「参考视角」恢复当前区域的构图。
- 「截图」导出当前渲染画面；「全屏」扩展观察空间。
- 「精细」「超清」「流畅」三档画质用于平衡分辨率、阴影、辉光与设备性能，默认精细。

`scene-manifest.json` 保留三处区域的分析，并记录坐标、相机、屏幕锚点、材质、灯光及构图假设。画布中的空间由场景几何与实时材质、灯光生成。

场景始终保持参考观察模式，不添加「进入场景」按钮、Pointer Lock 或第一人称自由飞行。单图无法确定不可见背面、绝对尺寸和完整材质参数；这些部分采用可编辑的合理补全，重点匹配参考视角中的轮廓、透视、遮挡与光色。

实现文件：`src/portal-world.js` 组织新区灯光、天空和粒子；`src/portal-gate.js` 构建门体、符文及动态能量；`src/portal-landscape.js` 构建菌林、石路和熔岩。`src/main.js` 管理区域切换、观察控制和画质。区域在首次访问时构建，已构建区域保留在同一场景中；远处非活动区域隐藏以节省绘制。

「星渊回廊」由 `src/scifi-world.js` 和 `src/scifi-effects.js` 组织：前者负责星幕、引力漩涡、绿色流体地貌、信标与探索者，后者提供 GPU 星尘和带噪声的动态星云带。该区域使用独立的深空雾色、实时辉光和参考相机 `[0,10,58]` / `[12,18,-38]`。

已验证：桌面 1280 × 720 与窄屏 390 × 844 预览、两区域切换、鼠标环绕和参考复位、精细/流畅画质切换、PNG 实际下载；模块语法与本地资源检查通过，未发现浏览器渲染警告或错误。新区域约 49,000 个实例构件。全屏取决于浏览器窗口是否允许原生 Fullscreen API。

传送门中心现包含持续形变的像素闪电、沿分枝上行的能量脉冲、旋动能量雾与 320 个上升火花/漂浮粒子。动画由 GPU 运行；`src/portal-lightning.js` 和 `src/portal-particles.js` 分别管理闪电与粒子。门框符文保持固定，中心灯光随能量轻微起伏。

熔火王座已进一步优化：`src/citadel-materials.js` 提供按世界尺度采样的玄武岩颗粒、裂纹、层理与粗糙度；`src/citadel-details.js` 添加层叠尖拱、檐下齿饰、桥面磨损、铁箍与火篮；`src/citadel-atmosphere.js` 提供流动熔岩、动态火焰、瀑布火星和低层薄雾。`src/world.js` 扩大主塔火窗并清理窗内遮挡，补齐蘑菇支撑和主要瀑布源头；王座灯光区分冷色天空光与暖色熔岩反照。参考相机为 `[49,76,151]`，观察目标 `[-8,23,0]`，视场角 45°。新增改动均使用王座独立模块，赤境之门沿用既有实现。

本轮已检查王座桌面和 390 × 844 窄屏、精细/超清/流畅三档渲染、模块语法与本地资源；未发现浏览器渲染警告或错误。王座包含约 53,000 个实例细节与特效元素。

## GitHub Pages

项目使用仓库 `main` 分支根目录发布，`.nojekyll` 保证本地 ES 模块与资源原样部署。所有页面资源使用相对路径，兼容 GitHub Pages 仓库子路径。后续修改提交并推送到 `main` 后，GitHub Pages 自动重新发布。

Three.js 及附加模块的 MIT 许可证见 `libs/LICENSE`；其他说明见 `THIRD_PARTY_NOTICES.md`。
