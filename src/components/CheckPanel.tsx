import type { CheckResult } from '../compat/check'
import type { EditorialDiagnostic } from '../engine/governance'

function CompatSection({ result }: { result: CheckResult }) {
  const statusClass = result.status === 'PASS' ? 'ok' : result.status === 'WARNING' ? 'warn' : 'fail'
  const count = result.findings.length
  return (
    <div className="check-section">
      <div className={`check-status ${statusClass}`}>
        {result.status}
        {count > 0 ? ` · ${count}` : ''}
      </div>
      {count === 0 ? (
        <div className="check-empty">未发现微信兼容性问题。</div>
      ) : (
        <ul className="check-list">
          {result.findings.map((f, i) => (
            <li key={i} className={`check-item ${f.severity}`}>
              <span className="check-code">{f.code}</span>
              <span className="check-msg">
                {f.message}
                {f.line ? ` · L${f.line}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const GOVERNANCE_LABEL: Record<string, string> = {
  'safety-invariant': 'INV',
  'machine-lint': 'LINT',
  'editorial-constraint': 'CON',
  heuristic: 'HINT',
}

function EpistemicSection({ diagnostics }: { diagnostics: EditorialDiagnostic[] }) {
  const errors = diagnostics.filter((d) => d.severity === 'error')
  const warnings = diagnostics.filter((d) => d.severity === 'warning')
  const infos = diagnostics.filter((d) => d.severity === 'info')
  const statusClass = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'ok'
  const statusText =
    errors.length > 0
      ? `LINT ERROR · ${errors.length}`
      : warnings.length > 0
        ? `LINT WARNING · ${warnings.length}`
        : infos.length > 0
          ? `LINT INFO · ${infos.length}`
          : 'LINT PASS'
  return (
    <div className="check-section">
      <div className={`check-status ${statusClass}`}>{statusText}</div>
      {diagnostics.length === 0 ? (
        <div className="check-empty">未发现认识论问题。</div>
      ) : (
        <ul className="check-list">
          {diagnostics.map((d, i) => (
            <li key={i} className={`check-item ${d.severity === 'error' ? 'fail' : d.severity === 'warning' ? 'warn' : ''}`}>
              <span className="check-code">{GOVERNANCE_LABEL[d.governance] ?? '?'}·{d.code}</span>
              <span className="check-msg">{d.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CheckPanel({
  result,
  epistemic,
}: {
  result: CheckResult
  epistemic?: EditorialDiagnostic[]
}) {
  return (
    <div className="check-panel" role="status">
      <CompatSection result={result} />
      <EpistemicSection diagnostics={epistemic ?? []} />
    </div>
  )
}
