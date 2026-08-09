import type { CheckResult } from '../compat/check'

export function CheckPanel({ result }: { result: CheckResult }) {
  const statusClass = result.status === 'PASS' ? 'ok' : result.status === 'WARNING' ? 'warn' : 'fail'
  const count = result.findings.length
  return (
    <div className="check-panel" role="status">
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
