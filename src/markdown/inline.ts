import type { InlineNode } from './types'

function splitUrlTitle(inner: string): { url: string; title?: string } {
  inner = inner.trim()
  const m = inner.match(/^(\S+)\s+["'](.+)["']$/)
  if (m) return { url: m[1], title: m[2] }
  return { url: inner }
}

function findClosingParen(s: string, from: number): number {
  let depth = 0
  for (let j = from; j < s.length; j++) {
    const ch = s[j]
    if (ch === '(') depth++
    else if (ch === ')') {
      if (depth === 0) return j
      depth--
    }
  }
  return -1
}

/** 单遍扫描的 inline 解析：`code`、**strong**、*em*、[link](url)、![img](url)。 */
export function parseInline(src: string): InlineNode[] {
  const out: InlineNode[] = []
  let i = 0

  const pushText = (t: string) => {
    if (!t) return
    const last = out[out.length - 1]
    if (last && last.type === 'text') last.value += t
    else out.push({ type: 'text', value: t })
  }

  while (i < src.length) {
    const c = src[i]

    if (c === '`') {
      const end = src.indexOf('`', i + 1)
      if (end !== -1) {
        out.push({ type: 'code', value: src.slice(i + 1, end) })
        i = end + 1
        continue
      }
      pushText(c)
      i++
      continue
    }

    if (c === '!' && src[i + 1] === '[') {
      const close = src.indexOf(']', i + 2)
      if (close !== -1 && src[close + 1] === '(') {
        const parenEnd = findClosingParen(src, close + 2)
        if (parenEnd !== -1) {
          const alt = src.slice(i + 2, close)
          const { url, title } = splitUrlTitle(src.slice(close + 2, parenEnd))
          out.push({ type: 'image', alt, src: url, title })
          i = parenEnd + 1
          continue
        }
      }
      pushText(c)
      i++
      continue
    }

    if (c === '[') {
      const close = src.indexOf(']', i + 1)
      if (close !== -1 && src[close + 1] === '(') {
        const parenEnd = findClosingParen(src, close + 2)
        if (parenEnd !== -1) {
          const label = src.slice(i + 1, close)
          const { url, title } = splitUrlTitle(src.slice(close + 2, parenEnd))
          out.push({ type: 'link', href: url, title, children: parseInline(label) })
          i = parenEnd + 1
          continue
        }
      }
      pushText(c)
      i++
      continue
    }

    if (c === '*' || c === '_') {
      const two = src.slice(i, i + 2) === '**' || src.slice(i, i + 2) === '__'
      const marker = two ? src.slice(i, i + 2) : c
      const rest = src.slice(i + marker.length)
      const closeIdx = rest.indexOf(marker)
      const inner = closeIdx !== -1 ? rest.slice(0, closeIdx) : ''
      if (closeIdx !== -1 && inner.length > 0) {
        out.push(
          two
            ? { type: 'strong', children: parseInline(inner) }
            : { type: 'em', children: parseInline(inner) },
        )
        i += marker.length + closeIdx + marker.length
        continue
      }
      pushText(c)
      i++
      continue
    }

    pushText(c)
    i++
  }

  return out
}
