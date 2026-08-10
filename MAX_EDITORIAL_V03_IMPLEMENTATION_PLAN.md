# MAX EDITORIAL V03 — IMPLEMENTATION PLAN

> **状态：SPEC ONLY。不实现任何阶段。** 从选定方向 C 到生产工程的分阶段桥梁。
> 每阶段列：涉及文件 / 预期视觉结果 / 编译器影响 / 所需测试 / 手动视觉 QA / 回归风险。
> 顺序理由：先立"普通 markdown 出版级"（P0），再上编辑签名（LEVEL 2），再安静 utility（LEVEL 3），最后编辑器与微信编译。

## Phase 1 — 设计 token + 普通 Markdown 排版（P0 基座）

**目标**：纯 Markdown 文章即出版级。覆盖 LOCK §2–16、§25 LEVEL 1。

**涉及文件（预计）**
- `src/styles/tokens.css`（新 V0.3 token：色板/字号/行高/间距/字距）
- `src/styles/article.css`（基础排版重写：p/h1–h3/strong/em/blockquote/ul/ol/hr/a/code/pre/table/img/figure）
- `src/engine/wechat/safeCss.ts`（微信安全 CSS 同步：block 流 + 固定 px）
- `src/engine/wechat/tokens.ts`（若有，导出期解析）

**预期视觉结果**：普通 markdown 的 cover 开版、编号 H2、安静 H3、稳定正文节奏——不再像默认 markdown。

**编译器影响**：基础元素全部是可编译 primitive（block/px/border/background）；伪元素 H2 墨线需编译为真实节点。

**所需测试**：token 断言（色/字号值）；markdown 元素渲染测试；`checkWechatPolicy` 对新 safeCss 0 error；纯 markdown fixture 结构断言。

**手动视觉 QA**：375/430/desktop 截"纯 markdown 文章"；ACCEPTANCE §1 的正文/H2/H3/引用/列表/表格项。

**回归风险**：V0.2.x 的浏览器预览视觉整体更换（预期内，这是 V0.3）；既有 v02-render 测试断言旧 class 结构 → 需同步更新（文档化）。

## Phase 2 — masthead + 编号 H2 + figures（LEVEL 2 签名）

**目标**：masthead/issue 系统 + 自动编号 H2 + figure grammar。覆盖 LOCK §7/§16/§17/§25 LEVEL 2。

**涉及文件**
- `src/engine/doocs/semantic.ts` / `src/render/Article.tsx`（H2 编号：渲染器自动给 H2 加 `01` 文本节点，作者不手输）
- `src/engine/shared/semanticHtml.ts`（figure 的 `FIG / 01` 语言）
- `src/styles/article.css` + `safeCss.ts`

**预期视觉结果**：文章从开头就是"一本刊物"——品牌 masthead、编号 section、figure 语言。

**编译器影响**：编号必须是**真实文本**（微信不能 CSS counter）；H2 墨线编译为 border/div。

**所需测试**：编号自动生成（H2 序数、H3 不编号、intro 无 00、语义块不参与）；编号在微信产物为显式文本；figure caption 存在。

**手动视觉 QA**：截图编号 H2 在 375/430/desktop；grayscale 自检。

**回归风险**：H2 结构改变影响既有 markdown 解析/渲染测试；编号改变文章 AST 输出（需确认编号在渲染层而非 AST 层注入，避免污染 lint/relations）。

## Phase 3 — Metric + Judgment（LEVEL 2 签名核心）

**目标**：Metric 检查锚点（D3 中文 role 标 + H01 编译）+ MAX/JUDGMENT 签名时刻（D2）。覆盖 LOCK §18/§19。

**涉及文件**
- `src/engine/shared/semanticHtml.ts`（Metric label → `被检查对象 / METRIC` 等；Judgment 结构：判断先行居中、解释左对齐）
- `src/engine/wechat/safeCss.ts`（Metric 44px H01 + role 标；Judgment 21–24px 居中单规则）
- `src/engine/wechat/compiler.ts`（若需 spec 化 role 文本）

**预期视觉结果**：43 是清晰的检查锚点；Judgment 是作者签名时刻而非组件。

**编译器影响**：Metric 数字走 H01 `<p>` 44px（V0.2.3 已验证）；role 标是真实中文文本；Judgment 无 flex。

**所需测试**：Metric 三种 role 标签映射（specimen/result/reference）；H01 对齐测试沿用 V0.2.3；Judgment 居中判断 + 解释左对齐 + 长内容回退；forbidden primitive 0。

**手动视觉 QA**：metric 特写（微信 375px 44px 清晰）；Judgment 截图（居中/署名/留白）；长 Judgment 回退截图。

**回归风险**：Metric label 文案变化（`INSPECTION SPECIMEN` → 中文）影响既有测试断言；Judgment 结构调整影响 anchor 测试。

## Phase 4 — AI Output + Evidence + Counterpoint + Lab Note（LEVEL 3 utility 安静化）

**目标**：utility 从属 signature；quiet 判词结构、文档标本、笔记本插页。覆盖 LOCK §20–23。

**涉及文件**
- `src/engine/shared/semanticHtml.ts`（结构保持，元数据收敛 ≤2 项）
- `src/engine/wechat/safeCss.ts`（安静表达：hairline、浅底、块行元数据）

**预期视觉结果**：Evidence 判词先读、Counterpoint parity、AI 是标本、Lab Note 是插页；无卡片、无元数据竞争。

**编译器影响**：全部 block 流 + 显式文本；无 flex/gap/nowrap。

**所需测试**：各块微信产物结构断言；元数据行数 ≤2；parity 断言沿用。

**手动视觉 QA**：Evidence/Counterpoint 并排截图（同级可读）；AI 元数据换行截图；Lab Note 截图。

**回归风险**：元数据收敛影响既有 lint/渲染测试；需确认不削弱 epistemic 要求（scope 声明仍在）。

## Phase 5 — 编辑器 UI 样式（editorial workstation）

**目标**：编辑器外壳向 C 的编辑工作台靠拢（安静 mono 源 + publication 主导 + 最小 chrome）。覆盖原型 `c-editor-ui.html`。

**涉及文件**
- `src/styles/app.css`（顶栏/分栏/状态栏重样式）
- `src/components/StatusBar.tsx` / `PreviewPane.tsx`（若需结构调整）

**预期视觉结果**：编辑器像编辑工作站，不像 SaaS dashboard。

**编译器影响**：无（编辑 shell 不进微信产物）。

**所需测试**：无结构性新测试（视觉为主）；既有 app 测试通过。

**手动视觉 QA**：desktop 编辑器截图对照 `c-editor-ui.html`。

**回归风险**：编辑 shell 改动影响编辑器交互（需手动回归：输入/切模式/COPY/CHECK）。

## Phase 6 — 微信目标编译映射（把 C 拍平进编译器）

**目标**：按 `WECHAT_MAPPING_SPEC` 把 C 的浏览器源语言拍平成微信安全编译表达。覆盖映射 §1–2。

**涉及文件**
- `src/engine/wechat/safeCss.ts`（微信安全 CSS 定稿）
- `src/engine/wechat/compiler.ts`（伪元素→真实节点、counter→显式文本、flex→block、H2 墨线→border/div 的编译期处理）
- `src/engine/wechat/policyCheck.ts`（检测项补：伪元素/渐变/absolute 是否泄漏）

**预期视觉结果**：微信粘贴产物保持 C 的核心身份（标题/编号/Metric/Judgment），元数据块行换行。

**编译器影响**：本阶段是编译器行为的核心工作；产物必须 policy-clean（0 flex/gap/clamp/vw/@media/nowrap/var）。

**所需测试**：编译产物结构断言（显式序号、H2 墨线节点、无伪元素）；`checkWechatPolicy` 0 error；preview/clipboard 同 artifact。

**手动视觉 QA**：WECHAT 预览对照 C 原型；grayscale 自检。

**回归风险**：编译产物变化影响 V0.2.3 的 H01 对齐测试（需保持 44px 不变）；伪元素展开是编译期新逻辑，需防过度生成。

## Phase 7 — 真实微信视觉验收

**目标**：按 `VISUAL_ACCEPTANCE` 四视口截图验收；回填 `WECHAT_COMPAT_MATRIX`。

**涉及文件**：无代码；验收记录/矩阵更新。

**预期结果**：真实微信粘贴通过 ACCEPTANCE 全部项 + 最终门"不像工程原型"= 否。

**所需测试**：无新单测；验收驱动（截图 + 勾选清单）。

**手动视觉 QA**：真实公众号后台粘贴截图（全篇 + metric 特写）。

**回归风险**：验收发现微信特有的字体/排版塌缩 → 回到 Phase 1/3/6 对应 token 调整（固定值，不回到 clamp/vw/flex）。

---

## 跨阶段纪律

1. 每阶段结束：`tsc` / 既有测试 / `checkWechatPolicy` 绿。
2. 语义/认识论不变量不因视觉改而变（claim_id、scope、parity、author-owned cue 保持）。
3. 微信安全 primitive 集不变（禁 flex/gap/clamp/vw/@media/nowrap）。
4. 不引入新语义块、不改 parser AST 语义（编号在渲染层注入，不在 AST）。
5. 每阶段截图存档，供 ACCEPTANCE 对照。
