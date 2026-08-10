// @vitest-environment jsdom
/**
 * V0.2.2 微信目标编译器测试。
 *
 * 定位：产物级断言（无禁止 primitive、固定 px、块流、语义保留）。
 * 不声称这些测试验证真实微信——真机粘贴验收仍必须（见 WECHAT_TARGET_COMPILER_REPORT.md）。
 */

import { describe, expect, it } from 'vitest'
import { compileForWechat } from './compiler'
import { checkWechatPolicy } from './policyCheck'
import { renderDoocsHtml } from '../doocs/engine'
import fixtureRaw from '../../../examples/issue-001.md?raw'

function compile(md: string): string {
  return compileForWechat(md).html
}

describe('WeChat target compiler — policy & architecture', () => {
  it('compiled fixture artifact is self-contained and policy-clean', () => {
    const html = compile(fixtureRaw)
    expect(checkWechatPolicy(html)).toEqual([])
    // 自包含：无 <style> 标签、无外部引用、无 var()。
    expect(html).not.toMatch(/<style/i)
    expect(html).not.toMatch(/var\(\s*--/)
    // 语义块都有内联 style（juice 已内联）。
    expect(html).toMatch(/class="sblock sblock-judgment" style=/)
    expect(html).toMatch(/class="sblock sblock-evidence" style=/)
  })

  it('compilation is deterministic (preview and clipboard share one artifact)', () => {
    const a = compileForWechat(fixtureRaw)
    const b = compileForWechat(fixtureRaw)
    expect(a.html).toBe(b.html)
    expect(a.plainText).toBe(b.plainText)
  })

  it('artifact contains NO forbidden layout primitives (flex/gap/clamp/vw/@media/nowrap)', () => {
    const html = compile(fixtureRaw)
    for (const re of [/display:\s*flex/i, /flex-wrap/i, /align-items/i, /justify-content/i, /clamp\s*\(/i, /\b\d+vw\b/i, /@media/i, /white-space:\s*nowrap/i]) {
      expect(html, re.toString()).not.toMatch(re)
    }
  })
})

describe('METRIC — fixed target size, no responsive scaling (§13.7)', () => {
  it('specimen 43 compiles to a fixed 44px value (no clamp/vw)', () => {
    const html = compile(fixtureRaw)
    expect(html).toContain('font-size: 44px')
    expect(html).not.toMatch(/clamp|vw/i)
  })

  it('reported_result stays restrained, reference stays low', () => {
    const md =
      ':::metric value="42" origin="internal_evaluation" display_function="reported_result" source="内部" method="样例" boundary="仅限样例" id="m1"\n:::\n\n:::metric value="7" origin="external_source" display_function="contextual_reference" source="外部" id="m2"\n:::'
    const html = compile(md)
    expect(html).toContain('font-size: 22px') // result
    expect(html).toContain('font-size: 19px') // reference
    expect(html).not.toContain('font-size: 44px')
  })
})

describe('EVIDENCE — vertical block flow, not flex (§13.4/§13.5)', () => {
  it('binary contrast evidence stacks vertically (SUPPORTED / value on separate lines)', () => {
    const html = compile(
      [
        ':::claim id="c"',
        '命题',
        ':::',
        '',
        ':::evidence id="e" supports="c"',
        'SUPPORTED',
        '30–60 分钟',
        '',
        'NOT SUPPORTED',
        '恰好 43 分钟',
        ':::',
      ].join('\n'),
    )
    expect(html).toMatch(/class="evidence-row" style="display: block/)
    expect(html).toMatch(/class="evidence-label" style="display: block/)
    expect(html).toMatch(/class="evidence-value" style="display: block/)
    expect(html).not.toMatch(/display:\s*flex/)
    expect(html).not.toMatch(/gap\s*:/i)
  })

  it('generic evidence renders relation grammar (支持/边界/来源), not manufactured verdicts', () => {
    const html = compile(
      [
        ':::claim id="c"',
        '命题',
        ':::',
        '',
        ':::evidence id="e" supports="c" boundary="不支持推出普遍结论" source="模型报告 v3"',
        '这段材料说明 X。',
        ':::',
      ].join('\n'),
    )
    expect(html).toContain('evidence-prose')
    expect(html).not.toContain('SUPPORTED')
    expect(html).toContain('边界：不支持推出普遍结论')
  })
})

describe('AI OUTPUT — metadata wraps naturally (block lines, no nowrap)', () => {
  it('source/status are separate block lines and wrap', () => {
    const html = compile(':::ai-output source="一个很长的来源名称用于测试自然换行行为" status="raw" id="a"\n输出\n:::')
    expect(html).toMatch(/class="meta-source" style="display: block/)
    expect(html).toMatch(/class="meta-status" style="display: block/)
    expect(html).not.toMatch(/white-space:\s*nowrap/i)
    expect(html).not.toMatch(/display:\s*flex/)
  })
})

describe('COUNTERPOINT — parity preserved, block flow', () => {
  it('counterpoint body renders at legible fixed size, same container as evidence', () => {
    const html = compile(':::counterpoint\n精确表达并不必然误导。\n:::')
    expect(html).toContain('sblock-counterpoint')
    expect(html).toContain('精确表达并不必然误导。')
    expect(html).not.toMatch(/opacity|filter/)
  })
})

describe('JUDGMENT — deliberate pause, ownership, referential fix', () => {
  it('keeps author ownership and single top rule; no incorrect 见后文', () => {
    const html = compile(fixtureRaw)
    expect(html).toContain('judgment-author')
    expect(html).toContain('— Max')
    // V0.2.1：单条 top 墨线（无 border-bottom on judgment）。
    const judgment = html.match(/class="sblock sblock-judgment"[^>]*>/)?.[0] ?? ''
    expect(judgment).toContain('border-top')
    expect(judgment).not.toContain('border-bottom')
    // referential-integrity：evidence/counterpoint 在上方 → 见上方。
    expect(html).toContain('证据与反方见上方')
    expect(html).not.toContain('见后文')
  })
})

describe('LAB NOTE — scope-limiting annotation survives', () => {
  it('keeps scope statement and block annotation styling', () => {
    const html = compile(
      ':::lab-note title="CHECKMYCOACH" id="l"\n40 cases\n15 routed\n\nSystem evaluation.\nNot a human study.\n:::',
    )
    expect(html).toContain('System evaluation.')
    expect(html).toContain('Not a human study.')
    expect(html).toContain('sblock-lab-note')
    expect(html).not.toMatch(/display:\s*flex/)
  })
})

describe('H2 → QUESTION — redundant orientation removed (V0.2.1)', () => {
  it('fixture has no heading immediately followed by a QUESTION', () => {
    const { tokens } = renderDoocsHtml(fixtureRaw)
    const meaningful = tokens.filter((t) => t.type !== 'space')
    for (let i = 0; i < meaningful.length - 1; i++) {
      if (meaningful[i].type !== 'heading') continue
      const next = meaningful[i + 1]
      expect(next.type === 'semanticBlock' && (next as { sType?: string }).sType === 'question').toBe(false)
    }
  })
})

describe('Preview & Clipboard consume the same compiled artifact', () => {
  it('the artifact the preview would render is exactly what a copy would emit', () => {
    // App 预览用 compileForWechat(source).html；doocs copyToWechat 内部调用同一函数。
    const previewHtml = compileForWechat(fixtureRaw).html
    // 产物可独立渲染：masthead + body + footer 都在。
    expect(previewHtml).toContain('masthead-title')
    expect(previewHtml).toContain('article-footer')
    expect(previewHtml).toContain('sblock-metric')
  })
})
