# V0.2 Cognitive / Epistemic Editorial — Implementation Report

> **Epistemic status：** 本报告记录**实现**完成度，不声称任何行为/认知效果已被验证。
> canonical spec 的三态标签保持 `DESIGN-COVERED / IMPLEMENTATION-UNVERIFIED / BEHAVIORALLY-UNVALIDATED`。
> 实现不会让 §21 P2 的行为假设自动"转正"；那些仍需真实读者数据。

## 1. Starting State

| 项 | 值 |
|---|---|
| Implementation branch | `feat/cognitive-editorial-v02` |
| Branch base (starting commit) | `6d8c09e`（`feat/doocs-engine-adapter` 之上；任务声明的 engine-migration checkpoint `e018349` 与 `d8cfb76` 均保留在历史中，未破坏） |
| Canonical spec | `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md`（V0.2 rev1） |
| Canonical spec SHA-256（实测） | `86d118f4b5190ecbcbb8c55f2b06fc9813ce33b151ddb0cbfe653700b40ead2b` |
| 声明 hash 匹配 | YES（大小写归一后逐字符一致） |
| Provenance | `MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_PROVENANCE.md`（recovery case A；内容未重写） |
| 实现 HEAD | `efa1ff3` |
| 并发进程提示 | 会话期间另有进程在 `feat/doocs-engine-adapter` 提交了 `6d8c09e`（metric 结构资格语义收紧）与 `src/engine/doocs/authorization.ts`（Phase 0.5 编辑授权层）。两者均被纳入本分支基线与工作树；处理见 §11 已知缺口。 |

## 2. Implementation Contract

`MAX_EDITORIAL_V02_IMPLEMENTATION_CONTRACT.md`（已更新）：

- 契约初稿写于规范未恢复时；规范恢复后经 `MAX_EDITORIAL_V02_CONTRACT_RECONCILIATION.md` 对账最小修补，结论 `READY FOR PHASE 0`。
- 本 sprint 在契约顶部新增 **§0 Canonical Input & P0 Requirements Matrix**（§21 P0 九项 → 实现位置 → 测试方法），满足任务 Phase 1 的映射要求。
- 契约遗留的 `SPEC FILE NOT FOUND` / `PER TASK PROMPT` 标记已修订为以已核验的 canonical rev1 为权威。
- CONTRACT REVIEW GATE 自审：五项全 NO（无启发式→不变量、无 P0 遗漏、无方向性→最优性、无 spec 外设计自由、无未要求功能）。

## 3. P0 Completion Matrix

| Spec Ref | P0 Requirement | 状态 | 实现位置 |
|---|---|---|---|
| §13.7 / INV A4/A5 | METRIC 两轴 + specimen 资格 + defaults DOWN | **DONE** | `metric.ts`（schema，既有）+ `shared/semanticHtml.ts` renderer 消费 `effectiveDisplayFunction` → `data-salience` + 覆盖标记 + 负向资格收回 |
| §14.7 / INV A7 | Referential integrity + stale lint | **DONE** | `relations.ts`/`blockIds.ts`（lint）+ renderer 降级（`sblock-degraded`）+ claim 引用行显示 live claim 文本（claimMap） |
| §19 | 三级治理 + HEURISTIC MUST NOT + render-tree 不变性 | **DONE** | `governance.ts`（既有）+ `epistemicLint.ts`/`heuristics.ts` 真实规则 + 非变更测试 |
| §13.5 / INV A2 | COUNTERPOINT legibility parity | **DONE** | 共享 CONTRAST PAIR 容器（`.sblock-evidence, .sblock-counterpoint` 同一排版） |
| §13.3 / INV A6 | JUDGMENT author-owned cue + adjacency anchor | **DONE** | 署名行 `— Max`；uncertainty 行；anchor 缺失 lint（§7.5-3） |
| §13.2 / INV A3 | AI OUTPUT quotation 化 + status/source | **DONE** | QUOTATION 语法 + source/status meta；无 source 降级为普通引用；VERIFIED 无 substantiation → RAW OUTPUT |
| §13.4 | EVIDENCE claim_id 引用 + 去 spreadsheet | **DONE** | claim 引用行 + 对照列表（无 cell border） |
| §14.1 | Epistemic lint 三级化 | **DONE** | machine-checkable 3 项 + UNCERTAINTY 防 boilerplate + blockquote 来源 + LICENSED INFERENCE 出 lint（不机器验证） |
| §14.3 | scope-limiting metadata 模板推广 | **DONE** | 文章 ≥1 条 + 含数字/结论块建议（heuristic）+ fixture 模板 |

**P1/P2 说明：** 任务 Phase 3–13 将 §21 P1 的大部分（Base Markdown 身份、五容器语法族、Spacing、Mobile-first、LAB NOTE 注记化、Interrupt Density）与部分 P2（label 收敛、中英混排审计）纳入 sprint 范围，本报告按此范围实现。P2 的行为验证项（SCAN 测试、INSPECT 五问可答率、grammar comprehension、A/B）**未做**——它们需要真实读者，属于 `IMPLEMENTATION-UNVERIFIED`。

## 4. Base Markdown Changes（§12）

`src/styles/article.css` 全量重建 + `src/styles/tokens.css`：

- **H2/H3 稳定语法**：H2 = 结构导航（1.5em，样式完全一致），H3 字号+间距双重轻于 H2（1.18em）。正文 READ 态安静（低对比、统一节奏）。
- **blockquote 语义化**：引用条 + 来源名必须可见；无来源 = lint 警告（`ep-blockquote-source`）。作者强调不再用引用。
- **技术术语 ≠ 代码**：`calibration` / `margin of error` 等术语按普通样式渲染；inline code 只给字面值（fixture 示范 `suggest(...)` 与 `src/fitness/...` 的区分）。
- **table 去 spreadsheet**：去掉 cell grid，仅表头上线 + 上下发丝线；`.table-wrap` 横滚。短对照数据用列表（EVIDENCE 语法）。
- **strong/em 克制**：strong = claim 关键字；em = 语气。
- **列表**：同层枚举，项内无长 prose。
- **image/caption**：markdown `title` 属性 → `<figure><figcaption>`（ANNOTATION 语法），legacy/doocs 两个引擎结构一致。
- **identity 来源**：统一字号阶梯 + 统一间距节奏 + 稳定 H2/H3，不靠卡片/装饰。

## 5. Semantic Component Changes（§13）

共享渲染器 `src/engine/shared/semanticHtml.ts`（legacy + doocs 共用，禁止漂移；A/B regression 结构等价）。

**五容器语法族（§9.1 冻结映射）：**

| 族 | 成员 | 视觉 |
|---|---|---|
| PROSE | QUESTION（默认）/ claim | 左对齐，label「提问」，底部发丝线；major QUESTION 才借 PAUSE 语法 |
| QUOTATION | AI OUTPUT | 左引用条 + 来源/status 行；正文同字号或略小；无 source → 降级普通引用 |
| CONTRAST PAIR | EVIDENCE ↔ COUNTERPOINT | **同一容器同一排版仅 label 不同**（parity）；无 cell border 对照列表 |
| PAUSE | JUDGMENT、METRIC-specimen | 居中 + 上下墨线 + 署名行 + uncertainty/anchor |
| ANNOTATION | LAB NOTE | 小字号、弱背景、数字平铺（非 dashboard） |

**每块的认识论处理：**

- **QUESTION**：section opener，非 inline 高频；全文 ≤2（lint）。label「提问」。
- **AI OUTPUT**：label「AI OUTPUT」；强制 source + status（raw/verified/excerpt）；VERIFIED 无 substantiation → 按 RAW OUTPUT 渲染（§14.1）；无 source → 降级为无主引用 + 诊断（不镀金）。
- **JUDGMENT**：label「JUDGMENT」；署名行 `— Max`（可 `author=` 覆盖，INVARIANT A6）；`uncertainty=` 默认显示 weak-evidence cue；`anchor=` 渲染 adjacency 提示。杜绝 motivational-quote 样式。
- **EVIDENCE**：label「EVIDENCE」；claim 引用行在最前（文本来自 claim_id live 关系）；SUPPORTED/NOT SUPPORTED 对照列表；boundary/evidence_strength 元数据；无 claim_id → 降级 + machine-lint error。
- **COUNTERPOINT**：label「COUNTERPOINT」；与 EVIDENCE 完全同级 legibility（不灰化/不缩小/无 warning 样式）；强反方纪律交给作者（lint 只提示 anchor 缺失，不做内容评判）。
- **LAB NOTE**：label「实验注记」；数字平铺在文本中（`40 cases · 15 routed · 12 passed`），scope-limiting 声明常显（"System evaluation. Not a human study."）。
- **METRIC**：渲染器**只消费** `deriveMetricEligibility().effectiveDisplayFunction`（§13.7 salience 由 DISPLAY FUNCTION 决定）。specimen → `data-salience="inspection_specimen"` + 2–3× + **覆盖标记（被检查对象 · 非结论 + inspection_question + specimen_source，权重 ≥ 数字）**；result → 1.3–1.6× 紧邻 boundary；reference → 中低。两轴声明 + SOURCE + METHOD/BOUNDARY 常显。负向资格（author_computed / exact_value_visible=false）收回 specimen。

**label 系统（§9.4）：** 英文 label 恰好 4 个（AI OUTPUT / JUDGMENT / EVIDENCE / COUNTERPOINT）；QUESTION「提问」、LAB NOTE「实验注记」用中文；label 不含评价词（无 PROVEN/VERIFIED 字样）。

## 6. Epistemic Lint Changes（§14 / §17 / §19）

新模块 `src/engine/epistemicLint.ts` + 真实 `heuristics.ts`，聚合进 `validateDocument`，经 `engine.render().epistemicDiagnostics` 进入 CheckPanel（与微信兼容检查并列展示，带 governance 前缀）。

| 规则 | 治理 | severity | 豁免 |
|---|---|---|---|
| `ep-ai-source` / `ep-ai-status` / `ep-ai-verified`（AI OUTPUT 强制 source/status；VERIFIED substantiation） | machine-lint | warning | 否 |
| `ep-evidence-claim`（EVIDENCE 必须 claim_id） | machine-lint | error | 否 |
| `ep-judgment-anchor`（load-bearing 判断缺 anchor，§7.5-3） | editorial-constraint | warning | `suppress=` |
| `ep-interrupt-density`（连续 HIGH >2，§7.4/C4） | editorial-constraint | warning | `suppress=` |
| `ep-blockquote-source`（引用无来源，§12.5） | editorial-constraint | warning | `suppress=` |
| `ep-uncertainty`（boilerplate，§14.2） | editorial-constraint | warning | `suppress=` |
| `ep-scope-limiting`（文章 ≥1 条；含数字块建议，§14.3/D14） | heuristic | warning / info | `suppress=` |
| `ep-question-frequency`（≤2，§13.1）/ `ep-hr-frequency`（≤2，§12.11） | heuristic | info | `suppress=` |
| `HEUR-pause-density`（PAUSE ≤3，§11.2） | heuristic | info | `suppress=` |

**执行契约（§19）：** 全部为只读纯函数——不 mutate AST、不自动选 CSS、不 autofix、不影响 build 退出码。`canDiagnosticFailBuild()` 策略查询保持 machine-lint error 才可能 gate；heuristic/editorial-constraint 永不 gate。render-tree 不变性有测试（validator 前后 JSON 深比较相等）。

**防 classification laundering（§14.6 / INV A7）：** ① EVIDENCE 强制 claim_id（无 = lint error + 渲染降级）；② AI OUTPUT 无 source 降级、VERIFIED 需 substantiation；③ label 禁评价词。渲染器永远不直接按作者 props 的强度词分支给 salience——specimen 视觉只来自派生 eligibility，且强制覆盖标记。

**SELECTION OPACITY（§15.1）：** 设计哲学写入本报告 §11 与契约；UI 不默认叠加"证据由作者选择"提示（避免 audit theater）；不检查 selection 完整性（不可自动化）。

## 7. Mobile / WeChat Changes（§16）

- **mobile-first 基线**：tokens.css 默认即移动 lean（`--block-before:1.5em`、`--pause-gap:2.4em`、paper 内边距 1.3em/2.2em 等）；桌面完整 editorial whitespace 由 app.css `.vp-desktop .paper` token 覆盖恢复。这样 **WeChat 粘贴（clipboard CSS 直接解析 tokens）天然是移动 lean**，不依赖媒体查询（微信会剥离 `<style>`）。
- **长英文串**：`.article { overflow-wrap: break-word }`；code 块横滚。
- **表格**：默认禁用（作者用对照列表）；`.table-wrap` 横滚 + lint 建议。
- **specimen**：覆盖标记与数字同屏（同块内）。
- **title**：masthead-title 允许 2 行折行。
- Normal/Editorial：同一编辑语法的两种密度（§10），认识论不变量（同容器/同 label/同降级）不变。

## 8. Preview / Clipboard Fidelity（§9）

- Preview 与 COPY→WECHAT 共用同一 artifact：Preview 把引擎 HTML 注入 `.article-body`；剪贴板 clone 预览 DOM（`.article.paper`）→ juice 内联 → 微信流水线。**没有第二套预览实现**。
- 测试证明 V0.2 标记（`data-salience="inspection_specimen"`、`metric-cover`、`judgment-author`、`evidence-claim`、`实验注记`）在 preview 与 clipboard 产物中都存在（`v02-render.test.ts`）。
- 剪贴板 CSS 0 个未解析 `var()`（`theme.ts` 导出期解析），artifact 抽查确认。
- legacy 引擎（dev A/B）保留：copy 走独立 legacy 剪贴板（`render/clipboard.ts`），已补 claim 按 prose 渲染，避免 `UNKNOWN · claim`。

## 9. Tests

`133 tests` 全绿（基线 105 → +28），`tsc --noEmit` 与 `vite build` 通过。

**新增（`src/engine/v02-render.test.ts`，19 项）：** 块身份/label（提问、claim-as-prose、lab-note 平铺）；AI OUTPUT 降级 + VERIFIED 回退；JUDGMENT 署名/uncertainty/anchor；METRIC defaults DOWN；认识论 lint 各规则 + suppress + 非变更；preview/clipboard artifact 一致性；移动溢出防线。

**新增（fixture.test.ts）：** V0.2 fixture 的关系有效性（无 stale/missing）、无认识论 error、specimen 覆盖标记 + 署名行 + 非降级。

**更新的既有测试（记录理由）：** 4 处断言旧"渲染中立 / 零视觉变化"行为的测试被改写为 V0.2 新语义——
- `relations.test.ts`「relations 不改渲染」→「可解析关系显示 live claim 文本；不可解析降级不镀金」
- `metric.test.ts`「两轴元数据不改渲染」「specimen 渲染同 plain」→「renderer 消费派生 eligibility；specimen 得 data-salience+覆盖标记；资格缺/负向 → defaults DOWN」
- `metric.test.ts` laundering「无视觉授权字段」→ 保留"无授权字段"断言，末尾改为断言渲染输出由派生状态驱动
- `engine.test.ts` / `regression.test.ts` fixture 的 ai-output 补充 source/status（否则按 §13.2 降级，类断言失效）

> 说明：这些"渲染中立"断言是 Phase 0.4 提交的**临时零视觉变化**声明；V0.2 渲染器按 spec 消费派生状态正是本 sprint 的目的，断言随行为规范更新，非退化。

## 10. Known Gaps

1. **specimen 编辑授权层未接线**：并发进程产物 `src/engine/doocs/authorization.ts`（Phase 0.5）要求"结构资格 + block-ID 显式授权"双满足才授予 specimen 特权。本 sprint 的渲染器用 canonical spec 的资格条件（§13.7）+ 强制覆盖标记实现，**未**接入独立编辑授权层（V0.2 无编辑授权 UI/流程）。保留该文件，未做冲突处理；若未来启用生产发布流，应让渲染特权改走 `resolveMetricTreatment`。这是一处**文档化歧义**（canonical spec 未要求独立授权层）。
2. **authoring/production 双模式**：契约推导的分级降级（authoring 可见诊断条 vs production 中性回退）未实现完整模式开关；V0.2 编辑器以 authoring 行为为准（降级渲染 + CheckPanel 诊断）。
3. **inline 诊断条**：§14 的 authoring 可见诊断条未做（诊断集中在 CheckPanel，避免 inline 装饰/audit-theater 风险）。
4. **legacy 引擎不提供认识论诊断**（`epistemicDiagnostics` 仅 doocs 填充）；legacy 为 dev A/B，可接受。
5. **juice patch（上游已知风险）**：`parseCSS` 空值防御 patch 未应用（继承 ENGINE_MIGRATION_REPORT），真实崩溃路径 copy 走 `ok=false`。
6. **weak-evidence uncertainty 自动检测**：§13.3 "weak evidence 时 uncertainty 默认显示"——自动检测 evidence 强度未实现（编辑判断，H3）；由 `uncertainty=` prop + lint 提示承担。
7. **viewport-dominant / counterpoint 5 屏可达**：需要真实布局量测，headless 未做（interrupt density 已做结构性近似）。
8. **并发进程**：`authorization.ts` 与 `6d8c09e` 来自会话期另一进程；本分支未与其后续工作冲突，但若对方继续提交需协调。

## 11. Explicitly Unvalidated Claims

> **实现不等于行为验证。** canonical spec 的 `BEHAVIORALLY-UNVALIDATED` 状态保持不变。以下全部仍是假设，直到真实读者行为评估（§21 P2）：

- ❌ 不验证**读者行为**（SCAN/INSPECT/RESUME 循环未被证明改善）。
- ❌ 不验证**认知负荷降低**（本设计假设减少 extraneous load，无实验数据）。
- ❌ 不验证**理解提升**（没有任何可读性/comprehension 实验）。
- ❌ 不验证**偏差减少**（confirmation bias 缓解仍是方向性主张）。
- ❌ 不验证**可检查性提升**（"inspectable"是可测试主张，需 INSPECT 五问可答率、grammar comprehension 测试、V0.1 vs V0.2 A/B）。
- ❌ 不声称任何字号/行高/中断数量是**心理学最优**（§20 伪科学禁令）。
- ❌ 不声称解决了 **evidence selection / selection bias**（§15.1 诚实边界：证据由作者选择，系统不宣称完整性）。

**SELECTION OPACITY 设计哲学（写入实现，非 UI 承诺）：** 本系统的排版纪律（label 禁评价词、claim_id 引用、specimen 覆盖标记、scope-limiting 声明、反方 parity）旨在让"检查"更容易，**不能**证明"证据被完整、无偏地挑选"。呈现结构 ≠ 证据完整性。

---

## 附：视觉验收（Phase 13）

**方法：** 环境无 headless 浏览器/截图工具，采用**可复现检查集**（`artifacts/` 下 5 个自包含 HTML，由真实引擎 + 剪贴板解析 CSS 生成，0 未解析 var()）：

| 文件 | 覆盖 |
|---|---|
| `artifacts/issue-001-editorial.html` | 完整 fixture · editorial · 桌面 whitespace |
| `artifacts/issue-001-normal.html` | 完整 fixture · normal · 桌面 |
| `artifacts/issue-001-mobile-lean.html` | 完整 fixture · editorial · 移动 lean |
| `artifacts/base-markdown-only.html` | 纯 Markdown（无任何语义块）· 桌面 |
| `artifacts/six-block-sequence.html` | AI OUTPUT → METRIC → JUDGMENT → EVIDENCE → COUNTERPOINT → LAB NOTE 序列 |

**浏览器打开检查**（在项目根 `C:\Users\gbx12\projects\max-editorial`）：
1. 直接双击/打开 `artifacts/*.html`（桌面宽度视窗）。
2. 或将 viewport 缩窄至 ~390px 检查 mobile-lean 的 whitespace 预算。
3. 交互版：`npm run dev` → 浏览器打开 `http://localhost:5173`（默认加载 issue-001；可切换 NORMAL/EDITORIAL、DESKTOP/WECHAT/MOBILE、CHECK 查看认识论 lint、COPY → WECHAT）。
   - 注：本沙箱内 localhost HTTP 抓取被拦截（curl/Invoke-WebRequest 均 502），但 vite 启动日志显示编译无错；133 项 jsdom 测试已覆盖完整渲染管线。

**验收时需人工核对的点（IMPLEMENTATION VALIDATION，非自动证明）：**
- 去掉全部语义块后，纯 Markdown 是否仍像成熟刊物（§12）。
- 六连块序列是否产生"组件轰炸"感（预期：lint 已标 `ep-interrupt-density`，视觉上五族语法已统一）。
- 灰阶/低色环境下五族身份是否仍可辨（不靠颜色）。
