import { type CSSProperties } from 'react'
import type { Block } from '../markdown/types'
import { getViewportInfo, type PreviewMode, type Viewport } from './modes'
import { renderBlock } from './blocks'

interface ArticleProps {
  blocks: Block[]
  frontmatter: Record<string, unknown>
  mode: PreviewMode
  viewport: Viewport
}

function Masthead({ fm }: { fm: Record<string, unknown> }) {
  const issue = fm.issue ? String(fm.issue).padStart(3, '0') : null
  return (
    <header className="masthead">
      <div className="masthead-brand">MAX大郭的判断局</div>
      {fm.series ? (
        <div className="masthead-series">
          {String(fm.series)}
          {issue ? ` / ${issue}` : ''}
        </div>
      ) : null}
      {fm.title ? <h1 className="masthead-title">{String(fm.title)}</h1> : null}
      {fm.date ? <div className="masthead-date">{String(fm.date).replace(/-/g, ' / ')}</div> : null}
    </header>
  )
}

function SimpleHeader({ fm }: { fm: Record<string, unknown> }) {
  return (
    <header className="masthead masthead-simple">
      <div className="masthead-brand">MAX大郭的判断局</div>
      {fm.title ? <h1 className="masthead-title">{String(fm.title)}</h1> : null}
      {fm.date ? <div className="masthead-date">{String(fm.date).replace(/-/g, ' / ')}</div> : null}
    </header>
  )
}

function ArticleFooter({ fm, editorial }: { fm: Record<string, unknown>; editorial: boolean }) {
  const issue = fm.issue ? String(fm.issue).padStart(3, '0') : null
  const brand = ['MAX', fm.series ? String(fm.series) : '', issue].filter(Boolean).join(' / ')
  const next = fm.next as Record<string, unknown> | undefined
  return (
    <footer className="article-footer">
      <div className="footer-brand">{brand || 'MAX'}</div>
      {editorial && fm.tagline ? <div className="footer-tagline">{String(fm.tagline)}</div> : null}
      {next?.title ? (
        <div className="next">
          <div className="next-label">NEXT</div>
          <div className="next-title">{String(next.title)}</div>
        </div>
      ) : null}
    </footer>
  )
}

export function Article({ blocks, frontmatter, mode, viewport }: ArticleProps) {
  const info = getViewportInfo(viewport)
  const style = { '--scale': String(info.scale) } as CSSProperties
  return (
    <article className="article paper" data-mode={mode} style={style}>
      {mode === 'editorial' ? <Masthead fm={frontmatter} /> : <SimpleHeader fm={frontmatter} />}
      {blocks.map((b, i) => renderBlock(b, i))}
      <ArticleFooter fm={frontmatter} editorial={mode === 'editorial'} />
    </article>
  )
}
