# V0.3 Phase 2 — RED-BLUE EDITORIAL · PRODUCTION DECISION REPORT

> 状态：**PRODUCTION IMPLEMENTED — READY_FOR_OWNER_VISUAL_REVIEW**
> 微信真机验收：**`WECHAT_MANUAL_ACCEPTANCE_PENDING`**（见 §12）
> Provenance：Agent Claude Code · 2026-08-23 · Branch `feat/v03-phase2-red-blue-editorial`
> Starting HEAD `f8a3f31` · 未 push · main 未触碰

---

## 1. 为什么从 teal/terracotta 改为 red/blue

Phase 2 设计研究 `v03-phase2-surface-hierarchy` 曾把 `#315C5B` teal 作为候选身份色。
Owner 本轮明确否决 teal，选定**红蓝**作为最终身份配色：暖白/米灰保留为阅读面，
蓝色承担结构、提问、信息与链接，红色承担反方、警示、边界与少量判断，
并明确要求支持**两种对立观点或数据的红蓝对照**。

teal 方案被 `SUPERSEDED_BY_RED_BLUE_EDITORIAL`（原报告头已标注），不再作为候选。

## 2. 最终 token（`src/styles/tokens.css`）

| Token | 值 | 角色 |
|---|---|---|
| `--canvas` | `#E9E3D9` | 预览工作台（不导出） |
| `--paper` | `#FFFDF8` | 纸面（暖白，导出） |
| `--ink` | `#252421` | 墨色正文 / 主结构线 |
| `--muted-ink` | `#6F6B63` | 次级文字 / 注记 |
| `--hairline` | `#D8D1C6` | 发丝线 |
| `--neutral-surface` | `#F4F1EB` | 中性浅面（quote / lab-note / 表头） |
| `--blue` | `#2F5FD7` | 主蓝（结构 / 提问 / 链接 / 列表 / 证据 / 正方） |
| `--blue-surface` | `#EEF3FF` | 极浅蓝面（question） |
| `--red` | `#D4473F` | 判断红（反方 / 风险 / 边界 / 少量判断标签） |
| `--red-surface` | `#FFF0EE` | 极浅红面（保留，counterpoint 未用） |

派生：`--neutral #746F67`（quote 边框）、`--deep #243F9E`（访问链接）、
`--code-text #B83E38`（inline code）、`--code-block-bg #23211E` / `--code-block-fg #F5F2EC`（代码块）。
旧别名 `--cobalt/--secondary/--surface/--bg/--fg/--accent` 全部指向新角色色。

## 3. Markdown 全语法颜色映射（预览 article.css ↔ 微信 safeCss）

| 结构 | 处理 |
|---|---|
| H1（masthead） | serif 墨色，≤40px（桌面 40 / 微信 30），移动自然换行 |
| H2 | serif 墨色标题 + 蓝色 mono 编号 + 蓝色 60px 短线（真实节点 `.sec-rule`） |
| H3 | serif 墨色，无编号 |
| H4 | **进入生产**：sans 17px 600 墨色 |
| H5 / H6 | sans/mono 更小、muted-ink，低层级可区分 |
| 正文 | 墨色，暖白纸面 |
| 链接 | 蓝色 + 蓝色下划线（不只靠颜色）；访问后深蓝 |
| 无序列表 | 墨色正文，蓝色 `—` marker |
| 有序列表 | 墨色正文，蓝色 mono 序号（浏览器 counter；微信原生 `<ol>`） |
| task list | **真实符号 ☑/☐**（压制 `<input>`）；完成=蓝，未完成=neutral |
| blockquote | 中性灰左边框 `#746F67` + `#F4F1EB` 底，墨色，serif |
| q-source | 渲染器把 `——` 开头末行拆为 `.q-source`：mono 小字 muted-ink + hairline 上边 |
| 图片 | max-width 100%，height auto，caption muted |
| 表格 | 表头 neutral-surface + 蓝色细线，正文黑白，`.table-wrap` 局部横滚 |
| inline code | `#F4F1EB` 底 + `#B83E38` 文字（red 安全深色） |
| code block | 深墨底 `#23211E` + 暖白 `#F5F2EC`，不做语法高亮，长行自身横滚 |
| hr / 加粗 / 斜体 / 删除线 / 脚注 | hairline / 墨色加粗 / 斜体 / 低调删除线 / 蓝色脚注标记 + muted 正文 |

## 4. 七个语义块映射

| 块 | 边框 | 背景 | label | 文字 | 角色 |
|---|---|---|---|---|---|
| Question | 左 2px 蓝 | `#EEF3FF` 浅蓝 | 蓝 | 墨 | 问题入口 |
| AI Output | 左 2px 蓝 | 无 | 蓝 | 墨 | 归属明确，非结论 |
| Judgment | 顶部 1px 墨线 | 无 | **红** | 墨 | 签名裁决（非警报） |
| Evidence | 左 2px 蓝 | 无 | 蓝（可 `label=` 覆盖） | 墨 | 证据 / 正方 |
| Counterpoint | 左 2px 红 | 无 | **红**（可 `label=` 覆盖） | 墨 | 反方 / 风险 |
| Lab Note | 左 2px hairline | `#F4F1EB` | muted | muted | 编辑部边注 |
| Metric | 无块级边框 | 无 | 蓝 | 数字墨 ≤44px | 检查锚点 |

红蓝对立：`:::evidence label="观点 A"` ↔ `:::counterpoint label="观点 B"`（或 `数据 A/数据 B`），
同一容器同一排版（legibility parity，INVARIANT A2），仅 border/label 色区分，body 均墨色。

## 5. 为什么普通 quote 保持中性

`>` 是"引用"，不等于"证据"（blue）也不等于"反方"（red）。
给它上色会污染红蓝的角色语义。普通引用统一中性灰边 + neutral surface，
q-source 只在作者显式写 `—— 来源` 时产出（不伪造来源）。

## 6. 为什么 Judgment 不使用红色卡片

Judgment 是 Max Editorial 的签名块（居中 + 墨线 + 署名）。红色只用于一个很小的
`JUDGMENT` 标签表示"这是一次明确裁决"，不是警报。红色大卡片会把它变成营销页的
"警告条"，违背编辑部气质，也破坏 4:1 的红蓝面积纪律。

## 7. 为什么 Metric 保持 44px

微信 H01 上限即 44px（`WECHAT_SAFE_PROFILE_V1` / 既有 `WECHAT_TARGET_TOKENS_V1`）。
84px 只适合浏览器预览，会在微信塌缩且抢走正文注意力。Phase 2 把浏览器与微信
都收敛到 44px，数字保持墨色，蓝色只用于标签/单位。`negative="true"` 时数字转红
且必须伴随文本标签（label 或默认"负向风险"）。

## 8. 为什么红蓝表达角色而不表达真伪

颜色回答"这段文字在文章里扮演什么角色"，不回答"它对不对"。
- Evidence（蓝）≠ "证据一定正确"；Counterpoint（红）≠ "反方一定错误"。
- 对立双方必须有真实文本标签（观点 A/B、支持/反对、数据 A/B）。
- 红蓝两侧字体、字号、留白、边框粗细同等级（parity）。
- 灰度下靠标题、标签、边框、空间层级仍可读懂（§15 灰度截图）。

## 9. 移动端裁切根因与修复

**根因（继承 design study R2 的既有诊断，本轮在生产 preview 上复验）：**
旧 Edge headless `--screenshot --window-size=390` 会把页面排版在浏览器最小窗口宽
（~504px），却只截 390px 宽 → 右缘裁切。**这是截图 harness 缺陷，不是布局溢出。**

**本轮验证（CDP 真视口 390px，生产 renderer + 生产 CSS）：**
```
htmlScroll 375 ≤ htmlClient 375 · bodyScroll 375 ≤ bodyClient 375
overflowEls: [] · pass: true
```
无横向滚动、无元素越视口、H1/正文/语义块均在可视区内。
**修复**：截图工具改用 CDP `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot`
（`scripts/capture-redblue.mjs`），并内置 scrollWidth 自动断言。生产 CSS 本身无
固定 min-width；`table-wrap`/`pre` 局部 `overflow-x:auto`，长 URL 靠 `overflow-wrap: break-word`。

## 10. 浏览器预览与微信编译的差异

| 项 | 浏览器 preview（article.css） | 微信产物（safeCss，juice 内联） |
|---|---|---|
| 颜色 | `var(--x)` token | 硬编码 hex（无 rgba 半透明） |
| 列表序号 | CSS counter + `::before` | 原生 `<ol>/<ul>` 标记 |
| 单位 | em / px 混用 | 全部固定 px |
| flex | 预览可用 | PRODUCTION_FORBIDDEN（policyCheck 拦截） |
| 伪元素 | 仅 ul marker / ol counter（装饰） | 无伪元素承载必要内容 |

## 11. 自动化测试状态

`npm test` → **21 files / 243 tests passed**（219 既有 + 24 新增 `v03-phase2.test.ts`）。
`npm run build`（tsc + vite）→ 通过。
新增覆盖：H1–H6 稳定、H4 解钳、7 语义块结构、Question 蓝 / Counterpoint 红 /
Judgment 无红底 / quote 中性 / AI Output 无大蓝底、Metric ≤44px、产物无 `var()`/伪元素/counter/
rgba/clamp/vw、红蓝 token 编译为 hex、老 fixture 无回归、复制输出合法 HTML、fixture 认识论 lint 零 error。
两个既有颜色断言（cobalt `#3157D5` → blue `#2F5FD7`）随配色同步更新。

## 12. 微信真机状态

- **local browser verified**：Edge headless（CDP 真视口）截图 7 张 + computed 视觉审计全绿。
- **compiler output verified**：`compileForWechat` 产物 self-contained、policy-clean、无 var()/伪元素/counter。
- **`WECHAT_MANUAL_ACCEPTANCE_PENDING`**：`.sec-rule` 空 span 的 inline 尺寸、serif 字体栈、
  浅蓝面/红边色相、task 符号 ☑/☐、q-source 行在微信编辑器中是否存活，均需 Owner 真机粘贴验收。

## 13. 已知限制

- `.sec-rule` 是空 span（width/height/background），微信可能剥离 → 已做真实节点 + 固定 px，
  仍标记 PENDING；核心身份（编号 + serif 标题）不依赖它。
- 微信端列表 marker 为原生黑/默认（无法按项目染蓝）——预览蓝、微信原生，差异已披露。
- 代码块不做语法高亮（不引入 highlight.js 依赖）；关键字/字符串/注释配色未实现。
- H1 桌面为 40px（略高于"建议 36–40"上沿），微信端 30px 安全。
- 超长表格在微信重排行为未知（`table-wrap` 局部横滚为浏览器策略，微信需真机确认）。

## 14. 一处修改 token 后全局换色

所有预览颜色都在 `src/styles/tokens.css` 的 `:root` 定义，`article.css`/`base.css` 全部走
`var(--x)`。改 `--blue` / `--red` 一个值即全局换色（含微信侧需同步改 `safeCss.ts` 对应 hex）。
微信产物是硬编码 hex，改色需同步更新 `src/engine/wechat/safeCss.ts`（集中一处）。

## 15. 如何回退到旧 palette

`tokens.css` 保留旧别名映射：`--cobalt: var(--blue)`、`--secondary: var(--muted-ink)` 等。
回退旧 palette = 把别名改回旧值（如 `--cobalt: #3157D5`、`--paper: #F7F5EF`），并同步
`safeCss.ts` 的 hex。渲染结构（H4/sec-rule/task 符号/q-source）与配色解耦，回退不影响结构。

---

## 产物

- 生产预览：`design-studies/v03-phase2-red-blue/preview.html`
- 微信目标产物：`design-studies/v03-phase2-red-blue/wechat-artifact.html`
- 截图：`design-studies/v03-phase2-red-blue/shots/red-blue-*.png`（7 张）
- 溢出报告：`design-studies/v03-phase2-red-blue/shots/overflow-report.json`
- 完整 fixture：`examples/red-blue-editorial.md`
