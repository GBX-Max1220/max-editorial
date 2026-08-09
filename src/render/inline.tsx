import { Fragment, type ReactNode } from 'react'
import type { InlineNode } from '../markdown/types'

export function renderInline(nodes: InlineNode[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return <Fragment key={i}>{n.value}</Fragment>
      case 'strong':
        return <strong key={i}>{renderInline(n.children)}</strong>
      case 'em':
        return <em key={i}>{renderInline(n.children)}</em>
      case 'code':
        return <code key={i}>{n.value}</code>
      case 'link':
        return (
          <a key={i} href={n.href} title={n.title}>
            {renderInline(n.children)}
          </a>
        )
      case 'image':
        return <img key={i} src={n.src} alt={n.alt} title={n.title} loading="lazy" />
    }
  })
}
