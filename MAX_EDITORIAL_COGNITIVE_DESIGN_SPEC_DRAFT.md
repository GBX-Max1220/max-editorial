---
**PROVENANCE HEADER（recovery record，2026-08-10）**

```text
Version: V0.2 rev1

Status:
DESIGN-COVERED
IMPLEMENTATION-UNVERIFIED
BEHAVIORALLY-UNVALIDATED

Canonical path:
C:\Users\gbx12\projects\max-editorial\MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md

Provenance: recovered original rev1 artifact（agent workspace 源文件复制；内容未重写）。
恢复时仅做两处最小修改：(1) 文件顶部添加本 provenance header（Step 4 要求）；
(2) §7.5 数字代理标注为 editorial/test heuristics（Step 2-H 要求，见 §7.5 内标注）。
不声称任何行为验证。
```

---

# MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT

**版本：** V0.2 rev1（合入 ChatGPT hostile review 裁决：INVARIANTS 分层、METRIC 两轴模型、五问三级化、referential integrity、自检三态。rev0 为基于 hostile audit 的压缩稿）
**读者：** 前端工程师（实现 Max Editorial V0.2 渲染层）
**性质：** design specification，不是 implementation plan。不含代码、不指定具体颜色值、不讨论 engine architecture。
**证据分级（全文统一）：**
- **[EVIDENCE-DIRECTION]** 有较稳健研究方向支持（不保证具体 UI 数值已被证明）
- **[HEURISTIC]** 受理论启发，具体规则由我们制定，可被测试推翻
- **[AESTHETIC]** 纯品牌/审美选择
- **[REJECT]** 伪心理学或不可操作，禁用

**三个心理学透镜（贯穿全文）：**
- **LENS A — Cognitive：** 页面怎样帮助大脑理解文章，而不是增加无关加工？
- **LENS B — Behavioral：** 一个真实手机读者会如何行动（scan/skim/stop/anchor）？
- **LENS C — Design：** 怎样把认知目标和阅读行为变成视觉结构？

---

## 1. Design Objective

### 1.1 核心目标

> 排版不仅应该让观点容易理解，还应该让观点更容易被检查。

操作化定义（可测试的成功标准）：

1. **Inspectability：** 读者在遇到任意 claim/evidence/source 时，能低摩擦回答五个问题——谁说的？什么状态？支持什么、支持到哪里？什么仍然不确定？最多可以合理推出什么？（§14）
2. **阅读连续性：** 2000–3000 字移动端连续滚动中，reader state 模型（§2）中的 READ→INSPECT→RESUME 循环不被打断成"组件浏览"。
3. **Epistemic 诚实：** 视觉系统永远不制造"比内容本身更高的权威"。（§8）
4. **辨识度：** 去掉全部 semantic blocks 后，普通 Markdown 本身仍像一个成熟 publication。（§12）

### 1.2 非目标（明确不做）

- 不追求最大审美吸引力。
- 不假装解决 evidence selection / completeness 问题（系统不宣称"无偏见"）。
- 不为"看起来严谨"堆砌标签（audit theater 禁令，§15 Risk G）。
- 不声称任何固定字号/行高/中断数量是"心理学最优"。

### 1.3 诊断基线（冻结）

> V0.1 提供了比 epistemic inspection 更强的 salience 与 authority cues。

V0.2 的验收标准：在同样内容上，检查类 cues（source/status/support/boundary/uncertainty）的视觉存在率从"部分缺失"变为"系统性覆盖"。

---

## 2. Reader State Model

### 2.1 状态机

```
SCAN → ORIENT → READ → INSPECT → PAUSE → RESUME
  ↑                                      │
  └────────────── (循环) ────────────────┘
```

| 状态 | 用户行为 | 视觉系统的职责 |
|---|---|---|
| SCAN | 快速滚动，找"值不值得读" | 提供可靠 landmarks（title、H2、QUESTION、METRIC-specimen） |
| ORIENT | 确认"当前在讨论什么问题" | H2 与 QUESTION 必须语义对齐；块类型可 0.5s 内识别 |
| READ | 进入连续 prose | **视觉系统尽量退出**：低对比、稳定节奏、无新对象 |
| INSPECT | 对 claim/evidence/source 做检查 | 五问可回答：谁说的/状态/支持/不确定/边界 |
| PAUSE | 主动停下（判断、标本、大问题） | 暂停语法只出现在真正值得停的对象上 |
| RESUME | 回到连续阅读 | 特殊块之后必须有明确的"回程"（prose 恢复信号） |

### 2.2 三透镜检查该模型

- **LENS A（Cognitive）：** 模型与阅读研究兼容——阅读不是匀速加工 [EVIDENCE-DIRECTION]；中断-恢复成本真实存在（Altmann & Trafton, 2002 方向）[EVIDENCE-DIRECTION]。但"状态"是理想化分类，真实读者在状态间连续滑动 [HEURISTIC]。模型用途是设计对齐，不是行为预测。
- **LENS B（Behavioral）：** SCAN 是移动阅读的主导行为 [HEURISTIC，有网页阅读行业数据支持但非实验证据]；锚定于大数字 [EVIDENCE-DIRECTION]。模型必须假设**最坏的读者路径**：只 SCAN + 只看 landmarks 就形成判断——设计必须让这条路径也不被误导。
- **LENS C（Design）：** 每个状态需要不同的视觉密度（READ 时安静、INSPECT 时信息可查）——这直接导出"视觉系统按状态进退"的语法分层（§9）。

### 2.3 模型推论（进入 spec 的硬约束）

1. **READ 状态是默认态：** 任何新视觉对象都是对 READ 的中断，必须有存在理由。
2. **SCAN 路径安全：** 只扫 landmarks 的读者不能带走错误结论（METRIC 不带 role 标记 = 违规，§13.7）。
3. **PAUSE 是特权：** 只有 JUDGMENT、METRIC-specimen、major QUESTION 拥有暂停语法；其他元素禁止借用（§11 的 major pause gap 只属于这三者）。

---

## 3. Cognitive Psychology Principles

每条标注证据等级。这些是 §17 INVARIANTS 的理论来源。

### 3.1 Visual authority ≤ epistemic authority [EVIDENCE-DIRECTION]

- **依据方向：** source monitoring（Johnson et al., 1993）——来源/状态信息弱化时，判断依赖外围线索；heuristic-systematic model（Chaiken, 1980）——外围线索（视觉权威感）可替代系统加工。
- **含义：** 任何对象的视觉权重不得超过其 epistemic 状态允许的权重。这是全系统的第一原则。

### 3.2 Evidence is a relation to a claim [HEURISTIC]

- **依据方向：** 这是认识论立场而非心理学发现；但心理学上的对应物是"支持关系需要显式加工才被利用"（integration 成本）[HEURISTIC]。
- **含义：** EVIDENCE 块必须引用它支持的 claim（§13.4）。label 本身不赋予权威。

### 3.3 Counterargument 需要 legibility parity，不是 salience parity [HEURISTIC]

- **依据方向：** confirmation bias 的普遍性 [EVIDENCE-DIRECTION，Nickerson 1998]；"视觉弱化反方 → 更强偏差"无直接实验，属合理推断 [HEURISTIC]。
- **含义：** 反方不得灰化/缩小/藏匿，但 evidence weight 不同时不必 50/50 强调。

### 3.4 Magnify the object of inspection, not its authority [EVIDENCE-DIRECTION→HEURISTIC]

- **依据方向：** 显著性捕获注意 [EVIDENCE-DIRECTION，Itti & Koch 2000 方向]；锚定 [EVIDENCE-DIRECTION]。
- **含义：** 大数字可以放大（作为标本），但必须携带"这是被检查对象"的覆盖标记，且标记权重 ≥ 数字（§13.7）。

### 3.5 Structured provenance improves inspectability [EVIDENCE-DIRECTION]

- **依据方向：** source monitoring；provenance 信息改善 source attribution [EVIDENCE-DIRECTION]。
- **边界：** provenance 改善可检查性；**不**证明内容为真、完整、无选择偏差（§14.3、§15 SELECTION OPACITY）。

### 3.6 Salience is a budget [EVIDENCE-DIRECTION + HEURISTIC]

- **依据方向（部分）：** 注意容量有限 [EVIDENCE-DIRECTION]。
- **启发式（部分）：** "预算"怎么分配无实证阈值 [HEURISTIC]。
- **操作规则：** 任意 viewport 内 dominant 对象 ≤ 1（§6.4）。

### 3.7 分组手段按成本排序 [EVIDENCE-DIRECTION + HEURISTIC]

- **依据方向：** Gestalt 知觉组织有实验基础（proximity, similarity, common region—Palmer 1992）[EVIDENCE-DIRECTION]。
- **排序本身：** proximity → alignment → whitespace → similarity → hairline → subtle surface → full border [HEURISTIC]。不要默认 card。

### 3.8 中断恢复成本 [EVIDENCE-DIRECTION]

- 中断后回到原任务需要时间；块类型越不一致，分类成本越高。
- **含义：** 统一块语法（§9.2）优先于减少块数（§7.3）。

### 3.9 加工流畅性影响 truth 判断 [EVIDENCE-DIRECTION]

- 流畅呈现提高 perceived truth（Reber & Schwarz 1999；Newman et al. 2012 truthiness 方向）。
- **含义：** 排版本身是说服装置。本项目拒绝利用 unearned trust：polish 服务于"理解的结构"，不服务于"同意的顺滑"（§15 Risk A）。

### 3.10 认知负荷三分（诊断工具）[EVIDENCE-DIRECTION]

- intrinsic / extraneous / germane（Sweller 方向）。用于审查每个视觉决策：它是 extraneous（与理解无关）还是 germane（服务于论证结构）？答不上来的元素删除。

---

## 4. Behavioral Reading Principles

### 4.1 用户不是匀速读者 [HEURISTIC]

典型路径：SCAN → 决定是否读 → 进入 prose → 遇到 claim → inspect/skip → pause → resume → 更新判断。**设计必须服务这条路径，而不是理想化的"从头读到尾"。**

### 4.2 Scan 时外围线索主导 [EVIDENCE-DIRECTION]

- scan 是浅加工，视觉语法（大小、容器、标签）成为主要信息源（heuristic processing, Chaiken 1980 方向）。
- **含义：** 只扫 landmarks 的读者必须能正确识别：这是判断/是标本/是注记/是反方。

### 4.3 用户会锚定于数字 [EVIDENCE-DIRECTION]

- 孤立大数字会被当作"事实"而非"被检查对象"。METRIC 的 role 标记是强制项（§13.7）。

### 4.4 用户从呈现推断权威 [EVIDENCE-DIRECTION]

- 表格、卡片、正式语法 → perceived rigor（truthiness 方向）。EVIDENCE 去 spreadsheet 化是行为层面的要求，不只是审美。

### 4.5 用户会跳过看起来次要的内容 [HEURISTIC]

- 弱视觉 = 可跳过信号。COUNTERPOINT 的 legibility parity 因此是行为要求。

### 4.6 用户对"标签堆积"会脱敏 [HEURISTIC]

- 全篇都是 epistemic label → audit theater（Risk G）：看似严谨，实则标签失去信号价值。label 数量是硬约束（§9.4）。

### 4.7 移动滚动行为 [HEURISTIC]

- 竖屏滚动中，一屏 whitespace 会被感知为"段落结束"或"文章结束"。whitespace 预算（§11.5）是移动端行为约束。

---

## 5. Design Psychology Principles

### 5.1 Gestalt 分组 [EVIDENCE-DIRECTION + HEURISTIC]

- proximity / similarity / common region 有知觉实验基础 [EVIDENCE-DIRECTION]；排版应用是启发式 [HEURISTIC]。
- 规则：先 proximity/alignment/whitespace，最后才 surface/border（§9.3）。

### 5.2 层级 = 对比的产物 [HEURISTIC]

- 层级来自反差（大小/粗细/间距），不是绝对数值。全篇统一的反差规则比"大一点"重要。

### 5.3 重复建立 convention [HEURISTIC]

- 同一角色永远同一语法（JUDGMENT 永远居中+署名；COUNTERPOINT 永远同级 legibility）。一致性降低分类成本（§3.8）。

### 5.4 figure-ground [EVIDENCE-DIRECTION（知觉基础）+ HEURISTIC（应用）]

- semantic block 是 figure，正文必须是有身份的 ground——否则块像"贴上去的组件"。这是 Base Markdown P0（§12）的设计心理学依据。

### 5.5 Information scent [HEURISTIC]

- 读者靠 landmarks（H2、QUESTION、label）判断"继续读有没有回报"。landmarks 必须语义准确：H2 说 A，块内容必须是 A 的展开。

### 5.6 Affordance [HEURISTIC]

- 视觉语法暗示"该拿它怎么办"：引用语法 → 读原话；对照对 → 比较；注记 → 忽略/备查。块语法不得给读者错误的 affordance（如"报告"暗示"验证完毕"）。

---

## 6. Salience Hierarchy

### 6.1 三层结构

| 层 | 成员 | 职责 |
|---|---|---|
| 导航层（常量） | H2、H3、QUESTION | 由 block type 决定，全篇一致；scan/orient 的 landmarks |
| 论证层（变量） | JUDGMENT、EVIDENCE、COUNTERPOINT、METRIC | 由**该处内容的 epistemic 权重**决定，不是由块类型决定 |
| 注记层 | LAB NOTE、metadata、caption | 永远低；服务 inspect，不参与竞争 |

### 6.2 论证层规则：内容覆盖类型

- 块类型给**默认权重**，内容给**覆盖权重**。
- **必须区分两个概念（rev1 澄清，防止实现歧义）：**
  - **Grammar identity（不变）**：同一种块类型全篇使用同一容器语法、同一 label、同一排版结构。这是 convention 一致性的来源——**CSS class 只绑定 grammar identity**。
  - **Salience intensity（可变）**：同类型块在**不同文章**中的强调程度可以不同；**同一篇文章内**同类型块的 intensity 必须一致（一致性优先于单点最优）。
- **实现约束：** CSS class 不得绑定 salience intensity 的绝对权重；intensity 由内容角色决定（§19-H1，作者/编辑裁决）——防止前端自动退化为 type → weight mapping（ChatGPT 裁决 C-1）。
- 例：METRIC-specimen（被检查的 43 分钟）可高；METRIC-result（12/15 通过）必须中；METRIC-statistic（外部数据）必须中低。三个 role 不可同权（§13.7）。

### 6.3 三方可比原则

- 文章核心 claim、主要 evidence、最强 counterpoint 三者的视觉权重**必须可比**。任何一方被系统性压弱 = 违规（INVARIANT 7 的心理学基础）。

### 6.4 Viewport 预算

- **任意 viewport 内 dominant 对象 ≤ 1。** 其余元素支持阅读而非竞争。
- dominant 的定义：占据该屏注意力的视觉对象（超大数字、居中金句、全宽卡片）。
- 状态（rev1）：**EDITORIAL CONSTRAINT（软，§17-B-C3）**——启发式纪律，lint 只能 warning，不得硬化成 error（§19 enforcement contract）。

---

## 7. Interrupt Model

### 7.1 元素中断等级

| 元素 | 等级 | 理由 |
|---|---|---|
| 正文段落 | LOW | 连续阅读单位 |
| H3 | LOW–MEDIUM | 子结构信号，预期内 |
| 有序/无序列表 | LOW–MEDIUM | 熟悉语法，分类成本低 |
| blockquote（普通引用） | MEDIUM | 引用语义化后成本降低（§12） |
| H2 | MEDIUM | 结构性中断，读者预期；一致性越高越便宜 |
| code block | MEDIUM–HIGH | 密集格式，需要进入"代码模式"；短代码块应避免 |
| QUESTION | MEDIUM | label + 间距；不做大 whitespace（与 JUDGMENT 区分，§13.1） |
| AI OUTPUT | HIGH | 新对象 + 引用语义；quotation 语法统一后成本可降为 MEDIUM–HIGH |
| COUNTERPOINT | MEDIUM | 与 EVIDENCE 同级语法；有容器但轻 |
| EVIDENCE | MEDIUM–HIGH | 对照列表语法；禁止表格后成本下降 |
| LAB NOTE | LOW–MEDIUM | 注记级；默认文末时几乎无中断 |
| JUDGMENT | HIGH | **功能性中断**——邀请 PAUSE |
| METRIC | HIGH（specimen）/ MEDIUM（result）/ MEDIUM（statistic） | 按 role 分级 |
| table | HIGH（默认禁用，§12） | 网格处理成本 + 窄屏重排 |

### 7.2 中断分类原则

- **功能性中断**（JUDGMENT、METRIC-specimen、major QUESTION）：服务该处的认知需求，允许 [HEURISTIC]。
- **非功能性中断**（装饰卡片、无 claim 引用的表格、重复 label）：extraneous load [EVIDENCE-DIRECTION]，删除。

### 7.3 统一语法优先于减少块数

- 连续 6 个块的问题根源是 6 种不同语法，不是 6 个块。统一为 4 种容器语法族（§9.2）后，切换成本显著下降。

### 7.4 Interrupt Density Heuristic（四维，禁止固定数字）

1. **Consecutive special blocks：** 连续 HIGH 中断 ≤ 2；第 3 个出现时编辑必须插入 prose。
2. **Viewport density：** 任意连续两个 viewport 内 HIGH 元素 ≤ 1。
3. **Narrative phase：** HIGH 元素落在论证转折点（提出 claim、给出判断、转折处）；不在连续展开的论证中间插入。
4. **Prose recovery length：** 每个 HIGH 元素后必须跟 ≥ 1 段 prose 再进入下一个块（"回程"要求，§2.3-3）。

目标：阻断 "AI OUTPUT → METRIC → JUDGMENT → EVIDENCE → COUNTERPOINT → LAB NOTE" 连续 component barrage。

### 7.5 Epistemic adjacency（rev1 新增，ChatGPT 裁决 F-2）

Salience 管"多大"，序列管"什么时候遇到"。**legibility parity ≠ encountered**——反方字号相同但五屏后才出现，多数读者已在五屏前形成结论。

规则（针对 **load-bearing JUDGMENT**；下述数字代理均为 **EDITORIAL/TEST HEURISTICS**，不得被实现为 renderer 自动重排规则或绝对认知主张——Step 2-H 恢复要求）：
1. 其支持 evidence 与最强 counterpoint 必须在一个**低摩擦 inspection neighborhood** 内可达——不强制相邻。
2. 具体：a) JUDGMENT 处有显式 anchor（"证据 / 反方见下"）；b) 移动端滚动距离 ≤ 1 屏；c) 反方不得出现在判断之后 5 屏以上。
3. lint：anchor 缺失 = warning（enforcement contract，§19）。

---

## 8. Epistemic Hierarchy

### 8.1 九种 epistemic 对象（区分是 inspectability 的前提）

| 对象 | 定义 | 视觉要求 |
|---|---|---|
| SOURCE | 谁/什么产生信息 | 永远可查（名称/时间/方法） |
| CLAIM | 被主张的命题 | 可被定位为"被支持"或"待查" |
| EVIDENCE | 对 claim 的支持关系 | 必须指向被支持的 claim（§13.4） |
| INTERPRETATION | 作者对材料的解读 | 作者归属标记 |
| JUDGMENT | 作者综合判断 | author-owned cue 强制（§13.3） |
| COUNTERARGUMENT | 替代模型/严肃挑战 | legibility parity（§13.5） |
| UNCERTAINTY | 仍不知道的、是谁的不确定 | 显式出现，不藏在正文里 |
| PROVENANCE | 研究状态/方法边界 | scope-limiting metadata（§14.3） |
| SPECIMEN | 被检查的样本（数字/输出） | 覆盖标记（§13.7） |

### 8.2 身份优先于强度

- epistemic 区分靠**语法身份**（引用 vs 对照 vs 注记 vs 暂停），不靠**强度**（大 vs 小）。强度只表达论证层内的权重。
- 反例（禁止）：EVIDENCE 与 LAB NOTE 共享卡片+表格语法——身份混淆，即使字号不同。

### 8.3 视觉权威上界

- 每个对象有 epistemic 权威上界：AI OUTPUT（待审查）< EVIDENCE（支持材料）< JUDGMENT（作者判断，非事实）。视觉权重不得超过上界（§3.1）。

---

## 9. Visual Grammar

### 9.1 语法即身份

- 容器语法编码 epistemic 身份，不是装饰身份。
- 四种容器语法族（全系统只用这四种）：

| 语法族 | 用途 | 视觉手段（不指定颜色） | 成员 |
|---|---|---|---|
| PROSE | 连续阅读 | 无容器，靠段距 | 正文、列表 |
| QUOTATION | 他者之语/待审查原话 | 引用条/引号 + 来源行 | AI OUTPUT、EXTERNAL STATISTIC 原文、blockquote |
| CONTRAST PAIR | 论证对照 | 同一容器两种 label，对齐结构 | EVIDENCE ↔ COUNTERPOINT |
| PAUSE | 值得停下的对象 | 居中 + 分隔规则 + 署名行 | JUDGMENT、METRIC-specimen、major QUESTION（可选） |
| ANNOTATION | 元信息 | 最小化：小字号、弱背景或无背景 | LAB NOTE、metadata、caption、scope 注记 |

### 9.2 容器语言统一规则

- **禁止**：每个块自选容器样式。七块只允许映射到上述五族。
- 映射（冻结）：QUESTION → PROSE/PAUSE（section opener 用 PROSE + label，major question 可 PAUSE）；AI OUTPUT → QUOTATION；EVIDENCE/COUNTERPOINT → CONTRAST PAIR（同一容器）；JUDGMENT → PAUSE；LAB NOTE → ANNOTATION；METRIC → QUOTATION/PAUSE（按 role，§13.7）。

### 9.3 分组手段优先级（默认不用 card）

```
proximity → alignment → whitespace → similarity → hairline rule → subtle surface → full border
```

- 前四种是默认分组手段 [HEURISTIC]；surface/border 只在"必须防止误读为正文"时使用（如 AI OUTPUT 需要与正文明确分离）。
- **不要默认 card。** 一个元素要用 surface/border，必须回答：为什么 proximity/whitespace 不够？

### 9.4 Label 系统

- 英文 label 总数 ≤ 4（建议：AI OUTPUT、JUDGMENT、EVIDENCE、COUNTERPOINT——需要导航的论证层）。其余用中文或并入语法本身 [HEURISTIC]。
- label 是导航工具不是装饰；每块都带 label = 每块都在喊"看我"。
- 中文 label 候选：提问 / AI 原话 / 作者判断 / 证据 / 反方 / 实验注记。

### 9.5 禁止模式（全系统）

1. 统一卡片化（componentized dashboard 感）
2. spreadsheet 表格（cell borders 双列）
3. 聊天气泡（AI OUTPUT）
4. warning/error 样式给 COUNTERPOINT
5. 金句模板（无署名的居中格言）
6. 每块独立设计（无系统）
7. 为强调而强调（无 epistemic 依据的放大）

---

## 10. Typography Grammar

### 10.1 Relational 规则（拒绝绝对数值声明）

以 body 为基准，给出起始区间，全部标注 [HEURISTIC]：

| 角色 | 相对 body | 区间 | 依据 |
|---|---|---|---|
| body | 1× | — | baseline |
| metadata / caption / LAB NOTE | 0.8–0.88× | 可读下限 | [HEURISTIC] |
| H3 | 1.1–1.2× | 子结构 | [HEURISTIC] |
| H2 | 1.4–1.6× | 结构导航 | [HEURISTIC] |
| JUDGMENT | 1.15–1.3× | 比 body 重，但不得像标题 | [HEURISTIC] |
| METRIC 数字 | 2–3×（specimen）/ 1.3–1.6×（result） | 按 role | [HEURISTIC] |
| title | 2–2.5× | 品牌区 | [HEURISTIC] |

- **禁令**：任何规则不得声称"心理学最优"。区间是设计起点，用真实文章校准。

### 10.2 Serif vs Sans [AESTHETIC]

- 决定依据 = **genre 信号**（想要什么身份：文化杂志 vs 技术博客），不是"可信度"。
- serif 标题 + 系统字体正文是安全组合（中文 serif 移动端字体栈受限）[AESTHETIC + 移动端现实 HEURISTIC]。
- 正文 serif/sans 阅读速度无一致差异 [EVIDENCE-DIRECTION]，所以这是自由选择——但必须一致。

### 10.3 中英混排

- 技术术语用原词（calibration、logprobs、confidence），不翻译成夹生中文 [HEURISTIC]。
- 英文单词与中文之间保留自然间距（浏览器自动处理，不额外加空格）[HEURISTIC]。
- 英文 label 的 code-switch 成本 [EVIDENCE-DIRECTION 方向，外推有限]：label 数量约束见 §9.4。

### 10.4 Line-height / 段落间距

- line-height 用相对值（body 的 1.6–1.8 倍起始）[HEURISTIC]，禁止"1.85 最优"声明。
- 段落间距 = 一个"视觉节拍"单位，全篇统一 [HEURISTIC]。

### 10.5 Bold 密度 [HEURISTIC]

- 每段 ≤ 1–2 处强调；**bold 是稀缺资源**，用于 claim 关键字，不用于装饰。
- 禁止整段 bold、禁止"伪标题"（正文里用 bold 冒充 H3）。

### 10.6 数字层级 [HEURISTIC]

- 数字与正文区分（tabular numerals 或独立样式），但 specimen/result/reference 三种 DISPLAY FUNCTION 的视觉权重不同（§13.7）。

### 10.7 拒绝声明

- 任何 "17px 最优 / 1.85 行高最优 / serif 增信" 一律删除（§20）。

---

## 11. Spacing Grammar

### 11.1 Gap 层级与认知作用

| Gap | 认知作用 | 规则 |
|---|---|---|
| paragraph gap | 阅读连续性：小、一致 | 全篇统一，禁止"有时大有时小" |
| intra-paragraph inline spacing | 不打断阅读 | 词间距交给字体系统 |
| H2 top gap | 结构边界：新段落的开始信号 | 明显大于 paragraph gap |
| H2 bottom gap | 让 H2 与其内容亲近 | 小于 top gap（proximity 分组） |
| semantic block before | 与上文分离 | ≥ H2 bottom gap |
| semantic block after | 回到 prose 的"回程" | 与 paragraph gap 相同或略大（不可过大，否则丢失连续性） |
| semantic internal gap | 块内元素分组 | 小于 block before/after |
| major pause | **PAUSE 特权**：只属于 JUDGMENT / METRIC-specimen / major QUESTION | 全系统最大 gap；其他元素禁止使用 |
| image gap | 图与文的关系 | 与段落 gap 一致 |
| caption gap | caption 属于图 | 小于 image gap（proximity） |

### 11.2 间距一致性规则

- **同角色同 gap**：同类元素在所有位置使用相同间距。间距不一致 = 读者误判层级 [HEURISTIC]。
- major pause 是稀缺资源：全文 2000–3000 字内，PAUSE 语法（§9.1）使用 ≤ 3 次 [HEURISTIC]——不是心理学定律，是"暂停特权"纪律。

### 11.3 移动端 whitespace 预算

- 桌面 whitespace 在手机上按比例**减半**：一屏（~700px 滚动距离）内，除 major pause 外不允许出现"空屏" [HEURISTIC]。
- 判断标准（行为测试）：滚动时读者是否误判"文章结束了"。出现误判 = whitespace 超预算。

---

## 12. Base Markdown Specification

**P0：普通 Markdown 承担 60–70% 的 publication identity。** 依据：正文占篇幅多数；blocks 是 figure，正文必须是有身份的 ground（§5.4）。

### 12.1 paragraph

- 默认样式：无容器、统一段距、统一 line-height。**视觉系统在 READ 时退出**（§2.3）。
- 禁止：段落背景、段落边框、每段缩进变化。

### 12.2 H2

- 结构导航，全篇唯一可靠 landmarks [HEURISTIC]。样式**完全一致**，禁止被块设计污染。
- 移动端：H2 前 gap 必须让读者明确"新部分开始"。

### 12.3 H3

- 子结构，明显轻于 H2（字号 + 间距双重区分）。禁止与 H2 混淆 [HEURISTIC]。

### 12.4 strong / em

- strong = claim 关键字（每段 ≤1–2 处）；em = 语气的细微变化。
- 禁止：strong 冒充标题、em 大段使用。

### 12.5 blockquote（引用语义化——V0.2 必须解决）

- 当前：左竖线 = 未分类引用，读者不知道引用者是谁 [HEURISTIC，source monitoring 方向]。
- 规则：引用类型三选一，视觉区分至少两种：
  1. **AI 原话** → 用 QUOTATION 语法（即 AI OUTPUT 块，或内联引用条 + "AI 说"标注）
  2. **他人观点** → 引用条 + 来源名（谁说的必须可见）
  3. **作者强调** → 禁止用 blockquote（用 strong 或 JUDGMENT 语法）
- 无来源的 blockquote 视为设计错误。

### 12.6 有序/无序列表

- 列表用于"同层枚举"，不用于"论证"（论证用 EVIDENCE/COUNTERPOINT）[HEURISTIC]。
- 列表项内禁止大段 prose（>2 行必须拆段落）。

### 12.7 table

- **默认禁用** [HEURISTIC + 移动端现实]。替代：对照列表（EVIDENCE/COUNTERPOINT 语法）。
- 仅当：数据 >3 行且必须精确对齐（如数字矩阵），且接受移动端横滚成本。
- 禁止 cell borders 双列表（spreadsheet 语法）。

### 12.8 inline code

- **只用于代码/字面值**（文件名、命令、API 名）。技术术语（calibration、logprobs、margin of error）**不是代码** [HEURISTIC]。
- 技术术语与代码的区分规则：术语用原词普通样式（可加第一次出现时的简短解释），代码用 inline code 样式。
- 禁止：术语默认 = inline code（这会让每篇 Human-AI 文章变成高亮丛林）。

### 12.9 code block

- 短代码块（<5 行）优先转为 inline 或文字说明；长代码块用独立语法（LOW-MEDIUM 中断可接受）。
- 禁止：无语法高亮的密集墙（移动端不可读）。

### 12.10 link

- 统一样式；链接是"通向外部"的信号，与正文区分但不过度吸引注意 [HEURISTIC]。
- 禁止：链接成段出现（link farm 视觉）。

### 12.11 horizontal rule

- 场景：章节大分隔（major pause 的廉价替代）。全篇 ≤2 次 [HEURISTIC]。
- 禁止：与 JUDGMENT 的双横线语法混淆。

### 12.12 image / caption

- 图 = 证据或插图必须说明来源；caption 永远存在 [HEURISTIC]。
- caption 用 ANNOTATION 语法（小字号，贴近图）。

### 12.13 Base 系统的身份来源

- identity 来自：一致的字号阶梯、统一的间距节奏、H2/H3 的稳定语法、列表/链接/代码的克制样式。**不靠**：卡片、字体轮换、图标装饰 [HEURISTIC]。

---

## 13. Semantic Component Specification（7 组件）

每个组件包含：epistemic affordance / visual salience / interruption / layout / typography / grouping / metadata / prohibited / mobile。颜色一律不指定。

### 13.1 QUESTION

- **Affordance：** orientation / problem framing
- **Salience：** 导航层（常量，非 dominant）
- **Interruption：** MEDIUM
- **Layout：** 默认 **section opener**（与 H2 配合，紧跟其下）；不鼓励 inline 高频使用。裁决：QUESTION 是 section opener，不是普通 inline component——inline 使用会稀释 orientation 价值并增加中断 [HEURISTIC]。
- **Typography：** label（英文 ≤4 总额内或中文"提问"）+ 正文 1.05–1.15× 的问题文本 [HEURISTIC]。
- **Grouping：** proximity + 底部 hairline（与 JUDGMENT 的 PAUSE 语法区分：QUESTION 左对齐，JUDGMENT 居中）[HEURISTIC]。
- **Metadata：** 无强制项。
- **Prohibited：** 大 whitespace（与 JUDGMENT 混淆）、每节都出现（频率纪律：2000–3000 字全文 ≤2 个）[HEURISTIC]。
- **Mobile：** 无全屏留白；问题文本可换行。

### 13.2 AI OUTPUT

- **Affordance：** source inspection——"这是分析对象，不是作者 endorsement"。
- **Salience：** 论证层默认 MEDIUM–HIGH；但**权威上界 = 待审查**（§8.3），不得呈现为结论。
- **Interruption：** HIGH（quotation 统一后可降）
- **Layout：** QUOTATION 语法：引用条/引号容器 + 来源行。**不做聊天气泡。**
- **Typography：** 正文同字号或略小；**Confidence 数字降为注记级**（不得与正文同权重——V0.1 的 Confidence: 90% 与文本同卡片 = 系统背书，禁止）[HEURISTIC，锚定方向]。
- **Grouping：** surface 仅用于"与正文分离"（允许 subtle surface，但必须与 ANNOTATION 语法可区分）。
- **Metadata（强制）：** source（谁产生的）、model（可选）、status（raw / verified / excerpt）、date（可选）。
- **Prohibited：** 聊天气泡；与 EVIDENCE/LAB NOTE 同容器；confidence 与正文同权重；无 status 标记。
- **Mobile：** 全宽引用容器；引用条在窄屏保持可见。

### 13.3 JUDGMENT（MAX / JUDGMENT）

- **Affordance：** author-owned synthesis / conclusion——**不是 objective fact**。
- **Salience：** 论证层默认最高（Primary 合理，冻结 FINDING 3 允许），但必须 ≤ 其 epistemic 上界（作者判断）。
- **Interruption：** HIGH（功能性：邀请 PAUSE）
- **Layout：** PAUSE 语法：居中 + 分隔规则（上下双 hairline）+ **署名行**（author-owned cue，INVARIANT）。
- **Typography：** body × 1.15–1.3 [HEURISTIC]；**不得像标题**（不是 section 标题的放大版）。
- **Grouping：** 居中 + 双规则 = 唯一的"暂停"信号（全系统独占，QUESTION 不得借用）。
- **Metadata：** author 归属（"— Max"或"作者判断"角标）**强制**；uncertainty cue 在 weak evidence 时**默认显示**（作者可显式关闭，§14.4）；**load-bearing JUDGMENT 必须携带 evidence/counterpoint anchor**（§7.5 epistemic adjacency）。
- **Prohibited：** 无署名金句；与 METRIC 同语法（判断 ≠ 标本）；每篇 >3 次 [HEURISTIC]。
- **Mobile：** 居中独占一屏可接受（这是 PAUSE 特权），但必须保留署名行。
- **目标：** "作者落下一锤"，不是 motivational quote。

### 13.4 EVIDENCE

- **Affordance：** inspect support relation——**Evidence is evidence-for-a-claim**。
- **Salience：** 论证层 MEDIUM（与 COUNTERPOINT 同层，可比原则 §6.3）。
- **Interruption：** MEDIUM–HIGH（对照列表语法后成本下降）
- **Layout：** CONTRAST PAIR 语法：与 COUNTERPOINT 同一容器。**强制结构：被支持的 claim 引用行在最前**（"支持：〈claim_id 对应的当前 claim 文本〉"——文本来自 claim_id 关系，非作者复制的旧文本；referential integrity §14.7 保证同步），然后材料 + 边界 [HEURISTIC + 认识论立场]。
- **Typography：** 正文同字号；label 用"EVIDENCE"或中文"证据"（≤4 英文额度内）。
- **Grouping：** 无 cell borders；短对照（≤3 行）用列表（"支持：…" / "不支持：…"），不用表格。
- **Metadata（强制）：** 被支持的 **claim_id**（引用而非重复文本，§14.7 referential integrity）；source；boundary（支持到哪里为止）；evidence strength（仅在有意义时，如"40 例系统评估"而非"强证据"这种无定义词汇）。
- **Prohibited：** spreadsheet 样式；无 claim 引用的孤立表格；label 单独洗白（classification laundering 第一防线，§15）。
- **Mobile：** 列表重排优先；表格需横滚时警告。

### 13.5 COUNTERPOINT

- **Affordance：** alternative model / serious challenge。
- **Salience：** 论证层 MEDIUM——**legibility parity with EVIDENCE，不强制 salience parity with JUDGMENT**（冻结 FINDING 3）。
- **Interruption：** MEDIUM
- **Layout：** CONTRAST PAIR 语法（与 EVIDENCE **同一容器同一排版**，仅 label 不同）。label 建议"COUNTERPOINT"或中文"反方"。
- **Typography：** 与 EVIDENCE 完全相同字号。
- **Grouping：** 与 EVIDENCE 对齐（对照结构：读者能左右/上下比较）。
- **Metadata：** 语义要求"**strongest alternative**"——作者必须写最强的反方，不写稻草人 [HEURISTIC]。
- **Prohibited（INVARIANT）：** 灰化、warning 样式、字号显著缩小、藏进脚注、无容器。
- **Mobile：** 与 EVIDENCE 同级呈现；禁止折叠默认隐藏。
- **False balance 说明：** legibility parity ≠ 50/50 prominence；evidence weight 不同时允许强调差异，但反方必须**可发现**（§7.5 中 MEDIUM 等级）。

### 13.6 LAB NOTE

- **Affordance：** provenance / research state。
- **Salience：** 注记层（永远低）。
- **Interruption：** LOW–MEDIUM（默认文末）
- **Layout：** ANNOTATION 语法：小字号、弱背景或无背景；**不是 dashboard**。
- **Typography：** body × 0.8–0.88 [HEURISTIC]。
- **Grouping：** 无卡片；数字**平铺在文本中**（"40 例中 15 例路由、12 例通过"），不孤立不放大 [HEURISTIC]。
- **Metadata（scope-limiting metadata，推广模式）：** 必须包含"**你不能从它推出什么**"——例："System evaluation. Not a human study." 是模板，不是唯一句。
- **Prohibited：** KPI dashboard 感、数字卡片、孤立数字、正文同权重。
- **Mobile：** 文末注记，不打断正文。

### 13.7 METRIC

**最复杂组件。rev1 按 ChatGPT 裁决重构：废除三选一 ROLE，改为两轴模型（冻结 FINDING 2 保留：不删除不降权，放大检查对象而非其权威）。**

#### 为什么三选一 ROLE 是错的（rev1）

旧的三 role（SPECIMEN / RESULT / EXTERNAL STATISTIC）**不是正交分类**：

- SPECIMEN 是**论证功能**（"这个数字现在是被检查对象"）
- RESULT 是**论证功能**（"这是评估产出的结果"）
- EXTERNAL STATISTIC 是**来源属性**（"这个数字来自外部"）

一个数字可以同时是 EXTERNAL STATISTIC + SPECIMEN：如文章解剖"某报告宣称 73% 的用户……"——73% 来自外部（来源属性），同时整段在检查它（论证功能）。三选一强迫作者二选一 = 分类设计错误。

#### 两轴模型

```text
ORIGIN（来源/生成方式轴）
- MODEL_OUTPUT          模型直接输出
- INTERNAL_EVALUATION   内部评估结果
- EXTERNAL_SOURCE       外部来源
- AUTHOR_COMPUTED       作者自己计算的

DISPLAY FUNCTION（论证功能轴）
- INSPECTION_SPECIMEN   被检查对象（放大特权）
- REPORTED_RESULT       报告的结果（中等）
- CONTEXTUAL_REFERENCE  上下文参考（中低）
```

- **Salience privilege 由 DISPLAY FUNCTION 决定；provenance requirements 由 ORIGIN 决定。**
- 两个轴独立填写；一个数字通常同时有 ORIGIN + DISPLAY FUNCTION。

#### INSPECTION_SPECIMEN 资格条件（防 salience laundering）

SPECIMEN 是特权标签（2–3× 数字、PAUSE、可独占一屏），作者有激励"想突出就标 specimen"。**必须满足全部资格条件**：

```text
specimen_source      标本来源（哪个 artifact / 哪次输出）
inspection_question  检查什么问题（为什么这个数字值得看）
exact_value_visible  精确值在来源中可见（非汇总）
```

**不得作为 specimen**（除非文章明确在检查"这个结果的呈现/精度本身"）：
- aggregate summary（汇总数字）
- author-computed result（作者自己算的结果）
- evaluation pass rate（评估通过率）

#### 核心规则：ambiguous defaults DOWN, not UP

- 无法确定是否 specimen → 按 REPORTED_RESULT / CONTEXTUAL_REFERENCE 处理。
- 系统的经济激励天然鼓励放大；默认方向必须向下（INVARIANT A4）。

#### 各 DISPLAY FUNCTION 的视觉要求

| DISPLAY FUNCTION | Salience | 布局要求 |
|---|---|---|
| INSPECTION_SPECIMEN | 可高（2–3×） | 大数字 + **覆盖标记（权重 ≥ 数字）** + 资格 metadata（specimen_source / inspection_question / exact value） |
| REPORTED_RESULT | 中等，不得放大 | 紧邻 denominator、study/evaluation type、provenance、boundary |
| CONTEXTUAL_REFERENCE | 中低 | QUOTATION 语法 + source 强制（出处、时间、语境） |

- specimen 与 result/reference 必须**视觉可区分**（一个邀请"看"，一个邀请"审"）。
- **Metadata（强制，所有 METRIC）：** ORIGIN；DISPLAY FUNCTION；SOURCE；METHOD/BOUNDARY。
- 目标不变：LOOK AT THIS NUMBER，不是 BELIEVE THIS NUMBER。

---

## 14. Authoring-Time Epistemic Lint

### 14.1 五问（authoring/lint 模型，不是全部显示）

作者在写作时为每个 semantic block 回答五问；lint 检查回答完整性；**显示层只展示必要子集**（§14.5）：

| 问题 | 定义 | 适用块 |
|---|---|---|
| SOURCE | 谁/什么产生了这个信息？ | AI OUTPUT、EVIDENCE、METRIC、blockquote |
| STATUS | 什么 epistemic state？RAW OUTPUT / VERIFIED / SYSTEM EVALUATION / HUMAN STUDY / AUTHOR INTERPRETATION / HYPOTHESIS | 全部 |
| SUPPORT | 支持哪个 claim？支持到哪里？ | EVIDENCE、COUNTERPOINT、METRIC-result |
| UNCERTAINTY | 什么仍然不知道？**是谁的不确定性？** | 全部 |
| LICENSED INFERENCE | 读者最多可以合理推出什么？ | JUDGMENT、METRIC、LAB NOTE |

#### 五问不是同一种问题（rev1 三级分层，ChatGPT 裁决 D）

把五问从"一个 lint 机制"拆成三级，**禁止把不可验证的项冒充 machine lint**：

```text
MACHINE-CHECKABLE（可结构检查）
- SOURCE：非空 + granularity 要求（"OpenAI" 不合格，需到模型/报告级别）
- STATUS：非空 + substantiation 字段（见下）
- SUPPORT：supports → claim_id（机械可查）

EDITORIAL PROMPTS（作者必答，lint 只能提示质量）
- UNCERTAINTY：防 boilerplate（见 14.2 附加规则）
- DOES_NOT_SUPPORT：这则材料不支持什么？（比抽象 boundary 更容易回答）

REVIEWER QUESTION（人工审稿问题，不得 lint）
- LICENSED INFERENCE：改写成反问题——
  "What stronger conclusion would this evidence NOT justify?"
  （人类回答"不能推出什么"比"最多能推出什么"更具体；
   让作者自报 inference ceiling ≈ 让司机自报超速）
```

- **STATUS 的 substantiation 要求（防 VERIFIED 自我认证）：** STATUS = VERIFIED 时必须附 verified_by / verification_method / verification_scope / verification_date。只有 STATUS 值没有 substantiation 的 VERIFIED 按 RAW OUTPUT 处理。
- **UNCERTAINTY 防 boilerplate：** "仍存在一定不确定性" 等模板句视为空；有效回答必须指明**是谁的不确定性 + 具体哪一层不确定**（14.2 五类之一）。

### 14.2 不确定性类型区分（禁止混用）

- **model confidence**（AI 声称的置信度）
- **author confidence**（作者自己的确定程度）
- **evidence strength**（材料的支持强度）
- **statistical uncertainty**（抽样/估计误差）
- **outcome probability**（结果概率）

lint 规则：一处文本同时涉及多种不确定性时，必须区分是谁的、什么类型 [HEURISTIC]。例："AI 说 90% 确定" ≠ "有 90% 把握正确"。

### 14.3 Scope-limiting metadata（推广模式）

- LAB NOTE 的 "System evaluation. Not a human study." 是模板：metadata 不只说"这是什么"，还说"**你不能从它推出什么**"。
- 推广到：EVIDENCE（"支持材料，非验证结论"）、METRIC（"模型输出，非事实"）、LAB NOTE（"系统评估，非人类研究"）。
- **Lint 强制：** 任何包含数字或结论性内容的块，必须有一个 scope-limiting 声明 [HEURISTIC]。

### 14.4 每块的 metadata 显示策略（"最多显示什么"）

| 块 | 必须显示 | 可隐藏/折叠 | 禁止 |
|---|---|---|---|
| QUESTION | 无 | — | — |
| AI OUTPUT | status（raw/verified）、source | model、date | 无 status 显示 |
| JUDGMENT | author 归属；**weak evidence 时 uncertainty 默认显示**（作者可显式关闭，rev1 修复与附录矛盾） | — | 无归属 |
| EVIDENCE | 被支持的 **claim_id 引用** | source 细节、boundary | 无 claim 引用的裸表格 |
| COUNTERPOINT | 与 EVIDENCE 同级 label | — | 无 label |
| LAB NOTE | scope-limiting 声明 | 数字细节 | 数字孤立放大 |
| METRIC | **ORIGIN + DISPLAY FUNCTION 声明**、source | method | 无两轴声明 |

### 14.5 显示纪律

- 五问是**作者/编辑器模型**，不是每块都展示全部五个标签——全展示 = audit theater（Risk G）。
- 默认：每块显示 ≤2 个 metadata 元素；scope-limiting 声明（§14.3）例外，永远显示。

### 14.6 Classification laundering 的 lint 级 mitigation

- 作者决定内容进 `:::evidence`，UI 给它 EVIDENCE label——label 可能洗白 status。mitigation（不靠画好看）：
  1. **EVIDENCE 块强制引用被支持的 claim_id**（§13.4）：没有 claim_id 的 EVIDENCE 是 lint 错误。
  2. **STATUS 必填 + substantiation**：进块时作者必须声明 raw/verified/system eval/human study；VERIFIED 必须附 verified_by/method/scope/date（§14.1）。
  3. **label 文案审查**：任何 label 不得包含评价词（"PROVEN"、"VERIFIED" 作为 label 的一部分禁用；VERIFIED 只能作为 STATUS 值出现）。
- 诚实边界：这些 mitigation **降低** laundering，**不解决**它——"有资格被分类为 evidence"本身由作者决定（自检 Q4 标注，§附录）。
- 这些是 schema/wording 层 mitigation，不是视觉层 [HEURISTIC]。

### 14.7 Referential integrity（rev1 新增——ChatGPT 裁决 F，最高优先级缺口）

系统在构建一个隐含 epistemic graph：

```text
SOURCE → EVIDENCE (supports claim_id) → CLAIM → JUDGMENT ↔ COUNTERPOINT
```

**风险（REFERENTIAL LAUNDERING）：** 作者修改正文 claim 后，evidence block 里的旧引用未更新，UI 仍以正式 EVIDENCE 语法显示——**视觉结构让已失效的支持关系更可信**。比 classification laundering 更危险，因为系统把 stale relation 渲染得极其严谨。

**Schema 要求（不是自然语言字段）：**

```text
claim_id: claim_017
evidence:
  supports: claim_017
  source_id: src_004
counterpoint:
  challenges: claim_017
```

**Lint 必须检查：**
1. target（claim_id / source_id）存在
2. claim 文本修改后，引用它的 evidence/counterpoint 关系是否 stale（旧 quote 与新 claim 不一致 = 标记）
3. quote 是否仍与 source 对应
4. JUDGMENT 的 evidence/counterpoint links 是否仍有效

**状态：** 这是 inspectability 的数据基础，不是 engine 装饰（INVARIANT A7）。

---

## 15. Behavioral / Epistemic Risk Controls

逐项：机制 → mitigation（显示层 + lint 层）→ 证据等级。

| # | 风险 | 机制 | Mitigation | 等级 |
|---|---|---|---|---|
| A | 读者看到 polished JUDGMENT → 跳过 evidence 检查 | 流畅性→truth（Reber & Schwarz 方向） | JUDGMENT 强制署名 + 配对规则（有 JUDGMENT 必有 COUNTERPOINT/EVIDENCE）；PAUSE 语法不用于装饰 | [EVIDENCE-DIRECTION] |
| B | EVIDENCE label → 读者认为"科学证明" | label 洗白 + spreadsheet 语法 | 去 spreadsheet；强制 claim 引用行；scope-limiting 声明 | [HEURISTIC] |
| C | 大数字 → overweight | 锚定 | ORIGIN + DISPLAY FUNCTION 声明强制；specimen 带资格与覆盖标记；result 不得放大；ambiguous 默认 DOWN（§13.7） | [EVIDENCE-DIRECTION] |
| D | COUNTERPOINT 被跳过 | 弱视觉 = 可跳过 | legibility parity（同容器同字号）；禁止灰化/隐藏 | [HEURISTIC] |
| E | LAB NOTE 数字被误读为 human outcome | 数字 salience | 数字平铺 + "Not a human study" 族 scope-limiting | [HEURISTIC] |
| F | AI OUTPUT 被当作 endorsed recommendation | quotation 缺失 + confidence 同权 | QUOTATION 语法 + confidence 注记级 + status 显示 | [EVIDENCE-DIRECTION] |
| G | 大量 epistemic label → audit theater（看似严谨，selection 仍偏） | 标签脱敏 | label 总量约束（≤4 英文）；每块 ≤2 metadata；lint 不追求全覆盖 | [HEURISTIC] |
| H | **CLASSIFICATION LAUNDERING**：作者自行分类进块，label 洗白 status | 作者决定 + UI 背书 | §14.6：claim_id 引用、STATUS 必填 + substantiation、label 禁评价词 | [HEURISTIC，schema 层] |
| I | **SELECTION OPACITY**：读者不知道证据是否被挑选过 | 呈现完整性幻觉 | 见 §15.1 裁决 | [HEURISTIC] |
| J | **REFERENTIAL LAUNDERING**（rev1）：claim 修改后 evidence 引用 stale，正式语法仍在渲染 | stale 引用 + 视觉背书 | §14.7：claim_id/source_id 关系 + stale lint（claim 改动即标记） | [HEURISTIC，schema 层；ChatGPT 裁决 F-1] |
| K | **Argument order / epistemic adjacency**（rev1）：反方 legibility 达标但五屏后才出现 | serial position + 滚动距离 | §7.5：load-bearing JUDGMENT 的 evidence/counterpoint anchor + ≤1 屏可达 | [HEURISTIC；ChatGPT 裁决 F-2] |

### 15.1 SELECTION OPACITY 裁决

- **写入 design philosophy（必须）：** 系统明确声明"证据是作者选择的，不声称完整性"。
- **UI 提示（推荐，轻量）：** LAB NOTE 或文末注记可选加一句"证据由作者选择呈现"——不默认显示（避免 audit theater 叠加），但模板提供 [HEURISTIC]。
- **Authoring lint（不强制）：** 不检查 selection 完整性（不可自动化，且会逼出虚假完整性声明）。
- **底线：** 系统**不假装**解决 completeness / selection bias（§1.2）。

---

## 16. Mobile / WeChat Rules

### 16.1 Mobile-first

- 所有组件以 ~375px 竖屏为设计基准；桌面是超集 [HEURISTIC]。

### 16.2 具体规则

| 问题 | 规则 |
|---|---|
| long title wrapping | title 允许 2 行折行；断行点由语义控制（不在关键词中间断）[HEURISTIC] |
| vertical scroll | 滚动连续性优先：除 major pause 外无空屏；block 之间 prose 恢复 ≤ 1 屏 |
| repeated blocks | 同类型块连续出现 ≤ 2；第 3 个必须插入 prose（§7.4） |
| tables | 默认禁用；数据用对照列表；必须表格时接受横滚并警告 |
| giant metrics | specimen 大数字可独占一屏（PAUSE 特权），但覆盖标记必须同屏可见 |
| code | 短代码 inline 化；长代码块允许横向滚动（明确提示） |
| English strings | 长英文词允许断字换行；URL 用短链形式 [HEURISTIC] |
| desktop whitespace | 减半预算（§11.3）；判断标准 = 读者不误判"文章结束" |

### 16.3 "什么时候 desktop 优雅空白变成滚动烦躁"

- 当 whitespace 造成：a) "段落结束"误判；b) 组件之间失去"同一篇文章"感；c) 需要额外滚动才能看到被分隔的内容。三条任一出现即超预算 [HEURISTIC]。
- 行为测试（设计验收）：拇指滚动 5 秒，停下的位置必须是"看起来有内容"的位置，而不是空白屏。

---

## 17. INVARIANTS 与 EDITORIAL CONSTRAINTS（rev1 分层）

rev1 按 ChatGPT 裁决把 enforcement 拆成三级：**EPISTEMIC SAFETY INVARIANTS**（违反即误导读者，硬约束）/ **EDITORIAL CONSTRAINTS**（一致性与预算纪律，内容覆盖须记录理由）/ **DEFAULTS**（§18，可自由 override）。rev0 把三层混在同一列表是治理错误：heuristic 被硬化、阈值被绝对化、与 §19 自相矛盾。

### 17-A. EPISTEMIC SAFETY INVARIANTS（9 条，绝对不能违反）

1. **Visual authority ≤ epistemic authority（重写版）。** 区分两个概念：**attention salience**（多大、多显眼）与 **authority cue**（暗示可信/正式/已验证）。SPECIMEN 可以有高 salience，但不得携带 authority cue（无"已验证"视觉、无正式报告语法）。salience 可以高，authority 必须 ≤ 内容的 epistemic 状态。**颜色不得成为 epistemic 身份的唯一载体**（grayscale/forced-colors/dark mode 下身份必须保持，ChatGPT 裁决 E-Q1）。
2. **COUNTERPOINT 不得使用** warning/error 样式、灰化、显著缩小字号、脚注隐藏（legibility parity，§13.5）。
3. **AI OUTPUT 不得使用**聊天气泡或"endorsed"样式（§13.2）。注：confidence 数字**本身**若作为检查对象（specimen）可放大，但必须满足 §13.7 资格条件——"放大 confidence"只在解剖 confidence 时合法（ChatGPT 裁决 A-3）。
4. **METRIC 必须声明 ORIGIN + DISPLAY FUNCTION**（两轴，§13.7）；ambiguous 默认 DOWN。
5. **inspection privilege 必须满足资格条件**：specimen_source / inspection_question / exact_value_visible；specimen 与 result/reference 视觉可区分（§13.7）。
6. **JUDGMENT 必须带 author-owned cue**（署名行或"作者判断"标记）。
7. **EVIDENCE 块必须引用被支持的 claim_id**（schema 关系强制，§13.4）；**claim 修改后 stale 引用必须被 lint 标记**（referential integrity，§14.7）。
8. **呈现为独立数据对象的数字必须携带 provenance**（谁给的/怎么算的/边界）；结构性数字（日期、章节编号、序号）豁免（rev1 限域，ChatGPT 裁决 A-6）。
9. **禁止伪科学数值声明**（§20 列表）。注：这是 **spec-governance invariant**——违反走 spec 修订流程，不是 renderer 报错（ChatGPT 裁决 A-14）。

### 17-B. EDITORIAL CONSTRAINTS（5 条，默认执行，内容覆盖须记录理由）

- C1. **Load-bearing contestable JUDGMENT 必须有同级的 COUNTERPOINT**（rev1 重写，ChatGPT 裁决 A-7：只约束承载论证、可被挑战的判断，不约束每句判断——防机械"一判断一反方"与 false balance；观点文可显式豁免）。
- C2. **LAB NOTE 不得呈现为 dashboard/KPI**；数字平铺，scope-limiting 声明强制。
- C3. **任意 viewport 内 dominant 对象 ≤ 1**（§6.4，启发式纪律）。
- C4. **连续 HIGH 中断 ≤ 2**；其后必须接 prose（§7.4）。
- C5. **英文 label 总数 ≤ 4**（§9.4，认知负荷纪律）。

（移动端表格默认禁用 → 移入 §18 DEFAULTS。）

---

## 18. DEFAULTS

默认这样做；内容需要时可以 override（override 必须记录理由，且不得违反 INVARIANTS）。

| # | 默认 |
|---|---|
| 1 | 容器语法默认次序：proximity → alignment → whitespace → similarity → hairline；surface/border 需要理由（§9.3） |
| 2 | blockquote 默认 = 他人观点引用，必须带来源名（§12.5） |
| 3 | 技术术语默认用普通样式原词，不用 inline code（§12.8） |
| 4 | 对照数据（≤3 行）默认列表，不用表格（§12.7） |
| 5 | QUESTION 默认 section opener，全文 ≤2 个（§13.1） |
| 6 | JUDGMENT 默认居中 + 双规则 + 署名（§13.3） |
| 7 | AI OUTPUT confidence 默认注记级（§13.2） |
| 8 | LAB NOTE 默认文末、数字平铺（§13.6） |
| 9 | metadata 默认每块 ≤2 项显示；scope-limiting 声明例外（§14.5） |
| 10 | 英文 label 默认 ≤4，其余用中文（§9.4） |
| 11 | 中英混排默认自然间距，不额外加空格（§10.3） |
| 12 | bold 默认每段 ≤1–2 处（§10.5） |
| 13 | 移动端 whitespace 默认桌面预算减半（§11.3） |
| 14 | 文章必须有 ≥1 个 scope-limiting 声明（§14.3） |
| 15 | **移动端表格默认禁用**；数据用对照列表（§12.7、§16.2，rev1 从 INVARIANTS 降级——"默认"与"绝对不能违反"逻辑冲突） |

---

## 19. HEURISTICS

需要作者/设计者判断；**不要被实现成 rigid UI rule**。Claude 遇到以下情况时只能提示，不能替作者决定。

| # | Heuristic | 谁判断 |
|---|---|---|
| 1 | 论证层 salience 的覆盖权重（内容 epistemic 权重 > 块类型默认）（§6.2，**intensity 可变、grammar identity 不变**） | 作者 |
| 2 | METRIC 两轴之外的强化需求（如教学性演示——仍须满足 §13.7 资格） | 作者 |
| 3 | JUDGMENT 的 uncertainty cue 何时显示（weak evidence 时默认显示，作者可显式关闭） | 作者 + lint |
| 4 | 哪个是"strongest alternative"（COUNTERPOINT 内容选择——**不可被 lint，只可人工审**；实现禁止用 `counterpoint != empty` 冒充） | 作者 |
| 5 | evidence strength 标注是否有意义 | 作者 |
| 6 | 表格是否必须——**判断依据 = 是否需要精确二维对齐，行数只是 proxy**（rev1，ChatGPT 裁决 C-6；禁止实现为 `if rows > 3 allow_table`） | 作者 |
| 7 | 正文 identity 与 block 密度的权衡（每篇不同） | 编辑 |
| 8 | Interrupt Density 约束（§17-B-C3/C4）的具体执行 | 编辑 + lint 提示 |
| 9 | 是否使用 SELECTION OPACITY 文末注记（§15.1） | 作者 |
| 10 | serif/sans 的 genre 选择 | 品牌所有者 |

**Enforcement contract（rev1，ChatGPT 裁决 C）：** 仅"warning not error"不够——工程实践中 warning → CI zero-warning → autofix 会把启发式变成 de facto rule。HEURISTIC 与 EDITORIAL CONSTRAINT 必须遵守：

```text
HEURISTIC / EDITORIAL CONSTRAINT:
- may emit advisory（可提示）
- MUST NOT mutate AST（不得改写文档结构）
- MUST NOT select CSS treatment automatically（不得自动选择渲染样式）
- MUST NOT autofix（不得自动修复）
- MUST NOT affect build exit code（不得影响构建状态）
- MUST have explicit suppress/override path（必须有显式豁免路径）
```

并有测试验证：**同一 Markdown 在只有 heuristic warning 差异时，render tree 不得因此被自动重写。**

---

## 20. REJECTED PSEUDO-PSYCHOLOGY

以下内容**不得**出现在 spec、注释、设计讨论中。出现即删除并标记来源。

| 主张 | 拒绝理由 |
|---|---|
| "17px 是心理学最优字号" | 无普适最优；依赖字体/行宽/设备/距离 |
| "1.85 行高最优" | 无普适最优；相对值 |
| "Serif 增加信任" | 无一致证据；文化联想，不是心理机制 |
| "蓝色降低认知负荷" | 无证据；颜色情绪效应不一致 |
| "每篇最多 3 个 JUDGMENT 是实验结论" | 编造阈值 |
| "3–5 个中断是最优" | 编造阈值；中断成本真实但无固定数字 |
| "卡片提升信任，所以用卡片" | 正是系统要避免的 truthiness 机制；"会提升信任"不是设计理由 |
| "居中文本更有力量（心理学证明）" | 经典排版研究显示居中正文阅读更慢（效应小、老研究）；居中只用于 PAUSE 特权，理由不是"力量" |
| "读者看到 label 就进入验证模式" | semantic block ≠ cognitive operation（冻结 FINDING 5）；标签只建立 parsing convention |
| "我们解决了 selection bias" | 系统不声称完整性（§15.1） |

---

## 21. V0.2 Implementation Priority

### P0（epistemic 正确性——不做就是系统性误导）

- [ ] **METRIC 两轴系统**（rev1）：ORIGIN × DISPLAY FUNCTION、specimen 资格条件、ambiguous defaults DOWN（INVARIANT A4/A5）
- [ ] **Referential integrity schema**（rev1）：claim_id/source_id 关系 + stale lint（INVARIANT A7，ChatGPT 裁决 F-1——**rev1 最高优先级**）
- [ ] **Enforcement-level semantics**（rev1）：17-A/17-B/§18 三级治理 + HEURISTIC MUST NOT contract + render-tree 不变性测试（§19）
- [ ] **COUNTERPOINT legibility parity**：与 EVIDENCE 同容器同字号（INVARIANT A2）
- [ ] **JUDGMENT author-owned cue**（INVARIANT A6）+ load-bearing 配对（17-B-C1）+ epistemic adjacency anchor（§7.5）
- [ ] **AI OUTPUT quotation 化**：QUOTATION 语法 + status 标记（INVARIANT A3）
- [ ] **EVIDENCE claim_id 引用 + 去 spreadsheet**（INVARIANT A7 前置）
- [ ] **Epistemic lint 三级化**（rev1）：machine-checkable 三项（SOURCE granularity / STATUS substantiation / SUPPORT→claim_id）；UNCERTAINTY 防 boilerplate；LICENSED INFERENCE 移出 lint 改 reviewer 问题
- [ ] **scope-limiting metadata 模板**（"Not a human study" 族推广）

### P1（阅读体验与身份）

- [ ] **Base Markdown 身份化**（§12）：H2/H3 稳定语法、blockquote 语义化、技术术语与 inline code 区分、列表克制
- [ ] **容器语法族落地**（§9.1）：五族映射 + 禁止模式检查（CSS class 只绑定 grammar identity，§6.2）
- [ ] **Spacing Grammar**（§11）：gap 层级 + major pause 稀缺纪律
- [ ] **Mobile-first 重审**：whitespace 预算、表格→列表、滚动连续性测试
- [ ] **LAB NOTE 注记化**（§13.6）
- [ ] **Interrupt Density 检查**（17-B-C3/C4，lint warning 级，enforcement contract §19）

### P2（打磨与验证）

- [ ] label 系统收敛（≤4 英文，17-B-C5）
- [ ] 中英混排审计（数字/术语/URL）
- [ ] 真实文章验收测试：SCAN 5 秒测试、INSPECT 五问可答率、滚动误判测试（§16.3）
- [ ] **Grammar comprehension 测试**（rev1，ChatGPT 裁决 F-3）：epistemic role identification accuracy——只给读者看 block，问"谁在说？这是结论、证据还是分析对象？这个数字该信还是该查？"；读者把 specimen 当"重点结论" = 整套理论失败
- [ ] Interrupt Density 参数用真实数据校准（替换启发式默认）
- [ ] A/B 测试框架：同内容 V0.1 vs V0.2，测 INSPECT 完成率与 perceived authority（注意：本项目不能只测"更好看"）
- [ ] **自检三态更新**（rev1）：IMPLEMENTATION-UNVERIFIED 项在实现后逐一转正

---

## 附录：Final Quality Test 自检（rev1 三态版）

**rev1 修正（ChatGPT 裁决 E）：** 原自检把"spec 里写了 mitigation"当成"风险已通过测试"，是 spec-level self-certification——这本身就是 Max Editorial 要反对的 Precision Illusion 翻版。rev1 改用三态，**禁止 spec 自己给行为效果打 ✅**：

```text
DESIGN-COVERED                spec 层面已有对应规则（不等于行为已验证）
IMPLEMENTATION-UNVERIFIED     需要实现后测试（§21 P1/P2 验收）
EMPIRICALLY-VALIDATED         需要真实读者数据（当前没有任何一项达到）
```

1. **颜色全部换掉，系统是否仍成立？** → **DESIGN-COVERED**。rev1 新增 INVARIANT A1：颜色不得成为 epistemic 身份的唯一载体（grayscale/forced-colors/dark mode 下身份必须保持）。原判 ✅ 是错误的——"spec 没指定颜色"不等于"颜色不承担语义"。
2. **去掉全部 semantic blocks，普通 Markdown 是否仍像成熟 publication？** → **IMPLEMENTATION-UNVERIFIED**。§12 是要求不是渲染产物；relational 规则落地后才能验证。
3. **所有组件出现一遍，是否变成 dashboard？** → **DESIGN-COVERED（密度约束）+ IMPLEMENTATION-UNVERIFIED（全组件文章需真实渲染测试）**。17-B-C3/C4 + §7.4 提供密度防线；原自检声称的"§2.3 增加 READ 合理性检查"未真正落地——rev1 不再声称。
4. **Evidence 是否因 label 获得不应有权威？** → **DESIGN-COVERED，且诚实标注不完整**。claim_id 引用（INVARIANT A7）降低 laundering 但不解决——"有资格被分类为 evidence"仍由作者决定（§14.6 诚实边界）。
5. **Judgment 是否比其证据看起来更确定？** → **DESIGN-COVERED**。rev0 已修 §14.4：weak evidence 时 uncertainty 默认显示（rev1 保持，且 §14.4 与 §13.3 措辞已统一——rev0 两者矛盾）。
6. **Counterpoint 是否真正可发现？** → **DESIGN-COVERED（legibility）+ DESIGN-COVERED（adjacency，rev1 新增 §7.5）**。legible ≠ encountered——rev1 增加 anchor + ≤1 屏可达 + 反方不晚于 5 屏；但"真正被读到"仍需 IMPLEMENTATION-UNVERIFIED 测试。
7. **大数字是否明确是 specimen/result/statistic？** → **DESIGN-COVERED（rev1 两轴 + defaults DOWN）**。原判 ✅ 是错的——三选一 ROLE 非正交，分类错误必然发生（§13.7）。
8. **手机连续滚动 3000 字能否维持 momentum？** → **IMPLEMENTATION-UNVERIFIED**（§21 P2 验收测试）。
9. **是否存在"心理学包装过度"的规则？** → **DESIGN-COVERED**。rev1 修复了最严重的违规：原 INVARIANTS 11–13 把启发式硬化成绝对约束（§17 分层后不再发生）；§19 enforcement contract 阻断 warning→autofix 路径。
10. **是否让 argument 更容易 inspect，而不仅仅更有说服力？** → **IMPLEMENTATION-UNVERIFIED**。这是**行为主张，spec 无权自证**。验收 = §21 P2 的 INSPECT 五问可答率、grammar comprehension 测试、V0.1 vs V0.2 对比。在测试之前，此问必须保持 UNVERIFIED。

**自检结论（rev1）：** 无任何一项达到 EMPIRICALLY-VALIDATED。当前状态是"设计覆盖完整、行为效果未知"。下一步 = 实现（P0）→ 验收（P2）→ 用真实读者数据替换 DESIGN-COVERED，而不是靠 spec 的严谨外观自我确认。



