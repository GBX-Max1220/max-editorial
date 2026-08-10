# Max Editorial V0.2 Implementation Contract

> **SPEC-SOURCE NOTICE — 必须读这一段（revised 2026-08-11）。**
>
> 本契约初稿撰写于规范文件尚未恢复时（以任务说明内联的 FROZEN DESIGN DECISIONS + 逐文件代码核验为准，原文缺失处标 `SPEC FILE NOT FOUND`）。
>
> **规范现已在磁盘上核验可用**（2026-08-10 恢复，见 `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_PROVENANCE.md` recovery case A）：
>
> - Canonical path: `C:\Users\gbx12\projects\max-editorial\MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`
> - 实测 SHA-256: `86d118f4b5190ecbcbb8c55f2b06fc9813ce33b151ddb0cbfe653700b40ead2b`
> - 声明 SHA-256: `86D118F4B5190ECBCBB8C55F2B06FC9813CE33B151DDB0CBFE653700B40EAD2B`
> - **HASH MATCH: YES**
> - 状态三态：`DESIGN-COVERED` / `IMPLEMENTATION-UNVERIFIED` / `BEHAVIORALLY-UNVALIDATED`（实现不等于行为验证）
>
> 本契约已按 `MAX_EDITORIAL_V02_CONTRACT_RECONCILIATION.md` 对账并最小修补（§7 major/evidence_strength 授权边界、§10 反方 parity 移入不变量、§14 AI-source 与 invalid-support 按 spec 降级、§6 补负向清单与 defaults DOWN 等），对账结论 `READY FOR PHASE 0`。凡原文才能确定的细节此后一律以 canonical spec 为权威；契约中残留的 `SPEC FILE NOT FOUND` / `PER TASK PROMPT` 标记属于初稿遗留，已由对账裁决覆盖，不再视为缺原文。
>
> 架构事实全部标 `VERIFIED IN CODE`；未能核验的标 `NOT FOUND`。未使用任何规划文档的假设。

---

## 0. Canonical Input & P0 Requirements Matrix（2026-08-11 Phase 1 补）

### 0.1 Canonical Input

| 项 | 值 |
|---|---|
| Canonical design spec path | `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`（V0.2 rev1） |
| Actual SHA-256 | `86d118f4b5190ecbcbb8c55f2b06fc9813ce33b151ddb0cbfe653700b40ead2b` |
| Provenance path | `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_PROVENANCE.md` |
| Git starting commit | `d8cfb76`（分支 `feat/doocs-engine-adapter`；engine-migration checkpoint `e018349` 已在历史中，未破坏） |
| Implementation branch | `feat/cognitive-editorial-v02` |

### 0.2 P0 Requirements Matrix（§21 P0 × 实现位置；实现状态随 sprint 更新）

| Spec Ref | Requirement | Current State (2026-08-11) | Implementation Target | Test/Inspection Method |
|---|---|---|---|---|
| §13.7 / INV A4 / A5 | METRIC 两轴（ORIGIN×DISPLAY FUNCTION）+ specimen 资格 + ambiguous defaults DOWN | schema/lint 完成（`src/engine/doocs/metric.ts`）；renderer 未消费 | renderer 消费 `deriveMetricEligibility` → `data-salience` + specimen 覆盖标记 + result/reference 区分（`src/engine/shared/semanticHtml.ts` + `src/styles/article.css`） | `metric.test.ts`（schema）；新增 renderer 断言（salience/覆盖标记/负向资格收回） |
| §14.7 / INV A7 | Referential integrity：claim_id/source_id 关系 + stale lint | lint 完成（`relations.ts`/`blockIds.ts`）；renderer 未降级 | renderer 读取 relation 状态，无效/stale 关系渲染降级（不镀金）；claim 引用行显示当前 claim 文本（claimMap 注入） | `relations.test.ts`；新增 renderer 降级断言 |
| §19 | Enforcement 三级治理 + HEURISTIC MUST NOT contract + render-tree 不变性 | governance 完成（`governance.ts`）；heuristics 为占位 | 填充真实启发式（interrupt density / question 频率 / hr 数 / scope-limiting / anchor / blockquote 来源）并接入 `validateDocument` + CheckPanel 展示 | `governance.test.ts`；新增启发式非变更断言 |
| §13.5 / INV A2 | COUNTERPOINT legibility parity（与 EVIDENCE 同容器同字号） | 否（evidence 卡片化、counterpoint 独立） | 共享 CONTRAST PAIR 容器（shared semanticHtml + article.css） | regression + 新增 parity 断言 |
| §13.3 / INV A6 | JUDGMENT author-owned cue + load-bearing 配对 + adjacency anchor | 否（无署名行） | 署名行 `— Max`；anchor 缺失 lint（§7.5-3 warning） | 新增署名/adjacency 断言 |
| §13.2 / INV A3 | AI OUTPUT quotation 化 + status/source 标记 | 否（无 status/source） | QUOTATION 语法 + status/source meta + 无 source 降级 | 新增 ai-output 断言 |
| §13.4 / INV A7 | EVIDENCE claim_id 引用 + 去 spreadsheet | 否（无引用行、表格化） | claim 引用行（claimMap 解析）+ 对照列表（无 cell border） | 新增 evidence 断言 |
| §14.1 | Epistemic lint 三级化（machine-checkable 3 项 + UNCERTAINTY 防 boilerplate + LICENSED INFERENCE 出 lint） | 部分（blockIds/relations/metric 是 machine-lint；UNCERTAINTY/LICENSE 未做） | 补 ai-output source/status machine-lint、verified 无 substantiation → raw、UNCERTAINTY 空模板检测（editorial 提示） | 新增 lint 断言 |
| §14.3 | scope-limiting metadata 模板推广 | 否 | fixture + heuristic 检查（含数字/结论块必须有 scope 声明；文章 ≥1） | fixture + 新增断言 |

> 非 P0 的 §21 P1（Base Markdown 身份、容器语法族、Spacing、Mobile-first、LAB NOTE 注记化、Interrupt Density）与 P2 项：作为本 sprint 的完整实现范围（任务 Phase 3–13），不视为 scope expansion——任务明确定义了完整 V0.2 sprint 边界。

---

## 1. Executive Verdict

**rev1 能否在不把认知语义塌缩成 CSS 枚举的前提下实现？**

不能，在**当前架构**上直接实现。但可以——只需要一个有界的**架构补丁**（typed epistemic schema + 携带稳定 ID/关系的语义 token + identity/salience 渲染分离 + 四层 lint 治理），然后垂直切片即可推进。规范本身（冻结决策）是自洽的，**不需要改 spec**。

**证据（VERIFIED IN CODE）：**

- 语义块类型 → 视觉 class 的映射是硬编码 `switch (type)` → `.sblock-{type}`，出现在 3 处：`src/engine/doocs/semantic.ts`、`src/engine/legacy/renderHtml.ts`、`src/render/blocks.tsx`。这就是任务明确要拒绝的反模式，当前代码**正处在这个状态**。
- 语义块元数据是扁平 `props: Record<string, string>`（`src/markdown/types.ts:22`、`src/engine/doocs/semantic.ts:32`）。**没有 `id`、没有关系引用、没有嵌套结构**（`supports`/`challenges`/`claim_id` 在代码中 NOT FOUND）。
- identity 与 salience 融合在同一个 CSS 类里：`src/styles/article.css` 每个 `.sblock-*` 规则同时定义结构（label/border/对齐）和强度（字号/留白/间距）。没有独立的 salience 通道。
- 唯一存在的 lint 是 `src/compat/check.ts` 的 `runCompatibilityCheck(source, structure)`——只做微信兼容性，纯函数、不改 AST（VERIFIED）。没有认知 lint，没有关系校验，没有作者/发布模式之分。

**最大实现风险：**

> **分类洗白（classification laundering）**。渲染器对作者可控的枚举没有任何资格边界——`switch(block.type)` 直接决定视觉强度，`props` 里任何 `importance=high` / `display_function=inspection_specimen` 只要出现就能驱动渲染。目前没有任何机制阻止"作者选更强的枚举 → 渲染器授予权威外观"。

**是否 ready for vertical slice：**

否。垂直切片需要：Claim 的稳定 ID、Evidence→Claim 的关系、specimen 资格验证、失效状态降级——这些在当前解析器（扁平 props、无 ID）和渲染器（type→class 直连）上**字面不可实现**。必须先落 Phase 0 架构补丁。**因此 verdict = `SPEC/ARCHITECTURE PATCH REQUIRED`，且补丁是架构性的、有界的（不是重写）**；规范本身无需修改。

---

## 2. Current Architecture Map

```
Markdown source (textarea / examples/issue-001.md)
  → 解析
  → AST / 语义表示
  → lint
  → 渲染
  → 样式系统
  → 最终 HTML/CSS
```

| 层 | 文件 | 关键类型/函数 | 状态 |
| --- | --- | --- | --- |
| 解析（legacy） | `src/markdown/parser.ts` | `parseMarkdown(src): ParseResult` → `Block[]` | VERIFIED IN CODE |
| 解析（doocs，默认） | `src/engine/doocs/engine.ts` | `renderDoocsHtml`：marked@18 + `markedSemanticBlocks()` + `markedAlert({container:false})` + `markedFootnotes` → `SemanticBlockToken` | VERIFIED IN CODE |
| 语义块语法 | `:::type [key="value"]` 围栏 | `:::` 唯一认领者；未知块 → `.sblock-unknown` + diagnostics | VERIFIED IN CODE |
| AST 语义块表示 | `src/markdown/types.ts`（legacy `Block`/`SemanticBlock`）；`src/engine/doocs/semantic.ts`（`SemanticBlockToken`） | `{ type, props: Record<string,string>, lines, invalid, unknown }` | VERIFIED IN CODE |
| **元数据存储** | `props`（扁平字符串 KV） | `:::` 头部 `key="value"` 解析 → `parseProps()`；**无 ID / 无关系 / 无嵌套** | VERIFIED IN CODE；ID/关系 **NOT FOUND** |
| **块类型 → 样式** | `src/engine/doocs/semantic.ts` `renderSemanticBlock`、`src/engine/legacy/renderHtml.ts` `semanticHtml`、`src/render/blocks.tsx` | `switch (type)` → `class="sblock-{type}"` | VERIFIED IN CODE（**正是要拒绝的反模式**） |
| lint | `src/compat/check.ts` | `runCompatibilityCheck(source, structure)`：微信兼容 10 项；**纯函数，返回 findings，不改 AST** | VERIFIED IN CODE；认知 lint **NOT FOUND** |
| 渲染 | `src/render/Article.tsx` | `Article` 把引擎 `html` 经 `.article-body` `dangerouslySetInnerHTML` 注入；masthead/footer 为 React | VERIFIED IN CODE |
| **渲染器是否改结构** | 否——渲染是 AST→HTML 的纯函数；剪贴板流水线（`src/engine/doocs/clipboard.ts`）只 clone **DOM 副本**做 juice/结构修正，**不改 AST** | | VERIFIED IN CODE |
| 样式系统 | `src/styles/tokens.css`（token）、`src/styles/article.css`（文章排版，预览+剪贴板共用）、`src/styles/app.css`（应用壳） | `.sblock-*` identity+salience 融合；`data-mode`（normal/editorial）是全局 salience 密度轴；`--scale` 是视口轴 | VERIFIED IN CODE |
| 既有 V0.1 语义组件 | `src/render/blocks.tsx` | React 版 `.sblock-*` 组件（legacy 路径，预览已切到引擎 HTML） | VERIFIED IN CODE |
| 作者模式 vs 发布模式 | **不存在**。只有 `import.meta.env.DEV` 控制引擎切换控件 | | **NOT FOUND** |

**结构结论**：解析/渲染分层干净（引擎接口隔离），这对迁移是资产。但语义块是"无身份的类型标签 + 扁平 props"，关系、资格、失效态在 AST 层**无处安放**。这是所有后续任务的约束。

---

## 3. Authoring Schema

只定义规范证成的字段。核心原则：**id 是身份，`relations` 是引用的唯一载体，所有作者可控的"强度词"不进入身份层**。

```ts
// 稳定身份：所有可被引用的块都带 id；id 在文档内唯一。
type EntityId = string                      // 建议 "<type>:<slug>[:<n>]"，如 "claim:precision-illusion"

type Claim = {
  id: ClaimId
  text: string                              // 规范文本（对 hash 比对用的快照来源）
  // 关系（见 §4）
  challenged_by: CounterpointId[]           // 可选
  supported_by: EvidenceId[]                // 可选
  related_metrics: MetricId[]               // 可选
}

type Source = {
  id: SourceId
  kind: "model_output" | "external_paper" | "internal_evaluation" | "author_computed"
  // 仅展示所需的必要子集（§12），作者可存更多
  label: string                             // 渲染展示用短标签
  detail?: { provider?: string; model?: string; date?: string; artifact_id?: string; url?: string }
}

type Evidence = {
  id: EvidenceId
  text: string
  supports: ClaimId[]                       // 关系（§4）
  source?: SourceId                         // 可选来源
  // 编辑器提示区（不参与身份，仅提示，见 §13）
  editorial_prompts?: { uncertainty?: boolean; does_not_support?: boolean }
}

type Counterpoint = {
  id: CounterpointId
  text: string
  challenges: ClaimId[]                     // 关系（§4）
  // 反方要求 legibility parity，不要求 salience parity（冻结决策 #9）
}

type Judgment = {
  id: JudgmentId
  text: string
  relates_to: ClaimId[]                     // 关系（§4）
  // load-bearing JUDGMENT 必须（rev1 §7.5/§13.3/§14.7-4）：
  anchor?: { evidence: EvidenceId[]; counterpoints: CounterpointId[] }
  author?: string                           // author-owned cue 强制（INVARIANT A6）
}

type AIOutput = {
  id: AIOutputId
  text: string
  source: SourceId                          // 必填（见 §12：model_output 粒度）
}

type Metric = {
  id: MetricId
  value: string
  unit?: string
  origin: MetricOrigin                      // 冻结决策 #3 双轴之一
  display_function: MetricDisplayFunction   // 冻结决策 #3 双轴之二
  relates_to: ClaimId[]                     // 关系（§4）
  source?: SourceId
  method_boundary?: string                  // 方法/边界声明
  specimen?: SpecimenEligibility            // display_function=inspection_specimen 时的资格证据（§6）
}

type LabNote = {
  id: LabNoteId
  title?: string
  stats: LabStat[]
  notes: string[]
}

type Question = {
  id: QuestionId
  text: string
}

// 双轴（冻结决策 #3：old SPECIMEN/RESULT/EXTERNAL_STATISTIC 互斥模型已废止）
type MetricOrigin = "model_output" | "internal_evaluation" | "external_source" | "author_computed"
type MetricDisplayFunction = "inspection_specimen" | "reported_result" | "contextual_reference"

// 资格证据（冻结决策 #4）：inspection_specimen 是"salience privilege"，不是标签
type SpecimenEligibility = {
  specimen_source: string
  inspection_question: string
  exact_value_visible: boolean
}

// 结构化验证（冻结决策 #11：status="verified" 不能独立存在）
type Verification = {
  method: string
  scope: string
  actor: string
  date: string
}

// STATUS 值集（rev1 §14.1）：RAW OUTPUT / VERIFIED / SYSTEM EVALUATION / HUMAN STUDY /
// AUTHOR INTERPRETATION / HYPOTHESIS。VERIFIED 无 substantiation → 按 RAW OUTPUT 处理。
```

**Schema 边界声明**：
- `origin` / `display_function` 是两个**独立轴**，不互斥——`external_source + inspection_specimen` 合法（这正是 §17 切片要证明的）。
- 没有 `importance` 字段（spec 无此概念，Never encode）。`major`（QUESTION 分类）与 `evidence_strength`（EVIDENCE 元数据）按 §7 的授权边界处理：major 需编辑确认 + 频率纪律；evidence_strength 仅限有意义值。
- 展示功能（`display_function`）是**请求**，不是资格本身；资格来自 `specimen` 字段的存在与 lint 验证（§6）。

---

## 4. Epistemic Relation Model

| 关系 | 基数 | 必选/可选 | 引用完整性规则 | 失效(stale)行为 | 作者错误行为 | 关系无效时的渲染 |
| --- | --- | --- | --- | --- | --- | --- |
| `Evidence.supports → Claim.id` | 1..* | 必选（Evidence 无 target = 结构不完整） | target 必须存在；target 文本 hash 必须等于 authoring 时快照 | 检测到文本变更 → 降级 + 诊断 | 悬空 ID → 诊断 | 见下方"关键规则" |
| `Counterpoint.challenges → Claim.id` | 1..* | 必选 | 同上 | 同上 | 同上 | 同上 |
| `Judgment.relates_to → Claim.id` | 1..* | 可选（判断可以无显式关系） | 同上 | 同上 | 悬空 ID → 警告 | 关系失效时 Judgment 本体仍可渲染（无权威关系声明） |
| `Judgment.anchor → Evidence/Counterpoint`（load-bearing 必填，rev1 §7.5） | evidence 1..* / counterpoint ≥1 | **load-bearing 时必选** | target 必须存在 | 悬空 → 警告 | "anchor 缺失 = warning"（§7.5-3） | 无 anchor → JUDGMENT 不获得 adjacency 标注 |
| `Metric.relates_to → Claim.id` | 1..* | 可选 | 同上 | 同上 | 同上 | Metric 本体渲染，关系标注降级 |
| `* → Source.id`（AIOutput 必选，Evidence/Metric 可选） | 0..1 | AIOutput 必选 | source 必须存在 | 缺失 → AIOutput 降级（§15） | 悬空 → 警告 | AIOutput 无 source = 无归属的"原始输出"不可渲染为 AI OUTPUT |
| `Evidence.supports → Counterpoint.supported_evidence` 等跨块 | — | — | 不做跨块反向（YAGNI） | — | — | — |

**关键规则（冻结决策 + 任务要求）：**

> **渲染器绝不可把结构上无效的 evidence/support 关系呈现为认识论上有效的。**

关系状态必须与视觉状态**解耦**：`valid / invalid / stale / missing` 是 AST 层的派生状态（由 lint/validation 计算），渲染器只消费这个状态，自己不做认识论判断。

**无效关系的渲染策略**（作者模式 vs 发布模式——当前代码无此区分，需新增一个 build-mode 输入）：

| 模式 | Evidence/Counterpoint 关系无效时 | Judgment 关系无效时 | Metric 关系无效时 |
| --- | --- | --- | --- |
| **authoring/dev** | 可见诊断条 + 降级渲染（保留引用语法，去掉"有效支持"的强化样式，如删除强调边框但保留引用结构） | 诊断提示；本体正常 | 诊断提示；specimen privilege 收回（§6） |
| **production** | 中性引用/散文回退 + 构建诊断 | 关系标注省略 | specimen privilege 不授予 |
| **硬失败** | 仅当违反"认识论安全不变量"（如把支持关系渲染成已验证）才 block 发布；常规悬空引用只警告 | 不 block | 不 block |

**判定**：悬空/陈旧引用 = **warning + 降级渲染**；结构完整性（如 Evidence 无 target）在 authoring = **error 级诊断**，production = **降级为中性引用**（不 block）。真正的 safety invariant 才 block——保守使用硬失败（任务明确要求）。

---

## 5. Referential Integrity / Staleness

**问题**（敌意审查指出的洗白路径）：

```
Evidence 引用 Claim A → 作者改了 Claim A → 旧 Evidence 关系仍然视觉光鲜
```

**方案比较**：

| 方案 | 机制 | 能检测什么 | 代价 | 结论 |
| --- | --- | --- | --- | --- |
| A. 仅稳定 `claim_id` | 只存 ID | 悬空 ID、重复 ID | 最小 | **检测不到文本变更**——洗白路径仍在 |
| B. `claim_id` + 文本 hash 快照 | ID + 引用时存的 `text_hash` | 悬空、重复、**文本变更** | 小（一个字段 + 一次校验） | **推荐** |
| C. AST 节点身份 + 内容 hash | 完整对象图 | 全部 | 大（需要持久 AST、diff） | 过度，YAGNI |

**推荐 Option B**——最小可信方案。

```ts
// 引用处存快照（不是存整段文本，只存 hash + 可见性提示）
type RelationRef = {
  target: ClaimId
  text_hash: string        // authoring 时对 Claim.text 的哈希
  quoted?: string          // Evidence 中实际引用的片段（可选，用于 quoted-mismatch 检测）
}
```

**必须检测的 5 种情况**：

1. **missing claim**：`target` 不存在 → `warning`（`stale_relation:missing_target`）
2. **duplicate claim id**：两个 Claim 同 id → `error`（authoring）/ `warning`（production，选择第一个渲染）
3. **claim text changed**：`hash(target.text) != ref.text_hash` → `warning`（`stale_relation:text_changed`）——这是洗白路径的核心闸口
4. **relation 指向不兼容块**：Evidence.supports 指向非 Claim 块 → `error`（结构错误）
5. **source reference missing**：AIOutput.source 悬空 → `warning`（`stale_source`）

不需要图数据库。一个纯函数 `validateRelations(blocks): RelationDiagnostic[]`，输入 typed AST，输出诊断，**不改 AST**（与 `check.ts` 同构）。实现上是 Phase 0 的第一批代码。

---

## 6. METRIC Two-Axis Contract

```ts
type Metric = {
  id: MetricId
  value: string
  unit?: string
  origin: MetricOrigin              // 独立轴 1
  display_function: MetricDisplayFunction   // 独立轴 2
  relates_to: ClaimId[]
  source?: SourceId
  method_boundary?: string
  specimen?: SpecimenEligibility    // 仅当 display_function=inspection_specimen
}
```

**两轴独立性的实现保证**：
- `origin` 与 `display_function` 各自是封闭枚举，互不推导。`external_source + inspection_specimen` 必须合法（§17 切片）。
- **旧的互斥 SPECIMEN/RESULT/EXTERNAL_STATISTIC 不得以任何形式回归**——包括不得在渲染层按单枚举 switch 分支。
- **分治（rev1 §13.7）**：salience privilege 由 **DISPLAY FUNCTION** 决定；provenance requirements 由 **ORIGIN** 决定。两轴不共享同一视觉职责。
- **ambiguous defaults DOWN（INVARIANT A4）**：无法确定是否 specimen → 一律按 REPORTED_RESULT / CONTEXTUAL_REFERENCE 处理；系统默认方向向下。
- **负向资格清单（rev1 §13.7，不得作为 specimen，除非文章明确在检查"该结果的呈现/精度本身"）**：aggregate summary（汇总数字）、author-computed result（作者自算结果）、evaluation pass rate（评估通过率）。lint 检出这三类与 `display_function=inspection_specimen` 并存 → 拒绝 specimen privilege + 诊断。
- **specimen 与 result/reference 必须视觉可区分**（一个邀请"看"，一个邀请"审"）；specimen 的覆盖标记视觉权重 ≥ 数字本身（rev1 §3.4/§13.7）。

**inspection_specimen 资格**（冻结决策 #4：#3/#4）：

| 资格字段 | 必选？ | 机器可验 | 说明 |
| --- | --- | --- | --- |
| `specimen_source` | 必选 | 语法：非空 | 该数字来自哪（含 source 引用） |
| `inspection_question` | 必选 | 语法：非空、非纯标点 | 让读者"检查"的问题 |
| `exact_value_visible` | 必选 | 语义：`true` | 值本身必须可见（不能被替换/隐藏） |

**谁决定资格？——三级门禁（各自诚实，不假装 lint 能验证语义真值）：**

| 门禁 | 判定 | 由谁 | 能做什么 |
| --- | --- | --- | --- |
| **syntactic eligibility** | 三个字段存在、类型正确 | lint（机器） | 决定"是否允许请求 specimen 渲染 privilege" |
| **editorial eligibility** | inspection_question 是否有真正的检查价值 | **编辑者**（提示，不评分） | 触发"请复核此 specimen 是否真值得放大"的提示 |
| **rendering privilege** | 综合：syntactic 通过 + （production 下）editorial 已确认 | 渲染层（只消费 lint 产出的 `specimen_eligible: boolean`） | 决定是否授予大排版 salience |

**守卫模型**：

```text
作者设置 display_function="inspection_specimen"
  → lint 校验 specimen 三字段（syntactic eligibility）
  → 通过 → renderer 收到 specimen_eligible=true → 授予渲染 privilege
  → 不通过 → renderer 收到 specimen_eligible=false → 按 reported_result 处理 + 诊断
```

**渲染层严禁**：`if (metric.displayFunction === "inspection_specimen") return hugeTypography`。渲染层只读 `specimen_eligible`（lint 派生），不读作者枚举。

---

## 7. Salience Privilege Boundary

作者可控字段 → 视觉强度的映射清单。这是防洗白的核心表。

| 字段 | 分类 | 实现 |
| --- | --- | --- |
| `display_function = "inspection_specimen"` | **Unsafe automatic** | 必须经 §6 三级门禁；renderer 只读 `specimen_eligible` |
| `block_type = "judgment"` | **Unsafe automatic**（对 salience） | identity 允许（判断块结构），**salience 不许**：判断块是"克制的显著"还是"大号强调"必须由编辑层/资格决定，不是 type 自动给 |
| `importance = "high"` | **Never encode** | 不进入 schema；强度由编辑判断，不进 AST |
| `major`（QUESTION 分类） | **Unsafe automatic（有授权边界）** | spec §2.3/§9.1 授权 "major QUESTION" 为 PAUSE 特权成员。实现：作者标 major → lint 校验频率纪律（全文 PAUSE ≤3，§11.2）+ 编辑确认 → 才授予 PAUSE 语法。裸 major 不自动给 salience |
| `evidence_strength`（EVIDENCE 元数据） | **Safe automatic（限有意义值）** | spec §13.4 允许该字段，仅限有意义的强度描述（"40 例系统评估"）；禁止无定义词汇（"强证据"）。lint 校验词汇合法性，不校验强度真假；渲染只用于 identity 措辞，不驱动 salience |
| `status = "verified"` | **Unsafe automatic**（见 §9） | 必须带 `verification` 结构化对象 |
| `origin = "external_source"` | **Safe automatic**（仅限 identity） | 影响 attribution 行的身份呈现（来源标签），**不影响 salience** |
| `supports` 关系 | **Safe automatic**（仅限 identity） | 只驱动"证据/反方"的结构呈现；强度与有效性来自 validation，不来自关系存在与否 |

**防洗白硬规则**：

> **渲染器收到的每一个会放大视觉的输入，必须来自"验证过的派生状态"（`specimen_eligible`、`relation_valid`、`verification_present`），绝不直接来自作者填写的枚举或强度词。**

作者选择更强枚举 → 只有一条路径通向强渲染：lint 验证 → 派生状态 → 渲染。中途任何一步不通过，fall back 到中性。

---

## 8. Identity vs Salience

**grammar identity**（块是"什么"）vs **salience intensity**（这个块在此文中"多强"）。

| 组件 | Identity（稳定，结构/标签/对齐，不进 salience） | Salience（可变，需验证或编辑层授权） |
| --- | --- | --- |
| EVIDENCE | 引用结构 + `SUPPORTED` 标签 + 来源归属行 + 与 COUNTERPOINT 的 legibility parity | 内边距/字距 |
| COUNTERPOINT | 引用结构 + `COUNTERPOINT` 标签 + **legibility parity 保证**（不灰、不折叠、不小、非错误样式） | 无（不允许降 salience） |
| JUDGMENT | 居中 + 双发丝线 + `JUDGMENT` 标签（品牌结构） | 字号/留白的"判断强度"——需编辑层决定 |
| AI OUTPUT | 等宽 + 来源归属行 + `AI OUTPUT` 标签（terminal excerpt 结构） | 内边距 |
| METRIC specimen | 大数字身份结构 + 资格标注 | **放大 privilege**——仅 `specimen_eligible` 授予 |
| METRIC reported/reference | 数字身份结构 | 常规 |
| LAB NOTE | 数据网格 + `LAB NOTE` 标签 | 间距 |

**当前渲染器能否分离 identity 与 salience？——不能（VERIFIED IN CODE）。**

`switch(type) → class="sblock-{type}"` 且 CSS 里每个 `.sblock-*` 同时承载结构、字号、留白。没有独立的 salience 通道。

**最小架构变更（不是重写）**：

1. **identity 通道**：`switch(type)` 保留，但只产生"身份类"（结构/标签/对齐/parity），禁止携带字号/留白等强度属性。
2. **salience 通道**：新增 `data-salience` 派生属性（由 lint/编辑层给出），CSS 里 `.sblock[data-salience="default"]` 与 `[data-salience="emphasized"]` 只调强度。salience 的来源是验证过的派生状态，不是 type。
3. **CSS 拆分**：每个块拆成"identity 规则 + salience 规则"两组；`data-mode`（normal/editorial）继续作为全局密度轴，与块级 salience 正交。

这一步是 Phase 1 的最小改动，改的是 renderer 映射 + CSS 结构，不是引擎重写。

---

## 9. STATUS / SOURCE Contract

**STATUS：`status = "verified"` 不得独立存在。**

```ts
// ❌ 反模式（会被当成装饰徽章）
// status: "verified"

// ✅ 结构化验证对象
type Verification = {
  method: string      // "manual_cross_check" | "external_replication" | ...
  scope: string       // 验证覆盖了什么（哪句、哪个数字、哪种边界）
  actor: string       // 谁验证的
  date: string
}

// VERIFIED 必须由 verification 对象证成；无对象 → 不渲染任何"已验证"徽章
type Status = { verification: Verification } | { verification: null }
```

**判定**：`status: "verified"` 单枚举 = 洗白入口，弃用。渲染层只在 `verification` 对象存在且结构完整时显示验证徽章（且徽章永远不单独承载语义——伴随标签/日期）。**STATUS 完整值集（rev1 §14.1）**：RAW OUTPUT / VERIFIED / SYSTEM EVALUATION / HUMAN STUDY / AUTHOR INTERPRETATION / HYPOTHESIS；**VERIFIED 无 substantiation → 按 RAW OUTPUT 处理**（rev1 原文），不是简单"不渲染徽章"。

**SOURCE 粒度**（冻结任务 #12；不建 bibliography）：

| source 类型 | 最小粒度（作者必填） | 渲染展示 |
| --- | --- | --- |
| AI output | `provider` + `model` + `date` + `artifact_id?` | `OpenAI · gpt-4o · 2026-08` 一行归属 |
| external article/paper | `label`(标题) + `date` + `url?` | 标题 + 链接 |
| internal evaluation | `label` + `date` + `method_boundary?` | 标签 + 边界 |
| author-computed | `label` + `date` + `method_boundary`(必填——作者自算必须有方法边界) | 标签 + 边界声明 |

`Source` 对象可存更多（detail 字段），渲染只取必要子集。**AIOutput 无 source 的处理见 §15**。

---

## 10. Epistemic Lint Enforcement Levels

四个治理层级**不得塌缩成一个执行层**（冻结决策 #2）。

| 层级 | 示例 | 执行 | 谁能触发 | 错误码前缀 |
| --- | --- | --- | --- | --- |
| **EPISTEMIC SAFETY INVARIANTS** | 结构无效的支持关系不得呈现为有效（A7）；specimen privilege 不得无资格授予（A5）；COUNTERPOINT legibility parity（A2）；JUDGMENT author-owned cue（A6） | **block 发布**（production）；authoring 红 | lint（机器） | `INV-` |
| **EDITORIAL CONSTRAINTS** | C3 任意 viewport dominant ≤1；C4 连续 HIGH ≤2 后接 prose；C5 英文 label ≤4——**默认执行，覆盖须记录理由**（rev1 §17-B） | warning（适用 §19 enforcement contract），**不 block** | lint + 编辑确认 | `CON-` |
| **DEFAULTS** | 无 specimen 资格时按 reported_result 处理；未标记块按中性渲染 | 自动选择默认值 | 系统 | `DEF-`（一般不报） |
| **HEURISTICS** | 中断密度、距离、标签数 | **只警告**，绝不改 AST/CSS/退出码 | lint | `HINT-` |

**机器可验 vs 编辑提示 vs 评审判断**（冻结决策 #5）：

| 层 | 内容 | 机器可验？ |
| --- | --- | --- |
| 机器可检查结构 | source 粒度、status 证成、supports→claim_id、引用完整性 | ✅ |
| 编辑提示 | UNCERTAINTY、DOES_NOT_SUPPORT | ⚠️ 只提示，不评分 |
| 评审判断 | "此证据无法证成什么更强的结论？" | ❌ 完全人工（不进 lint 引擎，只作为评审清单项） |

**实现约束**：lint 层必须是"读 AST、出诊断"的纯函数链（`validateInvariants` → `checkConstraints` → `heuristicPass`），层与层之间禁止互相改 AST。当前 `check.ts` 是纯函数（VERIFIED），可作为新 lint 的骨架。

---

## 11. Heuristic Non-Mutation Contract

> **PER TASK PROMPT → SPEC VERIFIED（2026-08-11 修订）**：以下清单初稿引自任务说明示例（`≤1 viewport / ≤2 HIGH interruptions / ≤4 English labels / ≤3 pause blocks / 5-screen counterpoint reachability / >3 table rows / typography ratios / whitespace budgets`）。canonical rev1 现已在磁盘核验（hash 见 §0.1），精确措辞以 spec §17-B（EDITORIAL CONSTRAINTS C3/C4/C5）、§19（HEURISTICS H1–H10 + enforcement contract）、§7.4/§7.5（中断密度 + epistemic adjacency 数字代理）为权威。**判定不变：全部为 advisory/约束级，禁止硬化为 build failure 或渲染自动重排**。

| Heuristic | 机器可检测？ | 可警告？ | 可改 AST？ | 可改 CSS？ | 可自动修复？ | 可改退出码？ | Override 机制 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| interrupt-density（≤2 HIGH） | ✅（按标记计数） | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: interrupt-density` |
| pause-block 数量（≤3） | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: pause-density` |
| English-label 数量（≤4） | ✅（对 label 文本） | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: english-label-density` |
| counterpoint 可达性（5-screen） | ✅（DOM 距离量测） | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: counterpoint-reachability` |
| 表格行数（>3） | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: table-height` |
| typography ratios / whitespace budgets | ✅（token 计算） | ✅ | ❌ | ❌ | ❌ | ❌ | 同上（按 rule 名） |
| adjacency 距离 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `lint-disable: epistemic-adjacency` |

**非变更承诺（每一行都要测）**：警告不得改 AST、不得改语义类型、不得重排内容、不得插入散文、不得改 display function、不得自动升降 metric salience、不得隐藏内容、不得改 CI 退出码。

**Override 机制（最小）**：块级属性 `<!-- lint-disable: rule1, rule2 -->`（HTML 注释，解析器已支持注释跳过？——当前 doocs 引擎把 raw HTML 转义为文本，所以需要单独在语义块 props 里支持 `suppress="interrupt-density"`）。**最小方案**：语义块 props 增加 `suppress`（逗号分隔 rule 名），lint 命中时先检查 suppress。**不**为每个警告建元数据对象。

---

## 12. Epistemic Adjacency

**冻结决策**：不得自动重排内容。numeric proxies（within one screen / before five screens）**除非被证成 safety invariant，否则一律是 TEST/EDITORIAL heuristic**。

**允许（renderer/linter 可安全做）**：
- 暴露锚点链接（`#claim:xxx`、`#evidence:yyy`）
- 显示关系导航（"证据 for claim X"）
- 关系极远时发 `HINT-adjacency` 警告（不改布局）
- 关系标签（"这是 claim X 的支持/反方"）

**禁止**：
- 自动把 COUNTERPOINT 移到 JUDGMENT 旁边
- 插入重复块
- 重写作者序列
- 隐藏远处内容
- 任何"为了让关系近而移动内容"的自动行为

---

## 13. Rendering Contract

渲染器**确定性**处理 **valid semantic AST**；渲染器**不做认识论判断**。任何含数字或结论性内容的块必须带 scope-limiting 声明（rev1 §14.3，"你不能从它推出什么"；文章 ≥1 条，§18-D14）。

| 块 | 必需 identity | 允许 salience 范围 | 渲染所需元数据 | 元数据无效回退 | 色彩独立性 | 移动端 | 可改内容顺序？ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVIDENCE | 引用结构 + 标签 + 归属行 + 与反方 legibility parity | 内边距/字距微调 | `supports` 有效或进入降级 | 关系无效 → 中性引用 + 诊断（§4/§15） | 灰阶下结构+标签可辨 | 连续滚动内保持 | ❌ |
| COUNTERPOINT | 引用结构 + 标签 + **legibility parity**（不灰/不折叠/不小/非 warning 样式） | 不允许降低 salience | `challenges` 有效 | 同上 | 灰阶可辨 | 可达（允许 heuristic 警告，禁止移动） | ❌ |
| JUDGMENT | 居中 + 双发丝线 + 标签 + **署名行（author-owned cue，INVARIANT A6）** | 字号/留白由编辑层授权 | 本体渲染；**load-bearing 时 `anchor` 必填（§7.5）** | 关系失效只影响标注；anchor 缺失 → warning | 灰阶：线+署名+结构可辨 | 正常 | ❌ |
| AI OUTPUT | 等宽 + **来源归属行** + 标签 | 内边距 | `source` 必填 + **`status` 必显（raw/verified/excerpt，§13.2）** | 无 source → **降级为散文引用** + 诊断（§15） | 灰阶可辨 | 正常 | ❌ |
| METRIC specimen | 大数字 identity + 资格标注 | **放大 privilege 仅 `specimen_eligible=true`** | `specimen` 三字段 + `specimen_eligible` | 资格缺 → 按 reported_result + 诊断 | 数字本身不靠色 | 不超屏宽 | ❌ |
| METRIC reported/reference | 数字 identity | 常规 | 无 | — | 可辨 | 正常 | ❌ |
| LAB NOTE | 数据网格 + 标签 | 间距 | 无；**scope-limiting 声明必填（§14.3）** | 缺 scope-limiting → 诊断 + 提示 | 网格线可辨 | 正常 | ❌ |

**渲染器禁止**：基于 `origin`/`display_function`/`block_type` 直接分支给 salience；基于距离移动内容；给无效关系镀金。

---

## 14. Invalid-State Degradation

| 违规 | authoring 模式 | production 模式 | 严重度 |
| --- | --- | --- | --- |
| EVIDENCE 无有效 claim target | 可见诊断 + 降级（保留引用语法，去掉强化） | 中性引用/散文 + 诊断 | warning（不 block） |
| COUNTERPOINT target 缺失 | 同上 | 同上 | warning |
| METRIC 请求 specimen 但资格字段缺失 | 诊断 + 按 reported_result | 按 reported_result | warning（privilege 收回） |
| AI OUTPUT 无 source | 诊断 + 降级为散文引用 | 降级为散文引用 + 诊断 | **warning（machine-checkable，§14.1；§12.5 "无来源引用=设计错误"）** |
| status=verified 缺 verification | 诊断 + **按 RAW OUTPUT 处理**（rev1 §14.1 原文） | 不渲染徽章 + 按 RAW OUTPUT | warning |
| 重复 claim ID | authoring error；production 取第一个 + 诊断 | 诊断 | authoring error / production warning |
| **结构无效支持关系呈现为有效** | 诊断 + 降级 | 降级 + 诊断（**不 block**；仅当渲染器确会将其呈现为有效时才阻断） | **INV-（A7：lint 标记 + 降级，rev1 §14.7）** |

**原则**：不完美元数据 → 降级 + 诊断，**不允许光鲜语义样式悄悄继续**；只有真正的 safety invariant 才 block 发布。硬失败要保守（任务明确）。

---

## 15. Color Independence

**规则**：对每个语义区分，回答"如果 `color: initial` 或灰阶，角色还能辨认吗？"。要求身份通过 结构/排版/对齐/标签/边框/归属/留白 的**组合**承载，不要求每块全用。

- EVIDENCE/COUNTERPOINT：标签 + 引用结构 + 归属行（不靠色）
- JUDGMENT：双发丝线 + 居中（线本身不是色）
- METRIC：数字 identity + 资格标签（不靠 accent）
- AI OUTPUT：等宽 + 归属（不靠底色）
- LAB NOTE：网格线（线宽可辨，不靠色）

**测试策略**：
- 灰阶截图（`filter: grayscale(1)` 渲染后截图）
- forced-colors 模式（`forced-colors: active` media query 下跑结构断言）
- 深色主题（token swap 后角色仍可辨）
- 色彩 token 替换（换 accent 后语义不漂移）

**色仅用于**：氛围/强调，从不单独承载 epistemic identity。

---

## 16. Test Matrix

### A. Schema tests
- 重复 claim ID 被拒
- 悬空 claim 引用被检出
- 无效 specimen eligibility 被检出（缺 `specimen_source` / `inspection_question` / `exact_value_visible`）
- VERIFIED 无 substantiation 被检出
- 关系指向不兼容块被检出

### B. Lint enforcement tests
- heuristic 警告**不改 AST**（渲染前后 AST 深比较相等）
- heuristic 警告**不改渲染 class 结构**（渲染 HTML 相同）
- 抑制警告只改诊断输出（AST/CSS 不变）
- lint 四层不互相改状态

### C. Renderer semantic tests
- EVIDENCE/COUNTERPOINT 有同等 legibility 原语（标签、字号下限、非灰）
- AI OUTPUT 保留 attribution
- specimen eligibility 控制 pause privilege（`specimen_eligible=false` → 无放大）
- 无效元数据安全降级（不崩溃、不镀金）
- 渲染确定性：同一 valid AST 两次渲染逐字节相同

### D. Visual/behavioral acceptance tests
- 灰阶身份测试
- SCAN landmark 测试（只看 Metric/Judgment 地标能否得到正确 provenance 印象——**人工**）
- 角色识别测试（无标签时能否辨认块类型）
- 移动端连续滚动测试

**D 类明确标注**：`IMPLEMENTATION VALIDATION`，**不是** `PSYCHOLOGY PROOF`。不得在文档或代码里声称 D 类证明认知有效性。

---

## 17. Adversarial Vertical Slice

**切片内容**：1 Claim + 1 Evidence（`supports` 该 Claim）+ 1 Judgment（`relates_to`）+ 1 Counterpoint（`challenges` 同一 Claim）+ 1 Metric（**`origin=external_source`, `display_function=inspection_specimen`**，证明两轴共存）。

**必须测试**：

1. **Referential integrity**：Evidence 写好引用后修改 Claim 文本 → 系统检测到 `text_changed`，Evidence 降级（不呈现为有效支持）。
2. **Metric privilege**：删掉一个 `specimen` 资格字段 → Metric 不再保留 specimen salience privilege（按 reported_result 渲染）。
3. **Heuristic non-mutation**：触发 interrupt-density / adjacency 警告 → AST 与渲染结构完全不变（深比较）。
4. **Counterpoint parity**：移除所有颜色 → Evidence 与 Counterpoint 仍同等可读（结构断言）。
5. **STATUS substantiation**：标记 VERIFIED 但无 `verification` 对象 → 系统诊断，不渲染徽章。
6. **Scan safety**：只看 Metric/Judgment 地标的读者不应被误导出错误 provenance/status 印象——**人工测试，不声称自动证明**（明确写为 IMPLEMENTATION VALIDATION）。

---

## 18. Minimal Implementation Sequence

**Phase 0 — Schema + relation integrity**
- 加 typed epistemic schema（§3）+ semantic 块携带 `id`/`relations`
- `validateRelations` 纯函数（悬空/重复/文本变更/类型不兼容）
- Schema tests（A 类）

**Phase 1 — Lint governance / enforcement separation**
- 四层 lint 分离（§10）+ heuristic 非变更契约（§11）
- 最小 suppress 机制
- B 类测试

**Phase 2 — Vertical-slice renderer**
- identity/salience 分离（§8 最小架构变更：`data-salience` 派生通道）
- 作者/发布模式输入
- C 类测试

**Phase 3 — Vertical-slice adversarial tests**
- §17 六项测试

**Phase 4 — 再泛化其余块**
- 只有切片通过才展开剩余块

**明确不做**：不一次实现全部语义块，不写生产 CSS，不做大规模前端重写。

---

## 19. Kill Conditions

| 条件 | 判定 | 行动 |
| --- | --- | --- |
| identity 与 salience 无法分离（需大改） | 当前为中等重构（CSS+映射拆分），**可分离** | patch architecture（Phase 1） |
| specimen eligibility 无法表示而不信任作者枚举 | 当前 props 无结构，**需先加 schema** | patch architecture（Phase 0） |
| 引用完整性只能靠脆弱文本匹配 | Option B（id+hash）是结构化方案，可行 | 不触发 |
| heuristic 警告会改渲染 | 当前 lint 纯函数（VERIFIED），不会 | 不触发 |
| 当前解析器无法携带关系 ID | 属实（扁平 props），**Phase 0 必修** | patch architecture |
| COUNTERPOINT parity 需要自动重排 | 不需要——parity 是渲染约束，非重排 | 不触发 |
| valid/invalid 无法与视觉解耦 | 需新增派生状态通道，**可做** | patch architecture |

**所有 kill condition 均为"需架构补丁"，无一是"需改 spec"或"停止 V0.2"。** 若 Phase 0 后仍无法在不信任作者枚举的前提下表示资格，则 defer specimen feature。

---

## 20. Final Implementation Gate

进入 Phase 0 前必须全部为是：
- [ ] 语义块 token 能携带 `id` + `relations`（Phase 0 后）
- [ ] 渲染器有独立 salience 通道（identity 不再携带强度）
- [ ] `specimen_eligible` / `relation_valid` / `verification_present` 是 lint 派生的渲染输入
- [ ] heuristic 警告深比较下不改 AST/CSS/退出码
- [ ] 作者/发布模式已区分，降级策略明确
- [ ] 灰阶/forced-colors 下所有语义角色可辨（结构断言过）
- [ ] D 类测试明确标注 IMPLEMENTATION VALIDATION 而非 PSYCHOLOGY PROOF

---

### IMPLEMENTATION VERDICT

`SPEC/ARCHITECTURE PATCH REQUIRED`

（spec 无需修改；当前架构——扁平 props、无 ID/关系、`switch(type)→class` 融合 identity/salience——需要 Phase 0/1 的有界架构补丁后，垂直切片才可行。）

### HARDEST INVARIANT TO IMPLEMENT

identity 与 salience 的分离：单个块类型不得仅凭类型授予 salience，salience 只能经由验证过的派生状态流入渲染——而当前渲染器把两者融合进 `.sblock-{type}` 一个类，CSS 里每个块规则同时承载结构与强度。

### HIGHEST CLASSIFICATION-LAUNDERING RISK

`display_function: "inspection_specimen"`：作者填一个枚举就请求超大排版；若渲染器直接信任（`if (metric.displayFunction === "inspection_specimen") return hugeTypography`），洗白即完成。必须由三级门禁 + `specimen_eligible` 派生状态拦截。（次高：`status="verified"` 装饰徽章。）

### HIGHEST REFERENTIAL-INTEGRITY RISK

Evidence 引用 Claim → 作者改动 Claim 文本 → 旧 Evidence 关系仍视觉光鲜（敌意审查指出的洗白路径）。用 Option B（`claim_id` + 文本 hash 快照）检测 `text_changed` 并降级。

### HEURISTIC ENFORCEMENT MODEL

启发式 = 只读纯函数，输出 `HINT-*` 诊断；绝不改 AST、不改语义类型、不改 CSS、不改退出码。最小 suppress：语义块 `suppress="rule1,rule2"` 属性。警告在深比较测试下必须证明"渲染零变化"。

### METRIC IMPLEMENTATION MODEL

双轴独立枚举（origin × display_function），`external_source + inspection_specimen` 合法。specimen 是**请求**不是资格：三级门禁（syntactic lint / editorial 提示 / rendering privilege）→ 渲染器只消费派生状态 `specimen_eligible`，从不对作者枚举直接分支给 salience。

### FIRST CODE CHANGE AFTER APPROVAL

为 `SemanticBlockToken` 增加 `id` 与 `relations`（`supports`/`challenges`/`relates_to` 的目标引用数组）字段，并新增纯函数 `validateRelations(tokens): RelationDiagnostic[]`——用 Option B（目标 id + 文本 hash 快照）检测悬空、重复、`text_changed`、类型不兼容。这是唯一能让渲染器"不镀金无效关系"的前置改动。

### DO NOT IMPLEMENT YET

1. 任何生产 CSS（含 `data-salience` 的最终样式）——先做 schema/lint/切片，再谈样式
2. 全量语义块渲染——先垂直切片
3. `importance` 等 spec 未定义的强度字段——Never encode；`major` 与 `evidence_strength` 只按 §7 授权边界使用（major 需编辑确认 + 频率纪律；evidence_strength 仅限有意义值），不得作为裸 salience 通道
4. 自动重排 / 自动补全 / 自动移动 COUNTERPOINT——禁止项
5. NLP 式的"不确定性评分"——只做空答警告 + 编辑复核提示
6. 图数据库 / 完整引用系统——Option B（id+hash）足够
7. 把 D 类行为测试标注为"心理学证明"——必须是 IMPLEMENTATION VALIDATION
8. 在 spec 文件缺失的情况下，把 §19 启发式清单当作完整权威清单——待 spec 文件补齐后核对
