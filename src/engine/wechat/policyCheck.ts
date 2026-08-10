/**
 * 静态微信安全策略检查（V0.2.2，dev/test utility）。
 *
 * 检查最终微信 artifact 是否含有 WECHAT_SAFE_PROFILE_V1 的 PRODUCTION_FORBIDDEN primitives。
 * 只扫 style 属性值（产物为纯 inline style）避免正文误报；`@media`/`<style>`/`var(--` 全文档扫。
 *
 * 诚实边界：这【不是】微信兼容证明，只强制本地安全 profile。
 */

export interface PolicyFinding {
  code: string
  severity: 'error' | 'warning'
  message: string
}

const STYLE_CHECKS: { code: string; re: RegExp; message: string }[] = [
  { code: 'forbidden-flex', re: /display\s*:\s*flex/i, message: 'display:flex 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-flex-direction', re: /flex-direction/i, message: 'flex-direction 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-flex-wrap', re: /flex-wrap/i, message: 'flex-wrap 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-align-items', re: /align-items/i, message: 'align-items 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-justify-content', re: /justify-content/i, message: 'justify-content 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-gap', re: /(?:^|[;\s])gap\s*:/i, message: 'gap 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-clamp', re: /clamp\s*\(/i, message: 'clamp() 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-vw', re: /\b\d*\.?\d+vw\b/i, message: 'vw 单位是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-nowrap', re: /white-space\s*:\s*nowrap/i, message: 'white-space:nowrap 是 PRODUCTION_FORBIDDEN（长元数据溢出）' },
]

const DOC_CHECKS: { code: string; re: RegExp; message: string }[] = [
  { code: 'forbidden-media', re: /@media/i, message: 'media query 是 PRODUCTION_FORBIDDEN' },
  { code: 'forbidden-style-tag', re: /<style[^>]*>/i, message: '产物不应残留 <style> 标签' },
  { code: 'forbidden-css-variable', re: /var\(\s*--/i, message: 'CSS 变量必须在内联前解析，产物不得含 var(--)' },
]

function styleValues(html: string): string[] {
  const out: string[] = []
  const re = /style\s*=\s*"([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

export function checkWechatPolicy(html: string): PolicyFinding[] {
  const findings: PolicyFinding[] = []
  const styles = styleValues(html).join('\n')
  for (const c of STYLE_CHECKS) {
    if (c.re.test(styles)) {
      findings.push({ code: c.code, severity: 'error', message: c.message })
    }
  }
  for (const c of DOC_CHECKS) {
    if (c.re.test(html)) {
      findings.push({ code: c.code, severity: 'error', message: c.message })
    }
  }
  return findings
}
