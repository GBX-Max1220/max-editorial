import { describe, expect, it } from 'vitest'
import { renderDoocsHtml } from './engine'
import { validateBlockIds } from './blockIds'
import type { SemanticBlockToken } from './semantic'

function semanticBlocks(md: string): SemanticBlockToken[] {
  return renderDoocsHtml(md).tokens.filter(
    (t): t is SemanticBlockToken => t.type === 'semanticBlock',
  )
}

describe('validateBlockIds', () => {
  it('accepts blocks with distinct valid ids', () => {
    const md = [
      ':::judgment id="jud-1"',
      '判断一',
      ':::',
      '',
      ':::evidence id="ev-1"',
      'SUPPORTED',
      '30-60 min',
      ':::',
    ].join('\n')
    const diags = validateBlockIds(renderDoocsHtml(md).tokens)
    expect(diags).toEqual([])
  })

  it('reports duplicate ids', () => {
    const md = [
      ':::judgment id="same"',
      '判断一',
      ':::',
      '',
      ':::evidence id="same"',
      'SUPPORTED',
      '30-60 min',
      ':::',
    ].join('\n')
    const diags = validateBlockIds(renderDoocsHtml(md).tokens)
    expect(diags).toHaveLength(1)
    expect(diags[0].code).toBe('duplicate-id')
    expect(diags[0].severity).toBe('error')
    expect(diags[0].blockId).toBe('same')
  })

  it('reports missing ids as warnings (legacy content)', () => {
    const md = ':::judgment\n判断一\n:::'
    const diags = validateBlockIds(renderDoocsHtml(md).tokens)
    expect(diags).toHaveLength(1)
    expect(diags[0].code).toBe('missing-id')
    expect(diags[0].severity).toBe('warning')
  })

  it('reports empty ids', () => {
    const md = ':::judgment id=""\n判断一\n:::'
    const diags = validateBlockIds(renderDoocsHtml(md).tokens)
    expect(diags).toHaveLength(1)
    expect(diags[0].code).toBe('empty-id')
  })

  it('carries the author id through parse deterministically', () => {
    const md = ':::judgment id="jud-1"\n判断一\n:::'
    expect(semanticBlocks(md)[0].id).toBe('jud-1')
  })

  it('is stable across repeated parses of the same source', () => {
    const md = [
      ':::metric value="43" id="m-43"',
      ':::',
      '',
      ':::judgment id="j-x"',
      '判断',
      ':::',
    ].join('\n')
    const idsA = semanticBlocks(md).map((b) => b.id)
    const idsB = semanticBlocks(md).map((b) => b.id)
    expect(idsA).toEqual(idsB)
    expect(idsA).toEqual(['m-43', 'j-x'])
  })

  it('does not mutate the token list', () => {
    const md = ':::judgment id="j-1"\n判断一\n:::\n\n:::evidence\n无 id\n:::'
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    validateBlockIds(tokens)
    expect(JSON.stringify(tokens)).toBe(before)
  })

  it('does not change rendered html when ids are present', () => {
    const withIds = ':::judgment id="j-1"\n判断一\n:::'
    const withoutIds = ':::judgment\n判断一\n:::'
    expect(renderDoocsHtml(withIds).html).toBe(renderDoocsHtml(withoutIds).html)
  })
})
