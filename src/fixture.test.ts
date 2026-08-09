import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdown/parser'
import { toWechatHtml } from './render/clipboard'
import fixtureRaw from '../examples/issue-001.md?raw'

/**
 * Acceptance fixture（examples/issue-001.md）端到端验证。
 * 直接 import 真文件，任何对 fixture 的改动都会在这里显式报错。
 */
describe('examples/issue-001.md fixture', () => {
  it('parses frontmatter', () => {
    const r = parseMarkdown(fixtureRaw)
    expect(r.frontmatter.issue).toBe(1)
    expect(r.frontmatter.series).toBe('JUDGMENT')
    expect(r.frontmatter.title).toContain('我本来只是想检查 AI 的健身建议')
    expect(r.frontmatter.next).toEqual({
      title: 'AI 说自己“90% 确定”，到底是什么意思？',
    })
  })

  it('contains all seven semantic blocks', () => {
    const r = parseMarkdown(fixtureRaw)
    const types = r.blocks
      .filter((b) => b.kind === 'semantic')
      .map((b) => (b as { type: string }).type)
    expect(types).toEqual([
      'question',
      'ai-output',
      'metric',
      'judgment',
      'evidence',
      'counterpoint',
      'lab-note',
    ])
  })

  it('has no parser diagnostics', () => {
    const r = parseMarkdown(fixtureRaw)
    expect(r.diagnostics).toEqual([])
  })

  it('renders to wechat html without leaking fences', () => {
    const html = toWechatHtml(parseMarkdown(fixtureRaw), 'editorial')
    expect(html).toContain('43')
    expect(html).toContain('JUDGMENT')
    expect(html).toContain('NEXT')
    expect(html).not.toContain(':::')
  })
})
