import { Fragment, type ReactNode } from 'react'
import type { Block, SemanticBlock } from '../markdown/types'
import { parseInline } from '../markdown/inline'
import { renderInline } from './inline'
import { parseEvidence, parseLabNote } from './parseHelpers'

function Label({ children }: { children: ReactNode }) {
  return <div className="sblock-label">{children}</div>
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderInline(parseInline(line))}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  )
}

export function SemanticBlock({ block }: { block: SemanticBlock }) {
  switch (block.type) {
    case 'question':
      return (
        <section className="sblock sblock-question">
          <Label>QUESTION</Label>
          <div className="sblock-body">
            <Lines lines={block.lines} />
          </div>
        </section>
      )
    case 'ai-output':
      return (
        <section className="sblock sblock-ai-output">
          <Label>AI OUTPUT</Label>
          <pre className="sblock-body">{block.lines.join('\n')}</pre>
        </section>
      )
    case 'judgment':
      return (
        <section className="sblock sblock-judgment">
          <Label>JUDGMENT</Label>
          <div className="sblock-body">
            <Lines lines={block.lines} />
          </div>
        </section>
      )
    case 'evidence': {
      const rows = parseEvidence(block.lines)
      return (
        <section className="sblock sblock-evidence">
          <Label>EVIDENCE</Label>
          <div className="evidence-rows">
            {rows.map((r, i) => (
              <div className="evidence-row" key={i}>
                <span className="evidence-label">{r.label || ' '}</span>
                <span className="evidence-value">{r.value}</span>
              </div>
            ))}
          </div>
        </section>
      )
    }
    case 'counterpoint':
      return (
        <section className="sblock sblock-counterpoint">
          <Label>COUNTERPOINT</Label>
          <div className="sblock-body">
            <Lines lines={block.lines} />
          </div>
        </section>
      )
    case 'lab-note': {
      const { stats, notes } = parseLabNote(block.lines)
      const title = block.props.title
      return (
        <section className="sblock sblock-lab-note">
          <div className="lab-title">LAB NOTE{title ? ` · ${title}` : ''}</div>
          {stats.length > 0 && (
            <div className="lab-stats">
              {stats.map((s, i) => (
                <Fragment key={i}>
                  <span className="lab-stat-value">{s.value}</span>
                  <span className="lab-stat-label">{s.label || ' '}</span>
                </Fragment>
              ))}
            </div>
          )}
          {notes.length > 0 && <div className="lab-notes">{notes.join('  ·  ')}</div>}
        </section>
      )
    }
    case 'metric':
      return (
        <section className="sblock sblock-metric">
          <div className="metric-value">{block.props.value ?? ''}</div>
          {block.props.label && <div className="metric-label">{block.props.label}</div>}
        </section>
      )
    default:
      return (
        <section className="sblock sblock-unknown">
          <Label>{block.unknown ? `UNKNOWN · ${block.type}` : block.type}</Label>
          <pre className="sblock-body">{block.lines.join('\n')}</pre>
        </section>
      )
  }
}

function Hn({ level, children }: { level: number; children: ReactNode }) {
  const Tag = `h${Math.min(level, 3)}` as 'h1' | 'h2' | 'h3'
  return <Tag>{children}</Tag>
}

export function renderBlock(b: Block, key: number): ReactNode {
  switch (b.kind) {
    case 'heading':
      return (
        <Hn key={key} level={b.level}>
          {renderInline(b.inline)}
        </Hn>
      )
    case 'paragraph':
      return <p key={key}>{renderInline(b.inline)}</p>
    case 'blockquote':
      return <blockquote key={key}>{renderInline(b.inline)}</blockquote>
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag key={key}>
          {b.items.map((it, i) => (
            <li key={i}>{renderInline(it.inline)}</li>
          ))}
        </Tag>
      )
    }
    case 'code':
      return (
        <pre key={key}>
          <code>{b.code}</code>
        </pre>
      )
    case 'hr':
      return <hr key={key} />
    case 'image':
      return <img key={key} src={b.src} alt={b.alt} title={b.title} loading="lazy" />
    case 'table':
      return (
        <div className="table-wrap" key={key}>
          <table>
            <thead>
              <tr>
                {b.headers.map((h, i) => (
                  <th key={i}>{renderInline(parseInline(h))}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{renderInline(parseInline(c))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'semantic':
      return <SemanticBlock key={key} block={b} />
  }
}
