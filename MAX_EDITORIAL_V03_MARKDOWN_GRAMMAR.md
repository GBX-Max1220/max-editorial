# MAX EDITORIAL V03 — MARKDOWN → VISUAL GRAMMAR

> **状态：SPEC ONLY。** 标准 Markdown 构造 → V0.3 视觉角色。
> **P0：一篇零自定义语义块的纯 Markdown 文章必须已经是出版级。** 语义块是 figure；正文是有身份的 ground。
> 数值与 token 见 `MAX_EDITORIAL_V03_ART_DIRECTION_LOCK.md`；微信编译见 `MAX_EDITORIAL_V03_WECHAT_MAPPING_SPEC.md`。

## 映射表

| Markdown | 元素 | V0.3 视觉角色 | 关键 token | 微信编译 |
|---|---|---|---|---|
| `#`（frontmatter title） | cover | 封面开版（非 `<h1>`）：kicker + serif 标题 + deck + 墨线 + byline | serif 42px/mobile 33px · lh 1.3 · 500 | block 流 + 固定 px |
| `##` | H2 | section 转换：`01` 编号（渲染器自动）+ serif 标题 + 短墨线 | sec-num mono 11px ls .32em **cobalt**；serif 26px 500；3.4em top | 序号显式文本；墨线编译为 border-top/div |
| `###` | H3 | 子结构，安静，**不编号** | serif 20px 500 · 2.2em top | block + px |
| 段落 | p | 阅读主体 | 16px · lh 1.85 · 1.4em 段距 · max-width 36em | block + px |
| `**strong**` | strong | claim 关键字，有意为之 | weight 600 | font-weight |
| `*em*` | em | 语气微变 | italic | font-style |
| `>` 引用 | blockquote | 编辑引文：左墨线 + serif + 来源行 | serif 19px · border-left 1px ink · .q-source mono | border-left + serif px |
| `1.` 有序列表 | ol | 同层枚举，`01/02/03` 序号 | 显式序号 mono 11px cobalt（微信） | 显式文本序号 |
| `-` 无序列表 | ul | 同层枚举，`—` 标记 | `—` 前缀（secondary） | 显式文本标记 |
| `---` | hr | 章节大分隔（major pause 廉价替代），≤2 | border-top 1px ink · 3em | border-top |
| `[link](url)` | a | "通向外部"信号 | cobalt + 细下划线 | 内联 cobalt + border-bottom |
| `` `code` `` | inline code | 字面值（文件名/命令），非术语 | mono .86em · surface 底 · hairline 边框 | mono px + 背景 |
| ```` ``` ```` fence | pre | 代码块，属刊物 | mono 13px · surface · padding 19px 21px · 横滚 | mono px + 背景 + 横滚 |
| 表格 | table | 出版表格：无 box/竖线 | 上下墨线 + th mono 小标 · 数字右对齐 | table 保留（接受微信重排） |
| `![alt](src "title")` | figure | figure 语言：`FIG / 01` + 图 + 说明 + 来源 | fig-label mono · img max-width 100% · caption 13px | img + 显式 caption 文本 |

## P0 断言：纯 Markdown 已出版级

- **层级**：cover 开版 → 编号 H2 → 安静 H3 → 稳定正文节奏。
- **节奏**：1.4em 段距 + 3.4em section 间隙 = 长文不喘不挤。
- **身份**：serif 标题 + mono 标签 + cobalt 只出现在序号与链接。
- **可读**：measure 36em、正文 16px/lh 1.85、中英自然间距。
- **非默认感**：引用是编辑引文（serif+来源）、列表是编辑编号（01/—）、表格是出版表格（无 spreadsheet）。

## 注意事项

- 技术术语（calibration、margin of error）用普通样式；真正的代码/字面值才用 inline code（沿用 V0.2 纪律）。
- strong 每段 ≤1–2 处；em 不整段。
- 列表项内不长 prose（>2 行拆段）。
- 表格默认禁用（数据用对照列表）；仅真实 tabular data 用表。
- 纯 markdown 文章不应依赖任何语义块才"好看"——这是本 grammar 的验收下限。
