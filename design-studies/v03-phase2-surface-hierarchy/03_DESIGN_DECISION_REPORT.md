# V0.3 Phase 2 — DESIGN DECISION REPORT
## Editorial Surface & Hierarchy Study · Direction B (Restrained Hybrid)

> 状态：**STUDY COMPLETE — AWAITING OWNER + CHATGPT VISUAL REVIEW**。
> 本报告不冻结任何视觉。生产 renderer / compiler / app UI 未修改。
> Provenance：Agent Claude Code · 2026-08-21 · Branch `design/v03-phase2-surface-hierarchy-study` ·
> Starting HEAD `00cbebf224b32f3e754133ab525666d1a20d19ce`（feat/v03-phase1-markdown-typography）。

---

## 1. Executive Verdict

**`REVISE_HYBRID_BEFORE_OWNER_ACCEPTANCE`**

方向 B 可行：两个样张渲染干净、灰度层级成立、无营销模板风险、微信安全边界内可表达。
但进入生产前有 **3 个必须由 Owner + ChatGPT 拍板的决策**（cobalt→teal 身份迁移、Metric 84→44px 收敛、H4 需要渲染器改动），以及 2 个已知渲染器缺口（H4 钳制、`.q-source` 不产出）。方向对，未冻结。

---

## 2. 工作区状态

- 起始 branch：`feat/v03-phase1-markdown-typography` @ `00cbebf`，**工作区 clean**
- 新建 branch：`design/v03-phase2-surface-hierarchy-study`（自 00cbebf 创建）
- main 未触碰；未 push
- 无 `AGENTS.md`（任务 §四.1 要求读取，仓库无此文件）
- 无既有 design-study 目录规范（`design-studies/` 为首个，命名对齐 `artifacts/` 惯例）

## 3. 读取的权威设计与实现文件

- 设计：`DESIGN_TOKENS.md`、`SEMANTIC_BLOCKS.md`、`MAX_EDITORIAL_V03_ART_DIRECTION_LOCK.md`（§0–§26 全读）、`MAX_EDITORIAL_V03_MARKDOWN_GRAMMAR.md`、`MAX_EDITORIAL_V03_WECHAT_MAPPING_SPEC.md`、`WECHAT_SAFE_PROFILE_V1.md`
- 实现：`src/styles/tokens.css`、`src/styles/article.css`、`src/styles/base.css`、`src/engine/shared/v03Heading.ts`、`src/engine/shared/semanticHtml.ts`、`src/engine/doocs/semantic.ts`、`src/engine/doocs/engine.ts`、`scripts/make-v03-phase1-artifact.ts`
- 报告：`V0_3_PHASE1_MARKDOWN_TYPOGRAPHY_REPORT.md`
- 示例：`examples/issue-001.md`、`examples/v03-plain-markdown.md`

## 4. 当前 Baseline 的真实视觉语法（忠实复现于 `01_CURRENT_BASELINE.html`）

| 层 | baseline 现状 |
|---|---|
| Canvas | `#E7E3D8` 米灰工作台（`--bg`），纸面 `#F7F5EF` 居中 740px 列 |
| 身份色 | cobalt `#3157D5`：masthead 圆点、H2 序号、ol 序号、链接、selection |
| H1（封面） | serif 42/33 · 500 · 墨线；masthead-brand mono + kicker + deck + byline |
| H2 | mono 11px cobalt `01` + serif 26px ink + `::after` 60px×1px **ink** 短线 |
| H3 | serif 20px 500，不编号 |
| H4 | **不存在**：渲染器钳制（见 §5.1）；CSS 无 `.article h4` → UA 默认 |
| Quote | serif 19px + 左 1px **ink** 线，无底色，无 `.q-source` 样式（渲染器不产出） |
| Question | 左对齐 + 底部 hairline，无底色 |
| AI Output | 左 3px `--border-strong` 条 + label，无底色 |
| Evidence | 顶部 hairline，无底色 |
| Counterpoint | 顶部 hairline，无底色（与 Evidence 同容器，label 不同） |
| Lab Note | `--surface` 浅底 + 左 2px border |
| Judgment | 居中 + 顶部 1px ink 墨线 + 署名，无底色（签名块） |
| Metric | 居中 serif 84/66px + 无块级边框（cover 自带 border-top `--border-strong`） |

## 5. 本 prompt 与仓库真实状态的冲突

1. **H4 不存在于生产渲染器**。`createV03HeadingRenderer()`（`v03Heading.ts:22`）把标题 depth 钳到 1–3，`####` 强制渲染为 `<h3>`；article.css 无 `.article h4`。任务要求测试文章含 H4 → **最小复现**：生成器把唯一一处 `<h3>为什么区分很重要</h3>` 定向提升为 `<h4>`（两页同一替换，正文仍字节相同；baseline h4 = UA 默认 = 生产 CSS 若遇 h4 的真实表现）。已在 `scripts/build-study.ts` 注释披露。
2. **Quote 来源行无 `.q-source`**。Phase 1 已知限制：渲染器不产出该 class，引文来源与引文同 serif 呈现。两个样张均如此；hybrid CSS 中的 `.q-source` 规则存在但需渲染器支持才生效。
3. **Owner 候选 Primary `#315C5B`（teal）与冻结 cobalt `#3157D5` 冲突**。≤3 视觉角色约束下，本研究把 cobalt 触点（圆点/序号/链接/ol）迁移到 teal。这是**最重的开放决策**（见 §19.1）。
4. **Metric 尺寸冲突**：LOCK §18 浏览器 84px / 微信 44px；任务 §十要求"不要使用巨型数字""confidence 数字保持注记级"。hybrid 把浏览器 specimen 收敛到 44px（`--t-metric: 44px`）。开放决策（§19.2）。
5. **无 AGENTS.md**（任务 §四.1 读取项缺失，如实记录）。

## 6. Owner 授权如何修订（而非删除）旧纪律

原有纪律全部保留为"防泛滥"护栏，本轮只做受控修订：

| 原纪律 | 修订 | 保留的护栏 |
|---|---|---|
| 颜色只占很低优先级（2%） | → 颜色做**角色区分**，覆盖率受控：Primary≈5–8%、Accent≈2% | 黑白做结构；grayscale 自检 |
| 不给全部标题染色、不建蓝色组件框 | → 只给 H2 短线/H4 小标签染色；不建彩色卡片框 | 标题主体仍 ink；无蓝色组件框 |
| Judgment 用墨线不用 accent 背景 | **不变** | Judgment 零彩色面，签名保持 |
| 不用渐变/发光/玻璃拟态 | **不变** | 无渐变/阴影/毛玻璃 |
| 默认不用 card | → 用"左边框 + 极浅表面"作语义角色，不用完整四边框卡片 | 无 box-shadow 卡片层级 |

正确叙事：**对克制风格的受控演进**，不是改成通用公众号模板。

## 7. Baseline ↔ Hybrid 对照（同一文章，字节相同正文）

| 维度 | Baseline | Hybrid | 变化性质 |
|---|---|---|---|
| 文章表面 | `#F7F5EF` | `#FFFDF8` 暖白 | 更亮，导出后微信白底上不显"旧纸" |
| Canvas | `#E7E3D8` | `#EAE4DA` | 预览专用，与导出纸面明确分离 |
| 身份色 | cobalt 蓝 | teal `#315C5B` | 角色迁移（决策 §19.1） |
| H2 短线 | ink | teal | 单一克制彩色信号 |
| H4 | UA 默认 | sans 15px 600 teal 小标签 | 新增层级（需渲染器支持） |
| Quote | ink 左线无底 | Neutral 2px 左线 + Neutral Surface 浅底 | 轻微表面化 |
| Question | 底部 hairline | Primary 2px 左线 + Primary Surface 浅底 + 底部 hairline | "问题入口" |
| AI Output | 3px 灰条 | Neutral 2px 左线 + Neutral Surface 浅底 | 归属更明确 |
| Evidence | 顶部 hairline | Primary 2px 左线 + 顶部 hairline | 角色色（安静） |
| Counterpoint | 顶部 hairline | Accent 2px 左线 + Accent Surface 浅底 | 摩擦/异议（非 error） |
| Lab Note | surface 底 + 左线 | Neutral Surface + 上下 hairline | 研究注记感 |
| Metric | serif 84/66 无块线 | serif 44/40 + 顶部 1px Primary 线 + Primary label | 收敛到微信上限，不抢正文 |
| Judgment | 居中 + ink 墨线 | **同**（签名不变） | 无变化 |

## 8. 最终 palette ↔ 现有 token 映射

| 角色 | 本研究值 | 落地 token | 生产现值 | 关系 |
|---|---|---|---|---|
| Ink | `#252421` | `--ink` | `#191918` | 值微调 |
| Secondary | `#6F6B63` | `--secondary` | `#6A6862` | 值微调 |
| Hairline | `#D8D1C6` | `--hairline` | `#D8D4CA` | 值微调 |
| Primary | `#315C5B` | `--primary`（新） | cobalt `#3157D5` | **替换身份色** |
| Primary Surface | `#F0F6F4` | `--primary-surface`（新） | — | 新增 |
| Accent | `#B45F42` | `--accent`（新） | cobalt | Counterpoint 专用 |
| Accent Surface | `#FBF1EC` | `--accent-surface`（新） | — | 新增 |
| Neutral | `#746F67` | `--neutral`（新） | — | Quote/AI/Lab 边框 |
| Neutral Surface | `#F5F2EC` | `--surface` | `#EFEEE8` | 值微调，复用 |
| Article Surface | `#FFFDF8` | `--paper` | `#F7F5EF` | 值调整 |
| Preview Canvas | `#EAE4DA` | `--bg` | `#E7E3D8` | 值微调，仅预览 |

**兼容**：`--cobalt`/`--deep` 在本研究别名到 `--primary`，使既有引用（圆点、sec-num、ol 序号、链接、fig-label）零改动迁移；若 Owner 否决 teal 迁移，只需改回 `--primary: #3157D5` 一个值（见 §19.1）。

## 9. H1–H4 处理

- **H1**：封面开版不变（serif 42/33 · 无边框 · 无彩色底 · 字号/字重/行高/留白做封面感）。42px < 微信 44px 上限 ✓。
- **H2**：编号（mono 11px **teal**）+ serif 26px ink + 60px×1px **teal** 短线（浏览器 `::after`；微信编译为真实节点/border，见 §13）。不用四边框、不用彩色标题卡。
- **H3**：serif 20px 500 ink，无背景无边框，靠字号/段前距与 H2 分离；**灰度下仍清楚**（H2 有编号+短线，H3 没有）。
- **H4**：**新增**。sans 15px 600 + 轻微 teal；段前 2.6em。灰度下与 H3（20px serif）、正文（16px）靠字号+字重分离。生产渲染器需放开 depth 钳制才可真实产出（§19.3）。
- **灰度层级验证**（`hybrid-desktop-top-grayscale.png`）：H1 大 serif → H2 编号+短线 → H3 中 serif → H4 小粗体，四层无颜色也可辨。✓

## 10. Quote 处理（Neutral）

- `border-left: 2px var(--neutral)` + `background: var(--surface)`（Neutral Surface 极浅）+ serif 19px + 内边距 0.9em/1.1em。
- 不做气泡、不做四边框、不做大引号图标。
- 来源行：`.q-source` 规则已就位，但**渲染器不产出该 class** → 当前样张中来源行与引文同 serif；需 Phase 2 生产渲染器接入（已知限制，如实披露）。

## 11. 七个语义块处理（3 角色，非 7 套语言）

| 块 | 角色 | 处理 | 视觉角色定位 |
|---|---|---|---|
| Question | Primary | 2px Primary 左线 + Primary Surface 浅底 + 底部 hairline | "问题入口"，非 CTA |
| Evidence | Primary | 2px Primary 左线 + 顶部 hairline，**无底色** | 比 Question 更安静 |
| Metric | Primary | 顶部 1px Primary 线 + Primary label + serif 44/40px | 检查锚点，非 dashboard |
| Counterpoint | Accent | 2px Accent 左线 + Accent Surface 浅底 | 摩擦/异议，非 error（非鲜红） |
| AI Output | Neutral | 2px Neutral 左线 + Neutral Surface 浅底 + 真实文本 `AI OUTPUT` | 归属明确，不高于判断 |
| Lab Note | Neutral | Neutral Surface + 上下 hairline，小字号 | 研究注记/边注，非便利贴 |
| Judgment | Signature | **不变**：居中 + ink 墨线 + 署名，零彩色面 | 品牌签名，不统一成卡片 |

证据与反方 `legibility parity`（INVARIANT A2）保持：同容器、同字号、同对齐，仅色与 label 区分。

## 12. 三种背景分离

| 表面 | 值 | 是否导出 |
|---|---|---|
| Preview Canvas | `#EAE4DA`（米奶油） | **否**，仅编辑器预览 |
| Article Surface | `#FFFDF8`（暖白） | **是** |
| Semantic Surface | `#F0F6F4` / `#FBF1EC` / `#F5F2EC` | 是（内联在块上） |

五个问题回答：
1. 哪个背景只属于编辑器预览？→ Preview Canvas（`--bg`），只出现在 `.stage`/body，不进入剪贴板。
2. 哪个会复制到微信？→ Article Surface（`.paper` background）+ Semantic Surface（块内 background）。
3. 微信若过滤最外层背景？→ 文章仍成立：正文 ink 落在白底上可读；语义面是内层块的 inline background，通常保留。
4. 去掉所有 semantic surface 后？→ 边框 + 真实 label + 结构仍清楚（Evidence/Metric 无底色仍可辨）。
5. 发黄/旧纸/知识付费风险？→ `#FFFDF8` 是极浅暖白非黄；语义面是 5–8% 亮度差浅色，非满色块。风险**低**（见 §17 逐项）。

## 13. 微信兼容矩阵（逐信号）

| 视觉信号 | 表达 | 状态 |
|---|---|---|
| 整体暖白底 | `.paper` inline background | `manual verification required`（微信可能剥离最外层底；已做白底回退论证） |
| Semantic Surface（浅底） | inline `background` | `locally verified` + `manual verification required`（浅底类型 REAL-WECHAT-OBSERVED 于 lab-note） |
| border-left 2px 彩色 | inline `border-left` | `expected safe`（border-left 已观察存活）+ manual verify 色相保真 |
| H2 短线（teal `::after`） | 伪元素 | **`known risk`**：微信不渲染伪元素 → 生产编译须拍平为真实节点/border（Phase 6 已知映射，本研究未实现编译，仅 local） |
| H2 序号 / 真实 label | 显式文本 + mono px | `expected safe`（真实文本） |
| Metric 44px | `<p>` 固定 px | `locally verified`（H01 上限已验证 44px 存活；微信编译值本来就是 44px） |
| H4 | inline px + weight | `expected safe`（纯文本样式） |
| serif 标题 | font-family 栈 | `expected safe` + `manual verification required`（Songti/Noto Serif 真机确认） |
| Counterpoint terracotta | hex 背景 + border | `expected safe`（hex 简单值；非 rgba） |
| ol/ul 序号 | CSS counter（local） | `expected safe` after 编译为显式文本（Phase 6 已知映射） |

**诚实边界**：全部 `expected safe` 均为"按 WECHAT_SAFE_PROFILE_V1 推断"，不是真机验证。本地渲染只能算 **`LOCAL_RENDER_VERIFIED`**；真机粘贴 = **`WECHAT_MANUAL_ACCEPTANCE_PENDING`**（见 04 文件）。

## 14. Three-second scan

基于 `hybrid-desktop-top.png` + 全图：3 秒内可识别 主标题（serif 封面）、主要章节（H2 编号+teal 短线）、次级章节（H3/H4）、引用（Neutral 浅底）、作者判断（居中墨线 Judgment）、证据（Primary 左线）、反方（Accent 左线+暖底）、AI 输出（Neutral 浅底 + label）。**PASS**。

## 15. Grayscale

基于真实灰度转换截图（`*-grayscale.png`）：
- H1–H4 层级清楚（size/weight/spacing，非颜色）。**PASS**
- Judgment 仍居中 + 墨线 + serif，品牌签名可辨。**PASS**
- 语义块在灰度下 surface 压缩趋同，**靠真实 label + 边框位置 + 结构区分**（Question 底部 hairline、Evidence 无底色、Counterpoint 左线、Judgment 居中）。**PASS（label 承载）**
- 不依赖颜色承载身份。**PASS**

## 16. Density

390px 移动端（`hybrid-mobile-full.png`）：带底色容器 = Question、AI Output、Counterpoint、Lab Note、Quote 共 5 处，均为极浅浅色 + 左线/上下线，**非四边框卡片**；Metric、Evidence、Judgment 无底色。不构成"连续卡片墙"，正文段落仍占多数，段距 1.4em 维持节奏。**WARN→可接受**：5 处浅底略多于"稀疏"理想，建议生产中可考虑把 Question 或 AI Output 其一去掉底色以增加语法变化（见 §19.4）。

## 17. Marketing-template 风险

- 知识付费海报感：无（无满色大块、无渐变）。PASS
- 企业蓝后台感：无（无高饱和蓝）。PASS
- 营销号高亮感：无（strong 仍 600 不加底色）。PASS
- 七色标签感：无（3 角色，≤3 色相）。PASS
- 大量圆角卡片：无（仅 code 2px radius）。PASS
- 过度强调每段：无（正文仍克制）。PASS
- 单项残余风险：Counterpoint terracotta `#B45F42` 可能被个别读者读成"警告色"——已用非鲜红 + 浅底控制，需 Owner 目检确认不越界。

## 18. Editorial identity

- 仍是独立编辑出版物：serif 封面、mono 标签、墨线 Judgment、issue 系统。**PASS**
- 长期可复用个人品牌：Primary 单一色相贯穿（圆点/序号/短线/块线）比 cobalt+彩块更"系统"。**PASS**
- 围绕判断/证据/反驳的结构：三色角色恰好对应三态（主张=teal、异议=陶土、中性=灰）。**PASS（这是本方向的独特价值）**
- 不是通用 Markdown 主题：无模板味。**PASS**
- 残余风险：teal 绿有一定"咨询/金融"联想，需 Owner 判断是否符合个人品牌。

## 19. 需要 Owner 决定的问题

1. **身份色迁移：cobalt 蓝 → teal `#315C5B`？** 这是最大变更。选 teal（贯彻 Owner 候选色、三角色更统一）；选 cobalt（保留冻结身份，仅新增 Counterpoint 陶土 + 中性灰，Primary 角色借用 cobalt/`#243F9E`）。只需改一个 token 值即可切换。
2. **Metric 收敛：浏览器 84px → 44px？** 任务要求"不巨型、注记级"；LOCK §18 写 84px（微信 44px）。若坚持 84 浏览器表现，则与"confidence 数字不抢正文"矛盾。建议 44–56px 之间再定一档。
3. **H4 是否进入生产？** 需要放开 `v03Heading.ts` depth 钳制（渲染器改动，属生产范围），且 LOCK §4 未定义 H4 字号。若否，H4 保持 UA 默认或弃用。
4. **Question / AI Output 是否去一个底色**，把带底容器从 5 降到 4，提升语法变化（密度 §16）。
5. **Quote 来源行**：是否本轮同时接入 `.q-source` 渲染器产出（生产改动），否则来源行与引文同 serif。

## 20. 生产实施推荐

**暂不进入 production implementation。** 样张与 CSS 仅作为候选视觉系统供 Owner + ChatGPT 评审；评审通过后需：
- 确认 §19 五问；
- 将 hybrid token 合入 `src/styles/tokens.css`（含别名兼容）；
- 将 hybrid-article.css 差异合入 `src/styles/article.css`；
- 渲染器：放开 H4 钳制 + 产出 `.q-source`（两项生产改动，单独排期）；
- 编译器：H2 短线拍平 + ol 序号显式化（Phase 6 已知映射）；
- 真机微信验收（`04_WECHAT_MANUAL_ACCEPTANCE.md`）。

---

## 附 A. 验证记录

| 项 | 结果 |
|---|---|
| 生成命令 | `esbuild build-study.ts --format=cjs` + `node .tmp/build-study.cjs` |
| 正文字节一致性 | 两样张 `<div class="article-body">` 结构字节相同（strip style/title 后全文档 diff = True） |
| 元素覆盖 | 22 项全含；H4 经披露的最小复现注入 |
| CSS 选择器命中 | 7 语义块 + metric `data-salience="inspection_specimen"` 全部命中（DOM 检查） |
| 渲染 | Edge headless 两样张 8 张截图成功；浏览器无 console 报错（headless 静默） |
| 移动端溢出 | 390px 无横向溢出（overflow-wrap 生效，无宽元素） |
| 长标题换行 | masthead 42px 标题 390px 3 行优雅断行 |
| 中英混排 | 正文中英混排正常 |
| 真实文本标签 | AI OUTPUT / EVIDENCE / COUNTERPOINT / JUDGMENT / 提问 / 实验注记 / 来源 / 边界 全部为真实文本 |
| 伪元素承担必要信息 | 仅 H2 短线（已披露为浏览器-only，微信需拍平）；列表计数器同 |
| 测试 | 生产代码未改 → 无新增测试；完整套件另行（见附 B） |
| 未运行项 | 真实微信粘贴（属 Owner 手动验收，04 文件）；`npm run build` 完整构建（见附 B） |

## 附 B. 测试 / 构建说明

- 本轮修改**只新增** `design-studies/` 下文件，未触碰 `src/`、`examples/`、`package.json` → 既有 176 项测试与构建不依赖本目录。
- 已完成：生成器 bundle + 运行（产样张）+ DOM 断言 + 截图 + 灰度转换。
- 为完整性可在评审前执行 `npm test` 与 `npm run build` 确认零回归（未在此轮执行，理由：无生产代码变更、成本/收益不合理）。

## 附 C. 本地 vs 真实微信边界

- `LOCAL_RENDER_VERIFIED`：本报告 §7/§14/§15/§16 的视觉结论基于 Edge headless 截图。
- `WECHAT_MANUAL_ACCEPTANCE_PENDING`：任何"微信里会怎样"的表述均为按 SAFE_PROFILE_V1 的**推断**，未经真机。请按 `04_WECHAT_MANUAL_ACCEPTANCE.md` 逐项验收。
