/**
 * WeChat copy-back 诊断（dev-only，Phase 3 spike）。
 *
 * 用途：用户在微信编辑器里 Ctrl+A / Ctrl+C 复制回内容，粘贴到这里，
 * 与粘贴前（PRE-WECHAT）的剪贴板 HTML 做结构/样式差异比对。
 *
 * 诚实边界（重要）：
 *  - copy-back 不是发布渲染的完美证明——微信编辑器内部可能再次转换，且内容可能被
 *    部分重排/脱粘。它是【诊断辅助】，真实微信视觉结果仍是 source of truth。
 *  - 本模块不声称能解释微信为何这样处理，只报告 observable 差异。
 *
 * 依赖浏览器 DOMParser（浏览器/jest-jsdom 均可用）。
 */

export type DiffKind =
  | 'element-removed'
  | 'element-added'
  | 'structure-flattened'
  | 'style-removed'
  | 'style-rewritten'
  | 'value-normalized'

export interface HtmlDiffFinding {
  kind: DiffKind
  /** 文档顺序路径，如 `body > section[1] > div.sblock-label`。 */
  path: string
  prop?: string
  before?: string
  after?: string
  note?: string
}

interface ElemDesc {
  path: string
  tag: string
  index: number
  style: Map<string, string>
  childCount: number
}

function parseStyle(styleAttr: string | null): Map<string, string> {
  const m = new Map<string, string>()
  if (!styleAttr) return m
  for (const decl of styleAttr.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const prop = decl.slice(0, i).trim().toLowerCase()
    const value = decl.slice(i + 1).trim()
    if (prop) m.set(prop, value)
  }
  return m
}

function tagOf(el: Element): string {
  return el.tagName.toLowerCase()
}

/** 以文档顺序收集元素描述（含 style 解析）。跳过无意义节点。 */
function collect(root: Element): ElemDesc[] {
  const out: ElemDesc[] = []
  const walk = (el: Element, path: string, idxInParent: number) => {
    out.push({
      path,
      tag: tagOf(el),
      index: idxInParent,
      style: parseStyle(el.getAttribute('style')),
      childCount: el.children.length,
    })
    let ci = 0
    for (const child of el.children) {
      walk(child, `${path} > ${tagOf(child)}`, ci)
      ci++
    }
  }
  // 用 root（如 <body> 或包裹容器）作为起点。
  let ci = 0
  for (const child of root.children) {
    walk(child, tagOf(child), ci)
    ci++
  }
  return out
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** 判定"值被微信规范化"的启发式（单位换算 / 颜色格式），非精确证明。 */
function looksNormalized(before: string, after: string): boolean {
  if (before === after) return false
  const colorB = before.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i)
  const colorA = after.match(/^rgb\(/i)
  if (colorB && colorA) return true
  const pxEm = (v: string) => /^-?\d*\.?\d+(px|em|rem|pt|%)$/.test(v)
  if (pxEm(before) && pxEm(after)) return true
  // "1px solid #fff" 类简写被展开为多个 longhand。
  if (before.includes(' ') && after.includes(' ')) return true
  return false
}

/**
 * 对比 PRE-WECHAT 与 POST-WECHAT-COPYBACK 的 HTML。
 * 按文档顺序路径配对元素；报告元素增删、样式属性增删改、规范化。
 */
export function diffHtml(pre: string, post: string): HtmlDiffFinding[] {
  const findings: HtmlDiffFinding[] = []
  const a = collect(parse(pre).body)
  const b = collect(parse(post).body)
  const bByPath = new Map<string, ElemDesc>()
  for (const e of b) {
    const prev = bByPath.get(e.path)
    if (prev) {
      // 同一路径出现多次（如多行同结构）：仅记录第一个用于比对，其余略过（诊断辅助不追求完备）。
      continue
    }
    bByPath.set(e.path, e)
  }
  const seenPost = new Set<string>()

  for (const ea of a) {
    const eb = bByPath.get(ea.path)
    if (!eb) {
      findings.push({
        kind: ea.childCount > 0 ? 'structure-flattened' : 'element-removed',
        path: ea.path,
        note: ea.childCount > 0 ? '容器/子结构在 copy-back 中消失' : '元素在 copy-back 中消失',
      })
      continue
    }
    seenPost.add(ea.path)
    if (eb.tag !== ea.tag) {
      findings.push({ kind: 'structure-flattened', path: ea.path, note: `${ea.tag} → ${eb.tag}（标签被改写）` })
    }
    for (const [prop, before] of ea.style) {
      const after = eb.style.get(prop)
      if (after === undefined) {
        findings.push({ kind: 'style-removed', path: ea.path, prop, before, note: `样式属性被移除` })
      } else if (after !== before) {
        const kind: DiffKind = looksNormalized(before, after) ? 'value-normalized' : 'style-rewritten'
        findings.push({ kind, path: ea.path, prop, before, after })
      }
    }
    for (const [prop, after] of eb.style) {
      if (!ea.style.has(prop)) {
        findings.push({ kind: 'style-rewritten', path: ea.path, prop, after, note: '微信新增的样式属性' })
      }
    }
  }
  for (const eb of b) {
    if (!seenPost.has(eb.path)) {
      findings.push({ kind: 'element-added', path: eb.path, note: 'copy-back 中新增的元素' })
    }
  }
  return findings
}
