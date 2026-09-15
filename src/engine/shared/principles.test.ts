import { describe, expect, it } from 'vitest'
import { renderDoocsHtml } from '../doocs/engine'
import { legacyEngine } from '../legacy/engine'
import { renderSemanticHtml, principleInlineSource, splitPrincipleMarker } from './semanticHtml'

/**
 * :::principles 语义块单元测试（OPT-IN PRINCIPLES BLOCK）。
 * 边界：识别语法、编号真实文本、tone 稳定循环、普通有序列表与其他语义块不受影响、双引擎 A/B 一致。
 */

const FIVE = `:::principles
1. **先明确解释要服务什么目标**

   理解模型、验证单次建议、学习知识、满足问责和改善决策，是不同目标。

2. **把理由拆成可以检查的单位**

   明确标出关键事实、证据来源、推断步骤和未知部分。

3. **同时展示支持与反对结论的信息**

   系统需要暴露反例、替代解释和结论成立的边界。

4. **把摩擦留给真正高风险的节点**

   在证据不足、行动不可逆或错误成本较高时，要求用户确认依据或转交决定。

5. **用行为和结果评价解释**

   测量错误建议的接受、正确建议的拒绝、任务表现、核验行为和长期能力变化。
:::`

/** 提取渲染 HTML 中第一个 sblock-principles section（嵌套感知；两引擎 A/B 对比用）。 */
function principlesSection(html: string): string {
  const start = html.indexOf('<section class="sblock sblock-principles">')
  expect(start, 'sblock-principles section missing').toBeGreaterThanOrEqual(0)
  const re = /<section\b|<\/section>/g
  re.lastIndex = start
  let depth = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (m[0] === '</section>') {
      depth--
      if (depth === 0) return html.slice(start, re.lastIndex)
    } else {
      depth++
    }
  }
  throw new Error('unbalanced section in principles html')
}

describe(':::principles marker syntax', () => {
  it('recognizes `1. ` / `1、` / `1) ` / `1）` markers', () => {
    expect(splitPrincipleMarker('1. **甲**')).toBe('**甲**')
    expect(splitPrincipleMarker('2、**乙**')).toBe('**乙**')
    expect(splitPrincipleMarker('3) 丙')).toBe('丙')
    expect(splitPrincipleMarker('４）fullwidth-ignored')).toBe(null) // 全角数字不是序号
    expect(splitPrincipleMarker('10. 第十条')).toBe('第十条')
  })

  it('does not treat decimals as markers (markdown-consistent: `.` requires a following space)', () => {
    expect(splitPrincipleMarker('3.14 是圆周率')).toBe(null)
    expect(principleInlineSource('3.14 是圆周率')).toBe('3.14 是圆周率')
  })

  it('principleInlineSource strips markers and left indentation', () => {
    expect(principleInlineSource('   缩进说明行')).toBe('缩进说明行')
    expect(principleInlineSource('')).toBe('')
  })
})

describe(':::principles rendering', () => {
  it('renders five cards with position-generated two-digit real-text numbers', () => {
    const { html } = renderDoocsHtml(FIVE)
    const nums = [...html.matchAll(/<span class="p-num">(\d+)<\/span>/g)].map((m) => m[1])
    expect(nums).toEqual(['01', '02', '03', '04', '05'])
    // 作者序号本身不进 DOM（编号由位置生成）。
    expect(html).not.toContain('<span class="p-num">1</span>')
  })

  it('splits bold title vs indented description per card', () => {
    const { html } = renderDoocsHtml(FIVE)
    expect(html).toContain('<span class="p-title"><strong>先明确解释要服务什么目标</strong></span>')
    expect(html).toContain('<section class="p-desc">理解模型、验证单次建议、学习知识、满足问责和改善决策，是不同目标。</section>')
  })

  it('assigns data-tone 1..5 for the five-color progression', () => {
    const { html } = renderDoocsHtml(FIVE)
    const tones = [...html.matchAll(/<section class="p-item" data-tone="(\d)">/g)].map((m) => m[1])
    expect(tones).toEqual(['1', '2', '3', '4', '5'])
  })

  it('cycles tones stably past five items (6th → tone 1, 7th → tone 2)', () => {
    const seven = `:::principles\n${[1, 2, 3, 4, 5, 6, 7].map((n) => `${n}. **第${n}条**\n\n   说明${n}。`).join('\n\n')}\n:::`
    const { html } = renderDoocsHtml(seven)
    const tones = [...html.matchAll(/<section class="p-item" data-tone="(\d)">/g)].map((m) => m[1])
    expect(tones).toEqual(['1', '2', '3', '4', '5', '1', '2'])
    const nums = [...html.matchAll(/<span class="p-num">(\d+)<\/span>/g)].map((m) => m[1])
    expect(nums).toEqual(['01', '02', '03', '04', '05', '06', '07'])
  })

  it('uses only section for block-level containers (WeChat paste whitelist; div styles are stripped)', () => {
    const { html } = renderDoocsHtml(FIVE)
    const section = principlesSection(html)
    expect(section).toContain('<section class="p-list">')
    expect(section).toContain('<section class="sblock-label">原则</section>')
    // 微信会清掉 div 上的 inline style —— 本块内不允许出现任何 div。
    expect(section).not.toMatch(/<div[\s>]/)
  })

  it('degrades to prose when no numbered items exist (no empty card stack)', () => {
    const { html } = renderDoocsHtml(':::principles\n只有一段说明文字。\n:::')
    expect(html).toContain('sblock-principles')
    expect(html).not.toContain('p-item')
    expect(html).toContain('只有一段说明文字。')
  })

  it('numbers come from real DOM text, not CSS pseudo-elements', () => {
    const { html } = renderDoocsHtml(FIVE)
    // DOM 契约：编号是 .p-num span 文本；不产生依赖 ::before 的编号。
    expect(html).toMatch(/<p class="p-head"><span class="p-num">01<\/span>/)
  })
})

describe('non-interference', () => {
  it('plain ordered lists render as native ol/li, unchanged', () => {
    const md = '正文：\n\n1. 第一条\n2. 第二条\n'
    const { html } = renderDoocsHtml(md)
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>第一条</li>')
    expect(html).not.toContain('sblock-principles')
    expect(html).not.toContain('p-num')
  })

  it('other semantic blocks keep their DOM contract (question untouched)', () => {
    const { html } = renderDoocsHtml(':::question\n这是什么问题？\n:::')
    expect(html).toContain('<section class="sblock sblock-question"><div class="sblock-label">提问</div>')
    expect(html).not.toContain('p-item')
  })
})

describe('legacy/doocs A/B parity', () => {
  it('both engines produce the identical principles section', () => {
    const doocs = renderDoocsHtml(FIVE).html
    const legacy = legacyEngine.render(FIVE).html
    expect(principlesSection(legacy)).toBe(principlesSection(doocs))
  })

  it('both engines keep plain ol rendering equivalent (modulo marked newline legacy)', () => {
    const md = '1. 第一条\n2. 第二条\n'
    const squash = (s: string): string => s.replace(/\n+/g, '')
    expect(squash(legacyEngine.render(md).html)).toBe(squash(renderDoocsHtml(md).html))
  })
})

describe('renderSemanticHtml direct input (defensive)', () => {
  it('unknown sType still renders as unknown', () => {
    const html = renderSemanticHtml({
      sType: 'no-such-block',
      props: {},
      lines: ['x'],
      lineHtml: ['x'],
      rawText: 'x',
      claimMap: new Map(),
      ambiguousIds: new Set(),
      anchorDirections: new Map(),
    })
    expect(html).toContain('sblock-unknown')
  })
})
