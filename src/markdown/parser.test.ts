import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './parser'

const FULL = `---
issue: 001
series: JUDGMENT
title: AI 说自己“90% 确定”，到底是什么意思？
date: 2026-08
mode: editorial
next:
  title: 下一期标题
---

:::question
问题一
:::

:::ai-output
raw output
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
System evaluation.
:::

:::metric value="43" label="MINUTES · EXACTLY?"
:::
`

describe('frontmatter', () => {
  it('parses scalar and nested keys', () => {
    const r = parseMarkdown(FULL)
    expect(r.frontmatter.issue).toBe(1)
    expect(r.frontmatter.series).toBe('JUDGMENT')
    expect(r.frontmatter.title).toContain('90%')
    expect(r.frontmatter.mode).toBe('editorial')
    expect(r.frontmatter.next).toEqual({ title: '下一期标题' })
  })
})

describe('semantic blocks', () => {
  it('parses all seven types in order', () => {
    const r = parseMarkdown(FULL)
    const types = r.blocks
      .filter((b) => b.kind === 'semantic')
      .map((b) => (b as { type: string }).type)
    expect(types).toEqual([
      'question',
      'ai-output',
      'judgment',
      'evidence',
      'counterpoint',
      'lab-note',
      'metric',
    ])
  })

  it('parses metric props including quoted label with spaces', () => {
    const r = parseMarkdown(FULL)
    const metric = r.blocks.find(
      (b) => b.kind === 'semantic' && (b as { type: string }).type === 'metric',
    ) as { props: Record<string, string> }
    expect(metric.props.value).toBe('43')
    expect(metric.props.label).toBe('MINUTES · EXACTLY?')
  })

  it('parses lab-note title prop', () => {
    const r = parseMarkdown(FULL)
    const lab = r.blocks.find(
      (b) => b.kind === 'semantic' && (b as { type: string }).type === 'lab-note',
    ) as { props: Record<string, string>; lines: string[] }
    expect(lab.props.title).toBe('CHECKMYCOACH')
    expect(lab.lines[0]).toBe('40 cases')
  })

  it('flags unclosed semantic fences', () => {
    const r = parseMarkdown(':::question\n内容')
    const q = r.blocks[0] as { kind: string; invalid: boolean; lines: string[] }
    expect(q.kind).toBe('semantic')
    expect(q.invalid).toBe(true)
    expect(r.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('base markdown', () => {
  it('parses headings and inline markup', () => {
    const md = '# 标题\n\n正文 **加粗** *斜体* `code` [链接](https://a.b) ![图](img.png)'
    const r = parseMarkdown(md)
    expect(r.blocks[0].kind).toBe('heading')
    const para = r.blocks[1] as { kind: string; inline: Array<{ type: string }> }
    expect(para.kind).toBe('paragraph')
    const kinds = para.inline.map((n) => n.type)
    expect(kinds).toContain('strong')
    expect(kinds).toContain('em')
    expect(kinds).toContain('code')
    expect(kinds).toContain('link')
    expect(kinds).toContain('image')
  })

  it('parses list, quote, code fence, hr, table', () => {
    const md = [
      '- a',
      '- b',
      '',
      '> quote',
      '',
      '```js',
      'const x = 1',
      '```',
      '',
      '---',
      '',
      '| h1 | h2 |',
      '| --- | --- |',
      '| 1 | 2 |',
    ].join('\n')
    const r = parseMarkdown(md)
    expect(r.blocks.map((b) => b.kind)).toEqual(['list', 'blockquote', 'code', 'hr', 'table'])
    const list = r.blocks[0] as { ordered: boolean; items: unknown[] }
    expect(list.ordered).toBe(false)
    expect(list.items).toHaveLength(2)
    const table = r.blocks[4] as { headers: string[]; rows: string[][] }
    expect(table.headers).toEqual(['h1', 'h2'])
    expect(table.rows).toEqual([['1', '2']])
  })
})
