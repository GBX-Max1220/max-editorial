// @vitest-environment jsdom
/**
 * V0.2 语义渲染器测试（canonical rev1 §13 / §14）。
 *
 * 定位：结构/语义断言 —— 块身份、派生 salience、降级不镀金、强制元数据、容器 parity。
 * 不假装验证视觉认知（§12 明确：D 类行为测试 = IMPLEMENTATION VALIDATION，非心理学证明）。
 */

import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderDoocsHtml } from './doocs/engine'
import { processClipboardForWeChat } from './doocs/clipboard'
import { getClipboardCss } from './doocs/theme'
import { validateDocument } from './validate'
import fixtureRaw from '../../examples/issue-001.md?raw'

function html(md: string): string {
  return renderDoocsHtml(md).html
}

describe('V0.2 semantic renderer — block identity & labels (§9.4)', () => {
  it('question uses the Chinese label 提问 (English budget reserved for argument layer)', () => {
    const out = html(':::question id="q"\n问题？\n:::')
    expect(out).toContain('sblock-question')
    expect(out).toContain('提问')
    expect(out).not.toMatch(/>QUESTION</)
  })

  it('claim renders as prose, not as a block component (§8.1)', () => {
    const out = html(':::claim id="c"\n一个命题\n:::')
    expect(out).toContain('<p>一个命题</p>')
    expect(out).not.toContain('sblock-claim')
  })

  it('lab-note is annotation-styled (flat stats, no dashboard grid classes)', () => {
    const out = html(':::lab-note id="l"\n40 cases\n15 routed\n\nSystem evaluation.\nNot a human study.\n:::')
    expect(out).toContain('实验注记')
    expect(out).toContain('lab-stats-flat')
    expect(out).toContain('40 cases · 15 routed')
    expect(out).not.toContain('lab-stats">')
  })

  it('counterpoint and evidence share the same container (legibility parity, INV A2)', () => {
    const ev = html(':::evidence id="e" supports="c"\nSUPPORTED\nx\n:::\n\n:::claim id="c"\n命题\n:::')
    const cp = html(':::counterpoint id="p"\n反方\n:::')
    // 同一容器语法：都是 sblock-evidence / sblock-counterpoint，同 border-top 结构（CSS 断言见 article.css）。
    expect(ev).toContain('sblock sblock-evidence')
    expect(cp).toContain('sblock sblock-counterpoint')
    expect(cp).not.toContain('sblock-evidence')
  })
})

describe('V0.2 semantic renderer — AI OUTPUT (§13.2 / §14)', () => {
  it('renders source + status meta when present', () => {
    const out = html(':::ai-output source="模型 X" status="raw" id="a"\n输出\n:::')
    expect(out).toContain('sblock-ai-output')
    expect(out).toContain('来源：模型 X')
    expect(out).toContain('RAW OUTPUT')
  })

  it('degrades to a plain quotation when source is missing (no gilding)', () => {
    const out = html(':::ai-output id="a"\n原始输出\n:::')
    expect(out).not.toContain('sblock-ai-output')
    expect(out).toContain('sblock-degraded')
    expect(out).toContain('来源未标注')
  })

  it('treats VERIFIED without substantiation as RAW OUTPUT (§14.1)', () => {
    const out = html(':::ai-output source="模型 X" status="verified" id="a"\n输出\n:::')
    expect(out).toContain('RAW OUTPUT')
    expect(out).not.toMatch(/data-status="verified"/)
  })
})

describe('V0.2 semantic renderer — JUDGMENT (§13.3)', () => {
  it('renders the author-owned attribution line (INV A6)', () => {
    const out = html(':::judgment id="j"\n判断\n:::')
    expect(out).toContain('judgment-author')
    expect(out).toContain('— Max')
  })

  it('honors explicit author and uncertainty', () => {
    const out = html(':::judgment id="j" author="Max" uncertainty="这是关于呈现方式的判断。"\n判断\n:::')
    expect(out).toContain('judgment-uncertainty')
    expect(out).toContain('这是关于呈现方式的判断。')
  })

  it('renders an adjacency anchor note when anchor is declared (§7.5)', () => {
    const out = html(':::judgment id="j" anchor="ev-1,cp-1"\n判断\n:::')
    expect(out).toContain('judgment-anchor')
    expect(out).toContain('证据与反方见后文')
  })
})

describe('V0.2 semantic renderer — METRIC (§13.7)', () => {
  it('unknown / invalid axis enums fall back without specimen treatment (defaults DOWN)', () => {
    const out = html(':::metric value="73" origin="external" display_function="weird" id="m"\n73%\n:::')
    expect(out).not.toContain('data-salience="inspection_specimen"')
    expect(out).not.toContain('metric-cover')
  })
})

describe('V0.2 epistemic lint (§14)', () => {
  it('flags AI OUTPUT missing source/status as machine-lint warnings', () => {
    const { tokens } = renderDoocsHtml(':::ai-output id="a"\n输出\n:::')
    const diags = validateDocument(tokens)
    expect(diags.some((d) => d.code === 'ep-ai-source')).toBe(true)
    expect(diags.some((d) => d.code === 'ep-ai-status')).toBe(true)
  })

  it('flags evidence without claim_id as machine-lint error (INV A7)', () => {
    const { tokens } = renderDoocsHtml(':::evidence id="e"\nSUPPORTED\nx\n:::')
    const diags = validateDocument(tokens)
    expect(diags.some((d) => d.code === 'ep-evidence-claim' && d.severity === 'error')).toBe(true)
  })

  it('flags load-bearing judgment without anchor (§7.5-3)', () => {
    const { tokens } = renderDoocsHtml(':::judgment id="j" relates_to="claim-a"\n判断\n:::')
    const diags = validateDocument(tokens)
    expect(diags.some((d) => d.code === 'ep-judgment-anchor')).toBe(true)
  })

  it('heuristic warnings are suppressible via props.suppress and never fail build', () => {
    const { tokens } = renderDoocsHtml(':::question id="q" suppress="ep-question-frequency"\n一\n:::\n\n:::question id="q2"\n二\n:::\n\n:::question id="q3"\n三\n:::')
    const diags = validateDocument(tokens)
    expect(diags.some((d) => d.code === 'ep-question-frequency')).toBe(false)
  })

  it('validators never mutate tokens (render tree invariance, §19)', () => {
    const md = ':::claim id="c"\n命题\n:::\n\n:::evidence id="e" supports="c"\nSUPPORTED\nx\n:::'
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    validateDocument(tokens)
    expect(JSON.stringify(tokens)).toBe(before)
  })
})

describe('preview / clipboard artifact consistency (§9)', () => {
  it('the same V0.2 markers survive the WeChat clipboard pipeline as the preview', async () => {
    const preview = renderDoocsHtml(fixtureRaw).html
    const { html: copied } = await processClipboardForWeChat(fixtureRaw, null)
    for (const marker of [
      'data-salience="inspection_specimen"',
      'metric-cover',
      'judgment-author',
      'evidence-claim',
      '实验注记',
    ]) {
      expect(preview, marker).toContain(marker)
      expect(copied, marker).toContain(marker)
    }
  })

  it('clipboard CSS carries mobile overflow guards for long strings', () => {
    const css = getClipboardCss()
    expect(css).toMatch(/overflow-wrap\s*:\s*break-word|word-break/i)
    expect(css).toMatch(/pre\b[^}]*overflow-x\s*:\s*auto/)
  })
})

describe('fixture render sanity (DOM)', () => {
  it('renders the fixture to a parseable DOM with all grammar families', () => {
    const out = renderDoocsHtml(fixtureRaw).html
    const doc = new JSDOM(`<body>${out}</body>`).window.document
    expect(doc.querySelectorAll('.sblock-question').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-ai-output').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-metric[data-salience="inspection_specimen"]').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-evidence').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-counterpoint').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-judgment .judgment-author').length).toBe(1)
    expect(doc.querySelectorAll('.sblock-lab-note').length).toBe(1)
    expect(doc.querySelectorAll('.figure-caption').length).toBe(1)
    expect(doc.querySelectorAll('blockquote').length).toBe(1)
  })
})
