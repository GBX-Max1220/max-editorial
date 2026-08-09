/**
 * Doocs 派生的微信剪贴板流水线。
 *
 * 序列（对齐 Phase 4 spec 与上游 apps/web/src/services/export/clipboard.ts）：
 *   Preview DOM → clone → 注入解析后的主题 CSS → juice 内联 → 修正列表/图片结构
 *   → 微信 SVG 净化 → 自包含 HTML + 纯文本 → ClipboardItem(text/html, text/plain)
 */

import { modifyHtmlStructure, solveWeChatImage } from './vendor/clipboard-dom'
import { sanitizeSvgsForWeChat } from './vendor/wechat-svg'
import { getClipboardCss } from './theme'
import { renderDoocsHtml } from './engine'

export async function processClipboardForWeChat(
  markdown: string,
  previewEl: HTMLElement | null,
): Promise<{ html: string; plainText: string }> {
  const clipboardDiv = previewEl
    ? (previewEl.cloneNode(true) as HTMLElement)
    : buildDetachedArticle(markdown)

  const style = document.createElement('style')
  style.textContent = getClipboardCss()
  clipboardDiv.insertBefore(style, clipboardDiv.firstChild)

  const inlined = await mergeCss(clipboardDiv.innerHTML)
  clipboardDiv.innerHTML = modifyHtmlStructure(inlined)

  // 微信里页内锚点无效，去掉（同上游行为）
  clipboardDiv.querySelectorAll('a[href^="#"]').forEach(a => a.removeAttribute('href'))

  solveWeChatImage(clipboardDiv)
  sanitizeSvgsForWeChat(clipboardDiv)

  return { html: clipboardDiv.innerHTML, plainText: clipboardDiv.textContent || '' }
}

/** 没有预览 DOM 时的兜底：由渲染结果构造一个 .article.paper 容器再走同一流水线。 */
function buildDetachedArticle(markdown: string): HTMLElement {
  const { html } = renderDoocsHtml(markdown)
  const host = document.createElement('div')
  host.innerHTML = `<article class="article paper" data-mode="editorial">${html}</article>`
  return host.firstElementChild as HTMLElement
}

async function mergeCss(html: string): Promise<string> {
  const { default: juice } = await import('juice')
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
    resolveCSSVariables: false,
  })
}
