/**
 * Max Editorial 八个语义块的 marked 扩展（7 组件 + claim 命题块）。
 *
 * 设计约束（来自迁移 spec + V0.2 rev1）：
 *  - 语义解析必须在通用 alert/container 处理之前 —— 本扩展在 engine.ts 中注册在
 *    markedAlert 之前，并认领所有 `:::` 围栏；
 *  - 内层 Markdown 正常解析 —— question/judgment/counterpoint 逐行走 marked 行内
 *    解析（bold / code / link / image 均可用），与 V0.1 逐行语义一致；
 *  - 未知块名优雅失败 —— 渲染为 `.sblock-unknown`（同 V0.1），invalid/unknown
 *    信息进入 structure，由 CHECK 报 FAIL；
 *  - 视觉 HTML 由共享渲染器 `src/engine/shared/semanticHtml.ts` 产出（与 legacy 引擎共用，
 *    保证 A/B 回归一致）；本模块只负责 token 化与上下文（claimMap）注入。
 */

import type { MarkedExtension, RendererThis, Token, Tokens } from 'marked'
import { escapeHtml } from './vendor/basicHelpers'
import { parseRelations, type Relation } from './relations'
import { renderSemanticHtml } from '../shared/semanticHtml'

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

/** 逐行 parseInline（不加 <br/>，由共享渲染器按块类型拼接）。 */
function lineInlineHtml(this: RendererThis, token: SemanticBlockToken): string[] {
  return token.lineInline.map((toks) => this.parser.parseInline(toks))
}

/**
 * marked 扩展的 renderer 需要 claimMap / ambiguousIds。
 * 用模块内上下文承载（render 同步：lexer 后、parser 前由 engine.ts 一次性注入，无并发交错）。
 */
type RenderCtx = {
  claimMap: ReadonlyMap<string, string>
  ambiguousIds: ReadonlySet<string>
}

let currentCtx: RenderCtx = { claimMap: new Map(), ambiguousIds: new Set() }

export function setRenderCtx(ctx: RenderCtx): void {
  currentCtx = ctx
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
          const t = token as SemanticBlockToken
          const ctx = currentCtx
          return renderSemanticHtml({
            sType: t.sType,
            props: t.props,
            lines: t.lines,
            lineHtml: lineInlineHtml.call(this, t),
            rawText: escapeHtml(t.lines.join('\n')),
            claimMap: ctx.claimMap,
            ambiguousIds: ctx.ambiguousIds,
          })
        },
      },
    ],
  }
}
