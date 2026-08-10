import { parseInline } from './inline'
import { parseFrontmatter } from './frontmatter'
import type { Block, ListItem, ParserDiagnostic, ParseResult, SemanticBlock } from './types'

const KNOWN_SEMANTIC = new Set([
  'claim',
  'question',
  'ai-output',
  'judgment',
  'evidence',
  'counterpoint',
  'lab-note',
  'metric',
])

function findFenceClose(lines: string[], from: number, marker: string): number {
  for (let i = from; i < lines.length; i++) {
    if (lines[i].trim() === marker) return i
  }
  return -1
}

function parseSemanticHeader(header: string): { type: string; props: Record<string, string> } {
  const m = header.match(/^(\S+)(.*)$/)
  const type = m?.[1] ?? ''
  const props: Record<string, string> = {}
  const rest = m?.[2] ?? ''
  const propRe = /(\w+)\s*=\s*("[^"]*"|'[^']*'|\S+)/g
  let pm: RegExpExecArray | null
  while ((pm = propRe.exec(rest))) {
    let v = pm[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    props[pm[1]] = v
  }
  return { type, props }
}

function dedent(lines: string[]): string[] {
  const indents = lines
    .filter((l) => l.trim() !== '')
    .map((l) => l.match(/^\s*/)?.[0].length ?? 0)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => {
    const ws = l.match(/^\s*/)?.[0].length ?? 0
    return l.slice(Math.min(min, ws))
  })
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\s*\|?/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())
}

function isTableDelimiter(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-')
}

const headingRe = /^(#{1,6})\s+(.*)$/
const hrRe = /^(-{3,}|\*{3,}|_{3,})$/

/**
 * 行级 block 解析：frontmatter + 7 个语义块 + 基础 markdown。
 * 输出纯数据（Block[]），与渲染完全解耦——未来可整体替换成 Doocs engine。
 */
export function parseMarkdown(src: string): ParseResult {
  const text = src.replace(/\r\n/g, '\n')
  const diagnostics: ParserDiagnostic[] = []
  const lines = text.split('\n')
  const frontmatter: Record<string, unknown> = {}
  let idx = 0

  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
    if (end !== -1) {
      Object.assign(frontmatter, parseFrontmatter(lines.slice(1, end)))
      idx = end + 1
    } else {
      diagnostics.push({ kind: 'bad-frontmatter', line: 1, message: 'Frontmatter 开始标记 --- 未闭合' })
    }
  }

  const blocks: Block[] = []

  while (idx < lines.length) {
    const line = lines[idx]
    const t = line.trim()

    if (t === '') {
      idx++
      continue
    }

    // 语义块 :::type [key="value"]
    if (t.startsWith(':::')) {
      const close = findFenceClose(lines, idx + 1, ':::')
      const { type, props } = parseSemanticHeader(t.slice(3))
      const bodyEnd = close === -1 ? lines.length : close
      const bodyLines = dedent(lines.slice(idx + 1, bodyEnd))
      const block: SemanticBlock = {
        kind: 'semantic',
        type,
        props,
        raw: bodyLines.join('\n'),
        lines: bodyLines,
        invalid: close === -1,
        unknown: !KNOWN_SEMANTIC.has(type),
      }
      if (close === -1) {
        diagnostics.push({ kind: 'invalid-semantic', line: idx + 1, message: `:::${type} 未闭合` })
      }
      blocks.push(block)
      idx = close === -1 ? lines.length : close + 1
      continue
    }

    // 代码块
    if (/^(```|~~~)/.test(t)) {
      const marker = t.slice(0, 3)
      const lang = t.slice(3).trim()
      const close = findFenceClose(lines, idx + 1, marker)
      const codeEnd = close === -1 ? lines.length : close
      blocks.push({ kind: 'code', lang, code: lines.slice(idx + 1, codeEnd).join('\n') })
      if (close === -1) {
        diagnostics.push({ kind: 'unclosed-fence', line: idx + 1, message: '代码块未闭合' })
      }
      idx = close === -1 ? lines.length : close + 1
      continue
    }

    // 分隔线
    if (hrRe.test(t)) {
      blocks.push({ kind: 'hr' })
      idx++
      continue
    }

    // 标题
    const h = t.match(headingRe)
    if (h) {
      blocks.push({
        kind: 'heading',
        level: h[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        inline: parseInline(h[2]),
        raw: h[2],
      })
      idx++
      continue
    }

    // 引用
    if (t.startsWith('>')) {
      const quoteLines: string[] = []
      while (idx < lines.length && lines[idx].trim().startsWith('>')) {
        quoteLines.push(lines[idx].replace(/^\s*>\s?/, ''))
        idx++
      }
      blocks.push({ kind: 'blockquote', inline: parseInline(quoteLines.join(' ')), raw: quoteLines.join('\n') })
      continue
    }

    // 列表
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: ListItem[] = []
      let lastOrdered: boolean | null = null
      while (idx < lines.length) {
        const l = lines[idx]
        const li = l.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/)
        if (!li) break
        const ordered = /^\d+\.$/.test(li[2])
        if (lastOrdered !== null && ordered !== lastOrdered) break
        lastOrdered = ordered
        const indent = li[1].length
        const itemLines: string[] = [li[3]]
        idx++
        while (
          idx < lines.length &&
          lines[idx].trim() !== '' &&
          /^\s/.test(lines[idx]) &&
          (lines[idx].match(/^\s*/)?.[0].length ?? 0) > indent
        ) {
          itemLines.push(lines[idx].trim())
          idx++
        }
        items.push({ inline: parseInline(itemLines.join(' ')), blocks: [] })
      }
      blocks.push({ kind: 'list', ordered: lastOrdered === true, items })
      continue
    }

    // 表格
    if (t.includes('|') && idx + 1 < lines.length && isTableDelimiter(lines[idx + 1])) {
      const headers = splitTableRow(t)
      idx += 2
      const rows: string[][] = []
      while (idx < lines.length && lines[idx].trim().includes('|')) {
        rows.push(splitTableRow(lines[idx].trim()))
        idx++
      }
      blocks.push({ kind: 'table', headers, rows })
      continue
    }

    // 段落
    const para: string[] = []
    while (idx < lines.length) {
      const l = lines[idx]
      const tt = l.trim()
      if (tt === '') break
      if (headingRe.test(tt)) break
      if (/^\s*[-*+]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) break
      if (tt.startsWith(':::')) break
      if (/^(```|~~~)/.test(tt)) break
      if (hrRe.test(tt)) break
      if (tt.startsWith('>')) break
      if (tt.includes('|') && idx + 1 < lines.length && isTableDelimiter(lines[idx + 1])) break
      para.push(tt)
      idx++
    }
    blocks.push({ kind: 'paragraph', inline: parseInline(para.join(' ')), raw: para.join(' ') })
  }

  return { frontmatter, blocks, diagnostics }
}
