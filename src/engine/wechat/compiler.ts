/**
 * 微信目标编译器（V0.2.2）。
 *
 * 架构：semantic representation（renderDoocsHtml 的类化 HTML）
 *   → compileForWechat（内联 WECHAT_SAFE_CSS，primitive 全部块流 + 固定 px）
 *   → WeChatCompiledArtifact（纯 inline-style 自包含 HTML）
 *   → 微信预览 与 剪贴板 消费【同一 artifact】。
 *
 * 核心原则（任务）：Preview what will survive, not what the browser is capable of rendering.
 * 浏览器不是生产渲染目标；微信是。
 *
 * 管线事实：
 *  - 产物无 <style> 标签（内联后移除）、无 CSS 变量（无 var()）、无 flex/clamp/vw/@media/nowrap。
 *  - 换行依赖渲染器已产出的 <br/>，不依赖 white-space。
 */

import type { PreviewMode } from '../types'
import { renderDoocsHtml } from '../doocs/engine'
import { WECHAT_SAFE_CSS } from './safeCss'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import juice from 'juice'

export interface WeChatCompiledArtifact {
  /** 微信安全的自包含 HTML（全文：masthead + article body + footer）。 */
  html: string
  plainText: string
}

export interface CompileOptions {
  mode?: PreviewMode
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function mastheadHtml(fm: Record<string, unknown>, mode: PreviewMode): string {
  const issue = fm.issue !== undefined ? String(fm.issue).padStart(3, '0') : null
  const brand = `<div class="masthead-brand"><span class="dot">●</span> MAX大郭的判断局</div>`
  if (mode === 'normal') {
    return `<header class="masthead masthead-simple">${brand}${fm.title ? `<h1 class="masthead-title">${esc(fm.title)}</h1>` : ''}${fm.date ? `<div class="masthead-date">${esc(String(fm.date).replace(/-/g, ' / '))}</div>` : ''}</header>`
  }
  return `<header class="masthead">${brand}${fm.series ? `<div class="masthead-series">${esc(fm.series)}${issue ? ` / ${issue}` : ''}</div>` : ''}${fm.title ? `<h1 class="masthead-title">${esc(fm.title)}</h1>` : ''}${fm.tagline ? `<div class="masthead-deck">${esc(fm.tagline)}</div>` : ''}${fm.date ? `<div class="masthead-date">${esc(String(fm.date).replace(/-/g, ' / '))}</div>` : ''}</header>`
}

function footerHtml(fm: Record<string, unknown>): string {
  const issue = fm.issue !== undefined ? String(fm.issue).padStart(3, '0') : null
  const brand = ['MAX', fm.series ? String(fm.series) : '', issue].filter(Boolean).join(' / ')
  const next = fm.next as Record<string, unknown> | undefined
  return `<footer class="article-footer"><div class="footer-brand">${esc(brand || 'MAX')}</div>${fm.tagline ? `<div class="footer-tagline">${esc(fm.tagline)}</div>` : ''}${next?.title ? `<div class="next"><div class="next-label">NEXT</div><div class="next-title">${esc(next.title)}</div></div>` : ''}</footer>`
}

/** juice 内联（与剪贴板同一机制）；输入为片段字符串，juice 用 parse5 解析。 */
function inlineCss(html: string, css: string): string {
  const withStyle = html.replace(/<section class="wechat-article">/, `<section class="wechat-article"><style>${css}</style>`)
  return juice(withStyle, {
    inlinePseudoElements: true,
    preserveImportant: true,
    resolveCSSVariables: false,
  })
}

function stripStyleTags(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'TABLE',
  'TR',
  'SECTION',
  'HEADER',
  'FOOTER',
  'HR',
  'FIGURE',
])

/**
 * 从微信 artifact 提取可读纯文本（text/plain MIME）。
 *
 * 与旧实现（textContent 单空格压平）的关键差异：在块级元素边界插入换行，
 * 保证相邻块（如 masthead 品牌行与正文、JUDGMENT / 001 与正文）不会被粘成一个长串。
 * 这是 text/plain 降级路径的可读性前提 —— 微信无法使用 text/html 时粘贴的就是这段文本。
 */
function extractPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    // 无 DOM 环境（node 无 jsdom）时降级：在块级闭合标签后补换行再剥离标签。
    const withBreaks = html
      .replace(/<\/(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|section|header|footer|figure)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
    return withBreaks
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out: string[] = []

  const pushNewline = (): void => {
    if (out.length === 0) return
    if (out[out.length - 1] !== '\n') out.push('\n')
  }

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.textContent ?? '')
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    const tag = el.tagName
    if (tag === 'BR') {
      out.push('\n')
      return
    }
    const isBlock = BLOCK_TAGS.has(tag)
    if (isBlock) pushNewline()
    for (const child of Array.from(el.childNodes)) walk(child)
    if (isBlock) pushNewline()
  }

  for (const child of Array.from(doc.body.childNodes)) walk(child)

  return out
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 编译微信目标 artifact（同步：React 预览与剪贴板可同源消费同一产物）。
 * mode 只影响 masthead 呈现（editorial 完整 / normal 精简）；正文固定 px 目标一致。
 */
export function compileForWechat(markdown: string, options?: CompileOptions): WeChatCompiledArtifact {
  const mode = options?.mode ?? 'editorial'
  const { html, frontmatter } = renderDoocsHtml(markdown)
  const full = `<section class="wechat-article">${mastheadHtml(frontmatter, mode)}<div class="article">${html}</div>${footerHtml(frontmatter)}</section>`
  const inlined = inlineCss(full, WECHAT_SAFE_CSS)
  const clean = stripStyleTags(inlined)
  return { html: clean, plainText: extractPlainText(clean) }
}
