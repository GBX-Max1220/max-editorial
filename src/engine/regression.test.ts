// @vitest-environment jsdom
/**
 * A/B 回归：legacy 引擎 vs doocs 引擎，对同一输入的 HTML 做结构等价断言。
 *
 * 比较方法（文档于 ENGINE_MIGRATION_REPORT.md）：
 *  - textContent 折叠空白后相等 —— 文本内容一致；
 *  - 元素 tag 计数相等 —— 块级/行内结构一致；
 *  - blockquote 内的 <p> 包裹被解包后比较（marked 会加 <p>，V0.1 不加，视觉等价）。
 * 无像素比较；这是 headless 下对"视觉等价"最接近的代理。
 */

import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { createEditorialEngine } from './index'
import fixtureRaw from '../../examples/issue-001.md?raw'

const legacy = createEditorialEngine('legacy')
const doocs = createEditorialEngine('doocs')

const ALL_BLOCKS = `:::question
问题一，用 **加粗** 测试
:::

:::ai-output source="模型 X" status="raw"
raw output line
:::

:::judgment
判断一
判断二
:::

:::evidence
SUPPORTED
30–60 min

NOT SUPPORTED
exactly 43 min
:::

:::counterpoint
反方观点
:::

:::lab-note title="CHECKMYCOACH"
40 cases
15 routed

System evaluation.
:::

:::metric value="43" label="MINUTES · EXACTLY?"
:::
`

const FIXTURES: Record<string, string> = {
  'issue-001': fixtureRaw,
  basic: `# 一级标题

正文段落，**加粗**、*斜体*、\`行内代码\` 与 [链接](https://example.com)。

## 二级标题

> 引用内容。

- 无序 A
- 无序 B

1. 有序一
2. 有序二

![配图](img.png)

\`\`\`js
const x = 1
\`\`\`

---

| 列一 | 列二 |
| --- | --- |
| 甲 | 1 |
`,
  'semantic-all': ALL_BLOCKS,
  'semantic-nested': `:::judgment
**加粗**、\`code\`、[链接](https://x.com) 与 ![图](img.png)
第二行内容
:::

:::ai-output
keep **raw** markdown literal
:::
`,
  'long-mixed': `这是一段很长的中英混排文本，English mixed with Chinese，目的是验证换行与排版。${'loremipsum'.repeat(6)} 继续。
`,
}

function normalize(html: string) {
  const doc = new JSDOM(`<body>${html}</body>`).window.document
  // marked 会在 blockquote 内包 <p>，V0.1 不包；解包后两者文本一致。
  doc.querySelectorAll('blockquote > p').forEach((p) => {
    const bq = p.parentElement!
    bq.insertBefore(doc.createTextNode(' '), p)
    while (p.firstChild) bq.insertBefore(p.firstChild, p)
    bq.removeChild(p)
  })
  // 文本比较去掉所有空白：两个引擎在块边界（p/section/li 之间）插入的换行不同，
  // 但视觉上等价；内容本身的差异仍会被捕获。
  const text = (doc.body.textContent || '').replace(/\s+/g, '')
  const counts: Record<string, number> = {}
  doc.body.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase()
    counts[tag] = (counts[tag] || 0) + 1
  })
  return { text, counts }
}

describe('engine regression: legacy vs doocs', () => {
  for (const [name, src] of Object.entries(FIXTURES)) {
    it(`visually-equivalent structure for "${name}"`, () => {
      const a = normalize(legacy.render(src).html)
      const b = normalize(doocs.render(src).html)
      expect(b.text, 'text content').toBe(a.text)
      expect(b.counts, 'element structure').toEqual(a.counts)
    })
  }

  it('emits the same semantic block classes in both engines', () => {
    const src = FIXTURES['semantic-all']
    for (const engine of [legacy, doocs]) {
      const doc = new JSDOM(`<body>${engine.render(src).html}</body>`).window.document
      for (const cls of [
        'sblock-question',
        'sblock-ai-output',
        'sblock-judgment',
        'sblock-evidence',
        'sblock-counterpoint',
        'sblock-lab-note',
        'sblock-metric',
      ]) {
        expect(doc.querySelectorAll(`.${cls}`).length, cls).toBe(1)
      }
    }
  })
})
