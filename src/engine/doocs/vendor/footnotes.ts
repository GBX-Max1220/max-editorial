/**
 * VENDORED from doocs/md (adapted).
 * Upstream: https://github.com/doocs/md
 * Commit:   4699016755d0a699197aa6d634ed87f5a693b649
 * Source:   packages/core/src/extensions/footnotes.ts
 * License:  WTFPL v2
 * Modifications: `var(--md-primary-color)` replaced with `currentColor` — Max Editorial
 *   does not define that theme variable, and currentColor keeps footnotes legible in
 *   both preview and WeChat paste.
 */

import type { MarkedExtension, Tokens } from 'marked'

interface MapContent {
  index: number
  text: string
}

export function markedFootnotes(): MarkedExtension {
  const fnMap = new Map<string, MapContent>()

  return {
    hooks: {
      preprocess(markdown) {
        fnMap.clear()
        return markdown
      },
    },
    extensions: [
      {
        name: `footnoteDef`,
        level: `block`,
        start(src: string) {
          return src.match(/^\[\^/)?.index
        },
        tokenizer(src: string) {
          const match = src.match(/^\[\^(.*)\]:(.*)/)
          if (match) {
            const [raw, fnId, text] = match
            const index = fnMap.size + 1
            fnMap.set(fnId, { index, text })
            return {
              type: `footnoteDef`,
              raw,
              fnId,
              index,
              text,
            }
          }
          return undefined
        },
        renderer(token: Tokens.Generic) {
          const { index, text, fnId } = token
          const fnInner = `
                <code>${index}.</code>
                <span>${text}</span>
                    <a id="fnDef-${fnId}" href="#fnRef-${fnId}" style="color: currentColor;">↩︎</a>
                <br>`
          if (index === 1) {
            return `
            <p style="font-size: 80%;margin: 0.5em 8px;word-break:break-all;">${fnInner}`
          }
          if (index === fnMap.size) {
            return `${fnInner}</p>`
          }
          return fnInner
        },
      },
      {
        name: `footnoteRef`,
        level: `inline`,
        start(src: string) {
          return src.match(/\[\^/)?.index
        },
        tokenizer(src: string) {
          const match = src.match(/^\[\^(.*?)\]/)
          if (match) {
            const [raw, fnId] = match
            return {
              type: `footnoteRef`,
              raw,
              fnId,
            }
          }
        },
        renderer(token: Tokens.Generic) {
          const { fnId } = token
          const reference = fnMap.get(fnId)
          if (!reference) {
            return token.raw
          }

          const { index } = reference
          return `<sup style="color: currentColor;">
                    <a href="#fnDef-${fnId}" id="fnRef-${fnId}">\[${index}\]</a>
                </sup>`
        },
      },
    ],
  }
}
