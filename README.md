# Komari Glassmorphism Three-Network

基于 Glassmorphism 扩展的 Komari 三网延迟主题，可与原版主题同时安装。

[![Version](https://img.shields.io/badge/version-v3.3.15-7c3aed.svg)](https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork/releases)
[![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 代码直接基于 Komari Glassmorphism 开发，并参考了 LuminaPlus 的三网延迟与地区筛选交互。这里仅说明本分支新增或调整的内容；原主题的完整能力请查看下方致谢中的原仓库。

## 预览

![Komari Glassmorphism Three-Network 预览](docs/preview.png)

## 项目信息

| 项目     | 说明                                         |
| :------- | :------------------------------------------- |
| 当前版本 | **v3.3.15**                                  |
| 主题标识 | `GlassmorphismThreeNetwork`                  |
| 安装方式 | Komari 可导入 ZIP 主题                       |
| 上游基础 | Komari Glassmorphism                         |
| 参考主题 | Komari Theme LuminaPlus                      |
| 共存能力 | 使用独立主题标识，不覆盖原版 `Glassmorphism` |

## 本分支改动

### v3.3.15 上游兼容更新

- 同步 Glassmorphism v3.3.6：平铺地图不再强制固定六张总览卡片，统一遵循主题设置中的卡片方案、数量与顺序。
- 同步 Glassmorphism v3.3.7：详情历史的累计上传、下载流量按时间桶最后值显示，避免平均降采样导致累计值偏低。
- 普通历史指标仍使用平均值聚合；实时流量、流量配额、Agent 上报、后端记账及现有三网延迟均保持原有逻辑。
- 新增对应的浏览器回归检查，并同步 Code Quality 工作流，在 PR 与 `main` 推送时自动执行 lint 和 build。

### 三网延迟

- 节点卡片显示电信、联通、移动三项延迟与丢包状态。
- 主题设置提供三个 Ping 任务选择项，支持自动选择和指定任务。
- 优先读取 Metric Store，保留公开 Ping 记录和旧接口回退。
- 延迟卡片、图例和详情图表遵循 Komari 后台 Ping 任务顺序。
- 延迟数值使用分级颜色，并针对小字号显示做了抗锯齿调整。

### 地区筛选与跨设备一致性

- 首页增加独立国家/地区筛选行，默认显示全部节点，再次点击当前地区可取消筛选。
- 地区顺序优先为 `CN、HK、MO、TW、SG、JP、US`，随后显示欧洲和其他地区。
- 管理员配置的节点地区优先于第三方 IP 定位，避免不同浏览器把香港等节点误判到其他国家。
- 地区筛选、快捷筛选和节点工具在桌面与移动端保持对齐，窄屏支持横向滑动且不撑宽页面。

### 标签、地图与独立安装

- 节点标签支持显式颜色，并为未指定颜色的标签自动分配不同配色。
- 地图标记保留同位置多节点数量信息，同时避免国家统计遮挡 3D 地球。
- 使用独立名称、主题标识和仓库地址，可与原版 Glassmorphism 并存和分别配置。

### 上游兼容修复

- 同步 Glassmorphism v3.3.4：剩余 5 天内标红、6–10 天标黄，无效到期日期显示 `-`。
- 同步 Glassmorphism v3.3.4：短时历史缺少 CPU 指标时自动回退兼容记录接口。
- 同步 Glassmorphism v3.3.5：Ping 卡片、图例和指标线保持后台任务顺序。
- 同步 Glassmorphism v3.3.6：平铺地图遵循自定义总览卡片方案与顺序。
- 同步 Glassmorphism v3.3.7：累计上传、下载历史保留累计计数器语义。

## 安装与升级

在 Komari 主题管理中使用仓库地址：

```text
https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork
```

也可以从 [Releases](https://github.com/LuxJon/komari-theme-Glassmorphism-ThreeNetwork/releases) 下载最新 ZIP 后手动导入。

由于本主题使用独立标识 `GlassmorphismThreeNetwork`，安装或升级时不会覆盖原版 `Glassmorphism`。

## 本地开发

```bash
bun install
bun run dev
bun run lint
bun run build
```

构建产物为 `komari-theme-Glassmorphism-build-<short-sha>.zip`，ZIP 顶层保持：

```text
komari-theme.json
preview.png
dist/
```

## License

本项目遵循 [MIT License](LICENSE)。二次分发时请保留原项目的许可证与作者信息。

## 致谢

- [Komari Glassmorphism](https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism) — 本主题的主要代码基础、玻璃拟态设计与完整监控能力来自该项目，感谢作者及贡献者的持续维护。
- [Komari Theme LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus) — 三网延迟展示和地区筛选交互参考了该主题，感谢作者提供的设计思路。
- [Komari Monitor](https://github.com/komari-monitor/komari) — 感谢 Komari 项目及社区提供监控平台、接口和生态支持。

本仓库只维护上述基础上的差异功能与兼容更新。感谢所有原作者、维护者和贡献者。
