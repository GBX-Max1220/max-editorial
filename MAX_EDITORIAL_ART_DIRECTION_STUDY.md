# MAX_EDITORIAL_ART_DIRECTION_STUDY — V0.3 视觉方向原型

> 三个竞争性视觉原型（同一篇文章）供用户做**对比感知判断**，不由实现者选赢家。
> 本任务只产原型与对比工具；**不**进入生产实现，**不**改动 V0.2.3 渲染/编译器/剪贴板/语义模型。

## 1. Goal

V0.2.3 结构可靠、微信安全，但视觉上仍像：技术报告 / 工程原型 / 审计界面 / 带语义标签的默认 Markdown。
本研究的靶：让 Max Editorial 开始像一本**真正独立的科技 / 研究出版物**——精确、编辑化、聪明、冷静、独特、现代、作者性、出版级。

North Star 不变：*A good layout should make an argument easier to inspect, not merely easier to believe.*
但本研究把权重放在：编辑质量、排版、构图、视觉节奏、品牌身份、美。认知/epistemic 原则作为 **guardrails**，不是主要艺术方向。

## 2. Frozen Guardrails（三原型都必须遵守）

1. 视觉权威 ≤ epistemic 权威
2. Evidence 不得暗示"证明"
3. Counterpoint 保持可读（legibility parity）
4. Metric 可吸引检查，但不得像 KPI dashboard
5. Judgment 必须明确作者归属
6. Lab Note 不得暗示人类研究证据
7. 元数据不得主导正常阅读（渐进/安静的 epistemic disclosure，不是每块都暴露全部字段）
8. 无卡片汤
9. 颜色不是主要层级机制
10. 普通 Markdown 散文仍是视觉体验的大多数

**设计红线**：黑白做结构，颜色（Max Cobalt）做身份。去掉 accent 后页面仍应成立。

## 3. Prototype A — Research Magazine（独立研究/科技杂志）

**rationale**：最强的编辑美。serif 大标题（cover 开版）+ 安静 sans 正文 + 克制的 cobalt。
- 标题 = 封面开版：kicker（"A 系列 · 判断 · 独立研究刊物"）+ serif 44px 标题 + deck + 墨线 + 署名。
- H2 = 编辑式 section opener：mono 序号 `01` + serif 标题 + 短墨线（不再是大号加粗段）。
- Judgment = 签名编辑时刻：居中、serif、上墨线、`MAX / JUDGMENT · 01` 小标 + `— MAX`。
- Metric = 隔离检查点：`MODEL CLAIM / PRECISION` mono 标 + serif 88px `43` + `MINUTES` + 限定语；上下发丝线隔离，无卡片。
- Lab Note = 笔记本插页：浅 surface + 左边线 + 平铺数字。
- Evidence/Counterpoint = 安静结构：SUPPORTED/NOT SUPPORTED 用 mono 判词 + 正文值，无大组件框。
- AI OUTPUT = 文档标本：左墨线 + serif 原话 + 小标 + 注记。
- 序号列表用 `01/02/03` 编辑式编号。
- 想传达：文章优先、元数据次之；长段普通散文里也有设计感。

## 4. Prototype B — Precision Editorial（精确/系统/当代）

**rationale**：更技术、更精确、更系统，但仍是文章不是 dashboard。
- 全 sans 强排：标题 36px sans 700 + 明确字号阶 + 几何节奏。
- 封面用 `grid`（issue tag 左列 + 标题右列）+ 深 cobalt issue 标。
- H2 = 编号 + 标题 + 贯穿墨线（几何对齐）。
- Metric = 检查锚点：`INSPECTION SPECIMEN` 右上角小标 + sans 84px 800 大数字 + `MINUTES`，上下墨线框定（非卡片）。
- Evidence = 结构化对照：`SUPPORTED / NOT SUPPORTED` 左列判词 + 右列值，网格行 + 发丝线。
- Judgment = 规则化、精确：2px 顶线 + `MAX / JUDGMENT` + 序号，作者归属明确。
- Lab Note = 精确注记：细边框 + 左边线 + 平铺统计。
- cobalt 更锐利（link、issue 标、序号、判词），但仍稀疏。
- 想传达：精度仪器翻译成出版物；不是软件 dashboard。

## 5. Prototype C — Hybrid 70/30（前导假设）

**rationale**：A 的编辑美 + 阅读舒适 ⊕ B 的信息纪律 + 可辨识系统。
- 普通散文安静（A 式 serif 标题 + 安静 sans 正文）。
- section 转换漂亮（A 式序号 opener，但序号用 cobalt）。
- 少数认识论时刻（Metric/Judgment/Lab Note）视觉突出但克制。
- Metric：`INSPECTION SPECIMEN` role 标（cobalt）+ serif 84px `43` + `MODEL CLAIM / MINUTES` + 限定语——隔离 + 规则，非卡片。
- Judgment：居中 serif 签名时刻，`MAX / JUDGMENT · 01`。
- Evidence/Counterpoint：安静，但 SUPPORTED 判词用 deep cobalt。
- AI OUTPUT：最安静（hairline 引用条 + serif 原话 + 注记）。
- Lab Note：笔记本插页（surface + 左边线）。
- 想传达："MAX 大郭的判断局"作为**反复出现的独立出版物**的最可信形态。

## 6. Typography Systems

| | A · Magazine | B · Precision | C · Hybrid |
|---|---|---|---|
| Display | serif 44px / H2 serif 27px | sans 36px 700 / H2 sans 24px 700 | serif 42px / H2 serif 26px |
| Body | sans 16px · lh 1.85 · measure 36em | sans 16px · lh 1.85 | sans 16px · lh 1.85 · measure 36em |
| Label | mono 10–11px · ls 0.2–0.3em | mono 10px · 更系统 | mono 10–11px |
| Metric | serif 88px | sans 84px 800 | serif 84px |
| Judgment | serif 26px | serif 24px | serif 25px |
| 字体 | serif 标题 / sans 正文 / mono 标签 | 强 sans + serif 只留判断 | serif 标题 / sans 正文 / mono 标签 |

字号全部固定 px（原型可加粗排；微信可行性见 §11）。

## 7. Color Use

基础色板三原型一致：Paper `#F7F5EF` / Ink `#191918` / Secondary `#6A6862` / Hairline `#D8D4CA` / Surface `#EFEEE8` / Cobalt `#3157D5` / Deep `#243F9E`。
- **A**：cobalt 最少——品牌圆点、链接、Judgment 的 `MAX` 标。其余黑白。
- **B**：cobalt/deep 更锐利——issue 标、序号、判词 SUPPORTED、链接。结构仍黑白。
- **C**：cobalt 用于序号、Metric role 标、Judgment 的 `MAX`、Fig 标、链接。覆盖率 ≈3–5%。
三原型都不给全部标题染色、不做蓝色组件框。accent 覆盖目标 ≤5%。

## 8. Markdown Grammar Differences

| 元素 | A | B | C |
|---|---|---|---|
| 标题 | cover 开版（kicker+deck+byline） | issue tag 网格 + sans 700 | cover（kicker+deck） |
| H2 | `01` + serif + 短墨线 | `01` + sans + 贯穿墨线 | `01`(cobalt) + serif + 短墨线 |
| H3 | serif 20px 安静 | sans 600 17px | serif 20px |
| strong | 600 更实 | 700 | 600 |
| blockquote | 左墨线 + serif 引文 + 来源小标 | 左 cobalt 线 + sans | 左墨线 + serif 引文 + 来源小标 |
| ul | 长破折号标记 | 短墨线标记 | 长破折号标记 |
| ol | `01/02/03` mono 编辑式 | `01/02/03` mono cobalt | `01/02/03` mono cobalt |
| link | cobalt + 细下划线 | cobalt + 细下划线 | cobalt + 细下划线 |
| code/pre | mono + surface + hairline | mono + surface + hairline | mono + surface + hairline |
| table | 上下墨线 + 表头 mono 小标，无竖线 | 底墨线 + 右对齐数字 | 上下墨线 + 表头 mono 小标 |
| figure | `FIG / 01` 标 + 图 + 说明 + 来源 | `FIG / 01`(cobalt) + 图 + 说明 | `FIG / 01`(cobalt) + 图 + 说明 |
| 附录样本 | H3 + 行内 code + 旁注引用（等价三份） | 同 | 同 |

## 9. Custom-Component Differences（四个"强 Max"系统 vs 三个安静系统）

**强 Max 系统：**
- **Masthead/Issue**：A 品牌+日期一行墨线；B 系统网格 + issue tag；C 品牌+元数据（最具"刊物"感）。
- **Judgment**：A/C 居中 serif 签名时刻（`MAX / JUDGMENT · 01` + `— MAX`）；B 规则化左对齐 + 序号。都是作者时刻，非警示框。
- **Metric**：A 隔离 serif 88 + `MODEL CLAIM / PRECISION`；B sans 800 + `INSPECTION SPECIMEN` 角标；C serif 84 + role 标。都是检查锚点，非 KPI。
- **Lab Note**：三份都是笔记本插页/精确注记，保留 `System evaluation. Not a human study.`。

**安静系统：** AI OUTPUT（文档标本）、Evidence（安静判词结构）、Counterpoint（同等 legibility，不抢 salience）。

## 10. Editor UI Differences

三份编辑工作台外壳（a/b/c-editor-ui.html）：左 SOURCE（安静 mono 编辑器，语义块/标题语法着色克制）+ 右 PUBLICATION（实时刊物预览）+ 底部状态（字数 · 模式 · CHECK · COPY）。
- **A**：杂志工作台——右预览 serif 封面、cobalt 圆点、宽留白。
- **B**：精度工作台——右预览网格化、issue tag、cobalt 深、Evidence 双列。
- **C**：混合工作台——右预览编辑式 + 信息纪律。
三者 chrome 都最小：无大工具栏、无 25 个格式按钮、COPY 动作明显、target（WECHAT）可见。

## 11. WeChat Feasibility Notes

原型是**浏览器视觉语言**（源码主题层）；微信编译器负责把设计意图编译成安全 primitive（font/size/weight/line-height/letter-spacing/margin/padding/border/background/alignment/block flow）。
- 大多数设计由 SAFE 类 primitive 构成（固定 px 字号、margin/padding、hairline、背景、text-align、letter-spacing）。
- 标识性时刻（Metric 大数字、Judgment 居中、Lab Note 浅底）在 V0.2.3 已验证可编译（H01 模式）。
- 需编译器阶段验证的：serif 中文栈、超大数字在各机型存活、em 字距。这些是**后续实现决策**，不阻塞本次审美判断。

## 12. Known Browser-Only Primitives

以下只用于原型探索（浏览器渲染），**不能直接进微信**，需编译器降级/拍平：
- `display:grid`（B 的封面/H2/Evidence 网格、A/C 的部分布局）
- `::after`/`::before`（H2 墨线、列表标记）
- `flex`（B 的 metric 行、masthead 行）
- `position:absolute`（B 的 metric 角标）
- `linear-gradient`（B 的 ai-output 底色渐隐）
- `counter()`（ol 的 `01/02/03` 编号——微信可编译为显式编号文本）

这些都是浏览器源语言；最终概念在结构上仍可拍平为 block flow + 显式规则。

## 13. What Should NOT Influence Preference Judgment

- 不要因某个原型用了 grid/伪元素就判它"无法实现"——那是编译器问题，不是审美问题。
- 不要因 A"更杂志"就觉得更适合生产；也不要因 B"更系统"就觉得更可靠。
- 内容三份等价（含尾部等价排版样本）；不要因内容差异选。
- 三份都有等价的全部元素（masthead/标题/段落/H2/H3/引用/列表/AI OUTPUT/Metric/Evidence/Counterpoint/Judgment/Lab Note/链接/代码/表格/图/Footer）。
- 选择基于：哪个标题最好、哪段正文读起来最舒服、哪个 H2 最有节奏、哪个 Judgment 最像 Max、哪个 Metric 最好、哪个像技术报告、哪个像文学杂志、哪个你会真的发布。

## 14. Exact Paths

```
prototypes/art-direction-v1/
  index.html                     ← 对比页（A/B/C 标签 + 375/430/desktop 视口预设）
  a-research-magazine.html       ← 原型 A · 文章
  a-editor-ui.html               ← 原型 A · 编辑工作台
  b-precision-editorial.html     ← 原型 B · 文章
  b-editor-ui.html               ← 原型 B · 编辑工作台
  c-hybrid.html                  ← 原型 C · 文章
  c-editor-ui.html               ← 原型 C · 编辑工作台
```

打开方式：直接双击 `prototypes/art-direction-v1/index.html`（推荐从项目根相对路径保持 iframe 可加载）；或分别打开任意 `*-editorial.html` / `c-hybrid.html`。编辑器外壳单独打开 `*-editor-ui.html`。

---

## Visual QA 记录（非断言，实测）

- 结构 QA：三个文章原型经 jsdom 解析全部良构；必需元素（masthead/标题/3×H2/H3/段落/strong/引用/ul/ol/pre/code/table/figure/metric/evidence/counterpoint/judgment/lab-note/ai-output/link/footer/附录样本）全部 ≥ 要求数量；三份内容密度差异 ≤4（无内容偏置）。
- 布局 QA（headless Chrome 真实渲染 + ffmpeg 像素分析）：375px 视口下三原型左右边缘均为纯纸色 → **无横向溢出**；标题区存在墨色文字像素 → **内容正常渲染**；无空白页。
- 编辑 UI + 对比页良构。

**实现者不选赢家。** 请打开对比页，做第 13 节那些具体比较判断。
