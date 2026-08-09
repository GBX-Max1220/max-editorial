/**
 * Doocs-backed 渲染引擎。
 *
 * 渲染路径复用上游做法：marked（前端产物 @md/core 的宿主）+ front-matter +
 * readingTime + alert/footnotes 扩展 + Max Editorial 语义扩展。
 * 与上游的关键差异（详见 ENGINE_MIGRATION_REPORT.md）：
 *  - 省略上游 class-marking renderer（.p/.h2/.listitem）：Max Editorial 拥有自己的
 *    元素级 article.css，直接按元素排版，不需要主题类名；
 *  - 原始 HTML token 一律转义输出，绝不注入（XSS 防护；CHECK 仍会标记 script 等）；
 *  - 表格用 .table-wrap 包裹，与 V0.1 结构一致。
 */

import { Marked, type Token, type Tokens } from 'marked'
import frontMatter from 'front-matter'
import { markedSemanticBlocks, type SemanticBlockToken } from './semantic'
import { markedAlert } from './vendor/alert'
import { markedFootnotes } from './vendor/footnotes'
import { escapeHtml } from './vendor/basicHelpers'
import readingTime from './vendor/readingTime'
import { countWords } from '../../utils/words'
import { processClipboardForWeChat } from './clipboard'
import { copyHtml } from './vendor/browser-clipboard'
import type {
  CopyOptions,
  CopyResult,
  EditorialEngine,
  EngineStructure,
  RenderResult,
  SemanticBlockInfo,
} from '../types'

function createMarked(): Marked {
  const md = new Marked()
  md.setOptions({ gfm: true, breaks: false })

  // 语义扩展是 `:::` 的唯一认领者（alert 关闭 container，见 vendor/alert.ts）。
  md.use(markedSemanticBlocks())
  md.use(markedAlert({ container: false }))
  md.use(markedFootnotes())

  md.use({
    renderer: {
      // 原始 HTML 只转义、不注入。
      html(this: unknown, token: { text: string }) {
        return escapeHtml(token.text)
      },
      // 表格结构与 V0.1 对齐：.table-wrap 包裹，无 align 属性。
      table(this: { parser: { parseInline(t: Token[]): string } }, token: Tokens.Table) {
        const head = token.header.map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`).join('')
        const body = token.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`)
          .join('')
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
      },
    },
  })

  return md
}

export interface DoocsRenderOutcome {
  html: string
  frontmatter: Record<string, unknown>
  tokens: Token[]
}

export function renderDoocsHtml(markdown: string): DoocsRenderOutcome {
  let attributes: Record<string, unknown> = {}
  let body = markdown
  try {
    const parsed = frontMatter<Record<string, unknown>>(markdown)
    attributes = parsed.attributes ?? {}
    body = parsed.body
  } catch {
    body = markdown
  }

  const md = createMarked()
  const tokens = md.lexer(body)
  const html = md.parser(tokens)
  return { html, frontmatter: attributes, tokens }
}

function collectStructure(tokens: readonly Token[]): EngineStructure {
  const images: string[] = []
  const tableCols: number[] = []
  const semanticBlocks: SemanticBlockInfo[] = []

  const walk = (list: readonly Token[] | undefined) => {
    if (!list) return
    for (const t of list) {
      switch (t.type) {
        case 'semanticBlock': {
          const s = t as SemanticBlockToken
          semanticBlocks.push({ type: s.sType, props: s.props, lines: s.lines, invalid: s.invalid, unknown: s.unknown })
          break
        }
        case 'image':
          images.push((t as Tokens.Image).href)
          break
        case 'table':
          tableCols.push((t as Tokens.Table).header.length)
          break
        default:
          break
      }
      if ('tokens' in t && Array.isArray((t as { tokens?: unknown }).tokens)) {
        walk((t as { tokens: Token[] }).tokens)
      }
    }
  }
  walk(tokens)
  return { images, tableCols, semanticBlocks }
}

export const doocsEngine: EditorialEngine = {
  name: 'doocs',

  render(markdown: string): RenderResult {
    const { html, frontmatter, tokens } = renderDoocsHtml(markdown)
    const structure = collectStructure(tokens)
    const wordCount = countWords(markdown)
    const rt = readingTime(markdown)

    return {
      html,
      frontmatter,
      structure,
      wordCount,
      readingTime: { words: rt.words, minutes: rt.minutes },
      blockCount: tokens.length,
      diagnostics: structure.semanticBlocks
        .filter((b) => b.invalid || b.unknown)
        .map((b) => (b.invalid ? `:::${b.type} 未闭合` : `未知语义块 ${b.type}`)),
    }
  },

  async copyToWechat(markdown: string, options?: CopyOptions): Promise<CopyResult> {
    try {
      const { html, plainText } = await processClipboardForWeChat(markdown, options?.previewEl ?? null)
      await copyHtml(html, plainText)
      return { ok: true, html, plainText }
    } catch {
      return { ok: false, html: '', plainText: '' }
    }
  },
}
