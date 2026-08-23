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
import { markedSemanticBlocks, setRenderCtx, type SemanticBlockToken } from './semantic'
import { markedAlert } from './vendor/alert'
import { markedFootnotes } from './vendor/footnotes'
import { escapeHtml } from './vendor/basicHelpers'
import { buildAnchorDirections, buildClaimIndex } from '../shared/semanticHtml'
import { createV03HeadingRenderer } from '../shared/v03Heading'
import { validateDocument } from '../validate'
import readingTime from './vendor/readingTime'
import { countWords } from '../../utils/words'
import { copyHtml } from './vendor/browser-clipboard'
import { compileForWechat } from '../wechat/compiler'
import { recordClipboardError } from '../../clipboard/errors'
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

  // V0.3 渲染层 H2 编号（D1）：闭包按文档重置；序号为真实文本。
  const headings = createV03HeadingRenderer()

  // 语义扩展是 `:::` 的唯一认领者（alert 关闭 container，见 vendor/alert.ts）。
  md.use(markedSemanticBlocks())
  md.use(markedAlert({ container: false }))
  md.use(markedFootnotes())

  md.use({
    renderer: {
      // V0.3：H2 自动编号 01/02/03（H3 不编号；intro 无 00）。
      heading(this: { parser: { parseInline(t: Token[]): string } }, token: Tokens.Heading) {
        return headings.renderHeading(token.depth, this.parser.parseInline(token.tokens))
      },
      // 原始 HTML 只转义、不注入。
      html(this: unknown, token: { text: string }) {
        return escapeHtml(token.text)
      },
      // 普通 `>` 引用保持中性；引文内以 `—`（U+2014）开头的行作为来源行渲染为 .q-source。
      // 约定：`> —— 来源` 是作者显式书写，非伪造。同段内 `引文\n—— 来源`（marked 合并为一段）与
      // 独立段落两种情况都处理；无来源行时输出等同默认 blockquote。
      blockquote(this: { parser: { parse(tokens: Token[]): string; parseInline(tokens: Token[]): string } }, token: Tokens.Blockquote) {
        const inner = this.parser.parse(token.tokens ?? [])
        return `<blockquote>${splitQuoteSource(inner)}</blockquote>`
      },
      // GFM task list 的原生 checkbox 由 listitem 用真实符号 ☑/☐ 代替 → 压制 `<input>`（微信不可存活）。
      checkbox() {
        return ''
      },
      // §12.12：图片 title 属性作为 caption（ANNOTATION 语法），与 legacy 引擎一致。
      image(this: unknown, token: Tokens.Image) {
        const src = escapeHtml(token.href)
        const alt = escapeHtml(token.text)
        const title = token.title ? escapeHtml(token.title) : ''
        return title
          ? `<figure class="figure"><img src="${src}" alt="${alt}" title="${title}" /><figcaption class="figure-caption">${title}</figcaption></figure>`
          : `<img src="${src}" alt="${alt}" />`
      },
      // task list（GFM）：真实符号 ☑/☐（可复制、微信稳定），不用 <input>（微信不可存活）。
      // 非 task 项走默认渲染路径，输出与 marked 默认一致（tight 单段 parseInline，其余 parse）。
      listitem(this: { parser: { parse(t: Token[]): string; parseInline(t: Token[]): string } }, token: Tokens.ListItem) {
        const mark = token.task
          ? token.checked
            ? '<span class="task-mark task-done">☑</span> '
            : '<span class="task-mark">☐</span> '
          : ''
        const isTight = token.tokens.length === 1 && token.tokens[0].type === 'paragraph'
        const body = isTight
          ? this.parser.parseInline((token.tokens[0] as Tokens.Paragraph).tokens)
          : this.parser.parse(token.tokens)
        return `<li>${mark}${body}</li>`
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

/**
 * 把 blockquote 渲染 HTML 中，末段以 `—`（U+2014）开头的行拆为 .q-source 来源行。
 * 只处理最后一个 `<p>…</p>`（marked 把同段 `引文\n—— 来源` 合并为一个段落）；无来源行原样返回。
 */
function splitQuoteSource(innerHtml: string): string {
  const lastOpen = innerHtml.lastIndexOf('<p>')
  if (lastOpen === -1) return innerHtml
  const lastClose = innerHtml.lastIndexOf('</p>')
  if (lastClose < lastOpen) return innerHtml
  const body = innerHtml.slice(lastOpen + 3, lastClose)
  const lines = body.split('\n')
  const srcIdx = lines.findIndex((l) => l.trimStart().startsWith('—'))
  if (srcIdx === -1) return innerHtml
  const quote = lines.slice(0, srcIdx).join('\n')
  const src = lines.slice(srcIdx).join('\n')
  const prefix = quote ? `<p>${quote}</p><p class="q-source">${src}</p>` : `<p class="q-source">${src}</p>`
  return innerHtml.slice(0, lastOpen) + prefix + innerHtml.slice(lastClose + 4)
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

  // claim/锚点索引在完整 lex 后、parser 前构建并注入渲染上下文（render 同步，无交错）。
  // doocs token 用 sType 表示块类型；共享索引期待 type 字段，这里映射。
  const blocks = tokens
    .filter((t): t is SemanticBlockToken => t.type === 'semanticBlock')
    .map((t) => ({ type: t.sType, props: t.props, lines: t.lines }))
  const { claimMap, ambiguousIds } = buildClaimIndex(blocks)
  const anchorDirections = buildAnchorDirections(blocks)
  setRenderCtx({ claimMap, ambiguousIds, anchorDirections })

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
      // V0.2 认识论诊断（作者时 lint；渲染路径与 validator 隔离，不改 HTML/tokens）。
      epistemicDiagnostics: validateDocument(tokens),
    }
  },

  async copyToWechat(markdown: string, options?: CopyOptions): Promise<CopyResult> {
    try {
      // V0.2.2：剪贴板消费【微信目标编译 artifact】（与微信预览同一产物），不再克隆浏览器预览 DOM。
      const { html, plainText } = compileForWechat(markdown, { mode: options?.mode })
      const outcome = await copyHtml(html, plainText)
      // mode 传播：rich = 双 MIME 写入成功；plain = 已降级纯文本（UI 据此提示，不再假装样式已复制）。
      return { ok: true, html, plainText, mode: outcome.mode }
    } catch (err) {
      recordClipboardError(`doocsEngine.copyToWechat`, err)
      return { ok: false, html: '', plainText: '' }
    }
  },
}
