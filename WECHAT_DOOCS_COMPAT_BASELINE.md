# WECHAT_DOOCS_COMPAT_BASELINE

> 目的：以 vendored/上游 doocs/md 为基线，记录其**兼容性知识**（HTML 结构、CSS primitives、剪贴板规范化）。
> **不复制 doocs 的视觉设计**，只借用其"微信能安全处理什么"的知识。
>
> 证据来源分级：
> - `VERIFIED IN VENDORED CODE` = 本项目 `src/engine/doocs/vendor/` 里逐行核验
> - `VERIFIED IN MIGRATION REPORT` = `ENGINE_MIGRATION_REPORT.md` 文档化
> - `UPSTREAM KNOWLEDGE` = doocs/md 上游仓库知识（本项目未 vendored 的 theme CSS 部分，标注为推断）

## 1. Doocs 微信剪贴板规范化（VERIFIED IN VENDORED CODE）

管线：`renderer HTML → juice 内联 → modifyHtmlStructure → solveWeChatImage → sanitizeSvgsForWeChat → ClipboardItem`。

| 变换 | 函数（vendored） | 做什么 | 对 primitive 的含义 |
|---|---|---|---|
| 列表结构修复 | `modifyHtmlStructure`（clipboard-dom.ts） | 把 `li > ul/ol` 提升到 `li` 之后（`insertAdjacentElement('afterend')`） | 微信把嵌套列表包进 li 会错；doocs 显式修正 DOM 结构 |
| 图片尺寸 | `solveWeChatImage`（clipboard-dom.ts） | `img` 的 `width/height` **属性** → 内联 `style.width/height: Npx` | 微信可能忽略 width 属性；doocs 转成 inline style |
| SVG 净化 | `sanitizeSvgsForWeChat`（wechat-svg.ts） | marker 展开、presentation 属性内联、深色墨色→`currentColor`、显式像素尺寸（上限 `WECHAT_MAX_WIDTH_PX=677`）、去 `defs/id/class/clip-path/style` | 微信对 SVG 的 defs/id 支持差；doocs 全部拍平为像素尺寸 + currentColor |
| 内联 | juice（clipboard.ts） | 把 CSS 内联到每个元素 | 微信剥离 `<style>`/class，只认 inline style |

**关键：doocs 的规范化是"结构性"的（列表/图片/SVG 的 DOM 修正），不是"样式 primitive 转换"。** 它不把 flex/gap/clamp 转成别的；它假设 juice 内联后的 inline style 能存活。它规避的是结构/DOM 级风险，不是 CSS 特性级风险。

## 2. Doocs 的 HTML 结构与 CSS primitives（VERIFIED IN VENDORED CODE + UPSTREAM KNOWLEDGE）

### 2.1 语义块结构（VERIFIED：alert.ts）

- GFM alert：`<blockquote class="markdown-alert markdown-alert-{variant}"><p class="markdown-alert-title">标题</p>正文</blockquote>`。
- 结构 = **blockquote 容器 + 段落**。无 flex、无 grid、无嵌套 flex。靠 `border`/`background` 呈现（inline style）。

### 2.2 常规 markdown（UPSTREAM KNOWLEDGE —— doocs/md 的 article theme 未 vendored）

doocs 的文章输出以**块级 + 传统 primitives** 为主：

- 排版：`font-size`（px/em）、`font-weight`、`line-height`、`text-align`。
- 间距：`margin`、`padding`（px/em）。
- 边框：`border`、`border-left`（引用）、`border-radius`（小）。
- 背景：`background`（pre/code/引用）。
- 颜色：`color`、`background-color`、主题变量 `--md-primary-color`。
- 布局：`display:block` / `inline`；**核心文章内容几乎不用 flex**。
- 图片：`max-width:100%`。
- 表格：`table` + `border-collapse` + 单元格边框。

> 这是推断（theme CSS 未 vendored），但与本项目迁移时 vendoring 决策一致（doocs 的正文是"标准 markdown 排版"，复杂布局交给 mermaid/plantuml SVG 与 alert 容器）。

### 2.3 doocs 主题变量处理

- 上游 alert.ts 的 `var(--md-primary-color)` 在本项目被改为 `currentColor`（THIRD_PARTY_NOTICES 记录）——因为本项目无该变量。
- doocs 的微信导出同样走 `?inline` 主题解析（迁移报告文档化：CSS 变量导出期替换），与 Max 一致。

## 3. Max Editorial 引入的、doocs 正文通常回避的 primitives

对照 audit（`WECHAT_CSS_CURRENT_USAGE.md`），Max 在 doocs 正文不使用的位置引入了：

| Primitive | Max 使用位置 | Doocs 正文使用情况 | 风险假设（待实测，非结论） |
|---|---|---|---|
| `display:flex` | evidence-claim / evidence-row / evidence-rows / sblock-meta | 基本不用 | 微信富文本编辑器/网页视图对 flex 的处理未知 |
| `gap`（flex gap） | 同上 | 不用 | flexbox `gap` 是较新的 CSS 特性，旧 webview 可能忽略 |
| `flex-wrap` | sblock-meta | 不用 | 同上 |
| `align-items:baseline` | evidence-row/claim | 不用 | flex 对齐在微信里可能丢失 → 行内错位 |
| `clamp()` + `vw` | metric-value | 不用（数字以固定 px 呈现） | 现代 CSS；老 webview 可能回退或忽略 |
| `calc()` | paper font-size / h3 margin | 部分 | 通常安全，但 em×num 需实测 |
| `min-width:6em` | evidence-label | 不用 | em 相对宽在微信是否按字准 |
| em 相对 `letter-spacing` | 全部 label/meta | 少量 | em 字距在微信 webview 的行为 |
| `white-space:nowrap/pre-wrap` | meta / ai-output | pre-wrap 用于代码 | nowrap 溢出风险；pre-wrap 换行保留 |
| `text-transform:uppercase` | sblock-label | 少量 | 中文无影响；英文 label 是否保留 |
| 属性选择器 `[data-salience]` | metric | 不用 | juice 已内联；data 属性残留 HTML |

**基线结论（推断，需实测）：** Max 的 V0.2 把"现代 CSS 特性密集"的组件（evidence 对照列表用 flex+gap+baseline、metric 用 clamp+vw）放进了微信粘贴产物；doocs 自己的正文在这些位置只用块级 + margin/border/font-size。**这不是说 flex/clamp 在微信必坏**——只是它们落在 doocs 已验证兼容的范围之外，属于本 spike 的高优先级探针对象。

## 4. Doocs 的 677px 内容宽约束（VERIFIED：wechat-svg.ts）

`WECHAT_MAX_WIDTH_PX = 677`：doocs 对 SVG 显式像素化并封顶 677px。含义：微信正文列宽 ~677px；任何超宽对象需要显式控制。Max 的 metric 用 `vw`/`clamp`，没有等效的像素封顶——这可能是大数字在微信超宽的候选风险（**待实测**）。

## 5. 对 Max 的启示（不做设计改动，仅记录）

1. Max 的微信风险面集中在 **flex 布局族 + 现代 CSS 单位（clamp/vw/gap/calc）**——不在 doocs 已验证范围。
2. doocs 的规范化不做样式 primitive 降级——所以"微信坏了 flex 会怎样"只能靠真机探针回答（本 spike 的探针正是为此）。
3. 结构类风险（列表嵌套、图片尺寸、SVG）doocs 已有成熟处理且 Max 已复用同一管线。
4. 若探针证明某 primitive 在微信中不稳定，修复方向是**该 primitive 的降级替代**（如 flex→inline-block/table、clamp→px 封顶），而不是重做 V0.2 设计。
