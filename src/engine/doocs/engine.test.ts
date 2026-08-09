import { describe, expect, it } from 'vitest'
import { doocsEngine } from './engine'

const SAMPLE = `:::question
问题
:::

:::ai-output
输出
:::

:::judgment
判断
:::

:::evidence
SUPPORTED
30–60 min
:::

:::counterpoint
反方
:::

:::lab-note title="CHECKMYCOACH"
40 cases
:::

:::metric value="43" label="MINUTES · EXACTLY?"
:::
`

describe('doocs engine', () => {
  it('parses frontmatter (scalar + nested)', () => {
    const r = doocsEngine.render('---\ntitle: 标题\nissue: 2\nnext:\n  title: 下一期\n---\n正文')
    expect(r.frontmatter.title).toBe('标题')
    expect(r.frontmatter.issue).toBe(2)
    expect(r.frontmatter.next).toEqual({ title: '下一期' })
  })

  it('renders all seven semantic blocks with stable classes', () => {
    const r = doocsEngine.render(SAMPLE)
    for (const cls of [
      'sblock-question',
      'sblock-ai-output',
      'sblock-judgment',
      'sblock-evidence',
      'sblock-counterpoint',
      'sblock-lab-note',
      'sblock-metric',
    ]) {
      expect(r.html, cls).toContain(cls)
    }
    expect(r.structure.semanticBlocks).toHaveLength(7)
  })

  it('parses inner markdown inside semantic blocks', () => {
    const r = doocsEngine.render(':::judgment\n**加粗** 与 `code` 与 [链接](https://x.com)\n:::\n')
    expect(r.html).toContain('<strong>加粗</strong>')
    expect(r.html).toContain('<code>code</code>')
    expect(r.html).toContain('<a href="https://x.com">链接</a>')
  })

  it('renders unknown semantic blocks gracefully with a diagnostic', () => {
    const r = doocsEngine.render(':::weird\n内容\n:::\n')
    expect(r.html).toContain('sblock-unknown')
    expect(r.structure.semanticBlocks[0].unknown).toBe(true)
    expect(r.diagnostics.length).toBeGreaterThan(0)
  })

  it('flags unclosed semantic blocks', () => {
    const r = doocsEngine.render(':::judgment\n没有闭合')
    expect(r.structure.semanticBlocks[0].invalid).toBe(true)
    expect(r.diagnostics.length).toBeGreaterThan(0)
  })

  it('escapes raw html tokens (xss guard)', () => {
    const r = doocsEngine.render('<script>alert(1)</script>')
    expect(r.html).not.toContain('<script>')
    expect(r.html).toContain('&lt;script&gt;')
  })

  it('exposes structure for the compatibility checker', () => {
    const md = [
      ':::lab-note title="X"',
      '40 cases',
      ':::',
      '',
      '![图](file:///C:/x.png)',
      '',
      '| a | b | c | d | e | f | g |',
      '|---|---|---|---|---|---|---|',
      '|1|2|3|4|5|6|7|',
    ].join('\n')
    const r = doocsEngine.render(md)
    expect(r.structure.semanticBlocks[0].props.title).toBe('X')
    expect(r.structure.images).toContain('file:///C:/x.png')
    expect(r.structure.tableCols).toContain(7)
    expect(r.blockCount).toBeGreaterThan(0)
  })
})
