// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { checkWechatPolicy } from './policyCheck'

describe('checkWechatPolicy (static forbidden-primitive detector)', () => {
  it('detects flex, gap, clamp, vw, align-items, nowrap in style attributes', () => {
    const html =
      '<div style="display:flex; gap:8px; align-items:center;">a</div>' +
      '<span style="font-size:clamp(1em, 5vw, 3em); white-space:nowrap;">b</span>' +
      '<div style="justify-content:space-between;">c</div>'
    const f = checkWechatPolicy(html)
    const codes = f.map((x) => x.code)
    expect(codes).toContain('forbidden-flex')
    expect(codes).toContain('forbidden-gap')
    expect(codes).toContain('forbidden-align-items')
    expect(codes).toContain('forbidden-clamp')
    expect(codes).toContain('forbidden-vw')
    expect(codes).toContain('forbidden-nowrap')
    expect(codes).toContain('forbidden-justify-content')
  })

  it('detects @media, <style> tag, and var(--) in the document', () => {
    const html = '<style>@media (max-width:480px){.a{color:var(--ink);}}</style><div>a</div>'
    const f = checkWechatPolicy(html)
    const codes = f.map((x) => x.code)
    expect(codes).toContain('forbidden-media')
    expect(codes).toContain('forbidden-style-tag')
    expect(codes).toContain('forbidden-css-variable')
  })

  it('does not flag prose text that merely mentions forbidden words', () => {
    // vw/gap/flex 出现在正文里不应误报（检查器只扫 style 属性）。
    const html = '<p>关于 flex 布局与 gap 间距的讨论，以及 5vw 单位。</p>'
    expect(checkWechatPolicy(html)).toEqual([])
  })

  it('passes a clean inline-styled artifact', () => {
    const html =
      '<div style="display:block; font-size:44px; border-top:1px solid #171612; text-align:center;">43</div>'
    expect(checkWechatPolicy(html)).toEqual([])
  })
})
