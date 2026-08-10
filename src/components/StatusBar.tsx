import type { WordCount } from '../engine/types'
import type { PreviewMode } from '../render/modes'

interface Props {
  counts: WordCount
  blockCount: number
  semanticBlocks: number
  mode: PreviewMode
  onMode: (m: PreviewMode) => void
  onCheck: () => void
  onCompat?: () => void
  compatOpen?: boolean
  onCopy: () => void
  copyState: 'idle' | 'copied' | 'error'
}

export function StatusBar({
  counts,
  blockCount,
  semanticBlocks,
  mode,
  onMode,
  onCheck,
  onCompat,
  compatOpen,
  onCopy,
  copyState,
}: Props) {
  return (
    <footer className="status">
      <span className="status-item">WORDS {counts.total}</span>
      <span className="status-item">BLOCKS {blockCount}</span>
      <span className="status-item muted">SEMANTIC {semanticBlocks}</span>
      <span className="status-grow" />
      <div className="seg seg-mode" role="group" aria-label="Article mode">
        {(['normal', 'editorial'] as const).map((m) => (
          <button key={m} className={m === mode ? 'active' : ''} onClick={() => onMode(m)}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <button className="ghost" onClick={onCheck}>
        CHECK
      </button>
      {onCompat && (
        <button className={`ghost ${compatOpen ? 'active' : ''}`} onClick={onCompat}>
          COMPAT
        </button>
      )}
      <button className="copy-btn" onClick={onCopy} disabled={copyState === 'copied'}>
        {copyState === 'copied' ? 'COPIED ✓' : copyState === 'error' ? 'COPY FAILED' : 'COPY → WECHAT'}
      </button>
    </footer>
  )
}
