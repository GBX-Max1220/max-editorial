// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { diffHtml } from './htmlDiff'

describe('htmlDiff (WeChat copy-back diagnostic)', () => {
  it('identical HTML produces no findings', () => {
    const html = '<div style="color:#171612;font-size:1em;">a</div>'
    expect(diffHtml(html, html)).toEqual([])
  })

  it('reports a removed element', () => {
    const pre = '<div class="sblock"><div class="inner">x</div></div>'
    const post = '<div class="sblock">x</div>'
    const f = diffHtml(pre, post)
    expect(f.some((x) => x.kind === 'structure-flattened' || x.kind === 'element-removed')).toBe(true)
  })

  it('reports a removed style property', () => {
    const pre = '<div style="color:#171612;margin:8px 0;">x</div>'
    const post = '<div style="color:#171612;">x</div>'
    const f = diffHtml(pre, post)
    expect(f.some((x) => x.kind === 'style-removed' && x.prop === 'margin')).toBe(true)
  })

  it('reports a rewritten style value', () => {
    const pre = '<div style="color:#171612;">x</div>'
    const post = '<div style="color:#a03a24;">x</div>'
    const f = diffHtml(pre, post)
    expect(f.some((x) => x.kind === 'style-rewritten' && x.prop === 'color')).toBe(true)
  })

  it('flags unit/color normalization as value-normalized, not rewritten', () => {
    const emPx = diffHtml('<div style="font-size:1.5em;">x</div>', '<div style="font-size:24px;">x</div>')
    expect(emPx.some((x) => x.kind === 'value-normalized' && x.prop === 'font-size')).toBe(true)
    const hexRgb = diffHtml('<div style="color:#171612;">x</div>', '<div style="color:rgb(23, 22, 18);">x</div>')
    expect(hexRgb.some((x) => x.kind === 'value-normalized' && x.prop === 'color')).toBe(true)
  })

  it('reports an added element and added style property', () => {
    const pre = '<div style="color:#171612;">x</div>'
    const post = '<div style="color:#171612;font-weight:700;">x</div><p>new</p>'
    const f = diffHtml(pre, post)
    expect(f.some((x) => x.kind === 'style-rewritten' && x.prop === 'font-weight')).toBe(true)
    expect(f.some((x) => x.kind === 'element-added')).toBe(true)
  })
})
