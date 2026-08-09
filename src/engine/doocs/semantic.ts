/**
 * Max Editorial 七个语义块的 marked 扩展。
 *
 * 设计约束（来自迁移 spec）：
 *  - 语义解析必须在通用 alert/container 处理之前 —— 本扩展在 engine.ts 中注册在
 *    markedAlert 之前，并认领所有 `:::` 围栏；
 *  - 内层 Markdown 正常解析 —— question/judgment/counterpoint 逐行走 marked 行内
 *    解析（bold / code / link / image 均可用），与 V0.1 逐行语义一致；
 *  - 未知块名优雅失败 —— 渲染为 `.sblock-unknown`（同 V0.1），invalid/unknown
 *    信息进入 structure，由 CHECK 报 FAIL；
 *  - 输出稳定 class —— 与 V0.1 的 React 语义组件完全相同的 class 结构，让既有
 *    article.css 直接生效，保证视觉一致。
 */

import type { MarkedExtension, RendererThis, Token, Tokens } from 'marked'
import { escapeHtml } from './vendor/basicHelpers'
import { parseEvidence, parseLabNote } from '../shared/blockParse'
import { parseRelations, type Relation } from './relations'

export const SEMANTIC_TYPES = [
  'claim',
  'question',
  'ai-output',
  'judgment',
  'evidence',
  'counterpoint',
  'lab-note',
  'metric',
] as const

export interface SemanticBlockToken extends Tokens.Generic {
  type: 'semanticBlock'
  sType: string
  /** 稳定作者身份（`:::type id="..."`），文档内唯一；后续关系引用依赖它。 */
  id?: string
  props: Record<string, string>
  lines: string[]
  /** 每行的行内 tokens（tokenizer 阶段用 this.lexer 生成，renderer 只做 parseInline）。 */
  lineInline: Token[][]
  invalid: boolean
  unknown: boolean
  /** typed relations（supports/challenges），由 props 解析；渲染层不读取。 */
  relations?: Relation[]
}

const KNOWN = new Set<string>(SEMANTIC_TYPES)
const OPEN_RE = /^:::[ \t]*(\S+)[ \t]*(.*)$/
const CLOSE_RE = /^:::[ \t]*$/

function parseProps(header: string): Record<string, string> {
  const props: Record<string, string> = {}
  const re = /(\w+)\s*=\s*("[^"]*"|'[^']*'|\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(header))) {
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    props[m[1]] = v
  }
  return props
}

function dedentLines(lines: string[]): string[] {
  const indents = lines.filter((l) => l.trim() !== '').map((l) => l.match(/^\s*/)?.[0].length ?? 0)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(Math.min(min, l.match(/^\s*/)?.[0].length ?? 0)))
}

/** 逐行 parseInline + `<br/>` 连接，与 V0.1 的 Lines 组件一致。 */
function inlineLines(this: RendererThis, token: SemanticBlockToken): string {
  return token.lineInline
    .map((toks, i) => `${this.parser.parseInline(toks)}${i < token.lineInline.length - 1 ? '<br/>' : ''}`)
    .join('')
}

function renderEvidence(lines: string[]): string {
  const rows = parseEvidence(lines)
  const rowsHtml = rows
    .map(
      (r) =>
        `<div class="evidence-row"><span class="evidence-label">${escapeHtml(r.label || ' ')}</span><span class="evidence-value">${escapeHtml(r.value)}</span></div>`,
    )
    .join('')
  return `<section class="sblock sblock-evidence"><div class="sblock-label">EVIDENCE</div><div class="evidence-rows">${rowsHtml}</div></section>`
}

function renderLabNote(token: SemanticBlockToken): string {
  const { stats, notes } = parseLabNote(token.lines)
  const title = token.props.title
  const statRows = stats
    .map(
      (s) =>
        `<span class="lab-stat-value">${escapeHtml(s.value)}</span><span class="lab-stat-label">${escapeHtml(s.label || ' ')}</span>`,
    )
    .join('')
  const notesHtml = notes.length
    ? `<div class="lab-notes">${escapeHtml(notes.join('  ·  '))}</div>`
    : ''
  return `<section class="sblock sblock-lab-note"><div class="lab-title">LAB NOTE${title ? ` · ${escapeHtml(title)}` : ''}</div>${stats.length > 0 ? `<div class="lab-stats">${statRows}</div>` : ''}${notesHtml}</section>`
}

function renderMetric(token: SemanticBlockToken): string {
  const value = token.props.value ?? ''
  const label = token.props.label
  return `<section class="sblock sblock-metric"><div class="metric-value">${escapeHtml(value)}</div>${label ? `<div class="metric-label">${escapeHtml(label)}</div>` : ''}</section>`
}

function renderSemanticBlock(this: RendererThis, token: SemanticBlockToken): string {
  const lines = token.lines
  switch (token.sType) {
    case 'claim':
      // claim 按 prose 渲染（rev1 §8.1：claim 是可被定位为"被支持/待查"的命题，非块状视觉组件）。
      return token.lines
        .map((l, i) => `<p>${this.parser.parseInline(token.lineInline[i] ?? [])}</p>`)
        .join('')
    case 'question':
      return `<section class="sblock sblock-question"><div class="sblock-label">QUESTION</div><div class="sblock-body">${inlineLines.call(this, token)}</div></section>`
    case 'ai-output':
      return `<section class="sblock sblock-ai-output"><div class="sblock-label">AI OUTPUT</div><pre class="sblock-body">${escapeHtml(lines.join('\n'))}</pre></section>`
    case 'judgment':
      return `<section class="sblock sblock-judgment"><div class="sblock-label">JUDGMENT</div><div class="sblock-body">${inlineLines.call(this, token)}</div></section>`
    case 'evidence':
      return renderEvidence(lines)
    case 'counterpoint':
      return `<section class="sblock sblock-counterpoint"><div class="sblock-label">COUNTERPOINT</div><div class="sblock-body">${inlineLines.call(this, token)}</div></section>`
    case 'lab-note':
      return renderLabNote(token)
    case 'metric':
      return renderMetric(token)
    default:
      return `<section class="sblock sblock-unknown"><div class="sblock-label">UNKNOWN · ${escapeHtml(token.sType)}</div><pre class="sblock-body">${escapeHtml(lines.join('\n'))}</pre></section>`
  }
}

export function markedSemanticBlocks(): MarkedExtension {
  return {
    extensions: [
      {
        name: 'semanticBlock',
        level: 'block',
        start(src: string) {
          return src.match(/^:::/)?.index
        },
        tokenizer(this: { lexer: { inline(text: string): Token[] } }, src: string) {
          const lines = src.split('\n')
          const open = OPEN_RE.exec(lines[0] ?? '')
          if (!open) return undefined

          const [, type, header] = open
          const body: string[] = []
          let i = 1
          let closed = false
          for (; i < lines.length; i++) {
            if (CLOSE_RE.test(lines[i] ?? '')) {
              closed = true
              break
            }
            body.push(lines[i])
          }

          const raw = lines.slice(0, closed ? i + 1 : lines.length).join('\n')
          const dedented = dedentLines(body)
          const props = parseProps(header)
          return {
            type: 'semanticBlock',
            raw,
            sType: type,
            id: props.id,
            props,
            lines: dedented,
            lineInline: dedented.map((l) => this.lexer.inline(l)),
            invalid: !closed,
            unknown: !KNOWN.has(type),
            relations: parseRelations(props),
          }
        },
        renderer(this: RendererThis, token: Tokens.Generic) {
          return renderSemanticBlock.call(this, token as SemanticBlockToken)
        },
      },
    ],
  }
}
