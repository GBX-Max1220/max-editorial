# WECHAT_COMPAT_MATRIX

> 状态：**探针就绪，尚未真机测试**。所有 Verdict 默认 `UNKNOWN`。
> 判定规则：自动化/管线测试**不能授予 SAFE**。只有一次真实微信粘贴（截图）+ 可选 copy-back 才能落 Verdict。
> 填法：`WeChat Visual` 栏填观察（"保留/丢失/变形/溢出"），`Copy-Back DOM` 栏贴 `COMPAT` 面板 diff 结论，然后据此给 Verdict。
> 列：Primitive | Pre-Paste（管线事实） | WeChat Visual | Copy-Back DOM | Verdict | Notes。

Verdict 取值：`SAFE` / `SAFE_WITH_CONSTRAINT` / `UNSTABLE` / `STRIPPED` / `UNKNOWN`。

## A. Typography

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `font-family`（sans/serif/mono 栈） | 内联到元素；字体栈完整 |  |  | UNKNOWN | 中文 serif 移动端栈受限（T26）；微信是否用本地字体回退 |
| `font-size`（px） | 内联（10px/13px/17px） |  |  | UNKNOWN | label 10px 是否被微信最小字号钳制 |
| `font-size`（em） | 内联（1.5em/1.24em…） |  |  | UNKNOWN | em 相对链在微信是否保真（T27） |
| `font-size`（`clamp(3.1em,7vw,4.5em)`） | 内联到 metric-value |  |  | UNKNOWN | 现代 CSS；老 webview 回退行为（T10） |
| `font-weight`（600/500） | 内联 |  |  | UNKNOWN | 粗体是否保留 |
| `line-height`（1.8/1.7…） | 内联 |  |  | UNKNOWN | 微信是否改写行高（T28） |
| `letter-spacing`（em） | 内联 |  |  | UNKNOWN | em 字距；label 是否被压（T17） |
| `font-style:italic` | 内联 |  |  | UNKNOWN | 斜体保留 |
| `text-transform:uppercase` | 内联到 label |  |  | UNKNOWN | 英文 label 大写化是否保留（T18） |
| `text-decoration`（a） | 内联 |  |  | UNKNOWN | 链接下划线 |

## B. Spacing

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `margin`（em 多值） | 内联 |  |  | UNKNOWN | 块间距节奏是否保留（T19） |
| `padding`（em/px） | 内联 |  |  | UNKNOWN | 块内边距 |
| `gap`（flex） | 内联到 flex 元素 |  |  | UNKNOWN | 高优先级；flex-gap 是较新特性（T06） |

## C. Borders

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `border-top` | 内联（judgment 墨线、evidence/counterpoint 发丝线） |  |  | UNKNOWN | 顶部规则是否保留（T01） |
| `border-left` | 内联（ai-output 3px、blockquote/lab-note 2px） |  |  | UNKNOWN | 引用条是否保留（T02） |
| `border-bottom` | 内联（question 底部线） |  |  | UNKNOWN | 底部规则（T03） |
| `border-radius` | 内联（2px） |  |  | UNKNOWN | 圆角（T04） |
| `border-collapse` | table 内联 |  |  | UNKNOWN | 表格边框 |

## D. Layout（高风险）

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `display:flex` | 内联到 evidence-claim/row、sblock-meta |  |  | UNKNOWN | 高优先级；微信富文本对 flex 的处理（T05） |
| `flex-direction:column` | evidence-rows |  |  | UNKNOWN | 纵向 flex（T08） |
| `flex-wrap:wrap` | sblock-meta |  |  | UNKNOWN | 换行行为（T07） |
| `align-items:baseline` | evidence-row/claim |  |  | UNKNOWN | 基线对齐丢失 → 行内错位（T09） |
| `flex:none`（子项） | evidence-label |  |  | UNKNOWN | 固定 label 宽 |
| `display:block` / `inline` | img/table/默认 |  |  | UNKNOWN | 常规 |
| `vertical-align:top` | td |  |  | UNKNOWN | 单元格 |

## E. Sizing

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `width:100%` | paper/table |  |  | UNKNOWN | 表格宽度 |
| `max-width`（百分比） | img |  |  | UNKNOWN | 图片适配 |
| `min-width:6em` | evidence-label |  |  | UNKNOWN | em 相对宽（T21） |
| `calc()` | paper font-size、h3 margin |  |  | UNKNOWN | 计算值微信解析（T12） |
| `vw` 单位（clamp 内） | metric-value |  |  | UNKNOWN | 视口单位（T11） |
| `px` / `em` / `rem` | 见上 |  |  | UNKNOWN | rem 不在 Max 产物（见 E-extra） |

## F. Text

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `text-align:center` | judgment/metric |  |  | UNKNOWN | 居中是否保留（T16） |
| `white-space:nowrap` | meta-source/status |  |  | UNKNOWN | 长来源不折行 → 溢出风险（T14/T07） |
| `white-space:pre-wrap` | ai-output body |  |  | UNKNOWN | 换行保留（T15） |
| `overflow-wrap:break-word` | .article |  |  | UNKNOWN | 长英文断字 |
| `word-break` | .article |  |  | UNKNOWN | 断行策略 |

## G. Visual

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `background`（surface-subtle） | pre/code/lab-note |  |  | UNKNOWN | 浅底色（T25） |
| `color`（hex/rgb/rgba） | 全系统 |  |  | UNKNOWN | 深色墨色在微信暗色模式可读性 |
| `opacity` | **不在 Max 产物** |  |  | — | 附加 harness E03 |

## H. Other

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| CSS 变量 `var()` | 导出期已解析，产物无残留 | — | — | — | 管线事实，无需实测 |
| media query | **存活在 `<style>` 标签**（juice 不剥离） |  |  | UNKNOWN | 微信是否执行 `<style>` 里的 @media（T13）；对 .paper 无实际影响（PAPER_OVERRIDE 已内联去边框） |
| 属性选择器 `[data-salience]` | juice 已内联；data 属性残留 HTML |  |  | UNKNOWN | 属性本身对视觉无关 |
| 表格 `<table>` + `.table-wrap` | 内联；wrap overflow-x |  |  | UNKNOWN | 表格结构是否保留（T22） |
| `figure + figcaption` | img title → figure |  |  | UNKNOWN | 图注（T23） |
| 嵌套 `section>div>span` | sblock 结构 |  |  | UNKNOWN | 块结构是否被扁平化（copy-back 重点观察） |
| `blockquote` | ai-output 降级路径、引用 |  |  | UNKNOWN | 引用条 |
| `pre>code` | fenced code |  |  | UNKNOWN | 代码块 |

## I. Extra harness（Max 产物之外，微信通用行为参考）

| Primitive | Pre-Paste | WeChat Visual | Copy-Back DOM | Verdict | Notes |
|---|---|---|---|---|---|
| `inline-block` | 附加 harness E01 |  |  | UNKNOWN | 微信通用行为 |
| `box-shadow` | E02 |  |  | UNKNOWN |  |
| `opacity` | E03 |  |  | UNKNOWN |  |
| `rem` | E04 |  |  | UNKNOWN |  |
| `justify-content:space-between` | E05 |  |  | UNKNOWN |  |
| `vw` 单独 | E06 |  |  | UNKNOWN |  |
| `max-width:%` | E07 |  |  | UNKNOWN |  |
| `float` | E08 |  |  | UNKNOWN |  |

---

## 填写说明（真实测试后）

1. **WeChat Visual**：粘贴后截图，肉眼判定"保留 / 丢失 / 变形 / 溢出 / 换行错误"。逐项对照探针 T01–T31。
2. **Copy-Back DOM**：微信里 Ctrl+A / Ctrl+C → 粘贴进 `COMPAT` 面板 → DIFF → 把该 primitive 的 finding（removed/rewritten/normalized/flattened）抄入。
3. **Verdict**：`SAFE`（保留且值一致）/ `SAFE_WITH_CONSTRAINT`（保留但需注意边界，如长值）/ `UNSTABLE`（形态丢失或错位）/ `STRIPPED`（被移除或拍平）。`UNKNOWN` 只用于未测项。
4. 同一 primitive 若在探针多个 T-id 出现，以最差表现落 Verdict，并在 Notes 注明。
