# DESIGN TOKENS — V0.1

所有 token 在 `src/styles/tokens.css`。换主题只需改颜色块；spacing 用 `em` 为单位，随纸面字号整体缩放。

## 颜色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#eceae5` | 预览区外框 / 页面底色 |
| `--surface` | `#fdfcf9` | 纸面 |
| `--surface-subtle` | `#f5f4ef` | 代码 / evidence / ai-output 次级面 |
| `--fg` | `#171612` | 墨色正文 |
| `--muted` | `#7c7a72` | 次级文字 |
| `--faint` | `#b2b0a7` | 弱标签 |
| `--border` | `#e2e0d8` | 发丝线 |
| `--border-strong` | `#c6c4ba` | 更实在的线 |
| `--accent` | `#a03a24` | **唯一 accent token**。换主题只改这一个 |

**Accent 纪律**：只在顶栏圆点、选区高亮、复制按钮悬停出现。判断块用墨线，不用 accent 背景。

## 字体栈（安全字体，不加载任何字体文件）

- `--sans`：系统 sans + PingFang SC / Hiragino / Microsoft YaHei / Noto Sans CJK SC
- `--serif`：Georgia + Songti SC / Noto Serif CJK SC / Source Han Serif SC / SimSun（用于 masthead 标题、judgment、metric 大数字）
- `--mono`：系统 mono（用于所有 label、证据数据、lab-note 数字、编辑器）

## 字号 / 行高

| Token | 值 | 说明 |
| --- | --- | --- |
| `--body` | 16px | 纸面正文基准 |
| EDITORIAL | 17px | `data-mode="editorial"` 时纸面字号 |
| NORMAL | 15.5px | `data-mode="normal"` 时纸面字号 |
| `--lh-body` | 1.85 | 长文阅读的关键 |
| `--lh-heading` | 1.4 | |

标题 / 间距全部用 `em`，随纸面字号缩放（WECHAT/MOBILE 视口通过 `--scale: 0.94` 整体收窄）。

## Spacing tokens（禁止组件自己写 margin）

| Token | 值 (em) | 用途 |
| --- | --- | --- |
| `--paragraph-gap` | 1.15em | 段落间距 |
| `--heading-top` / `--heading-bottom` | 2.1em / 0.7em | 标题上下 |
| `--section` | 2.8em | 章节 / masthead / footer 分隔 |
| `--block-gap` | 2.5em | 语义块与相邻内容的间距 |
| `--block-pad` | 1.5em 1.7em | 语义块内边距（紧凑） |
| `--block-pad-lg` | 2.4em 0.6em | 语义块内边距（宽松，question） |
| `--metric-size` | `clamp(3.1em, 7vw, 4.5em)` | 超大米字 |

NORMAL 模式下通过 CSS 覆盖把 `--block-gap`、judgment / metric 字号压紧——同一个系统，两种密度。

## 排版优先级（给设计校准用）

Typography 25% · Semantic components 25% · Spacing 20% · Editor UX 20% · Clipboard 8% · Color 2%。

第一眼标准：白色纸面、深墨字、一根发丝线、超大数字、克制标签、editorial 网格。没有渐变、没有发光、没有玻璃拟态、没有机器人图标。
