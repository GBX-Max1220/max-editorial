/**
 * V0.1 引擎的 HTML 渲染：把 V0.1 AST 渲染为与 React 预览完全相同的 class/元素结构。
 * 让 legacy 与 doocs 两个引擎能产出一致的 HTML 供 UI 统一用 innerHTML 渲染，
 * 并支持 A/B 回归对比。
 */

import type { Block, InlineNode, SemanticBlock } from '../../markdown/types'
import { parseInline } from '../../markdown/inline'
import { parseEvidence, parseLabNote } from '../shared/blockParse'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

export function renderInlineHtml(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
          return esc(n.value)
        case 'strong':
          return `<strong>${renderInlineHtml(n.children)}</strong>`
        case 'em':
          return `<em>${renderInlineHtml(n.children)}</em>`
        case 'code':
          return `<code>${esc(n.value)}</code>`
        case 'link':
          return `<a href="${escAttr(n.href)}">${renderInlineHtml(n.children)}</a>`
        case 'image':
          return `<img src="${escAttr(n.src)}" alt="${escAttr(n.alt)}" />`
      }
    })
    .join('')
}

function linesHtml(lines: string[]): string {
  return lines
    .map((l, i) => `${renderInlineHtml(parseInline(l))}${i < lines.length - 1 ? '<br/>' : ''}`)
    .join('')
}

function semanticHtml(b: SemanticBlock): string {
  switch (b.type) {
    case 'question':
      return `<section class="sblock sblock-question"><div class="sblock-label">QUESTION</div><div class="sblock-body">${linesHtml(b.lines)}</div></section>`
    case 'ai-output':
      return `<section class="sblock sblock-ai-output"><div class="sblock-label">AI OUTPUT</div><pre class="sblock-body">${esc(b.lines.join('\n'))}</pre></section>`
    case 'judgment':
      return `<section class="sblock sblock-judgment"><div class="sblock-label">JUDGMENT</div><div class="sblock-body">${linesHtml(b.lines)}</div></section>`
    case 'evidence': {
      const rows = parseEvidence(b.lines)
      const html = rows
        .map(
          (r) =>
            `<div class="evidence-row"><span class="evidence-label">${esc(r.label || ' ')}</span><span class="evidence-value">${esc(r.value)}</span></div>`,
        )
        .join('')
      return `<section class="sblock sblock-evidence"><div class="sblock-label">EVIDENCE</div><div class="evidence-rows">${html}</div></section>`
    }
    case 'counterpoint':
      return `<section class="sblock sblock-counterpoint"><div class="sblock-label">COUNTERPOINT</div><div class="sblock-body">${linesHtml(b.lines)}</div></section>`
    case 'lab-note': {
      const { stats, notes } = parseLabNote(b.lines)
      const title = b.props.title
      const statRows = stats
        .map(
          (s) =>
            `<span class="lab-stat-value">${esc(s.value)}</span><span class="lab-stat-label">${esc(s.label || ' ')}</span>`,
        )
        .join('')
      const notesHtml = notes.length ? `<div class="lab-notes">${esc(notes.join('  ·  '))}</div>` : ''
      return `<section class="sblock sblock-lab-note"><div class="lab-title">LAB NOTE${title ? ` · ${esc(title)}` : ''}</div>${stats.length > 0 ? `<div class="lab-stats">${statRows}</div>` : ''}${notesHtml}</section>`
    }
    case 'metric': {
      const value = b.props.value ?? ''
      const label = b.props.label
      return `<section class="sblock sblock-metric"><div class="metric-value">${esc(value)}</div>${label ? `<div class="metric-label">${esc(label)}</div>` : ''}</section>`
    }
    default:
      return `<section class="sblock sblock-unknown"><div class="sblock-label">UNKNOWN · ${esc(b.type)}</div><pre class="sblock-body">${esc(b.lines.join('\n'))}</pre></section>`
  }
}

function blockHtml(b: Block): string {
  switch (b.kind) {
    case 'heading': {
      const tag = Math.min(b.level, 3)
      return `<h${tag}>${renderInlineHtml(b.inline)}</h${tag}>`
    }
    case 'paragraph':
      return `<p>${renderInlineHtml(b.inline)}</p>`
    case 'blockquote':
      return `<blockquote>${renderInlineHtml(b.inline)}</blockquote>`
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul'
      return `<${tag}>${b.items.map((it) => `<li>${renderInlineHtml(it.inline)}</li>`).join('')}</${tag}>`
    }
    case 'code':
      return `<pre><code>${esc(b.code)}</code></pre>`
    case 'hr':
      return '<hr>'
    case 'image':
      return `<img src="${escAttr(b.src)}" alt="${escAttr(b.alt)}" />`
    case 'table':
      return `<div class="table-wrap"><table><thead><tr>${b.headers
        .map((h) => `<th>${renderInlineHtml(parseInline(h))}</th>`)
        .join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInlineHtml(parseInline(c))}</td>`).join('')}</tr>`)
        .join('')}</tbody></table></div>`
    case 'semantic':
      return semanticHtml(b)
  }
}

export function renderLegacyHtml(blocks: Block[]): string {
  return blocks.map(blockHtml).join('\n')
}
