# V0.2.1 Visual / Epistemic Polish — Implementation Report

> 严格四补丁视觉/epistemic 修补（基于人工视觉验收）。
> 未重开认知设计 spec，未加功能，未动引擎架构，未改 semantic block 数量。
> V0.2 三态标签保持 `DESIGN-COVERED / IMPLEMENTATION-UNVERIFIED / BEHAVIORALLY-UNVALIDATED`。

## 1. Commit Info

| 项 | 值 |
|---|---|
| Starting commit | `5b09393`（分支 `feat/cognitive-editorial-v02`，工作树干净） |
| Resulting commit | 本报告所在单一 polish commit（`fix/v02-1-visual-polish` HEAD；`git rev-parse HEAD`） |
| Branch | `fix/v02-1-visual-polish` |
| Canonical spec | `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`（未改动） |

## 2. The Four Patches

### PATCH 1 — 移除冗余 H2 → QUESTION 取向层级

- `examples/issue-001.md`：删除紧随 QUESTION 前的 `## 一个问题`；QUESTION 由自然过渡句（"先放下手环，回到那个更基本的问题："）承接，自身作为 orientation landmark 立在 prose 与下一个 H2 之间。
- QUESTION 视觉不变（§13.1 左对齐 + 底部 hairline + label「提问」），可独立承担 landmark。
- **新增非阻断启发式** `validateHeadingQuestionRedundancy`（`src/engine/epistemicLint.ts`）：heading（H2/H3）后紧跟 QUESTION（过滤 marked 的 `space` token 后的语义相邻）→ `heuristic` / `info` 诊断 `ep-heading-question-redundancy`，可 `suppress=` 豁免。
- **未做**：语义/NLP 等价检测；未硬化成 validation failure。

### PATCH 2 — JUDGMENT：降低修辞权威

- `src/styles/article.css` `.sblock-judgment`：移除 `border-bottom`，**只保留一条 top rule**（`border-top: 1px solid var(--fg)`）。
- 保留：居中、serif、`--pause-gap` 的 deliberate-pause 间距、署名行、uncertainty。
- **未做**：不加 card/背景/边框、不改左对齐、不改排版、不动 `.sblock-question-major`（PAUSE 成员的双规则与此无关）。

### PATCH 2B — 修复 referential-integrity 缺陷（锚点方向）

- **根因**：渲染器硬编码锚点文案"证据与反方见后文"，但 fixture 中 Evidence/Counterpoint 位于 Judgment **上方** → 错误的指向。
- **修复**：锚点文案改为**方向感知**。新增共享 `buildAnchorDirections`（`src/engine/shared/semanticHtml.ts`），按文档内 token 位置判定每个 anchor 目标相对 Judgment 在上/下；`renderJudgment` 据此生成 `见上方` / `见下` / `见上下文`（mixed/missing 中性兜底）。legacy 与 doocs 引擎共用同一索引，A/B 结构一致。
- fixture 中 Judgment `anchor="ev-3060,cp-precision"` 现在渲染为 **"证据与反方见上方"**。
- **未做**：未全局替换 后文→上文；spec 要求 load-bearing JUDGMENT 携带 anchor（§7.5），故不省略。

### PATCH 3 — METRIC：去除 provenance 重复，不动 salience

- `43` 保持高 salience（`data-salience="inspection_specimen"` + 2–3× 大数字不变）。
- `renderMetric`（shared/semanticHtml.ts）：specimen 的**覆盖标记不再包含 source 行**（`metric-cover-source` 删除），role 声明由覆盖标记"被检查对象 · 非结论"承担；独立 role meta 行（"模型输出 · 检查对象"）不再输出——**provenance 收敛为一条紧凑行**：`模型输出 · 来源：X · 方法：Y · 边界：Z`。
- result / reference 保持原有两行（role meta + provenance），provenance 要求不削弱。
- CSS 移除不再输出的 `.metric-cover-source` 规则。

### PATCH 4 — EVIDENCE：二元判定是变体而非默认

- `renderEvidence`（shared/semanticHtml.ts）做**结构推断**：`parseEvidence` 产出非空 label 行（`SUPPORTED` / `NOT SUPPORTED` 等 ALL-CAPS verdict label）→ 保持现有**二元对比呈现**（`evidence-rows`）；否则 → **quiet relation grammar**（`evidence-prose`：内容按 prose 排，不自动制造 SUPPORTED/NOT SUPPORTED 行）。
- 边界/来源/强度字段行（`evidence-fields`）两种模式共用，quiet mono 注记级。
- fixture 的 SUPPORTED/NOT SUPPORTED 对比结构按二元呈现保留（backward compatible）。
- **未加新 schema**：纯结构推断，复用现有 parseEvidence + props。

## 3. Files Changed

| 文件 | 变更 |
|---|---|
| `examples/issue-001.md` | Patch 1（删 H2）+ Patch 2B fixture 端（锚点方向已由渲染器处理，fixture 本身 anchor 未改） |
| `src/styles/article.css` | Patch 2（judgment 单规则）、Patch 3（去 cover-source）、Patch 4（evidence-prose/fields） |
| `src/engine/shared/semanticHtml.ts` | Patch 2B（buildAnchorDirections + 方向文案）、Patch 3（metric 去重复）、Patch 4（evidence 两态推断） |
| `src/engine/doocs/semantic.ts` | 渲染上下文加 `anchorDirections` |
| `src/engine/doocs/engine.ts` | lex 后构建 `anchorDirections` 注入 |
| `src/engine/legacy/renderHtml.ts` | legacy 构建/传递 `anchorDirections` |
| `src/engine/epistemicLint.ts` | Patch 1（heading→question 启发式） |
| `src/engine/v02-render.test.ts` | 锚点方向测试（见上方/见下/中性）+ V0.2.1 验收块 |
| `artifacts/*.html` | 重新生成（Issue 001 Editorial / Normal / Mobile lean / six-block / base-Markdown） |

## 4. Tests

`141 tests` 全绿（V0.2 基线 133 → +8），`tsc --noEmit` 与 `vite build` 通过。

- 新增 V0.2.1 验收块：fixture 无 H2→QUESTION 冗余；启发式触发且非阻断（`canDiagnosticFailBuild`=false）；specimen 43 高 salience + 元数据不重复（无 `metric-cover-source`、无重复 role）；二元 evidence 保持；relational evidence 不制造二元行。
- 锚点测试改为方向感知：`见下`（目标在下）、`见上方`（目标在上，referential 修复）、`见上下文`（目标缺失）。
- 未假装任何测试验证视觉认知（保持 IMPLEMENTATION VALIDATION 定位）。

## 5. Build / Artifacts

- `tsc --noEmit` ✓；`vite build` ✓；`vitest run` 141 ✓。
- `artifacts/` 重新生成（真实引擎 + 剪贴板解析 CSS，0 未解析 var()）：
  - `issue-001-editorial.html` / `issue-001-normal.html` / `issue-001-mobile-lean.html`
  - `six-block-sequence.html`（metric 改为 inspection specimen 以展示高 salience）
  - `base-markdown-only.html`
- 验收点核验：fixture 无"一个问题"、无"见后文"、含"证据与反方见上方"、metric 单行 provenance、无 `metric-cover-source`。

## 6. Ambiguities / Decisions

1. **锚点方向实现**：任务建议"见上方"或"省略"，并说"除非 canonical spec 要求 anchor 否则倾向省略"。spec §7.5 要求 load-bearing JUDGMENT 携带显式 anchor（缺失 = lint warning）。故选择**保留 anchor + 方向感知文案**，而非省略——既满足 spec，又修复了指错方向的缺陷。方向感知用 token 位置（非 DOM），legacy/doocs 共用。
2. **Patch 4 结构推断**：以"parseEvidence 是否产出非空 label 行"作为二元/关系态分界。这是既有解析产物的纯结构信号，未加 schema；边缘情况（如关系态里恰好有 ALL-CAPS 行）会被误判为二元——文档化为此推断的已知边界，不引入启发式猜词。
3. **fixture 过渡句**：删 H2 后加入"先放下手环，回到那个更基本的问题："自然过渡句，避免 QUESTION 突兀；这不是 H2 预告，也不触发启发式（前面是 paragraph 不是 heading）。
4. **PATCH 2 仅改 JUDGMENT**：`.sblock-question-major` 的双规则属于 major QUESTION 的 PAUSE 特权（§9.2），不在本补丁范围，未动。

## 7. Explicitly Unvalidated

行为/认知声明仍为假设：本补丁是视觉/epistemic 一致性调整，不声称降低认知负荷、提升可检查性或读者行为变化；三态 `BEHAVIORALLY-UNVALIDATED` 保持。
