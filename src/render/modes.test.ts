import { describe, expect, it } from 'vitest'
import { getModeTokens, getViewportInfo } from './modes'

describe('modes', () => {
  it('editorial shows masthead and tagline', () => {
    const t = getModeTokens('editorial')
    expect(t.showMasthead).toBe(true)
    expect(t.showTagline).toBe(true)
  })

  it('normal is compact and simplified', () => {
    const t = getModeTokens('normal')
    expect(t.showMasthead).toBe(false)
    expect(t.metricScale).toBeLessThan(1)
  })

  it('wechat and mobile viewports scale down, desktop does not', () => {
    expect(getViewportInfo('desktop').scale).toBe(1)
    expect(getViewportInfo('wechat').chrome).toBe('wechat')
    expect(getViewportInfo('wechat').scale).toBeLessThan(1)
    expect(getViewportInfo('mobile').chrome).toBe('mobile')
  })
})
