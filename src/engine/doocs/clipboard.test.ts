// @vitest-environment jsdom
/**
 * Doocs 剪贴板流水线集成测试：克隆 → juice 内联 → 结构修正 → SVG 净化 → 自包含 HTML + 纯文本。
 * （真实 ClipboardItem 写入依赖浏览器 clipboard 权限，这里验证流水线的产物。）
 */

import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { processClipboardForWeChat } from './clipboard'

describe('doocs clipboard pipeline', () => {
  it('inlines styles and returns self-contained html + plain text', async () => {
    const md = [
      ':::metric value="43" label="MINUTES"',
      ':::',
      '',
      ':::judgment',
      '判断文字',
      ':::',
      '',
      '正文段落。',
    ].join('\n')
    const { html, plainText } = await processClipboardForWeChat(md, null)

    expect(html).toContain('style=')
    expect(html).toContain('>43<')
    expect(html).toContain('sblock-judgment')
    expect(html).not.toContain('::')
    expect(plainText).toContain('判断文字')
    expect(plainText).toContain('正文段落')
  })

  it('fixes nested list structure (li > ul hoisted)', async () => {
    const md = '- 父\n  - 子\n- 父2'
    const { html } = await processClipboardForWeChat(md, null)
    const doc = new JSDOM(`<body>${html}</body>`).window.document
    // modifyHtmlStructure 把 li > ul 移到 li 后面，避免微信把 ul 包在 li 里
    expect(doc.querySelectorAll('li > ul, li > ol').length).toBe(0)
  })
})
