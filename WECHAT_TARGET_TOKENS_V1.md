# WECHAT_TARGET_TOKENS_V1

> 微信目标编译器的固定 px 排版/间距 token。
> **实现启发式，不是心理学真理**（§10 禁令：不得声称"最优"）。基于真实微信渲染 + 现有正文基准 + 移动宽度。
> 全部固定值，无 clamp/vw/em 相对依赖。移动垂直阅读为基准。

## 字号（固定 px）

| Token | px | 说明 |
|---|---|---|
| `body` | 16 | 正文基准（微信文章常见基准） |
| `metadata` | 13 | 来源/状态/边界/注记 |
| `label` | 11 | 块 label（字距 3px） |
| `h3` | 19 | 子结构 |
| `h2` | 24 | 结构导航 |
| `judgment` | 21 | 判断体（serif，比正文重但不似标题） |
| `metric-specimen` | 44 | 检查对象大数字（≈2.75× body；固定值，禁 clamp/vw） |
| `metric-result` | 22 | 报告结果（受限，不放大） |
| `metric-reference` | 19 | 上下文参考（中低） |
| `masthead-title` | 28 | 品牌标题（serif 保留） |
| `code` | 14 | 代码 |

## 行高

| Token | 值 | 说明 |
|---|---|---|
| `line-height-body` | 1.8 | 长文阅读 |
| `line-height-heading` | 1.4 | 标题 |
| `line-height-dense` | 1.7 | 块体/代码 |

## 间距（固定 px，垂直节奏）

| Token | px | 认知作用（§11.1 语义） |
|---|---|---|
| `paragraph-gap` | 18 | 段落连续性 |
| `h2-before` | 34 | 结构边界 |
| `h2-after` | 12 | 与内容亲近 |
| `block-before` | 24 | 语义块与上文分离 |
| `block-after` | 18 | 回程（不过大） |
| `major-pause` | 44 | PAUSE 特权（judgment/specimen） |
| `metadata-gap` | 12 | 元数据块间 |
| `internal-gap` | 8 | 块内元素分组 |
| `image-gap` | 18 | 图与文 |
| `caption-gap` | 6 | 图注贴近图 |
| `paper-pad` | 16 | 纸面左右内边距 |

## 边框

| Token | 值 | 说明 |
|---|---|---|
| `rule-ink` | `1px solid #171612` | judgment 顶部墨线（V0.2.1 单规则） |
| `rule-border` | `1px solid #e2e0d8` | 发丝线（evidence/counterpoint/question） |
| `rule-strong` | `1px solid #c6c4ba` | 引用条/分隔 |
| `quote-bar` | `3px solid #c6c4ba` | AI OUTPUT 引用条 |
| `radius` | `2px` | 代码小圆角 |

## 颜色（不变更色板；固定值）

| Token | 值 |
|---|---|
| `ink` | `#171612` |
| `muted` | `#7c7a72` |
| `faint` | `#b2b0a7` |
| `surface-subtle` | `#f5f4ef` |
| `border` | `#e2e0d8` |
| `border-strong` | `#c6c4ba` |
| `link` | `#576b95` |
| `ai-body` | `#3b3a36` |

## 字体栈

| Token | 栈 |
|---|---|
| `sans` | -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif |
| `serif` | Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif |
| `mono` | ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace |

## 诚实边界

- 44px specimen 是**目标特定设计启发式**，不是心理学最优；真实微信渲染后若 44 过小/过大再调。
- 所有值可由真机验收后回填修正，但**不允许**用 clamp/vw/em 依赖代替固定值。
