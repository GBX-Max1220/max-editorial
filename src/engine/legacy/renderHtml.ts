/**
 * V0.1 引擎的 HTML 渲染：把 V0.1 AST 渲染为与 React 预览完全相同的 class/元素结构。
 * 让 legacy 与 doocs 两个引擎能产出一致的 HTML 供 UI 统一用 innerHTML 渲染，
 * 并支持 A/B 回归对比。
 */

import type { Block, InlineNode, SemanticBlock } from '../../markdown/types'
import { parseInline } from '../../markdown/inline'
import { buildAnchorDirections, buildClaimIndex, renderSemanticHtml, type AnchorDirection } from '../shared/semanticHtml'

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
          return imageHtml(n)
      }
    })
    .join('')
}

/** §12.12：图片 title 属性作为 caption（ANNOTATION 语法）。与 doocs 引擎一致。 */
function imageHtml(img: { alt: string; src: string; title?: string }): string {
  return img.title
    ? `<figure class="figure"><img src="${escAttr(img.src)}" alt="${escAttr(img.alt)}" title="${escAttr(img.title)}" /><figcaption class="figure-caption">${esc(img.title)}</figcaption></figure>`
    : `<img src="${escAttr(img.src)}" alt="${escAttr(img.alt)}" />`
}

function semanticHtml(
  b: SemanticBlock,
  claimMap: ReadonlyMap<string, string>,
  ambiguousIds: ReadonlySet<string>,
  anchorDirections: ReadonlyMap<string, AnchorDirection>,
): string {
  return renderSemanticHtml({
    sType: b.type,
    props: b.props,
    lines: b.lines,
    lineHtml: b.lines.map((l) => renderInlineHtml(parseInline(l))),
    rawText: esc(b.lines.join('\n')),
    claimMap,
    ambiguousIds,
    anchorDirections,
  })
}

function blockHtml(
  b: Block,
  claimMap: ReadonlyMap<string, string>,
  ambiguousIds: ReadonlySet<string>,
  anchorDirections: ReadonlyMap<string, AnchorDirection>,
): string {
  switch (b.kind) {
    case 'heading': {
      const tag = Math.min(b.level, 3)
      return `<h${tag}>${renderInlineHtml(b.inline)}</h${tag}>`
    }
    case 'paragraph':
      // marked 会把独立图片行包在 <p> 里；legacy 保持相同结构（含 title → figure）以保证 regression 等价。
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
      return imageHtml(b)
    case 'table':
      return `<div class="table-wrap"><table><thead><tr>${b.headers
        .map((h) => `<th>${renderInlineHtml(parseInline(h))}</th>`)
        .join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInlineHtml(parseInline(c))}</td>`).join('')}</tr>`)
        .join('')}</tbody></table></div>`
    case 'semantic':
      return semanticHtml(b, claimMap, ambiguousIds, anchorDirections)
  }
}

export function renderLegacyHtml(blocks: Block[]): string {
  const semanticBlocks = blocks.filter((b): b is SemanticBlock => b.kind === 'semantic')
  const { claimMap, ambiguousIds } = buildClaimIndex(semanticBlocks)
  const anchorDirections = buildAnchorDirections(semanticBlocks)
  return blocks.map((b) => blockHtml(b, claimMap, ambiguousIds, anchorDirections)).join('\n')
}
