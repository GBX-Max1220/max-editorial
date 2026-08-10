import { useState } from 'react'
import { diffHtml, type HtmlDiffFinding } from '../compat/htmlDiff'

const KIND_LABEL: Record<HtmlDiffFinding['kind'], string> = {
  'element-removed': 'ELEMENT REMOVED',
  'element-added': 'ELEMENT ADDED',
  'structure-flattened': 'STRUCTURE FLATTENED',
  'style-removed': 'STYLE REMOVED',
  'style-rewritten': 'STYLE REWRITTEN',
  'value-normalized': 'VALUE NORMALIZED',
}

/**
 * dev-only：WeChat copy-back 诊断（Phase 3 spike）。
 * 流程：COPY → WECHAT（pre 存下）→ 微信粘贴 → Ctrl+A/Ctrl+C 复制回 → 粘贴到下方 textarea → DIFF。
 * 定位是【诊断辅助】，不是发布渲染证明。
 */
export function CompatPanel({ preHtml }: { preHtml: string | null }) {
  const [postHtml, setPostHtml] = useState('')
  const [findings, setFindings] = useState<HtmlDiffFinding[] | null>(null)

  const run = () => {
    if (!preHtml || !postHtml.trim()) return
    setFindings(diffHtml(preHtml, postHtml))
  }

  return (
    <div className="compat-panel">
      <div className="compat-head">
        <span className="compat-title">COMPAT · COPY-BACK DIAGNOSTIC (dev)</span>
        <span className={`compat-pre ${preHtml ? 'ok' : ''}`}>
          PRE-HTML {preHtml ? `✓ ${preHtml.length} chars` : '— 先 COPY → WECHAT'}
        </span>
      </div>
      <textarea
        className="compat-post"
        placeholder="从微信编辑器 Ctrl+A / Ctrl+C 复制回，粘贴到这里…"
        value={postHtml}
        onChange={(e) => {
          setPostHtml(e.target.value)
          setFindings(null)
        }}
      />
      <div className="compat-actions">
        <button className="ghost" onClick={run} disabled={!preHtml || !postHtml.trim()}>
          DIFF
        </button>
        <span className="compat-hint">copy-back ≠ 发布渲染证明；真实微信视觉是 source of truth。</span>
      </div>
      {findings && (
        <ul className="compat-findings">
          {findings.length === 0 ? (
            <li className="compat-clean">未发现差异。</li>
          ) : (
            findings.slice(0, 200).map((f, i) => (
              <li key={i} className="compat-finding">
                <span className="compat-kind">{KIND_LABEL[f.kind]}</span>
                <span className="compat-path">{f.path}</span>
                {f.prop && <span className="compat-prop">{f.prop}</span>}
                {f.before && <span className="compat-val before">{f.before}</span>}
                {f.after && <span className="compat-val after">{f.after}</span>}
              </li>
            ))
          )}
          {findings.length > 200 && <li className="compat-more">… 截断（{findings.length} 项）</li>}
        </ul>
      )}
    </div>
  )
}
