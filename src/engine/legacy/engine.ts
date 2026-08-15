/**
 * Legacy 引擎：V0.1 自研解析器，作为 A/B 回归的基准，也作为引擎切换的兜底。
 * 解析逻辑本身仍保留在 src/markdown/，未被改动。
 */

import { parseMarkdown } from '../../markdown/parser'
import { countWords } from '../../utils/words'
import readingTime from '../doocs/vendor/readingTime'
import { renderLegacyHtml } from './renderHtml'
import { structureFromBlocks } from './structure'
import { copyWechat, toPlainText, toWechatHtml } from '../../render/clipboard'
import { recordClipboardError } from '../../clipboard/errors'
import type { CopyOptions, CopyResult, EditorialEngine, RenderResult } from '../types'

export const legacyEngine: EditorialEngine = {
  name: 'legacy',

  render(markdown: string): RenderResult {
    const parsed = parseMarkdown(markdown)
    const html = renderLegacyHtml(parsed.blocks)
    const structure = structureFromBlocks(parsed.blocks)
    const wordCount = countWords(markdown)
    const rt = readingTime(markdown)

    return {
      html,
      frontmatter: parsed.frontmatter,
      structure,
      wordCount,
      readingTime: { words: rt.words, minutes: rt.minutes },
      blockCount: parsed.blocks.length,
      diagnostics: parsed.diagnostics.map((d) => d.message),
    }
  },

  async copyToWechat(markdown: string, options?: CopyOptions): Promise<CopyResult> {
    try {
      const mode = options?.mode ?? 'editorial'
      const parsed = parseMarkdown(markdown)
      const copiedMode = await copyWechat(parsed, mode)
      return { ok: true, html: toWechatHtml(parsed, mode), plainText: toPlainText(parsed), mode: copiedMode }
    } catch (err) {
      recordClipboardError(`legacyEngine.copyToWechat`, err)
      return { ok: false, html: '', plainText: '' }
    }
  },
}
