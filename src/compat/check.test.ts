import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../markdown/parser'
import { runCompatibilityCheck } from './check'

const blocks = (src: string) => parseMarkdown(src).blocks
const run = (src: string) => runCompatibilityCheck(blocks(src), src)

describe('compatibility checker', () => {
  it('passes a clean document', () => {
    expect(run('正文文字。\n\n:::judgment\n判断\n:::').status).toBe('PASS')
  })

  it('fails on script tag', () => {
    const src = '文字\n<script>alert(1)</script>'
    const r = run(src)
    expect(r.status).toBe('FAIL')
    expect(r.findings.some((f) => f.code === 'script')).toBe(true)
  })

  it('fails on external css', () => {
    const r = run('<link rel="stylesheet" href="x.css">')
    expect(r.findings.some((f) => f.code === 'external-css')).toBe(true)
  })

  it('fails on iframe', () => {
    const r = run('<iframe src="x"></iframe>')
    expect(r.findings.some((f) => f.code === 'iframe')).toBe(true)
  })

  it('warns on local file image', () => {
    const r = run('![图](file:///C:/x.png)')
    expect(r.findings.some((f) => f.code === 'local-image')).toBe(true)
  })

  it('warns on long unbroken ascii string but not on long chinese text', () => {
    expect(run('a'.repeat(70)).findings.some((f) => f.code === 'long-string')).toBe(true)
    expect(run('中'.repeat(120)).findings.some((f) => f.code === 'long-string')).toBe(false)
  })

  it('warns on empty semantic block', () => {
    const r = run(':::judgment\n:::\n')
    expect(r.findings.some((f) => f.code === 'empty-block')).toBe(true)
  })

  it('fails on unclosed semantic block', () => {
    const r = run(':::judgment\n没有闭合')
    expect(r.status).toBe('FAIL')
    expect(r.findings.some((f) => f.code === 'invalid-semantic')).toBe(true)
  })

  it('fails on unknown semantic block', () => {
    const r = run(':::totally-unknown\n内容\n:::')
    expect(r.status).toBe('FAIL')
    expect(r.findings.some((f) => f.code === 'unknown-block')).toBe(true)
  })

  it('warns on wide table', () => {
    const src = '| a | b | c | d | e | f | g |\n|---|---|---|---|---|---|---|\n|1|2|3|4|5|6|7|'
    const r = run(src)
    expect(r.findings.some((f) => f.code === 'wide-table')).toBe(true)
  })
})
