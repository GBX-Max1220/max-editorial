import type { ReactNode } from 'react'
import type { Block } from '../markdown/types'
import { Article } from '../render/Article'
import { VIEWPORTS, type PreviewMode, type Viewport } from '../render/modes'

interface Props {
  blocks: Block[]
  frontmatter: Record<string, unknown>
  mode: PreviewMode
  viewport: Viewport
  onViewport: (v: Viewport) => void
}

function WeChatFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="wx-chrome">
      <div className="wx-bar">
        <span className="wx-back">‹</span>
        <span className="wx-title">{title || '无标题'}</span>
        <span className="wx-more">⋯</span>
      </div>
      <div className="wx-article">{children}</div>
      <div className="wx-footer">阅读原文</div>
    </div>
  )
}

function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mobile-frame">
      <div className="mobile-screen">
        <div className="mobile-statusbar">
          <span>9:41</span>
          <span className="dots">●●●</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PreviewPane({ blocks, frontmatter, mode, viewport, onViewport }: Props) {
  const info = VIEWPORTS[viewport]
  const title = frontmatter.title ? String(frontmatter.title) : ''
  const article = <Article blocks={blocks} frontmatter={frontmatter} mode={mode} viewport={viewport} />

  return (
    <div className="pane pane-preview">
      <div className="preview-head">
        <div className="seg" role="group" aria-label="Preview viewport">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => (
            <button key={v} className={v === viewport ? 'active' : ''} onClick={() => onViewport(v)}>
              {VIEWPORTS[v].label}
            </button>
          ))}
        </div>
        <span className="preview-hint">MARKDOWN → EDITORIAL PREVIEW</span>
      </div>
      <div className={`viewport vp-${info.chrome}`}>
        <div className="viewport-inner">
          {viewport === 'wechat' ? (
            <WeChatFrame title={title}>{article}</WeChatFrame>
          ) : viewport === 'mobile' ? (
            <MobileFrame>{article}</MobileFrame>
          ) : (
            article
          )}
        </div>
      </div>
    </div>
  )
}
