import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdown/parser'
import { toWechatHtml } from './render/clipboard'
import { renderDoocsHtml } from './engine/doocs/engine'
import { validateDocument } from './engine/validate'
import { canDiagnosticFailBuild } from './engine/governance'
import fixtureRaw from '../examples/issue-001.md?raw'

/**
 * Acceptance fixture（examples/issue-001.md）端到端验证（V0.2）。
 * 直接 import 真文件，任何对 fixture 的改动都会在这里显式报错。
 * fixture 是"写得好"的示例：关系有效、认识论 lint 无 error。
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

  it('contains claim + all seven semantic blocks', () => {
    const r = parseMarkdown(fixtureRaw)
    const types = r.blocks
      .filter((b) => b.kind === 'semantic')
      .map((b) => (b as { type: string }).type)
    expect(types).toEqual([
      'claim',
      'question',
      'ai-output',
      'metric',
      'evidence',
      'counterpoint',
      'judgment',
      'lab-note',
    ])
  })

  it('has no parser diagnostics', () => {
    const r = parseMarkdown(fixtureRaw)
    expect(r.diagnostics).toEqual([])
  })

  it('has valid referential integrity (no stale/missing relations)', () => {
    const { tokens } = renderDoocsHtml(fixtureRaw)
    const diags = validateDocument(tokens)
    expect(diags.filter((d) => d.code.startsWith('relation-'))).toEqual([])
  })

  it('raises no epistemic-lint errors on the well-formed fixture', () => {
    const { tokens } = renderDoocsHtml(fixtureRaw)
    const diags = validateDocument(tokens)
    expect(diags.filter((d) => d.severity === 'error')).toEqual([])
    expect(diags.every((d) => !canDiagnosticFailBuild(d))).toBe(true)
  })

  it('renders the specimen metric with coverage mark and the judgment with attribution', () => {
    const { html } = renderDoocsHtml(fixtureRaw)
    expect(html).toContain('data-salience="inspection_specimen"')
    expect(html).toContain('被检查对象 · 非结论')
    expect(html).toContain('judgment-author')
    expect(html).toContain('— Max')
    // 支持关系解析为当前 claim 文本，不降级。
    expect(html).toContain('AI 输出的精确数字，没有携带足够的依据、误差与边界信息。')
    expect(html).not.toContain('sblock-degraded')
  })

  it('renders to wechat html without leaking fences', () => {
    const html = toWechatHtml(parseMarkdown(fixtureRaw), 'editorial')
    expect(html).toContain('43')
    expect(html).toContain('JUDGMENT')
    expect(html).toContain('NEXT')
    expect(html).not.toContain(':::')
  })
})
