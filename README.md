# Komari Glassmorphism Three-Network

面向 [Lite](https://github.com/nuomiiiii/Lite) 与 Komari 的毛玻璃监控主题，在原版 Glassmorphism 基础上增加三网延迟、地区筛选和节点标签等功能。

[![Version](https://img.shields.io/badge/version-v3.4.0-7c3aed.svg)](https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork/releases/latest)
[![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 预览

![Komari Glassmorphism Three-Network 预览](docs/preview.png)

## 3.4.0 更新

- 适配 Lite 2.3.4 的主题清单、原生后台入口、节点详情导航和公开监控接口。
- 三网线路改用 Lite 原生 Ping 任务选择器，仅显示后台实际存在的任务，不再列出固定的上海、浙江、广东线路。
- 保留旧版保存的任务名称或 ID；未选择、任务被删除或配置失效时，自动从现有任务中匹配电信、联通、移动。
- 将主题设置从九个分类整理为首页、延迟线路、节点与图表、外观、高级五类，保留全部 51 个设置键和原有首页功能。
- 移除主题内附带的旧 Komari 管理后台、Service Worker 资源和跳转桥接，后台按钮直接进入 Lite 原生 `/admin`。

## Lite 适配说明

本主题针对 [nuomiiiii/Lite](https://github.com/nuomiiiii/Lite) 2.3.4 完成适配。Lite 是基于 Komari 生态继续开发的版本，支持直接导入本仓库或 Release ZIP。

- 主题继续使用 `komari-theme.json`，Lite 会直接识别。
- 节点详情路由声明为 `/instance/{uuid}`。
- 延迟线路通过 Lite 的 `pingtasks` 配置控件读取真实任务，不保存虚构线路。
- 首页、节点详情、价格与到期时间、历史图表、实时指标继续使用公开接口。
- 管理、账单、账户和系统设置由 Lite 原生后台负责，主题包不再携带另一套后台页面。

从旧版升级后，建议在“延迟线路”中重新选择现有 Ping 任务。若浏览器仍打开旧后台，请清理该站点以前注册的 Service Worker 或站点缓存。

## 本主题的扩展

### 三网延迟

- 节点卡片显示电信、联通、移动三项延迟与丢包状态。
- 三行线路可从 Lite 当前 Ping 任务中指定，也可留空自动匹配。
- 优先读取 Metric Store，同时兼容公开 Ping 记录与旧接口回退。
- 延迟卡片、图例和详情图表遵循后台 Ping 任务顺序。
- 延迟数值使用分级颜色，并对小字号显示做抗锯齿调整。

### 地区筛选与跨设备一致性

- 首页提供独立国家/地区筛选行，默认显示全部节点，再次点击当前地区可取消筛选。
- 地区顺序优先为 `CN、HK、MO、TW、SG、JP、US`，随后显示欧洲和其他地区。
- 管理员配置的节点地区优先于第三方 IP 定位，避免不同浏览器产生不同归类。
- 地区筛选、快捷筛选和节点工具在桌面与移动端保持对齐，窄屏可横向滑动。

### 标签、地图与独立安装

- 节点标签支持显式颜色，未指定颜色时自动分配不同配色。
- 地图标记保留同位置多节点数量信息，并避免国家统计遮挡 3D 地球。
- 使用独立名称、主题标识和仓库地址，可与原版 Glassmorphism 共存并分别配置。

## 安装

在 Lite 或 Komari 的主题管理中导入仓库地址：

```text
https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork
```

也可以从 [最新 Release](https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork/releases/latest) 下载 ZIP 后上传安装。主题标识为 `GlassmorphismThreeNetwork`，不会覆盖原版 `Glassmorphism`。

## 本地开发

```bash
bun install
bun run dev
bun run lint
bun run build
```

构建包顶层固定包含：

```text
komari-theme.json
preview.png
dist/
```

## 致谢

- [Komari Glassmorphism](https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism) — 本主题的主要代码基础、玻璃拟态设计与监控能力。
- [Komari Theme LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus) — 三网延迟展示与地区筛选交互的设计参考。
- [Lite](https://github.com/nuomiiiii/Lite) — Komari 生态的持续开发版本及本主题 3.4.0 的主要适配目标。
- [Komari Monitor](https://github.com/komari-monitor/komari) — 原始监控平台、接口与主题生态。

## License

本项目遵循 [MIT License](LICENSE)。二次分发时请保留原项目许可证与作者信息。
