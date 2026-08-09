/**
 * 剪贴板用主题 CSS。
 * 预览里 article.css 依赖 tokens.css 的 CSS 变量；WeChat 粘贴时没有 :root 上下文，
 * 所以导出前把 var(--x) 解析成具体值。CSS 变量解析是导出期主题处理，
 * 不是渲染管线的 regex 后处理（渲染管线保持结构化）。
 */

import tokensCss from '../../styles/tokens.css?inline'
import articleCssRaw from '../../styles/article.css?inline'

function extractVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {}
  const re = /--([\w-]+)\s*:\s*([^;]+);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) vars[`--${m[1]}`] = m[2].trim()
  return vars
}

const TOKENS: Record<string, string> = { ...extractVars(tokensCss), '--scale': '1' }

function resolveVars(css: string): string {
  return css.replace(
    /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
    (_all, name: string, fallback?: string) => TOKENS[name] ?? (fallback ? fallback.trim() : 'inherit'),
  )
}

/**
 * 剪贴板里 `.paper` 不应保留预览卡片外观（边框 / 阴影 / 内边距）。
 * 追加覆盖规则（相同特异性，靠顺序胜出）。
 */
const PAPER_OVERRIDE = `
.paper { border: none; box-shadow: none; background: transparent; padding: 0; margin: 0; max-width: none; }
`

export function getClipboardCss(): string {
  return resolveVars(articleCssRaw) + PAPER_OVERRIDE
}
