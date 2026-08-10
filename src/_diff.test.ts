// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { compileForWechat } from './engine/wechat/compiler'
import fixtureRaw from '../examples/issue-001.md?raw'

describe('diff', () => {
  it('extract production metric + H01', () => {
    const { html } = compileForWechat(fixtureRaw)
    const m = html.match(/<section class="sblock sblock-metric"[^>]*>.*?<\/section>/)?.[0] ?? 'NOT FOUND'
    console.log('=== PRODUCTION METRIC ===')
    console.log(m)
    expect(true).toBe(true)
  })
})
