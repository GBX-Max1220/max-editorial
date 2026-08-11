# V0.3 PHASE 1 — MARKDOWN TYPOGRAPHY IMPLEMENTATION REPORT

> **状态：生产实现 Phase 1 完成。** 设计 token + 纯 Markdown 排版（P0 基座）。
> 覆盖 LOCK §2–§17 的 Level 1；H2 编号（D1）本阶段一并落地（渲染层真实文本）。
> 不实现任何语义块重构 / Metric / Judgment / 编辑器 UI / 新编译器架构（严格非目标）。

## 1. 起始分支 / commit

- 起始分支：`design/v03-art-direction-study` @ `286d2ba`
  （含五份锁定 V0.3 文档：ART_DIRECTION_LOCK / WECHAT_MAPPING / MARKDOWN_GRAMMAR / VISUAL_ACCEPTANCE / IMPLEMENTATION_PLAN）
- 实现分支：`feat/v03-phase1-markdown-typography`（自 286d2ba 新建，未动 main）
- main 仍指向 `65bb7d4`（V0.1 原型），未触碰。

## 2. 变更文件

| 文件 | 变更 |
|---|---|
| `src/styles/tokens.css` | 重写为 V0.3 canonical token（色板/三角色字体/固定 px 字阶/行高/字距/垂直节奏/paper canvas），保留 V0.2 别名对齐值 |
| `src/styles/article.css` | 基础 Markdown 排版重写为 V0.3（Level 1）；语义块区保留（经别名自动对齐 V0.3 色），masthead/footer 改 V0.3 封面开版 |
| `src/styles/base.css` | `::selection` 从旧 accent 红改为 cobalt |
| `src/styles/app.css` | 移除废弃的 `.vp-desktop .paper` 旧 token 覆盖块 |
| `src/engine/doocs/engine.ts` | marked heading renderer 接入 V0.3 H2 编号（渲染层注入，真实文本） |
| `src/engine/legacy/renderHtml.ts` | legacy heading 接入同一编号（保持 A/B 结构等价） |
| `src/engine/shared/v03Heading.ts` | **新增**：`createV03HeadingRenderer()` 共享编号工厂（按文档重置） |
| `src/engine/wechat/compiler.ts` | masthead 对齐 V0.3 封面结构（cobalt 圆点 + deck） |
| `src/engine/wechat/safeCss.ts` | 基础 Markdown + masthead/footer 收敛到 V0.3 token（全固定 px、无禁止 primitive）；metric H01 44px 不动 |
| `src/render/Article.tsx` | Masthead 加 cobalt 圆点 + cover deck（tagline） |
| `src/engine/v03-phase1.test.ts` | **新增**：10 个 Phase 1 聚焦测试 |
| `examples/v03-plain-markdown.md` | **新增**：纯 Markdown fixture（零语义块） |
| `scripts/make-v03-phase1-artifact.ts` | **新增**：视觉 artifact 生成器（esbuild CJS 打包运行） |
| `artifacts/v03-phase1-*.{html,png}` | **新增**：视觉 artifact + 截图（见 §10） |

## 3. Tokens 实现

- **Color（LOCK §2）**：`--paper #F7F5EF`、`--ink #191918`、`--secondary #6A6862`、`--hairline #D8D4CA`、`--surface #EFEEE8`、`--cobalt #3157D5`、`--deep #243F9E`；辅助 `--faint #B7B4AB`。
- **Typographic roles（LOCK §3）**：`--serif`（Georgia/Songti SC/Noto Serif CJK…）、`--sans`（PingFang/Microsoft YaHei…）、`--mono`（ui-monospace/Consolas…）。
- **Type scale（LOCK §4，固定 px）**：title 42/33(mobile)、h2 26、h3 20、body 16、lede 17.5、quote 19、judgment 23/21(mobile)、metric 84/66(mobile)、label 10–11、note 13、next 20；行高 body 1.85 / heading 1.35 / h3 1.45 / quote 1.8；字距 label 0.32em / title -0.005em。
- **Rhythm（LOCK §5）**：`--s-para 1.4em`、`--s-h2-top 3.4em`、`--s-h2-bottom 1.1em`、`--s-h3-top 2.2em`、`--s-block 2.5em`、`--s-pause 4.2em`、`--s-metric 3.2em`、`--s-cover 42px`、`--s-footer 4em`。
- 旧 V0.2 spacing/metric 名称保留为别名（值对齐 V0.3），使既有语义块规则零改动即收 V0.3 色与节奏。

## 4. Markdown 元素实现（Level 1）

| 元素 | V0.3 表达 |
|---|---|
| 封面/标题（frontmatter → masthead） | kicker（mono 次级）+ serif 标题（42/33px）+ deck（tagline）+ byline（date）+ 1px 墨线 |
| H2 | `01/02/03` cobalt mono 编号（渲染层真实文本）+ serif 26px ink 标题 + 60px 短墨线（`::after`） |
| H3 | serif 20px 500，不编号，间距双重轻于 H2 |
| 段落 | 16px · lh 1.85 · 段距 1.4em · measure 36em |
| strong / em | weight 600 克制强调 / italic |
| 链接 | cobalt + 细下划线 rgba(49,87,213,.35) |
| blockquote | 编辑引文：serif 19px + 左 1px 墨线 + 来源行样式（`.q-source` 待渲染器产出） |
| 无序列表 | `—` 前缀（secondary），`list-style:none` |
| 有序列表 | `01/02/03` mono 11px cobalt（CSS counter；微信编译器将显式文本化） |
| 水平线 | 1px ink，3em，editorial pause（lint ≤2 沿用） |
| 行内 code | mono .86em + surface 底 + hairline 边框 |
| fenced code | mono 13px · surface 底 · hairline 边框 · 19/21px 内边距 · 横滚 |
| table | 出版表格：无 box/竖线，上下墨线，mono 表头，hairline 行线 |
| image / figure | 干净间距 + 居中；`FIG / 01` 语言随 Phase 2 figure 扩展 |

## 5. H2 编号实现（冻结 D1）

- **位置**：渲染层（HTML 字符串注入），不在 parser AST——不污染 lint / relations / claimMap。
- **机制**：`createV03HeadingRenderer()`（`src/engine/shared/v03Heading.ts`）按文档重置闭包计数；marked heading renderer（doocs）与 legacy AST renderer 共用，保证两引擎结构等价（regression 保持绿）。
- **规则**：仅 H2 编号 `01/02/03…`；H3 不编号；intro（首个 H2 前）无 `00`；语义块（`:::`）不参与编号；作者不手输。
- **产物**：`<h2><span class="sec-num">01</span><span class="sec-title">标题</span></h2>`——**真实文本**，浏览器预览与微信编译产物同源获得；微信编译经 juice 内联为固定 px 样式。无 CSS counter 依赖（测试断言无 `counter(` 泄漏）。
- 视觉：数字视觉次要、cobalt；标题 ink serif（LOCK §7）。

## 6. 浏览器 → 微信映射含义

按 `WECHAT_MAPPING_SPEC`，对每个新 production 样式分类：

| 样式 | 分类 | 说明 |
|---|---|---|
| H2 编号（`sec-num` 文本） | **直接微信安全** | 真实文本 + 固定 px 内联；微信产物含显式数字 |
| H2 短墨线（`::after` 60px） | **浏览器-only**（Phase 6 已知映射） | 映射：编译为 border-top/真实节点；本阶段微信产物无短线，核心身份不依赖它 |
| 有序列表 `01/02/03`（CSS counter） | **浏览器-only**（Phase 6 已知映射） | 源结构化 `ol/li`；微信暂用默认标记；Phase 6 编译为显式序号文本 |
| 无序列表 `—`（`::before`） | **浏览器-only** | 微信暂用默认列表标记 |
| 封面 masthead（serif + mono + 墨线） | **可编译** | block 流 + 固定 px；编译产物已含（见 §4 编译截图） |
| 表格出版风格 | **可编译（受微信重排限制）** | 仅真实数据用表（沿用 V0.2 政策） |
| 中文 serif（标题/H2/引用） | **可编译，保真风险中** | 需真机确认 Songti/Noto Serif 呈现；Phase 7 验收 |

核心 Markdown 外观全部由 font-family/font-size/font-weight/line-height/letter-spacing/margin/padding/border/background/text-align/block flow/显式文本表达，无 flex/gap/clamp/vw/@media/nowrap/var 依赖（`checkWechatPolicy` 0 error）。

## 7. 视觉 QA 结果（实际渲染 + 逐项检查）

视口：375px / 430px / desktop 预览 / 微信编译产物 375px / 短标题 375px。截图见 §10。

| 项 | 结论 |
|---|---|
| 标题 | ✅ 编辑封面（kicker+serif+deck+byline+墨线）；长标题 375px 优雅 3 行断行；短标题干净；desktop serif 42px 2 行 |
| H2 | ✅ 01/02/03/04 cobalt + serif + 短墨线，制造清晰 section 转换 |
| H3 | ✅ 明显轻于 H2（字号+间距双重），不编号，不误当 H2 |
| 段落 | ✅ 16px/1.85/1.4em，3000 字级长读舒适，无 PPT 空白 |
| strong/em | ✅ 克制；weight 600 不加高亮；em italic 中文不别扭 |
| 引用 | ✅ serif + 左墨线，编辑引文；来源行待渲染器 `.q-source`（已知限制，见 §9） |
| 列表 | ✅ `—` / `01·02·03` cobalt，非 Word/默认 |
| 代码/表格 | ✅ 同属刊物：quiet surface 代码、出版表格无 spreadsheet |
| 页级节奏 | ✅ 阅读散文与结构暂停（H2/横线/图）交替 |
| 颜色 | ✅ cobalt 稀疏：圆点 + H2 序号 + 有序列表序号 + 链接；无蓝色组件框 |
| 整体 | ✅ **不像工程原型** |

微信编译产物（375px）逐项通过：masthead serif 标题 + cobalt 编号 + 固定 px 排版一致存活；H2 短线缺失为已声明浏览器-only 项。

## 8. 测试 / tsc / build

- `npm test`：**176 passed**（18 文件）。新增 `v03-phase1.test.ts` 10 项：H2 编号序列、H3 不递增、intro 无 00、语义块不参与编号、fixture 渲染（零语义块/元素齐全/无 `:::` 泄漏）、浏览器与微信产物编号均为真实文本、无 `counter(`、legacy=doocs 编号等价、fixture 编译 policy-clean、V0.2.3 metric H01 44px 与 judgment 单墨线不回归。
- `npm run build`：`tsc --noEmit` ✅ + `vite build` ✅（dist 产出；chunk >500kB 警告为既有项）。
- `checkWechatPolicy`：编译产物 0 error（测试断言，含新 fixture 与 issue-001）。

## 9. 已知限制

1. **blockquote 来源行**（`.q-source`）：样式已就位，但渲染器不为纯 Markdown 产出该 class——引用来源目前与引文同 serif 呈现。Phase 2 引用/figure 扩展时接入。
2. **H2 短墨线**：浏览器-only（`::after`）；微信编译产物无短线。Phase 6 按已知映射展开为真实节点/border。
3. **列表编号**：浏览器用 CSS counter（V0.3 视觉）；微信编译暂为默认列表标记。Phase 6 显式文本化。
4. **中文 serif 移动端呈现**：微信端 Songti/Noto Serif 是否呈现需真机确认（映射保真风险"中"），Phase 7 验收回填。
5. **Metric 组件**：未实现（Phase 3）。仅浏览器 metric 字号 token 对齐 V0.3 刻度（84/66px），编译产物仍走 V0.2.3 H01 44px（已验证不变）。
6. **真实微信粘贴验收**：本阶段为结构 + 截图级 QA；真机粘贴验收属 Phase 7。

## 10. Screenshots / Artifact 路径

- 主 artifact：`artifacts/v03-phase1-plain-markdown.html`（fixture 全文，浏览器 V0.3 样式）
- 短标题样本：`artifacts/v03-phase1-title-variant.html`
- 微信编译产物页：`artifacts/v03-phase1-wechat-compiled.html`（内联样式自包含，生产输出本身）
- 截图：`artifacts/v03-phase1-mobile-375.png`（375×9000 全篇）、`artifacts/v03-phase1-mobile-430.png`、`artifacts/v03-phase1-desktop.png`、`artifacts/v03-phase1-title-variant-375.png`、`artifacts/v03-phase1-wechat-compiled-375.png`、`artifacts/v03-phase1-app-desktop.png`（vite preview 集成 app）
- 生成器：`scripts/make-v03-phase1-artifact.ts`（`esbuild … --format=cjs` + node 运行）

## 11. 最终门

**"这还像工程原型吗？"**

**NO。**

纯 Markdown fixture（`examples/v03-plain-markdown.md`，零自定义语义块）在 375px / 430px / desktop 下呈现为独立刊物式出版级排版：封面开版 + 编号 H2 section 节奏 + 安静 H3 + 稳定长文正文 + 编辑引文 + 编辑式列表 + 出版表格 + 刊物化代码。Cobalt 稀疏，黑白色做结构，grayscale 自检成立。
