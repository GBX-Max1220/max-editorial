/**
 * VENDORED from doocs/md (trimmed).
 * Upstream: https://github.com/doocs/md
 * Commit:   4699016755d0a699197aa6d634ed87f5a693b649
 * Source:   packages/core/src/extensions/alert.ts
 * License:  WTFPL v2
 * Modifications:
 *   - imports adapted to local paths (no @md/shared; asAlertRenderer vendored).
 *   - defaultAlertVariant trimmed to a small neutral set; icons dropped (renderAlert
 *     already tolerates an empty icon). Academic / obsidian variants removed.
 *   - added `container` option (default true = upstream behavior). Max Editorial
 *     registers `markedAlert({ container: false })` so the semantic extension is the
 *     SOLE owner of `:::` fences (marked gives priority to the last-registered
 *     matching tokenizer, so coexistence would let alert steal `:::`); the GFM
 *     `[!name]` alert path (walkTokens) remains active.
 */

import type { MarkedExtension, Tokens } from 'marked'
import type { AlertRendererFn, AlertRendererThis, AlertToken } from './marked-tokens'
import { asAlertRenderer } from './marked-tokens'
import { escapeHtml, ucfirst } from './basicHelpers'

export interface AlertVariantItem {
  type: string
  title?: string
  icon?: string
}

export interface AlertOptions {
  className?: string
  variants?: AlertVariantItem[]
  withoutStyle?: boolean
  /** 是否注册 `:::name` 容器扩展。Max Editorial 由语义扩展独占 `:::`，故关闭。 */
  container?: boolean
}

export function markedAlert(options: AlertOptions = {}): MarkedExtension {
  const { className = `markdown-alert`, variants = [], withoutStyle = false, container = true } = options
  const resolvedVariants = resolveVariants(variants)

  function resolveVariant(name: string): AlertVariantItem | null {
    const lower = name.toLowerCase()
    return resolvedVariants.find(v => v.type.toLowerCase() === lower) ?? null
  }

  function buildMeta(name: string, matchedVariant: AlertVariantItem | null, customTitle?: string, fromContainer = false) {
    const variant = matchedVariant ? matchedVariant.type : `custom`
    const defaultTitle = matchedVariant
      ? (matchedVariant.title ?? ucfirst(matchedVariant.type))
      : name
    const title = customTitle && customTitle.trim()
      ? customTitle.trim()
      : defaultTitle
    return {
      className,
      variant,
      icon: matchedVariant?.icon ?? ``,
      title: escapeHtml(title),
      titleClassName: `${className}-title`,
      fromContainer,
    }
  }

  const renderAlert: AlertRendererFn = function (this: AlertRendererThis, token: AlertToken) {
    const { meta, tokens = [] } = token
    const text = this.parser.parse(tokens)
    let tmpl = `<blockquote class="${meta.className} ${meta.className}-${meta.variant}">\n`
    tmpl += `<p class="${meta.titleClassName} alert-title-${meta.variant}">`
    if (!withoutStyle) {
      tmpl += meta.icon.replace(
        `<svg`,
        `<svg class="alert-icon-${meta.variant}"`,
      )
    }
    tmpl += meta.title
    tmpl += `</p>\n`
    tmpl += text
    tmpl += `</blockquote>\n`

    return tmpl
  }

  return {
    walkTokens(token) {
      if (token.type !== `blockquote`)
        return

      const headerMatch = /^\[!([^\]\n]+)\][ \t]*([^\n]*)/.exec(token.text)
      if (!headerMatch)
        return

      const name = headerMatch[1].trim()
      const customTitle = headerMatch[2]
      const matchedVariant = resolveVariant(name)

      Object.assign(token, {
        type: `alert`,
        meta: buildMeta(name, matchedVariant, customTitle),
      })

      const firstLine = token.tokens?.[0] as Tokens.Paragraph | undefined
      const inlineTokens = firstLine?.tokens
      if (inlineTokens?.length) {
        let stripped = false
        for (let i = 0; i < inlineTokens.length; i++) {
          const t = inlineTokens[i]
          if (t.type === `br`) {
            inlineTokens.splice(0, i + 1)
            stripped = true
            break
          }
          if (t.type === `text` && t.raw.includes(`\n`)) {
            const textToken = t as Tokens.Text
            const restRaw = textToken.raw.slice(textToken.raw.indexOf(`\n`) + 1)
            const nlInText = textToken.text.indexOf(`\n`)
            const restText = nlInText >= 0 ? textToken.text.slice(nlInText + 1) : restRaw
            inlineTokens.splice(0, i)
            if (restRaw === ``)
              inlineTokens.shift()
            else
              Object.assign(inlineTokens[0], { raw: restRaw, text: restText })
            stripped = true
            break
          }
        }
        if (!stripped || inlineTokens.length === 0)
          token.tokens?.shift()
      }
    },
    extensions: (() => {
      const list: MarkedExtension['extensions'] = [
        {
          name: `alert`,
          level: `block`,
          renderer: asAlertRenderer(renderAlert),
        },
      ]
      if (container) {
        list.push({
          name: `alertContainer`,
          level: `block`,
          start(src) {
            return src.match(/^:::/)?.index
          },
          tokenizer(src) {
            const match = /^:::[ \t]*(\S+)[ \t]*([^\n]*)\n([\s\S]*?)\n:::/.exec(src)

            if (match) {
              const [raw, name, customTitle, content] = match
              const matchedVariant = resolveVariant(name)

              return {
                type: `alert`,
                raw,
                text: content.trim(),
                tokens: this.lexer.blockTokens(content.trim()),
                meta: buildMeta(name, matchedVariant, customTitle, true),
              }
            }
          },
          renderer: asAlertRenderer(renderAlert),
        })
      }
      return list
    })(),
  }
}

const defaultAlertVariant: AlertVariantItem[] = [
  { type: `note` },
  { type: `info` },
  { type: `tip` },
  { type: `important` },
  { type: `warning` },
  { type: `caution` },
  { type: `question` },
  { type: `danger` },
]

export function resolveVariants(variants: AlertVariantItem[]) {
  if (!variants.length)
    return defaultAlertVariant

  return Object.values(
    [...defaultAlertVariant, ...variants].reduce(
      (map, item) => {
        map[item.type] = item
        return map
      },
      {} as { [key: string]: AlertVariantItem },
    ),
  )
}

export function createSyntaxPattern(type: string) {
  return `^(?:\\[!${type}])\\s*?\n*`
}
