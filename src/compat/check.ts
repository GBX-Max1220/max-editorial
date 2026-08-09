import type { EngineStructure } from '../engine/types'

export type CheckSeverity = 'pass' | 'warning' | 'fail'
export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL'

export interface CheckFinding {
  severity: Exclude<CheckSeverity, 'pass'>
  code: string
  message: string
  line?: number
}

export interface CheckResult {
  status: CheckStatus
  findings: CheckFinding[]
}

/**
 * 微信兼容性检查。引擎无关：只依赖 source + 引擎暴露的结构信息。
 * 规则有意保守：能 PASS 的不多警告，能警告的不升级 FAIL。
 */
export function runCompatibilityCheck(source: string, structure: EngineStructure): CheckResult {
  const findings: CheckFinding[] = []
  const lines = source.split('\n')
  const findLines = (re: RegExp) => lines.map((l, i) => (re.test(l) ? i + 1 : 0)).filter((n) => n !== 0)

  const cssLines = findLines(/<link[^>]*stylesheet/i)
  if (cssLines.length > 0) {
    findings.push({ severity: 'fail', code: 'external-css', message: '检测到外部 CSS 引用', line: cssLines[0] })
  }

  const scriptLines = findLines(/<script/i)
  if (scriptLines.length > 0) {
    findings.push({ severity: 'fail', code: 'script', message: '检测到 <script> 脚本', line: scriptLines[0] })
  }

  const iframeLines = findLines(/<iframe/i)
  if (iframeLines.length > 0) {
    findings.push({ severity: 'fail', code: 'iframe', message: '检测到 <iframe> 内嵌页面', line: iframeLines[0] })
  }

  const posLines = findLines(/position\s*:\s*(fixed|absolute|sticky)|z-index\s*:\s*\d+/i)
  if (posLines.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'complex-positioning',
      message: '检测到复杂定位 / z-index，微信可能不兼容',
      line: posLines[0],
    })
  }

  const badImages = structure.images.filter((u) => /^(file:\/\/|[A-Za-z]:[\\/])/.test(u))
  if (badImages.length > 0) {
    findings.push({ severity: 'warning', code: 'local-image', message: `图片使用本地路径：${badImages[0]}` })
  }

  const longLines = lines
    .map((l, i) => (/[\x21-\x7E]{61,}/.test(l) ? i + 1 : 0))
    .filter((n) => n !== 0)
  if (longLines.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'long-string',
      message: '存在超过 60 字符的连续字符串，可能破坏移动端换行',
      line: longLines[0],
    })
  }

  for (const b of structure.semanticBlocks) {
    const hasContent = b.lines.some((l) => l.trim() !== '')
    if (!hasContent && Object.keys(b.props).length === 0) {
      findings.push({ severity: 'warning', code: 'empty-block', message: `空的 ${b.type} 块` })
    }
    if (b.invalid) {
      findings.push({ severity: 'fail', code: 'invalid-semantic', message: `未闭合的 :::${b.type}` })
    }
    if (b.unknown) {
      findings.push({ severity: 'fail', code: 'unknown-block', message: `未知语义块 ${b.type}` })
    }
  }

  for (const cols of structure.tableCols) {
    if (cols > 6) {
      findings.push({ severity: 'warning', code: 'wide-table', message: '表格超过 6 列，微信端可能显示过宽' })
    }
  }

  const status: CheckStatus = findings.some((f) => f.severity === 'fail')
    ? 'FAIL'
    : findings.length > 0
      ? 'WARNING'
      : 'PASS'

  return { status, findings }
}
