import type { Block, InlineNode, ParseResult, SemanticBlock } from '../markdown/types'
import { parseInline } from '../markdown/inline'
import { parseEvidence, parseLabNote } from './parseHelpers'
import { recordClipboardError } from '../clipboard/errors'
import type { PreviewMode } from './modes'

/**
 * WeChat 剪贴板：复制 text/html + text/plain，而不是 HTML 源码。
 * 微信编辑器会剥离 <style>/class，保留 inline style，所以这里全部内联。
 */

const BASE_STYLE = [
  'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;',
  'color:#171612;',
  'font-size:16px;',
  'line-height:1.8;',
  'letter-spacing:0.02em;',
  'word-break:break-word;',
].join('')

const LABEL_STYLE = 'font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.28em;color:#9a978d;'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

function inlineHtml(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
          return esc(n.value)
        case 'strong':
          return `<strong style="font-weight:600;">${inlineHtml(n.children)}</strong>`
        case 'em':
          return `<em style="font-style:italic;">${inlineHtml(n.children)}</em>`
        case 'code':
          return `<code style="font-family:Consolas,Menlo,monospace;font-size:0.9em;background:#f5f4ef;padding:0.12em 0.35em;border-radius:2px;">${esc(n.value)}</code>`
        case 'link':
          return `<a href="${escAttr(n.href)}" style="color:#576b95;text-decoration:none;">${inlineHtml(n.children)}</a>`
        case 'image':
          return `<img src="${escAttr(n.src)}" alt="${escAttr(n.alt)}" style="max-width:100%;display:block;margin:16px auto;"/>`
      }
    })
    .join('')
}

function linesHtml(lines: string[]): string {
  return lines.map(esc).join('<br/>')
}

function blockHtml(b: Block, mode: PreviewMode): string {
  switch (b.kind) {
    case 'heading': {
      const sizes: Record<number, string> = { 1: '26px', 2: '21px', 3: '17px' }
      const lvl = Math.min(b.level, 3)
      const margin =
        mode === 'editorial'
          ? lvl === 1
            ? '40px 0 14px'
            : '34px 0 12px'
          : lvl === 1
            ? '28px 0 10px'
            : '24px 0 10px'
      return `<h${lvl} style="font-size:${sizes[lvl]};line-height:1.45;margin:${margin};font-weight:600;">${inlineHtml(b.inline)}</h${lvl}>`
    }
    case 'paragraph':
      return `<p style="margin:0 0 1.15em;">${inlineHtml(b.inline)}</p>`
    case 'blockquote':
      return `<blockquote style="margin:24px 0;padding-left:16px;border-left:2px solid #d8d6cd;color:#6b6a63;">${inlineHtml(b.inline)}</blockquote>`
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul'
      const items = b.items.map((it) => `<li style="margin:0 0 0.4em;">${inlineHtml(it.inline)}</li>`).join('')
      return `<${tag} style="margin:0 0 1.15em;padding-left:1.4em;">${items}</${tag}>`
    }
    case 'code':
      return `<pre style="margin:24px 0;padding:16px 18px;background:#f6f5f1;border:1px solid #e4e2da;border-radius:2px;overflow-x:auto;font-family:Consolas,Menlo,monospace;font-size:13px;line-height:1.7;color:#333;">${esc(b.code)}</pre>`
    case 'hr':
      return `<hr style="border:none;border-top:1px solid #d8d6cd;margin:36px 0;"/>`
    case 'image':
      return `<img src="${escAttr(b.src)}" alt="${escAttr(b.alt)}" style="max-width:100%;display:block;margin:24px auto;"/>`
    case 'table': {
      const head = b.headers
        .map((h) => `<th style="border:1px solid #e4e2da;padding:8px 10px;background:#f6f5f1;font-weight:600;text-align:left;">${inlineHtml(parseInline(h))}</th>`)
        .join('')
      const body = b.rows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td style="border:1px solid #e4e2da;padding:8px 10px;">${inlineHtml(parseInline(c))}</td>`).join('')}</tr>`,
        )
        .join('')
      return `<table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    }
    case 'semantic':
      return semanticHtml(b)
  }
}

function semanticLabel(b: SemanticBlock): string {
  if (b.type === 'claim') return ''
  return b.unknown ? `UNKNOWN · ${b.type}` : b.type.toUpperCase()
}

function semanticHtml(b: SemanticBlock): string {
  // claim 是命题块，按 prose 渲染（与引擎渲染一致）。
  if (b.type === 'claim') {
    return b.lines.map((l) => `<p style="margin:0 0 1.15em;">${esc(l)}</p>`).join('')
  }
  const label = `<div style="${LABEL_STYLE};margin-bottom:14px;">${esc(semanticLabel(b))}</div>`
  switch (b.type) {
    case 'question':
      return `<section style="margin:32px 0;padding:28px 0 24px;border-top:1px solid #e4e2da;">${label}<div style="font-size:20px;line-height:1.7;color:#171612;">${linesHtml(b.lines)}</div></section>`
    case 'ai-output':
      return `<section style="margin:28px 0;background:#f6f5f1;border:1px solid #e4e2da;border-radius:2px;padding:16px 18px;">${label}<div style="font-family:Consolas,Menlo,monospace;font-size:13.5px;line-height:1.75;color:#333;white-space:pre-wrap;">${esc(b.lines.join('\n'))}</div></section>`
    case 'judgment':
      return `<section style="margin:40px 0;text-align:center;padding:28px 10px;border-top:1px solid #171612;border-bottom:1px solid #171612;">${label}<div style="font-size:21px;line-height:1.7;font-weight:600;color:#171612;">${linesHtml(b.lines)}</div></section>`
    case 'evidence': {
      const rows = parseEvidence(b.lines)
      const trs = rows
        .map(
          (r) =>
            `<tr><td style="padding:8px 0;font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.2em;color:#9a978d;width:38%;vertical-align:top;">${esc(r.label)}</td><td style="padding:8px 0;font-family:Consolas,Menlo,monospace;font-size:15px;color:#171612;text-align:right;">${esc(r.value)}</td></tr>`,
        )
        .join('')
      return `<section style="margin:28px 0;background:#faf9f6;border:1px solid #e4e2da;border-radius:2px;padding:16px 20px;">${label}<table style="width:100%;border-collapse:collapse;">${trs}</table></section>`
    }
    case 'counterpoint':
      return `<section style="margin:28px 0;padding:18px 0 4px;border-top:1px solid #e4e2da;">${label}<div style="font-size:16px;line-height:1.75;color:#333;">${linesHtml(b.lines)}</div></section>`
    case 'lab-note': {
      const { stats, notes } = parseLabNote(b.lines)
      const title = b.props.title ? ` · ${esc(b.props.title)}` : ''
      const statRows = stats
        .map(
          (s) =>
            `<tr><td style="padding:4px 0;font-family:Consolas,Menlo,monospace;font-size:15px;color:#171612;text-align:right;width:20%;">${esc(s.value)}</td><td style="padding:4px 0;padding-left:16px;font-family:Consolas,Menlo,monospace;font-size:13px;color:#6b6a63;">${esc(s.label)}</td></tr>`,
        )
        .join('')
      const note = notes.length
        ? `<div style="margin-top:14px;font-size:13px;color:#9a978d;line-height:1.7;">${esc(notes.join('  ·  '))}</div>`
        : ''
      return `<section style="margin:28px 0;border:1px solid #e4e2da;border-radius:2px;padding:18px 20px;"><div style="${LABEL_STYLE};margin-bottom:12px;">LAB NOTE${title}</div>${stats.length > 0 ? `<table style="width:100%;border-collapse:collapse;">${statRows}</table>` : ''}${note}</section>`
    }
    case 'metric': {
      const value = b.props.value ?? ''
      const lbl = b.props.label
        ? `<div style="font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.32em;color:#9a978d;margin-top:14px;">${esc(b.props.label)}</div>`
        : ''
      return `<section style="margin:44px 0;text-align:center;padding:24px 0;"><div style="font-size:52px;line-height:1;font-weight:600;letter-spacing:-0.02em;color:#171612;font-family:Georgia,serif;">${esc(value)}</div>${lbl}</section>`
    }
    default:
      return `<section style="margin:28px 0;border:1px dashed #d8d6cd;border-radius:2px;padding:16px 18px;">${label}<div style="font-family:Consolas,Menlo,monospace;font-size:13px;line-height:1.7;color:#6b6a63;white-space:pre-wrap;">${esc(b.lines.join('\n'))}</div></section>`
  }
}

function headerHtml(fm: Record<string, unknown>): string {
  const series = fm.series
    ? `<div style="font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.3em;color:#b0aea6;margin-top:6px;">${esc(String(fm.series))}${fm.issue ? ` / ${String(fm.issue).padStart(3, '0')}` : ''}</div>`
    : ''
  const date = fm.date
    ? `<div style="font-family:Consolas,Menlo,monospace;font-size:11px;color:#9a978d;margin-top:10px;">${esc(String(fm.date).replace(/-/g, ' / '))}</div>`
    : ''
  const title = fm.title ? `<h1 style="font-size:27px;line-height:1.4;margin:20px 0 4px;font-weight:600;color:#171612;">${esc(String(fm.title))}</h1>` : ''
  return `<div style="margin-bottom:36px;padding-bottom:22px;border-bottom:1px solid #e4e2da;"><div style="font-family:Consolas,Menlo,monospace;font-size:11px;letter-spacing:0.24em;color:#9a978d;">MAX大郭的判断局</div>${series}${title}${date}</div>`
}

function footerHtml(fm: Record<string, unknown>): string {
  const brand = ['MAX', fm.series, fm.issue ? String(fm.issue).padStart(3, '0') : ''].filter(Boolean).join(' / ')
  const tagline = fm.tagline
    ? `<div style="margin-top:12px;font-size:14px;color:#6b6a63;">${esc(String(fm.tagline))}</div>`
    : ''
  const next =
    fm.next && (fm.next as Record<string, unknown>).title
      ? `<div style="margin-top:26px;font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.3em;color:#9a978d;">NEXT</div><div style="margin-top:8px;font-size:19px;line-height:1.6;color:#171612;">${esc(String((fm.next as Record<string, unknown>).title))}</div>`
      : ''
  return `<div style="margin-top:40px;padding-top:24px;border-top:1px solid #e4e2da;"><div style="font-family:Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.3em;color:#b0aea6;">${esc(brand)}</div>${tagline}${next}</div>`
}

/** 生成可粘贴进微信编辑器的富文本 HTML（全部 inline style）。 */
export function toWechatHtml(parsed: ParseResult, mode: PreviewMode): string {
  const { frontmatter, blocks } = parsed
  const parts: string[] = []
  if (mode === 'editorial') parts.push(headerHtml(frontmatter))
  for (const b of blocks) parts.push(blockHtml(b, mode))
  parts.push(footerHtml(frontmatter))
  return `<section style="${BASE_STYLE}">${parts.join('\n')}</section>`
}

function plainInline(nodes: InlineNode[]): string {
  let s = ''
  for (const n of nodes) {
    switch (n.type) {
      case 'text':
        s += n.value
        break
      case 'strong':
      case 'em':
      case 'link':
        s += plainInline(n.children)
        break
      case 'code':
        s += n.value
        break
      case 'image':
        s += n.alt
        break
    }
  }
  return s
}

function blockPlain(b: Block): string[] {
  switch (b.kind) {
    case 'heading':
      return [`${'#'.repeat(Math.min(b.level, 3))} ${plainInline(b.inline)}`]
    case 'paragraph':
      return [plainInline(b.inline)]
    case 'blockquote':
      return [`> ${plainInline(b.inline)}`]
    case 'list':
      return b.items.map((it) => `- ${plainInline(it.inline)}`)
    case 'code':
      return ['```', b.code, '```']
    case 'hr':
      return ['———']
    case 'image':
      return [`[图片] ${b.alt}`]
    case 'table':
      return [b.headers.join(' | '), ...b.rows.map((r) => r.join(' | '))]
    case 'semantic': {
      if (b.type === 'claim') return [...b.lines]
      const label = b.unknown ? `UNKNOWN ${b.type}` : b.type.toUpperCase()
      return [`[${label}]`, ...b.lines]
    }
  }
}

export function toPlainText(parsed: ParseResult): string {
  const lines: string[] = []
  const { frontmatter, blocks } = parsed
  if (frontmatter.title) lines.push(String(frontmatter.title), '')
  for (const b of blocks) {
    lines.push(...blockPlain(b), '')
  }
  if (frontmatter.next && (frontmatter.next as Record<string, unknown>).title) {
    lines.push(`NEXT：${String((frontmatter.next as Record<string, unknown>).title)}`)
  }
  return lines.join('\n').trim() + '\n'
}

function copyLegacy(plain: string): void {
  const ta = document.createElement('textarea')
  ta.value = plain
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  if (!ok) {
    recordClipboardError(`render.copyLegacy → execCommand returned false`, new Error('clipboard copy failed'))
    throw new Error('clipboard copy failed')
  }
}

/**
 * 复制 text/html + text/plain 到剪贴板。
 * Clipboard API 不可用时退回 legacy execCommand（此时只复制纯文本，属已知降级）。
 * 返回值标识实际写入方式：`rich` = 双 MIME；`plain` = 降级纯文本（调用方据此告知用户）。
 */
export async function copyWechat(parsed: ParseResult, mode: PreviewMode): Promise<'rich' | 'plain'> {
  const html = toWechatHtml(parsed, mode)
  const plain = toPlainText(parsed)
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return 'rich'
    }
  } catch (err) {
    recordClipboardError(`render.copyWechat → ClipboardItem/clipboard.write`, err)
  }
  copyLegacy(plain)
  return 'plain'
}
