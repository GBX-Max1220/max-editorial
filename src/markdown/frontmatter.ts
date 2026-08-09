/**
 * 极简 frontmatter 解析：扁平键 + 两级嵌套对象（如 next.title）。
 * 足够 V0.1 使用；完整 YAML 不属于本层职责。
 */
function parseScalar(v: string): unknown {
  v = v.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  if (/^-?\d+$/.test(v)) return Number(v)
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

export function parseFrontmatter(lines: string[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') {
      i++
      continue
    }
    const m = trimmed.match(/^([\w-]+):\s*(.*)$/)
    if (m) {
      const key = m[1]
      const rest = m[2]
      if (rest === '' && i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) {
        const obj: Record<string, unknown> = {}
        i++
        while (i < lines.length) {
          const sub = lines[i].match(/^\s{2,}([\w-]+):\s*(.*)$/)
          if (!sub) break
          obj[sub[1]] = parseScalar(sub[2])
          i++
        }
        data[key] = obj
        continue
      }
      data[key] = parseScalar(rest)
      i++
    } else {
      i++
    }
  }
  return data
}
