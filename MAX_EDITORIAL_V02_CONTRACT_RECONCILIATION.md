# Max Editorial V0.2 Contract Reconciliation

> 对账对象：`MAX_EDITORIAL_V02_IMPLEMENTATION_CONTRACT.md` ↔ 权威 spec `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`（V0.2 rev1）。
> 分类口径：`FAITHFUL TRANSLATION` / `NECESSARY IMPLEMENTATION DERIVATION` / `UNSUPPORTED INVENTION` / `MISSING FROM CONTRACT` / `ENFORCEMENT LEVEL MISMATCH` / `SEMANTIC MISMATCH`。实现机制（ID、hash、渲染通道）不算新增认识论政策。

## 1. Source Verification

- canonical spec path: `C:\Users\gbx12\projects\max-editorial\MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`
- SHA-256 observed: `86d118f4b5190ecbcbb8c55f2b06fc9813ce33b151ddb0cbfe653700b40ead2b`
- hash match: **YES**（等于声明的 `86D118F4B5190ECBCBB8C55F2B06FC9813CE33B151DDB0CBFE653700B40EAD2B`）
- implementation contract path: `C:\Users\gbx12\projects\max-editorial\MAX_EDITORIAL_V02_IMPLEMENTATION_CONTRACT.md`
- provenance record 已读：恢复案例 A（Reasonix workspace 原稿复制，内容未重写；§7.5 数字代理标注为 EDITORIAL/TEST HEURISTICS；§13.4 与 claim_id 对齐）。

## 2. Executive Verdict

契约的**骨架是忠实的**：四层治理、METRIC 两轴、specimen 三级门禁、heuristic 非变更契约、adjacency 数字代理=启发式、identity/salience 分离、color independence、三态验证标注——都与 rev1 一致或为必要实现推导。

但存在 **2 处 SEMANTIC MISMATCH（契约过度限制 spec 明确授权的字段）**、**3 处 ENFORCEMENT-LEVEL MISMATCH（契约把非不变量硬化为不变量/把 constraint 放到错误层级）**、**8 处 MISSING canonical requirements（含 3 处 IMPORTANT）**。无 BLOCKER 遗漏。

契约需要最小修补（AUDIT 19）；修补后与 rev1 一致，Phase 0 可开始。

## 3. Canonical Requirements Missing From Contract

| # | 规范要求 | 来源 | 等级 |
| --- | --- | --- | --- |
| M1 | METRIC 负向资格清单：aggregate summary / author-computed result / evaluation pass rate **不得**作为 specimen（除非文章明确在检查"结果呈现/精度本身"） | §13.7 | IMPORTANT |
| M2 | "ambiguous defaults DOWN, not UP" 显式化（INVARIANT A4）；"salience privilege 由 DISPLAY FUNCTION 决定，provenance requirements 由 ORIGIN 决定" | §13.7 / 17-A-4 | IMPORTANT |
| M3 | load-bearing JUDGMENT 必须携带 evidence/counterpoint anchor（schema 关系 + "anchor 缺失 = warning"） | §7.5 / §13.3 / §14.7-4 | IMPORTANT |
| M4 | scope-limiting metadata 强制（含数字或结论的块必须带"你不能从它推出什么"；文章 ≥1 条） | §14.3 / §18-D14 | IMPORTANT |
| M5 | STATUS 完整值集（RAW OUTPUT / VERIFIED / SYSTEM EVALUATION / HUMAN STUDY / AUTHOR INTERPRETATION / HYPOTHESIS）；VERIFIED 无 substantiation → **按 RAW OUTPUT 处理**（契约只写"不渲染徽章"，较弱） | §14.1 | MINOR→IMPORTANT |
| M6 | UNCERTAINTY 五类区分（model/author/evidence/statistical/outcome confidence）+ "多处不确定性必须区分谁的、哪类" | §14.2 | MINOR |
| M7 | 冻结的五容器语法族映射（§9.1/9.2：QUOTATION/CONTRAST PAIR/PAUSE/ANNOTATION/PROSE） | §9.2 | MINOR |
| M8 | AI OUTPUT 必须显示 status（raw/verified/excerpt）；COUNTERPOINT "strongest alternative" 元数据；QUESTION ≤2 / JUDGMENT ≤3 频率启发式 | §13.2 / §13.5 / §13.1 / §13.3 | MINOR |

## 4. Contract Additions / Inventions

| 契约新增 | 分类 |
| --- | --- |
| `RelationRef.text_hash`（目标 ID + 文本 hash 快照） | NECESSARY IMPLEMENTATION DETAIL（spec §14.7-2 要求"claim 文本修改后 stale 标记"，快照是最小机制） |
| authoring/production 双模式 + 降级策略 | NECESSARY IMPLEMENTATION DERIVATION（spec §19 提 build exit code，隐含发布语义；spec 未定义运行时行为，属合理推导） |
| `specimen_eligible` 派生状态 / `data-salience` 通道 / 三级门禁（syntactic/editorial/rendering） | NECESSARY IMPLEMENTATION DERIVATION（实现 INVARIANT A5 与 §6.2 的最小通道） |
| `suppress="rule1,rule2"` 属性 | NECESSARY（spec §19 要求显式 suppress 路径但未定形式） |
| 具体校验严重度（谁 error 谁 warn） | NECESSARY DERIVATION，其中 2 处被判定为 ENFORCEMENT MISMATCH（见 §5） |
| `major=true → Never encode` | **UNSUPPORTED INVENTION → SEMANTIC MISMATCH**（spec §2.3/§9.1 明确授权 "major QUESTION" 为 PAUSE 特权成员） |
| `evidence_strength="strong" → Never encode` | **UNSUPPORTED INVENTION → SEMANTIC MISMATCH**（spec §13.4 明确把 evidence strength 列为 EVIDENCE 可选元数据，仅限有意义值） |

**UNSUPPORTED CONTRACT INVENTIONS 计数**：2（即上面两条被进一步判为语义不匹配；其余全部是必要机制）。

## 5. Enforcement-Level Mismatches

| # | 契约行为 | rev1 规范 | 判定 |
| --- | --- | --- | --- |
| E1 | §10 把 COUNTERPOINT legibility parity 放在 EDITORIAL CONSTRAINTS | 17-A-2 明确是 **INVARIANT** | ENFORCEMENT LEVEL MISMATCH（under-hierarchy） |
| E2 | §10/§14 把 "AI OUTPUT 无 source" 列为 safety invariant + block | 17-A 无此条；属 MACHINE-CHECKABLE SOURCE lint（§14.1）+ 强制元数据（§13.2）+ "无来源 blockquote=设计错误"（§12.5） | ENFORCEMENT LEVEL MISMATCH（hardening） |
| E3 | §14 "结构无效支持关系呈现为有效 → block 发布" | 17-A-7 只要求 "stale 必须被 lint 标记"，未定义 block | ENFORCEMENT LEVEL MISMATCH（hardening；应降级 + 诊断，block 仅在渲染器确会呈现为有效时收窄） |

非硬化项确认：viewport dominant ≤1（§6.4 = 17-B-C3 软约束，契约按 warn-only ✓）；连续 HIGH ≤2 / 英文 label ≤4（17-B-C4/C5，契约按 warn-only ✓）；PAUSE ≤3、表格行数、5 屏距离（启发式，契约 warn-only ✓）。**无 heuristic→build failure 的硬化**。

## 6. METRIC Reconciliation

- 两轴独立、旧三选一互斥模型未回归、EXTERNAL_SOURCE+INSPECTION_SPECIMEN 合法 → **FAITHFUL**（契约 §6 与 §17 切片）。
- 枚举名与 spec §13.7 一致（大小写差异为机制）→ **FAITHFUL**。
- specimen 三级门禁 → **NECESSARY DERIVATION**（实现 INVARIANT A5）。
- 缺 M1（负向资格清单）、M2（ambiguous defaults DOWN + salience/provenance 分治）→ **MISSING（IMPORTANT）**。
- "覆盖标记权重 ≥ 数字"（§3.4/§13.7）契约未显式承载 → MINOR MISSING。

## 7. Referential-Integrity Reconciliation

- 稳定 ID 为 spec 要求（P0 最高优先级，INVARIANT A7）→ 契约方案 **FAITHFUL / NECESSARY**。
- text-hash 快照 → **NECESSARY DERIVATION**；且契约把"文本变更"当 **STALE / RE-REVIEW**（降级 + 诊断），不是"关系为假" → 正确，未把语义有效性简化成 hash 相等。
- 契约覆盖 spec §14.7 的 1/2/4 项检查；**缺第 3 项**（quote 是否仍与 source 对应）→ MINOR MISSING。
- 缺 load-bearing JUDGMENT 的 evidence/counterpoint anchor 关系（M3）→ **MISSING（IMPORTANT）**。

## 8. Identity / Salience Reconciliation

- 契约 §8 与 spec §6.2 完全对齐（CSS class 只绑定 grammar identity；intensity 由内容角色/编辑裁决）→ **FAITHFUL**。
- `data-salience` 派生通道 → **NECESSARY DERIVATION**。
- 契约未发明 spec 之外的 salience 状态。
- MINOR：未引用 §9.2 冻结的五容器语法族映射（M7）。

## 9. Lint / Heuristic Reconciliation

- 五问三级化（machine-checkable / editorial prompts / reviewer judgment）、LICENSED INFERENCE 不机器验证、UNCERTAINTY 不评分 → **FAITHFUL**。
- §19 enforcement contract 六条全部被契约 §11 承载，外加"不改 display function / 不自动升降 metric salience / 不隐藏"——与"不得自动选择 CSS"一致，属**无害安全约束**，非 unsupported policy。
- render-tree 不变性测试 → **FAITHFUL**。
- MINOR：§14.2 五类不确定性区分规则缺失（M6）；EDITORIAL CONSTRAINT 的"覆盖须记录理由"与纯 heuristic 的"作者判断"差异未在契约 §11 注明。

## 10. Architecture Re-Verification

| 发现 | 文件 / 符号 | 复核证据 | 仍成立？ |
| --- | --- | --- | --- |
| 扁平 props | `src/markdown/types.ts:22`、`src/engine/doocs/semantic.ts:32` | `props: Record<string, string>` | **YES** |
| 无稳定 ID / 关系 | 全 src grep `claim_id/supports/challenges/relates_to` | 空 | **YES** |
| type→class switch | `src/engine/doocs/semantic.ts`、`src/engine/legacy/renderHtml.ts`、`src/render/blocks.tsx` | `.sblock-{type}` | **YES** |
| lint 纯函数（微信兼容） | `src/compat/check.ts:22` `runCompatibilityCheck` | 返回 findings，不改 AST | **YES** |
| 仓库未变 | `git status --short` | 仅 3 个未跟踪 md（spec/provenance/contract） | **YES** |

结论：AUDIT 15 的架构事实全部依然成立，契约的架构图无需更正。

## 11. Required Contract Patches

已按 AUDIT 19 对契约做最小修补（仅契约，不动 spec/生产代码）：

1. §7：`major` / `evidence_strength` 从 "Never encode" 改为符合 spec 的处理（major QUESTION 为授权 PAUSE 成员；evidence strength 为可选元数据 + 有意义值校验）。
2. §10：COUNTERPOINT legibility parity 移入 INVARIANTS；"AI OUTPUT 无 source" 从不变量样例移除（归入 machine-checkable + 降级）。
3. §14：AI OUTPUT 无 source → machine-checkable lint + 降级（非 block）；VERIFIED 无 substantiation → 按 RAW OUTPUT 处理（spec 原文）；无效支持关系 → 降级 + 诊断（block 仅收窄到"渲染器确会呈现为有效"）。
4. §6：补 METRIC 负向资格清单 + ambiguous defaults DOWN + salience/provenance 分治 + 覆盖标记权重。
5. §4/§13/§9：补 load-bearing JUDGMENT anchor 关系 + anchor 缺失 lint；补 scope-limiting 强制；补 STATUS 值集。

## 12. Phase-0 Gate

- [x] canonical rev1 与修补后契约一致（无遗留语义/层级冲突）
- [x] 无 enforcement-level blocker（AI-source、invalid-support 已按 spec 降级）
- [x] relation model 有界（只做 rev1 要求的 claim/source/evidence/counterpoint/judgment 关系，不建通用图引擎）
- [x] metric privilege 边界可实现（负向清单 + defaults DOWN + specimen_eligible）
- [x] identity/salience 分离有最小路径（CSS class 只绑 identity + data-salience 派生通道）
- [x] 无需重开任何设计问题（spec 本身无未决 blocker；运行时降级策略为必要实现推导）

---

### RECONCILIATION VERDICT

`READY FOR PHASE 0`

（契约已按对账修补；修补后与 rev1 一致。Phase 0 = schema + 稳定 ID + 关系完整性 + stale lint，即 spec P0 的"rev1 最高优先级"。）

### CANONICAL HASH VERIFIED

`YES`

### FATAL SEMANTIC MISMATCHES

`2`

（`major=true` 与 `evidence_strength` 的 "Never encode" 与 spec §2.3/§9.1/§13.4 直接冲突——契约过度限制，已修补。）

### ENFORCEMENT-LEVEL MISMATCHES

`3`

（E1 反方 parity 层级过低；E2 AI-source 硬化为不变量；E3 invalid-support 硬化为 block。）

### UNSUPPORTED CONTRACT INVENTIONS

`2`

（即上述两条语义不匹配的"Never encode"政策；其余契约新增均为必要实现机制。）

### MISSING CANONICAL REQUIREMENTS

`8`

（3 IMPORTANT：METRIC 负向清单+defaults DOWN+salience/provenance 分治、JUDGMENT anchor、scope-limiting；5 MINOR：STATUS 值集+RAW OUTPUT 回退、UNCERTAINTY 五类、容器语法族映射、AI-status+strongest-alternative+频率。）

### FIRST CODE CHANGE

给 `SemanticBlockToken`（`src/engine/doocs/semantic.ts`）增加稳定 `id` 字段，并新增纯函数 `validateBlockIds(tokens): IdDiagnostic[]` 校验 id 存在性与唯一性——**只做 ID，不做关系**。

### SECOND CODE CHANGE

新增 typed relations：`supports: ClaimId[]`（Evidence）、`challenges: ClaimId[]`（Counterpoint）、`relates_to: ClaimId[]`（Judgment/Metric）+ `validateRelations(tokens)`，用 Option B（目标 ID + 文本 hash 快照）检测悬空 / 重复 / `text_changed`（stale→re-review，非"关系为假"）/ 目标类型不兼容。

### DO NOT BUILD

1. 通用图引擎 / 完整引用数据库——只实现 rev1 要求的 claim/source/evidence/counterpoint/judgment 关系
2. 自动重排 / 自动补全 / 自动移动 COUNTERPOINT 或 JUDGMENT
3. NLP 式"不确定性评分"或"最强反方"选择——只做空答/禁语提示 + 人工复核
4. `importance` / 未加资格校验的 `major` / 无定义词汇的 `evidence_strength` 作为 salience 通道
5. 把 authoring/production 模式做成两套渲染器——单一渲染器 + 模式开关
6. 生产 CSS / 全量语义块渲染——先垂直切片
7. 把 D 类行为测试标为"心理学证明"——必须是 IMPLEMENTATION VALIDATION
