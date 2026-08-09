import { useMemo, useState } from 'react'
import { parseMarkdown } from './markdown/parser'
import { countWords } from './utils/words'
import { runCompatibilityCheck } from './compat/check'
import { copyWechat } from './render/clipboard'
import { EditorPane } from './components/EditorPane'
import { PreviewPane } from './components/PreviewPane'
import { StatusBar } from './components/StatusBar'
import { CheckPanel } from './components/CheckPanel'
import type { PreviewMode, Viewport } from './render/modes'
import fixtureRaw from '../examples/issue-001.md?raw'

export default function App() {
  const [source, setSource] = useState(fixtureRaw)
  const [mode, setMode] = useState<PreviewMode>('editorial')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [checkOpen, setCheckOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const parsed = useMemo(() => parseMarkdown(source), [source])
  const counts = useMemo(() => countWords(source), [source])
  const totalBlocks = parsed.blocks.length
  const semanticBlocks = parsed.blocks.filter((b) => b.kind === 'semantic').length
  const checkResult = useMemo(
    () => (checkOpen ? runCompatibilityCheck(parsed.blocks, source) : null),
    [checkOpen, parsed.blocks, source],
  )
  const issue = parsed.frontmatter.issue ? String(parsed.frontmatter.issue).padStart(3, '0') : '000'

  const handleCopy = async () => {
    setCopyState('idle')
    try {
      await copyWechat(parsed, mode)
      setCopyState('copied')
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
        </div>
      </header>

      <div className="app-main">
        <EditorPane value={source} onChange={setSource} onLoadFixture={() => setSource(fixtureRaw)} />
        <PreviewPane
          blocks={parsed.blocks}
          frontmatter={parsed.frontmatter}
          mode={mode}
          viewport={viewport}
          onViewport={setViewport}
        />
      </div>

      {checkOpen && checkResult && <CheckPanel result={checkResult} />}

      <StatusBar
        counts={counts}
        totalBlocks={totalBlocks}
        semanticBlocks={semanticBlocks}
        mode={mode}
        onMode={setMode}
        onCheck={() => setCheckOpen((v) => !v)}
        onCopy={handleCopy}
        copyState={copyState}
      />
    </div>
  )
}
