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
  if (mode === 'normal') {
    return `<header class="masthead masthead-simple"><div class="masthead-brand">MAX大郭的判断局</div>${fm.title ? `<h1 class="masthead-title">${esc(fm.title)}</h1>` : ''}${fm.date ? `<div class="masthead-date">${esc(String(fm.date).replace(/-/g, ' / '))}</div>` : ''}</header>`
  }
  return `<header class="masthead"><div class="masthead-brand">MAX大郭的判断局</div>${fm.series ? `<div class="masthead-series">${esc(fm.series)}${issue ? ` / ${issue}` : ''}</div>` : ''}${fm.title ? `<h1 class="masthead-title">${esc(fm.title)}</h1>` : ''}${fm.date ? `<div class="masthead-date">${esc(String(fm.date).replace(/-/g, ' / '))}</div>` : ''}</header>`
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

function extractPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    // 无 DOM 环境（node 无 jsdom）时降级：去标签。
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
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
