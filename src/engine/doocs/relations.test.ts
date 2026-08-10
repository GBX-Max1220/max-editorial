import { describe, expect, it } from 'vitest'
import { renderDoocsHtml } from './engine'
import { hashSemanticText, validateRelations } from './relations'
import type { SemanticBlockToken } from './semantic'

function semanticBlocks(md: string): SemanticBlockToken[] {
  return renderDoocsHtml(md).tokens.filter(
    (t): t is SemanticBlockToken => t.type === 'semanticBlock',
  )
}

const CLAIM_A = '模型输出的 90% 置信度需要检查。'
const claimMd = (text: string = CLAIM_A) => `:::claim id="claim-a"\n${text}\n:::`
const claimHash = (text: string = CLAIM_A) => hashSemanticText(semanticBlocks(claimMd(text))[0])

describe('validateRelations', () => {
  it('accepts a valid supports relation with matching target hash', () => {
    const md = [
      claimMd(),
      '',
      `:::evidence id="ev-1" supports="claim-a" supports_hash="${claimHash()}"`,
      'SUPPORTED',
      '30-60 min',
      ':::',
    ].join('\n')
    expect(validateRelations(renderDoocsHtml(md).tokens)).toEqual([])
  })

  it('accepts a valid challenges relation with matching target hash', () => {
    const md = [
      claimMd(),
      '',
      `:::counterpoint id="cp-1" challenges="claim-a" challenges_hash="${claimHash()}"`,
      '精确表达并不必然误导。',
      ':::',
    ].join('\n')
    expect(validateRelations(renderDoocsHtml(md).tokens)).toEqual([])
  })

  it('reports a missing target', () => {
    const md = `:::evidence id="ev-1" supports="ghost" supports_hash="${claimHash()}"\nSUPPORTED\nx\n:::`
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags).toHaveLength(1)
    expect(diags[0].code).toBe('relation-target-missing')
    expect(diags[0].severity).toBe('error')
  })

  it('refuses to resolve an ambiguous target (duplicate ids)', () => {
    const md = [
      claimMd('文本 A'),
      '',
      claimMd('文本 B'),
      '',
      `:::evidence id="ev-1" supports="claim-a" supports_hash="${claimHash()}"`,
      'SUPPORTED',
      'x',
      ':::',
    ].join('\n')
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags.some((d) => d.code === 'relation-target-ambiguous')).toBe(true)
    expect(diags[0].severity).toBe('error')
  })

  it('reports an incompatible target type', () => {
    const md = [
      ':::lab-note id="note-1"',
      '40 cases',
      ':::',
      '',
      ':::evidence id="ev-1" supports="note-1" supports_hash="x"',
      'SUPPORTED',
      'x',
      ':::',
    ].join('\n')
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags.some((d) => d.code === 'relation-target-type-invalid')).toBe(true)
  })

  it('reports a stale target as re-review, not as false', () => {
    const storedHash = claimHash('原始文本 A')
    const md = [
      claimMd('修改后的文本 B'),
      '',
      `:::evidence id="ev-1" supports="claim-a" supports_hash="${storedHash}"`,
      'SUPPORTED',
      'x',
      ':::',
    ].join('\n')
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags).toHaveLength(1)
    expect(diags[0].code).toBe('relation-target-stale')
    expect(diags[0].severity).toBe('warning')
    // stale 不是"关系为假 / 无效 / unsupported"
    expect(diags[0].message).not.toMatch(/false|无效|unsupported/i)
  })

  it('reports unversioned relations (legacy content without snapshot)', () => {
    const md = [claimMd(), '', ':::evidence id="ev-1" supports="claim-a"', 'SUPPORTED', 'x', ':::'].join('\n')
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags.some((d) => d.code === 'relation-target-unversioned')).toBe(true)
    expect(diags[0].severity).toBe('warning')
  })

  it('hashes are formatting-insensitive', () => {
    const bold = semanticBlocks(':::claim id="c"\n**AI confidence**\n:::')[0]
    const plain = semanticBlocks(':::claim id="c"\nAI confidence\n:::')[0]
    expect(hashSemanticText(bold)).toBe(hashSemanticText(plain))
  })

  it('does not mutate tokens', () => {
    const md = [claimMd(), '', ':::evidence id="ev-1" supports="claim-a"'].join('\n')
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    validateRelations(tokens)
    expect(JSON.stringify(tokens)).toBe(before)
  })

  it('renders the live claim text in the claim-ref line when a supports relation resolves', () => {
    const md = [
      ':::claim id="claim-a"',
      'AI 输出的 90% 置信度需要检查。',
      ':::',
      '',
      ':::evidence id="ev-1" supports="claim-a"',
      'SUPPORTED',
      'x',
      ':::',
    ].join('\n')
    const html = renderDoocsHtml(md).html
    expect(html).toContain(
      '<div class="evidence-claim"><span class="evidence-claim-label">支持：</span><span class="evidence-claim-text">AI 输出的 90% 置信度需要检查。</span></div>',
    )
    expect(html).not.toContain('sblock-degraded')
  })

  it('degrades a missing relation target instead of gilding it (no referential laundering)', () => {
    const html = renderDoocsHtml(':::evidence id="ev-1" supports="ghost"\nSUPPORTED\nx\n:::').html
    expect(html).toContain('sblock-degraded')
    expect(html).toContain('引用目标待复核')
  })

  it('degrades an evidence block that declares no claim_id at all', () => {
    const html = renderDoocsHtml(':::evidence id="ev-1"\nSUPPORTED\nx\n:::').html
    expect(html).toContain('sblock-degraded')
    expect(html).toContain('未声明 claim_id')
  })

  it('keeps validators pure: validateRelations does not touch rendered html', () => {
    const md = [claimMd(), '', ':::evidence id="ev-1" supports="claim-a"\nSUPPORTED\nx\n:::'].join('\n')
    const tokens = renderDoocsHtml(md).tokens
    const before = renderDoocsHtml(md).html
    validateRelations(tokens)
    expect(renderDoocsHtml(md).html).toBe(before)
  })
})
