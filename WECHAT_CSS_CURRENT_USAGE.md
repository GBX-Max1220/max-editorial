# WECHAT_CSS_CURRENT_USAGE — V0.2 剪贴板 artifact primitives 盘点

> Spike 环境：分支 `spike/wechat-compat-matrix`，基线 = `feat/cognitive-editorial-v02` HEAD（V0.2，不含 V0.2.1 polish）。
> 本文档只**盘点**最终复制 artifact 实际用到的 CSS/layout primitive，**不假设** WeChat 是否支持。
> 每个 primitive 给出：出现的选择器 / 具体值 / 类型分类。支持性判定见 `WECHAT_COMPAT_MATRIX.md`。

## 0. 剪贴板管线（最终 artifact 的 CSS 从哪来）

```
src/styles/article.css（var(--x) 未解析）
  → src/engine/doocs/theme.ts getClipboardCss():
      extractVars(tokens.css) → resolveVars(article.css)   ← 所有 var(--x) 替换为具体值
      + PAPER_OVERRIDE (.paper { border:none; box-shadow:none; background:transparent; padding:0; margin:0; max-width:none })
  → 插入 <style> → juice 内联到每个元素（inlinePseudoElements:true, preserveImportant:true, resolveCSSVariables:false）
  → modifyHtmlStructure / solveWeChatImage / sanitizeSvgsForWeChat
```

关键推论（管线事实，非 WeChat 行为）：

1. **CSS 变量不进入 artifact**：`var(--x)` 在导出期全部被替换成具体值（px/em/字体栈）。产物里没有 `var()`。
2. **em 仍是相对单位**：`1.5em`、`0.72em` 等**保持 em**，随元素 font-size 缩放——WeChat 是否按元素字号正确解析 em 需实测。
3. **media query 是否存活待验证**：juice 默认 `preserveMediaQueries:false`——`article.css` 里的 `@media (max-width:480px)` 很可能在 juice 阶段被丢弃。需探针确认（T-* 见下）。
4. **`[data-salience]` 属性选择器**：juice 用 css-select 匹配并内联，但 `data-salience` 属性本身也保留在 HTML 元素上（juice 不删属性）。
5. **`:last-child` 等结构伪类**：juice 只处理伪元素（inlinePseudoElements）；`:last-child` 由 css-select 匹配，是否可靠需实测。
6. **PAPER_OVERRIDE 移除纸面 chrome**：border/shadow/padding/背景在粘贴产物中不存在（这是设计意图，不是损失）。

---

## 1. Typography

| Primitive | 值（解析后） | 出现位置（选择器） |
|---|---|---|
| `font-family` | sans 栈 / serif 栈 / mono 栈（PingFang SC、Songti SC、Consolas 等） | `.article`（sans）、`.sblock-judgment .sblock-body`（serif）、`.masthead-title`（serif）、`.sblock-label`（mono）、`.metric-value`（serif）、`.sblock-ai-output .sblock-body`（sans）、`pre/code`（mono）、`.evidence-label`（mono） |
| `font-size` | `16px` / `17px`（纸面基准）、`calc(16px * 1)`、em（`1.5em` h2、`1.18em` h3、`1.12em` question、`1.24em` judgment、`0.98em` ai-output/blockquote、`0.82em` lab-note、`0.86em` code、`0.72em` meta/label、`0.68em` metric-label、`0.92em` table）、px（`10px` label、`13px` pre、`14px` footer-tagline）、`clamp(3.1em, 7vw, 4.5em)` metric-value | 全 article.css |
| `font-weight` | `600`、`500` | h1-h3/strong/th（600）、judgment body（500）、metric-value（600） |
| `line-height` | `1.8`（body）、`1.4`（heading）、`1.7`/`1.75`/`1.6`/`1.35` 等 | paper、h、blockquote、pre、各 sblock-body、masthead-title |
| `letter-spacing` | em（`0.28em` label、`0.34em` metric-label、`0.32em` series、`0.24em` brand、`0.22em` evidence-label、`0.18em` author、`0.16em` evidence-label、`0.14em` claim-label、`0.04em` sblock-meta、`0.06em` anchor、`0.005em`/`-0.005em`/`-0.02em`/`0.01em` 数字） | 各类 label、meta、author、title |
| `font-style` | `italic` | `em` 元素 |
| `text-transform` | `uppercase` | `.sblock-label` |
| `text-decoration` | `none`、`underline`（a 的 border-bottom 模拟） | `.article a` |

## 2. Spacing

| Primitive | 值 | 位置 |
|---|---|---|
| `margin` | 全 em（`1.15em` paragraph、`2.2em 0 0.7em` h2、`2.8em 0` section、`2.5em 0` sblock（V0.2 base `--block-gap:2.5em`）、`2.6em 1em` judgment、`3em 0` metric）、px（`0`、`auto`、`20px 0 10px` masthead-title）、`margin: var(--block-gap) 0` | 全 article.css |
| `padding` | em（`1.5em 1.7em` block、`2.4em 0.6em` question、`18px 20px`→em？）、px（`0.12em 0.35em` code、`14px 16px` pre、`16px 18px` pre-unknown） | sblock、pre、code |
| `gap` | em（`0.5em`、`1em`、`0.4em 1em`） | `.evidence-claim`、`.evidence-row`、`.sblock-meta` |
| `margin-bottom` / `margin-top` | em、px 混合 | 各类子元素 |

## 3. Borders

| Primitive | 值 | 位置 |
|---|---|---|
| `border`（四边） | `1px solid` | paper（被 PAPER_OVERRIDE 移除）、code、pre、unknown |
| `border-top` | `1px solid`（ink/border） | judgment（ink）、evidence/counterpoint（border）、hr、table、question-major |
| `border-left` | `2px`/`3px solid` | blockquote（2px）、ai-output（3px）、lab-note（2px） |
| `border-bottom` | `1px solid` | question、th、table、a、judgment（ink） |
| `border-radius` | `2px` | code、pre |
| `border-collapse` | `collapse` | table |
| `box-shadow` | 纸面阴影 | paper（被 PAPER_OVERRIDE 移除，不进入粘贴产物） |

## 4. Layout

| Primitive | 值 | 位置 |
|---|---|---|
| `display` | `block`（img、table、figure、sblock）、`flex`（evidence-claim、evidence-row、evidence-rows、sblock-meta）、`inline`（默认 span） | 多处 |
| `flex-direction` | `column` | `.evidence-rows` |
| `flex-wrap` | `wrap` | `.sblock-meta` |
| `gap`（flex） | `0.5em`/`1em`/`0.4em 1em` | evidence-claim/row、sblock-meta |
| `align-items` | `baseline` | evidence-claim、evidence-row |
| `flex`（子项） | `none` | `.evidence-label`、`.evidence-claim-label` |
| `justify-content` | **未使用**（V0.2 base article.css 无 justify-content） | — |
| `vertical-align` | `top` | td |

## 5. Sizing

| Primitive | 值 | 位置 |
|---|---|---|
| `width` | `100%` | paper、table |
| `max-width` | `var(--paper-width)`=760px（paper，被 PAPER_OVERRIDE 移除）、`30em`（question body） | paper、question |
| `min-width` | `6em` | `.evidence-label` |
| `calc()` | `calc(16px * 1)`（paper font-size）、`calc(var(--heading-top) * 0.85)`（h3） | paper、h3 |
| `clamp()` | `clamp(3.1em, 7vw, 4.5em)` | `.metric-value` |
| `vw` 单位 | `7vw`（clamp 内） | `.metric-value` |
| `em` | 全系统 | 全 article.css |
| `rem` | **未使用** | — |
| `px` | `10px`/`13px`/`14px`/`16px`/`17px` 等 | label、pre、paper 基准 |

## 6. Text

| Primitive | 值 | 位置 |
|---|---|---|
| `text-align` | `center`（judgment、metric、figure-caption、metric-label）、`left`（th/td） | 多处 |
| `white-space` | `pre-wrap`（ai-output body、unknown）、`nowrap`（meta-source/status） | 多处 |
| `overflow-wrap` | `break-word` | `.article` |
| `word-break` | `normal` | `.article` |
| `text-transform` | `uppercase` | label |

## 7. Visual

| Primitive | 值 | 位置 |
|---|---|---|
| `background` | `var(--surface)`、`var(--surface-subtle)` | paper（PAPER_OVERRIDE 移除）、pre、code、lab-note |
| `color` | 墨色 `#171612`、muted `#7c7a72`、faint `#b2b0a7`、ai-body `#3b3a36`、link `#576b95`、`rgba(87,107,149,.35)` | 全系统 |
| `opacity` | **未显式使用**（V0.2 base article.css） | — |
| `box-shadow` | 纸面阴影（PAPER_OVERRIDE 移除） | paper |

## 8. Other

| 项 | 详情 |
|---|---|
| CSS 变量 `var()` | 导出期全部解析；artifact 内**无残留** |
| media queries | `@media (max-width:480px)`（paper 去左右边框）——**juice preserveMediaQueries:false，存活与否待探针验证** |
| 属性选择器 | `[data-salience='inspection_specimen']`（metric 放大）、`[data-mode='editorial'/'normal']` |
| 结构伪类 | `:last-child`（p:last-child） |
| 嵌套结构 | `section > div > div/span`（sblock）、`figure > img+figcaption`、`blockquote`、`pre>code`、`ul/ol>li`、`table>thead/tbody>tr>th/td`、`.table-wrap>table` |
| 表格 | `table` + `.table-wrap`（overflow-x:auto） |
| 伪元素 | 无 `::before/::after`（V0.2 base） |

## 9. 高风险测试候选（来自任务，先测，非结论）

`display:flex`、`flex-wrap`、`gap`、`align-items`、`flex-direction`、`clamp()`、`vw`、`calc()`、media query、`white-space:nowrap`、`text-transform:uppercase`、em 相对单位、`letter-spacing`、`border-left`（引用条）、`min-width`。
