import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../markdown/parser'
import { toPlainText, toWechatHtml } from './clipboard'

const DOC = `---
title: 测试标题
tagline: 副标题
next:
  title: 下一期
---

正文内容。

:::metric value="43" label="MINUTES · EXACTLY?"
:::

:::judgment
判断文字
:::
`

describe('wechat clipboard html', () => {
  const parsed = () => parseMarkdown(DOC)

  it('contains content, labels and inline styles', () => {
    const html = toWechatHtml(parsed(), 'editorial')
    expect(html).toContain('测试标题')
    expect(html).toContain('JUDGMENT')
    expect(html).toContain('判断文字')
    expect(html).toContain('43')
    expect(html).toContain('style="')
    expect(html).toContain('NEXT')
    expect(html).toContain('MINUTES · EXACTLY?')
  })

  it('does not leak html source markers', () => {
    const html = toWechatHtml(parsed(), 'editorial')
    expect(html).not.toContain('::metric')
    expect(html).not.toContain(':::judgment')
  })

  it('editorial renders header, normal does not', () => {
    const editorial = toWechatHtml(parsed(), 'editorial')
    const normal = toWechatHtml(parsed(), 'normal')
    expect(editorial).toContain('MAX大郭的判断局')
    expect(normal).not.toContain('MAX大郭的判断局')
  })

  it('produces plain text with semantic labels', () => {
    const text = toPlainText(parsed())
    expect(text).toContain('测试标题')
    expect(text).toContain('判断文字')
    expect(text).toContain('[JUDGMENT]')
    expect(text).toContain('NEXT')
  })
})
