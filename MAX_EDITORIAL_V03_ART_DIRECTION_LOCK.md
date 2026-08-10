# MAX EDITORIAL V03 — ART DIRECTION LOCK

> **状态：SPEC ONLY。** Prototype C（`prototypes/art-direction-v1/c-hybrid.html`）经用户对比选择，成为 canonical：
> **MAX EDITORIAL V0.3 ART DIRECTION**。不再产出视觉替代，不再合并 A/B 特性。
> 本文件是生产实现的视觉契约；数值为可测 token，不是心理学最优声明。
> 本文档记录 **冻结决策**（§0）对 C 原型的调整；其余以 C 原型为准。

## 0. 冻结决策（高于原型，实现时以此为准）

- **D1 章节编号**：H2 仅编号，`01/02/03…` 由渲染器自动生成（作者不在 Markdown 里手输数字）；微信产物为**真实文本**（非 CSS `counter()`）；H3 不编号；intro 无 `00`；语义块不参与编号；数字视觉次要、优先 Max Cobalt；section 标题主要用 Ink。
- **D2 Judgment**：判断陈述 = serif 居中 + 作者归属 + 慷慨垂直留白 + 克制规则 + 默认无填充卡片；**居中判断，不居中解释**——含解释/支撑散文时，判断陈述先行，解释回到左对齐正文排版；长 Judgment 有安全回退（见 §19）。理想 1–3 行。
- **D3 Metric label**：不再用 `INSPECTION SPECIMEN`。改用出版面向角色标签：
  - SPECIMEN → `被检查对象 / METRIC`
  - RESULT → `系统结果 / RESULT`
  - EXTERNAL STATISTIC → `外部统计 / REFERENCE`
  - 英文是小系统 token，中文承载读者主要含义。43 specimen 仍是检查锚点，非 KPI。

---

## 1. Brand Character

独立研究刊物 × 精确编辑 × 技术随笔 × 实验室笔记。想被认出：冷静、精确、作者性、出版级；不想被认成：SaaS、AI 紫渐变、Notion 克隆、卡片汤、dashboard、咨询 PPT、cyberpunk、为粗野而粗野。

一句话身份：**"MAX 大郭的判断局"作为反复出现的独立刊物**。重复 = convention（§5.3），不是装饰。

## 2. Color Tokens

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#F7F5EF` | 纸面 |
| `--ink` | `#191918` | 墨色正文/主结构线 |
| `--secondary` | `#6A6862` | 次级文字/注记 |
| `--hairline` | `#D8D4CA` | 发丝线 |
| `--surface` | `#EFEEE8` | 浅面（code/lab-note 底色） |
| `--cobalt` | `#3157D5` | 身份 accent（序号、Metric role、Judgment 的 MAX、Fig 标、链接） |
| `--deep` | `#243F9E` | 深 cobalt（SUPPORTED 判词、ai-output 引用条可选） |

**纪律**：黑白做结构，颜色做身份。cobalt/deep 覆盖率 ≈3–5% 视觉面积。**不给全部标题染色，不建蓝色组件框。** 去掉 accent 后页面仍成立（grayscale 自检）。

## 3. Typography Roles

| 角色 | 字体 | 说明 |
|---|---|---|
| Display（标题/H2/Judgment/Metric） | `--serif` | Georgia, "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun |
| Body | `--sans` | -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC" |
| Label/元数据/序号 | `--mono` | ui-monospace, Consolas, "Liberation Mono" |

serif = 编辑时刻/标题；sans = 阅读主体；mono = 系统/标签。三者分工即身份。

## 4. Type Scale（固定 px；微信编译时 H01 大数字另见 §18）

| Token | px | 说明 |
|---|---|---|
| `--t-title` | 42（mobile 33） | cover 标题 serif 500 |
| `--t-h2` | 26 | H2 标题 serif 500 |
| `--t-h3` | 20 | H3 serif 500 |
| `--t-body` | 16 | 正文 |
| `--t-lede` | 17.5 | 开篇段 |
| `--t-quote` | 19 | blockquote serif |
| `--t-judgment` | **23（冻结 D2；mobile 21）** | 判断 serif |
| `--t-metric` | 84（mobile 66；**微信编译 44px**，H01 已验证） | specimen 数字 serif 400 |
| `--t-label` | 10–11 | mono 标签/序号/元数据 |
| `--t-note` | 13–14 | 次级说明/qualifier |
| `--t-next` | 20 | footer next 标题 serif |

行高：body 1.85；H2/H3 1.35–1.45；Judgment 1.7；Metric value 1；mono 1.8–1.9。字距：正文 0；标签 0.2–0.32em（mono，英文大写）；标题 -0.005em。

## 5. Spacing / Rhythm Scale（垂直节奏）

| Token | 值 | 认知作用 |
|---|---|---|
| `--s-para` | 1.4em | 段距（正文为主，不过度空） |
| `--s-h2-top` | 3.4em | section 转换 |
| `--s-h2-bottom` | 1.1em | 标题亲近内容 |
| `--s-h3-top` | 2.2em | 子结构 |
| `--s-block` | 2.4–2.6em | 语义块/引用/图与上下文 |
| `--s-pause` | 4.2em | Judgment 暂停特权 |
| `--s-metric` | 3.2em | Metric 隔离 |
| `--s-cover` | 42px（cover 后） | 封面到正文 |
| `--s-footer` | 4em | 页脚 |

正文 measure：段落 `max-width: 36em`（中文可读行长）。**避免 PPT 式垂直空白**——长段普通散文只靠 1.4em 段距维持节奏。

## 6. H1 / Title Grammar（封面开版，非 `<h1>`）

```
cover-kicker  mono 10px · ls .3em · uppercase · secondary（可含 cobalt 的 ISSUE 001）
cover-title   serif 42px · lh 1.3 · weight 500 · ls -.005em · max-width 20em
cover-deck    sans 16px · secondary · lh 1.7 · max-width 32em
cover-rule    none · border-top 1px ink
cover-byline  mono 10px · ls .22em · uppercase · secondary
```
标题感觉像文章封面/开版，不是默认 `<h1>`。kicker+deck+byline 是出版语言。

## 7. H2 Grammar（结构导航，section 转换）

```
h2 margin  3.4em 0 1.1em
sec-num    mono 11px · ls .32em · uppercase · cobalt · display block · margin-bottom 12px   ← 渲染器自动生成文本
sec-title  serif 26px · weight 500 · lh 1.35 · ls -.005em · ink
h2::after  60px × 1px ink · margin-top 14px                                                 ← 浏览器源语言；微信编译为 border-top（见映射）
```
H2 是**视觉节奏最强的来源**之一：数字 + serif 标题 + 短墨线。标题始终 ink；数字始终 cobalt。

## 8. H3 Grammar（子结构，安静）

serif 20px · weight 500 · lh 1.45 · margin 2.2em 0 0.8em · **不编号**。字号 + 间距双重轻于 H2，绝不与 H2 混淆。

## 9. Paragraph Grammar

16px · lh 1.85 · margin 0 0 1.4em · max-width 36em · ink。开篇段可 17.5px。中文断行交给浏览器/系统；不为每段加装饰。

## 10. Strong / Em / Link

- strong：`weight 600`，**有意为之**（claim 关键字），但不做高亮块。
- em：`italic`，语气微变。
- link：cobalt `#3157D5` + `border-bottom 1px rgba(49,87,213,.35)`——信号是"通向外部"，不抢正文。

## 11. Blockquote（编辑引文，非通用引用）

serif 19px · lh 1.8 · margin 2.4em 0 · `padding 4px 0 4px 22px` · `border-left 1px ink`。来源行 `.q-source`：mono 10px · ls .2em · uppercase · secondary。**无大引号图标**。

## 12. Lists

- ul：`list-style none`；li `padding-left 1.7em` + `::before "—"`（secondary）。
- ol：`01/02/03` mono 11px · ls .12em · cobalt（浏览器源语言用 counter()；**微信编译为显式文本序号**，见映射）。
- 列表用于同层枚举，项内不长 prose。

## 13. Horizontal Rule

章节大分隔（major pause 的廉价替代）。`border-top 1px ink` · margin 3em 0。全文 ≤2（lint 纪律）。不与 Judgment 的双线语法混淆。

## 14. Code

- inline：mono .86em · surface 底 · hairline 1px 边框 · radius 2px · padding .12em .4em。
- fence：mono 13px · lh 1.75 · surface 底 · hairline 边框 · radius 2px · padding 19px 21px · overflow-x auto。
- 代码属于刊物，不像从 GitHub 贴的。

## 15. Table（出版表格，非 spreadsheet）

- 无外框 box；无竖线。`border-top + border-bottom 1px ink`。
- `th`：mono 10px · ls .16em · uppercase · secondary · `border-bottom hairline`。
- `td`：padding 10px 8px；`tr+tr td border-top hairline`。
- 数字列右对齐（tabular）。表格仅用于真实数据；证据/布局不用表。

## 16. Image / Figure / Caption

```
figure .fig-label  mono 10px · ls .24em · uppercase · secondary（`FIG / 01`，cobalt 标可选）
img                 block · max-width 100% · margin auto
figcaption          13px · secondary · lh 1.6 · center · margin-top 10px
fig-source          mono 10px · ls .14em · secondary · center
```
figure 是 Max 身份资产之一：`FIG / 01` 语言 + 说明 + 来源。

## 17. Masthead / Issue System

```
masthead        padding 28px 0 20px · margin-bottom 42px · border-bottom 1px ink
brand           mono 11px · ls .26em · uppercase · ink（圆点 ● 用 cobalt）
meta            mono 10px · ls .22em · secondary（JUDGMENT / 001 · 2026-08）
```
品牌 + issue 系统 = 最强 Max 身份之一。

## 18. Metric（检查锚点，非 KPI）

```
metric        margin 3.2em 0 · text-align center · padding 2.6em 0
              border-top 1px ink · border-bottom 1px ink
m-role        mono 9px · ls .28em · uppercase · cobalt   ← 冻结 D3：被检查对象 / METRIC（RESULT→系统结果 / REFERENCE→外部统计）
m-label       mono 10px · ls .3em · uppercase · secondary（MODEL CLAIM / MINUTES）
m-value       serif 84px · lh 1 · weight 400 · ls -.02em · ink
              （微信编译：H01 模式 `<p>` 固定 44px + weight 600 + margin 10px 0，已验证）
m-unit        mono 11px · ls .34em · uppercase · secondary（EXACTLY?）
m-qualifier   14px · secondary · lh 1.7 · margin-top 20px（被检查的点值 · 非结论 + 检查问题）
```
放大检查对象，而非其权威。role 标 + qualifier 承担 epistemic 边界。无 KPI 数字卡片。

## 19. MAX / JUDGMENT（签名编辑时刻）

```
judgment      margin 4.2em 0 · text-align center · padding 3.2em 12px 2.6em · border-top 1px ink
j-label       mono 10px · ls .32em · uppercase · secondary；`MAX` 用 cobalt（MAX / JUDGMENT · 01）
j-body        serif 23px · lh 1.7 · weight 400 · max-width 22em · ink   ← 冻结 D2：21–24px 区间
j-uncertainty 13px · secondary · lh 1.7 · max-width 30em
j-author      mono 11px · ls .24em · uppercase · ink（— MAX）
```
**居中判断，不居中解释。** 判断陈述 1–3 行居中 serif；解释/支撑散文回到左对齐正文。作者归属显式。无填充卡片。

**长 Judgment 安全回退**：当判断陈述超 4 行或含多段解释时——
1. 判断陈述（前 1–3 行）居中 serif。
2. 其余解释段以左对齐正文排版（16px sans）。
3. `— MAX` 署名跟随判断陈述。
4. 整块不强制居中；若陈述本身超长，允许左对齐 + 保留上墨线（防止"居中=权威"的过度表现）。

## 20. Lab Note（笔记本插页）

```
lab-note   surface 底 · border-left 2px secondary · padding 18px 22px · margin 2.5em 0
lab-label  mono 10px · ls .24em · uppercase · secondary（LAB / CHECKMYCOACH）
lab-stats  mono 14px · ink · lh 1.9 · margin-bottom 10px（40 cases · 15 routed · 12 passed）
lab-scope  13px · secondary · lh 1.7（System evaluation. Not a human study.）
```
低视觉权威（低于 Judgment），保留 scope 边界。不是 dashboard。

## 21. AI Output（文档标本，非聊天气泡）

```
ai-output   padding 6px 0 6px 22px · border-left 2px hairline · margin 2.5em 0
ai-label    mono 10px · ls .24em · uppercase · secondary（AI 原话 · RAW OUTPUT）
ai-body     serif 18px · lh 1.8 · ink · pre-wrap
ai-annotate mono 11px · ls .05em · secondary · lh 1.8
```
克制；source/status 是注记，不抢输出本身。

## 22. Evidence（安静判词结构）

```
evidence   margin 2.4em 0
e-label    mono 10px · ls .26em · uppercase · secondary
e-verdict  mono 10px · ls .2em · uppercase · secondary；SUPPORTED 用 deep
e-text     16px · lh 1.8 · ink · max-width 36em
```
读者先懂"支持什么/不支持什么"，provenance 视觉次要。无大组件框。

## 23. Counterpoint（legibility parity）

```
counterpoint  margin 2.4em 0
cp-label      mono 10px · ls .26em · uppercase · secondary
cp-body       16px · lh 1.8 · ink · max-width 36em · border-top hairline · padding-top 18px
```
与 Evidence 同级可读；不灰化、不缩小、无 warning 样式、不隐藏。不强制与 Judgment 同 salience。

## 24. Footer / Next Article

```
footer        margin-top 4em · padding-top 28px · border-top 1px ink
footer-brand  mono 10px · ls .26em · uppercase · secondary（MAX / JUDGMENT / 001）
footer-tagline 15px · secondary · lh 1.7
next-label    mono 10px · ls .26em · uppercase · secondary（NEXT）
next-title    serif 20px · lh 1.55 · ink
```

## 25. Three-Level Visual Hierarchy

- **LEVEL 1 — READING LAYER（≈80%）**：title/body 关系、段落、H2、H3、strong/em、列表、引用、链接、图、表格/代码。**单独即可出版级**（Markdown P0）。
- **LEVEL 2 — EDITORIAL SIGNATURE（稀疏）**：masthead/issue、编号 H2 opener、Metric、MAX/JUDGMENT、figure grammar。这是"认出这是 Max"的来源。
- **LEVEL 3 — EPISTEMIC UTILITY（安静从属）**：Evidence/Counterpoint 元数据、AI source/status、Lab Note 边界、provenance、uncertainty。**不得与 Level 2 视觉竞争**；默认 ≤2 个可见元数据，scope 声明例外。

## 26. Anti-Patterns（禁止）

1. 卡片汤 / componentized dashboard 感。
2. spreadsheet 表格（cell borders 双列）。
3. 聊天气泡（AI OUTPUT）。
4. warning/error 样式给 COUNTERPOINT。
5. 金句模板（无署名的居中格言）。
6. 每块独立设计（无系统）。
7. 为强调而强调（无 epistemic 依据的放大）。
8. 全部标题染蓝色 / 蓝色组件框。
9. 元数据主导正文（每块全字段暴露 = audit theater）。
10. "仍然像工程原型"的任何表现（默认即失败，见 ACCEPTANCE）。
