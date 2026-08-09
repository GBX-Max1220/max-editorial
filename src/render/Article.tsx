import { type CSSProperties, type RefObject } from 'react'
import { getViewportInfo, type PreviewMode, type Viewport } from './modes'

// XSS 契约：正文 HTML 由引擎产出。legacy 引擎对全部文本转义；doocs 引擎把 raw
// HTML token 转义为文本（marked 默认也转义正文），因此 <script> 只会显示为文字、
// 不会执行。兼容性检查（CHECK）仍会对 source 里的 script/css/iframe 报 FAIL。

interface ArticleProps {
  /** 引擎产出的正文 HTML（不含 masthead/footer）。 */
  html: string
  frontmatter: Record<string, unknown>
  mode: PreviewMode
  viewport: Viewport
  articleRef: RefObject<HTMLElement>
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

export function Article({ html, frontmatter, mode, viewport, articleRef }: ArticleProps) {
  const info = getViewportInfo(viewport)
  const style = { '--scale': String(info.scale) } as CSSProperties
  return (
    <article ref={articleRef} className="article paper" data-mode={mode} style={style}>
      {mode === 'editorial' ? <Masthead fm={frontmatter} /> : <SimpleHeader fm={frontmatter} />}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      <ArticleFooter fm={frontmatter} editorial={mode === 'editorial'} />
    </article>
  )
}
