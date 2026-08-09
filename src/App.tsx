import { useMemo, useRef, useState } from 'react'
import { AVAILABLE_ENGINES, createEditorialEngine } from './engine'
import type { EngineName, PreviewMode, Viewport } from './engine'
import { runCompatibilityCheck } from './compat/check'
import { EditorPane } from './components/EditorPane'
import { PreviewPane } from './components/PreviewPane'
import { StatusBar } from './components/StatusBar'
import { CheckPanel } from './components/CheckPanel'
import fixtureRaw from '../examples/issue-001.md?raw'

/** 引擎切换仅开发模式可见；默认 Doocs-backed 引擎。 */
const DEFAULT_ENGINE: EngineName = 'doocs'

export default function App() {
  const [source, setSource] = useState(fixtureRaw)
  const [mode, setMode] = useState<PreviewMode>('editorial')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [checkOpen, setCheckOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [engineName, setEngineName] = useState<EngineName>(DEFAULT_ENGINE)

  const engine = useMemo(() => createEditorialEngine(engineName), [engineName])
  const rendered = useMemo(() => engine.render(source), [engine, source])
  const articleRef = useRef<HTMLElement>(null)

  const checkResult = useMemo(
    () => (checkOpen ? runCompatibilityCheck(source, rendered.structure) : null),
    [checkOpen, source, rendered.structure],
  )
  const issue = rendered.frontmatter.issue ? String(rendered.frontmatter.issue).padStart(3, '0') : '000'

  const handleCopy = async () => {
    setCopyState('idle')
    try {
      const r = await engine.copyToWechat(source, { mode, previewEl: articleRef.current })
      setCopyState(r.ok ? 'copied' : 'error')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="top-brand">
          <span className="dot">●</span> MAX EDITORIAL
        </div>
        <div className="top-meta">
          <span>ISSUE {issue}</span>
          <span className="top-badge">
            <span className="dot">●</span> WECHAT
          </span>
          {import.meta.env.DEV && (
            <div className="seg seg-engine" role="group" aria-label="Render engine">
              {AVAILABLE_ENGINES.map((n) => (
                <button key={n} className={n === engineName ? 'active' : ''} onClick={() => setEngineName(n)}>
                  {n.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="app-main">
        <EditorPane value={source} onChange={setSource} onLoadFixture={() => setSource(fixtureRaw)} />
        <PreviewPane
          html={rendered.html}
          frontmatter={rendered.frontmatter}
          mode={mode}
          viewport={viewport}
          onViewport={setViewport}
          articleRef={articleRef}
        />
      </div>

      {checkOpen && checkResult && <CheckPanel result={checkResult} />}

      <StatusBar
        counts={rendered.wordCount}
        blockCount={rendered.blockCount}
        semanticBlocks={rendered.structure.semanticBlocks.length}
        mode={mode}
        onMode={setMode}
        onCheck={() => setCheckOpen((v) => !v)}
        onCopy={handleCopy}
        copyState={copyState}
      />
    </div>
  )
}
