import { useMemo, useState } from 'react'
import type { PreviewMode } from '../engine/types'
import {
  collectClipboardEnv,
  runTestA,
  runTestB,
  runTestC,
  runTestD,
  TEST_A_TEXT,
  type ClipboardEnvInfo,
  type DiagResult,
} from '../clipboard/diag'
import { clearClipboardErrors, readClipboardErrors, type ClipboardErrorRecord } from '../clipboard/errors'

/**
 * dev-only：剪贴板传输层诊断面板。
 * 环境快照 + 四层隔离测试（A/B/C/D）+ 生产 copy 路径的实时错误日志。
 * 只诊断，不加降级、不改生产视觉。
 */

interface Props {
  source: string
  mode: PreviewMode
}

interface DiagTestDef {
  id: 'A' | 'B' | 'C' | 'D'
  label: string
  desc: string
  run: () => Promise<DiagResult>
}

const ENV_ROWS: { key: keyof ClipboardEnvInfo; label: string }[] = [
  { key: 'href', label: 'location.href' },
  { key: 'isSecureContext', label: 'isSecureContext' },
  { key: 'hasFocus', label: 'document.hasFocus()' },
  { key: 'clipboardAvailable', label: 'navigator.clipboard' },
  { key: 'writeAvailable', label: 'clipboard.write' },
  { key: 'writeTextAvailable', label: 'clipboard.writeText' },
  { key: 'clipboardItemAvailable', label: 'ClipboardItem' },
  { key: 'clipboardItemSupportsHtml', label: 'ClipboardItem.supports("text/html")' },
  { key: 'userAgent', label: 'user agent' },
]

function EnvValue({ value }: { value: boolean | 'n/a' | string }) {
  if (typeof value === 'boolean') {
    return <span className={value ? 'cbdiag-env-ok' : 'cbdiag-env-bad'}>{value ? 'YES' : 'NO'}</span>
  }
  return <span className="cbdiag-env-str">{value}</span>
}

function ResultCard({
  test,
  result,
  onRun,
}: {
  test: DiagTestDef
  result: DiagResult | 'running' | null
  onRun: () => void
}) {
  return (
    <div className={`cbdiag-test ${result && result !== 'running' ? (result.pass ? 'pass' : 'fail') : ''}`}>
      <button className="ghost" onClick={onRun} disabled={result === 'running'}>
        RUN {test.id}
      </button>
      <div className="cbdiag-test-info">
        <div className="cbdiag-test-label">{test.label}</div>
        <div className="cbdiag-test-desc">{test.desc}</div>
      </div>
      <div className="cbdiag-test-status">
        {result === 'running' && <span className="cbdiag-running">RUNNING…</span>}
        {result && result !== 'running' && (
          <>
            <span className={result.pass ? 'cbdiag-pass' : 'cbdiag-fail'}>{result.pass ? 'PASS' : 'FAIL'}</span>
            {result.stage && <span className="cbdiag-stage">{result.stage}</span>}
            <span className="cbdiag-mime">{result.mimeTypes.join(' + ')}</span>
            {result.htmlLength !== undefined && (
              <span className="cbdiag-metric">HTML {result.htmlLength} chars</span>
            )}
            {result.plainLength !== undefined && (
              <span className="cbdiag-metric">PLAIN {result.plainLength} chars</span>
            )}
            {result.topLevelElementCount !== undefined && result.topLevelElementCount >= 0 && (
              <span className="cbdiag-metric">TOP {result.topLevelElementCount} els</span>
            )}
            {!result.pass && result.errorName && <span className="cbdiag-err">[{result.errorName}]</span>}
            {!result.pass && result.errorMessage && <span className="cbdiag-err">{result.errorMessage}</span>}
            {!result.pass && result.errorStack && (
              <details className="cbdiag-stack">
                <summary>stack</summary>
                <pre>{result.errorStack}</pre>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LogRow({ rec }: { rec: ClipboardErrorRecord }) {
  return (
    <li className="cbdiag-log-row">
      <span className="cbdiag-log-stage">{rec.stage}</span>
      <span className="cbdiag-log-name">[{rec.name}]</span>
      <span className="cbdiag-log-msg">{rec.message}</span>
      <span className="cbdiag-log-time">{rec.timestamp}</span>
    </li>
  )
}

export function ClipboardDiagPanel({ source, mode }: Props) {
  const [env] = useState<ClipboardEnvInfo>(() => collectClipboardEnv())
  const [running, setRunning] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [results, setResults] = useState<Record<string, DiagResult>>({})
  const [log, setLog] = useState<readonly ClipboardErrorRecord[]>(() => readClipboardErrors())

  const tests: DiagTestDef[] = useMemo(
    () => [
      { id: 'A', label: 'A · PLAIN TEXT', desc: `writeText('${TEST_A_TEXT}')`, run: () => runTestA() },
      { id: 'B', label: 'B · MINIMAL HTML', desc: 'ClipboardItem(text/html + text/plain), fixed payload', run: () => runTestB() },
      { id: 'C', label: 'C · STATIC SAFE', desc: 'WeChat-safe primitives only (<p> + fixed px)', run: () => runTestC() },
      { id: 'D', label: 'D · PRODUCTION', desc: 'compileForWechat(source, mode) — same artifact as COPY → WECHAT', run: () => runTestD(source, mode) },
    ],
    [source, mode],
  )

  const run = async (id: 'A' | 'B' | 'C' | 'D'): Promise<void> => {
    if (running) return
    setRunning(id)
    const t = tests.find((x) => x.id === id)!
    try {
      const r = await t.run()
      setResults((prev) => ({ ...prev, [id]: r }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="cbdiag">
      <div className="cbdiag-head">
        <span className="cbdiag-title">CLIPBOARD TRANSPORT DIAGNOSTIC (dev-only)</span>
        <div className="cbdiag-head-actions">
          <button className="ghost" onClick={() => setLog([...readClipboardErrors()])}>REFRESH LOG</button>
          <button className="ghost" onClick={() => { clearClipboardErrors(); setLog([]) }}>CLEAR LOG</button>
        </div>
      </div>

      <div className="cbdiag-env">
        {ENV_ROWS.map((row) => (
          <div key={row.key} className="cbdiag-env-row">
            <span className="cbdiag-env-label">{row.label}</span>
            <EnvValue value={env[row.key]} />
          </div>
        ))}
      </div>

      <div className="cbdiag-tests">
        {tests.map((t) => (
          <ResultCard key={t.id} test={t} onRun={() => void run(t.id)} result={results[t.id] ?? null} />
        ))}
      </div>

      <div className="cbdiag-log">
        <div className="cbdiag-log-head">
          <span>PRODUCTION COPY ERROR LOG ({log.length})</span>
          <span className="cbdiag-hint">由真实 COPY → WECHAT 按钮触发的错误在此记录</span>
        </div>
        {log.length === 0 ? (
          <div className="cbdiag-log-empty">无记录 — 先点生产 COPY → WECHAT 制造一次复制。</div>
        ) : (
          <ul className="cbdiag-log-list">
            {log.map((rec, i) => (
              <LogRow key={i} rec={rec} />
            ))}
          </ul>
        )}
      </div>

      <div className="cbdiag-foot">
        <span className="cbdiag-hint">
          手测：A→Notepad 粘贴；B/C/D→微信编辑器粘贴。生产按钮「COPY → WECHAT」是唯一会写生产错误日志的入口。
        </span>
      </div>
    </div>
  )
}
