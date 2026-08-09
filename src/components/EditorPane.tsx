import { useRef, type KeyboardEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onLoadFixture: () => void
}

export function EditorPane({ value, onChange, onLoadFixture }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = ref.current
      if (!ta) return
      const { selectionStart, selectionEnd } = ta
      onChange(value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd))
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + 2
      })
    }
  }

  return (
    <div className="pane pane-editor">
      <div className="editor-head">
        <span className="editor-label">SOURCE · MARKDOWN</span>
        <button className="ghost" onClick={onLoadFixture}>
          LOAD FIXTURE
        </button>
      </div>
      <div className="editor-area">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="粘贴或书写 Markdown…"
        />
      </div>
    </div>
  )
}
