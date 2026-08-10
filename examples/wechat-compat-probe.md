---
issue: 999
series: COMPAT
title: WeChat Compatibility Probe
date: 2026-08
mode: editorial
tagline: 每个测试块在粘贴后截图，对照 artifact 判定 primitive 存活情况。
---

**此文档不是文章，是兼容性探针。** 每个编号块测试一个 CSS/layout primitive。复制 → 粘贴进微信公众号编辑器 → 截图 → 对照 `artifacts/wechat-compat-probe.html` 判定。

## T01 BORDER-TOP

反方与证据共享顶部发丝线。下方是反方块（border-top）：

:::counterpoint
T01 · 顶部发丝线应出现在本块上方。
:::

## T02 BORDER-LEFT

引用条（border-left）。AI OUTPUT 是 3px 引用条：

:::ai-output source="示例模型 · 2026-08" status="raw" id="t02"
“建议每天恰好进行 43 分钟训练。”

Confidence: 90%
:::

普通引用（blockquote，2px 左边线）：

> T02b · 普通引用的左边线应可见。
> —— 某来源

## T03 BORDER-BOTTOM

QUESTION 底部发丝线：

:::question id="t03"
T03 · 提问块底部应有发丝线。
:::

## T04 BORDER-RADIUS

行内 code 应有 2px 圆角与浅底：`src/fitness/plan.py`；fenced code 同样：

```python
# T04 · code 块圆角 + 背景
plan = suggest(duration=43)
```

## T05 FLEX

证据的 claim 引用行是 flex（`display:flex`）：

:::claim id="t05"
T05 · flex 容器：这一行的 label 与文本。
:::

:::evidence id="ev-t05" supports="t05"
SUPPORTED
flex 行左对齐、label 固定宽
:::

## T06 FLEX + GAP

AI OUTPUT 的 meta 行是 `flex` + `gap`（来源与状态左右并排且留空隙）：

:::ai-output source="这是一个很长的模型来源名称，用于测试 flex+gap+nowrap" status="verified" id="t06"
T06 · meta 行应为 flex，来源与状态之间有 gap。
:::

## T07 FLEX-WRAP

meta 行 `flex-wrap:wrap`：来源很长时应换行而不是溢出。

:::ai-output source="一个超长的来源字符串，超长超长超长超长超长超长超长超长，测试 flex-wrap 是否换行" status="excerpt" id="t07"
T07 · 超长来源应换行，不应横向溢出。
:::

## T08 FLEX-DIRECTION COLUMN

证据 rows 是 `flex-direction:column`：

:::evidence id="ev-t08" supports="t05"
SUPPORTED
第一行
NOT SUPPORTED
第二行
:::

## T09 ALIGN-ITEMS BASELINE

证据行的 label 与 value 基线对齐：

:::evidence id="ev-t09" supports="t05"
SUPPORTED
30–60 分钟，中等强度，每周 3–5 次
:::

## T10+T11 CLAMP FONT SIZE + VW UNIT

METRIC specimen 用 `clamp(3.1em, 7vw, 4.5em)`（含 vw）：

:::metric value="43" label="T10 · CLAMP + VW" origin="model_output" display_function="inspection_specimen" specimen_source="上述输出" inspection_question="T10 · 数字应大而清晰" exact_value_visible="true" source="示例模型" method="样例" boundary="仅限样例" id="t10"
:::

## T12 CALC

纸面 `font-size: calc(16px * 1)` 与 h3 `calc(var(--heading-top) * 0.85)`：

### T12 · 三级标题的 top margin 由 calc 得出

## T13 MEDIA QUERY

`@media (max-width:480px)` 若存活，窄屏下纸面无左右边框。**此条无法仅靠粘贴判定**——在矩阵中单独记录管线是否丢弃 media query。

## T14 WHITE-SPACE NOWRAP

meta 的 `white-space:nowrap`：

:::ai-output source="来源" status="raw" id="t14"
T14 · 状态与来源不应折行（nowrap）。
:::

## T15 WHITE-SPACE PRE-WRAP

AI OUTPUT body `white-space:pre-wrap`：换行应保留：

:::ai-output source="模型" status="raw" id="t15"
第一行
第二行（应换行显示）
:::

## T16 TEXT-ALIGN CENTER

JUDGMENT 与 METRIC 居中：

:::judgment id="t16"
T16 · 居中判断。
:::

## T17+T18 LETTER-SPACING + TEXT-TRANSFORM

label 用 `letter-spacing:0.28em` + `text-transform:uppercase`：

:::question id="t17"
T17 · 「提问」label 的字距。
:::

## T19 MARGIN + PADDING

语义块的外边距与内边距（em）：

:::evidence id="ev-t19" supports="t05"
SUPPORTED
T19 · 块的 margin/padding 应保持节奏。
:::

## T20 EM RELATIVE

em 间距随字号缩放。切换 NORMAL 模式（15.5px）后整体收窄：

:::judgment id="t20"
T20 · em 相对缩放。
:::

## T21 MIN-WIDTH

证据 label `min-width:6em`：

:::evidence id="ev-t21" supports="t05"
SUPPORTED
T21 · label 固定最小宽度。
:::

## T22 TABLE

表格 + `.table-wrap`（横向滚动容器）：

| 维度 | 结果 |
| --- | --- |
| 校准度 | 需要改进 |
| 置信度 | 90%（未校准） |
| 误差信息 | 缺失 |

## T23 FIGURE + FIGCAPTION

标题图片 → `figure + figcaption`：

![T23 · 图注](data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='480'%20height='80'%3E%3Crect%20x='60'%20y='30'%20width='300'%20height='14'%20fill='%23c6c4ba'/%3E%3Ccircle%20cx='120'%20cy='37'%20r='9'%20fill='%23171612'/%3E%3C/svg%3E "T23 · 点估计示意")

## T24 INLINE CODE

`margin-of-error` 是术语（普通样式），`src/fitness/plan.py` 是代码（inline code 样式）。

## T25 BACKGROUND

lab-note 弱背景 + 左边线：

:::lab-note title="T25" id="t25"
40 cases

System evaluation.
Not a human study.
:::

## T26 FONT-FAMILY

serif（判断/数字）、mono（label/数据）、sans（正文）：

:::judgment id="t26"
T26 · serif 判断。
:::

## T27 FONT-SIZE PX vs EM

label 10px（px）vs 正文 em：

:::question id="t27"
T27 · 「提问」label 是 10px，正文是 em。
:::

## T28 LINE-HEIGHT

正文 1.8 行高：

一段用于观察行高的正文。行高 1.8 应让中文长段有松快的节奏，同时保持紧凑。这段文字会折行多次，以便观察行距是否在粘贴后被微信修改。

## T29 FONT-WEIGHT

**600 加粗**与 500 判断体：

:::judgment id="t29"
T29 · 判断体 500。
:::

## T30 COLOR

墨色正文、muted 次级、faint 弱标签、链接色：

[链接色示例](https://example.com) 与正文墨色对比。

## T31 INLINE-BLOCK / BOX-SHADOW / OPACITY / REM / JUSTIFY-CONTENT

这些 primitive **不出现**在 Max 生产输出中（V0.2 base article.css 未用）。微信对它们的通用处理属于附加探针——见生成 HTML 的「EXTRA PRIMITIVE HARNESS」区段（该区段绕过 markdown 渲染器，仅用于理解微信通用行为，不属于 Max artifact）。
