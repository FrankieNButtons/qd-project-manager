# QD Projects Manager

<p align="center">
  <img src="assets/QDPMLOGO.png" alt="QD Projects Manager" width="420">
</p>

<p align="center">
  <strong>多团队追踪，一目了然，变更即时通知。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/平台-Android%20%7C%20iOS%20%7C%20Web-blue?style=flat-square" alt="平台">
  <img src="https://img.shields.io/badge/Expo%20SDK-55-000020?style=flat-square&logo=expo" alt="Expo SDK 55">
  <img src="https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=flat-square&logo=react" alt="React Native">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

<p align="center">
  <a href="#应用截图">截图</a> · <a href="#快速开始">快速开始</a> · <a href="#指标管理机制">工作原理</a> · <a href="README.md">English</a>
</p>

---

你负责管理多个项目团队，每个团队把各自的 KPI 填在独立的腾讯文档表格里——专利数量、合作企业数、里程碑完成率。要比较他们的进度，你得逐个打开表格、对照单元格，还得祈祷自己能及时发现有人悄悄加了一行或删了一行。

QD Projects Manager 替你做这些事。粘贴一个表格链接，起个名字，应用就会自动拉取数据、排名所有团队、在后台监控变化。一旦有变动，你会立刻知道。

## 应用截图

<p align="center">
  <img src="assets/screenshots/overview.png" width="230" alt="总览" />
  &nbsp;
  <img src="assets/screenshots/teams.png" width="230" alt="团队" />
  &nbsp;
  <img src="assets/screenshots/settings.png" width="230" alt="设置" />
</p>

<p align="center">
  <sub>总览 — 团队排名与指标排行 &nbsp;|&nbsp; 团队 — 详细指标进度 &nbsp;|&nbsp; 设置 — 权重、刷新率、配置</sub>
</p>

**总览**以综合进度排名展示所有团队。每张卡片包含一个堆叠进度条——每种颜色代表一个指标——让你同时看到总分和各项拆解。排名下方是指标排行榜，可以针对单个 KPI 比较各团队表现，支持在原始数值和百分比之间切换。

**团队**为每个团队提供一张详情卡片：每个指标的进度条、当前值和目标值。支持按综合进度或单个指标排序，也可以按已完成、未完成或自定义条件（如"专利数 > 50"）筛选。

**设置**用于添加或移除团队、调整数据刷新频率、设定指标权重（如果专利的重要性是合作企业的两倍，在这里调整）以及导入/导出团队配置。

---

## 指标管理机制

应用追踪所有团队指标的**交集**——只有每个团队都报告的 KPI 才会出现在排名中。

每次数据刷新时，应用会对比前后两次的指标列表快照：

| 场景 | 发生了什么 | 界面表现 |
|:-----|:-----------|:---------|
| 某团队的数据发生变化 | 顶部气泡提示 | *"团队A更新了专利数量指标"* |
| 所有团队同时新增一个指标 | 气泡提示 | *"专利数量指标已被添加"* |
| 部分团队新增，其余未新增 | 弹窗警告（必须手动确认） | 可分享对齐消息 |
| 部分团队删除一个指标 | 弹窗警告 + 红色**停止追踪**按钮 | 立即从排名中移除该指标 |
| 所有团队删除一个指标 | 自动停止追踪 | 弹窗确认或分享 |

"分享"按钮会生成一条消息——*"我注意到团队A新增了评价指标专利数量，需要统一调整吗？"*——并调用系统分享功能。仅部分团队添加的指标**不会**被纳入追踪，直到所有团队都添加为止。

所有事件记录在**消息中心**（右上角铃铛图标），带有未读徽标和"以上为新消息"分隔线。

---

## 表格格式

你的腾讯文档表格需要遵循以下结构：

| 评价指标 | 阶段目标 | 2026-01 | 2026-02 | 2026-03 | ... |
|----------|----------|---------|---------|---------|-----|
| 专利数量 | 200      | 5       | 10      | 20      | ... |
| 合作企业数 | 100    | 30      | 35      | 70      | ... |

- **第一列** — 指标名称（各团队之间必须一致才能进行跨团队比较）
- **第二列** — 目标值
- **其余列** — 各时间段的实际值

应用取所有日期列中的**最大值**，计算进度：`min(最大值, 目标值) / 目标值`。被追踪的指标为所有团队指标名称的交集。

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
git clone https://github.com/your-org/qd-projects-manager.git
cd qd-projects-manager
npm install
```

### 运行

| 命令 | 说明 |
|:-----|:-----|
| `npm start` | 启动 Expo 开发服务器 — 用 Expo Go 扫码运行 |
| `npm run web:dev` | 启动 Web 开发服务器 + CORS 代理（一条命令） |
| `npm run build:apk` | 通过 EAS 云端构建 Android APK（无需 Android Studio） |

**首次构建 APK？** 先运行 `npx eas login` 登录，然后再执行 `npm run build:apk`。

---

## 更新日志

### v0.1.0 (2026-03-12)

首次发布。

- 从腾讯文档表格进行多团队 KPI 追踪
- 总览页面：团队排名与堆叠进度条
- 指标排行榜：支持数值/百分比切换
- 团队详情卡片：支持排序与筛选
- 自动指标管理 — 检测各团队的指标新增、删除与数据变化
- 指标不一致时弹窗提醒，支持分享对齐消息
- 消息中心：未读徽标与事件日志
- 可配置指标权重与刷新频率
- 基于 TOML 的团队配置导入/导出
- Web 端 CORS 代理支持本地开发调试
- EAS 云端构建 Android APK

---

## 参与贡献

1. Fork 本仓库
2. 创建功能分支
3. 提交 Pull Request

## 许可证

[MIT](LICENSE)
