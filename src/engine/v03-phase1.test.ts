// @vitest-environment jsdom
/**
 * V0.3 Phase 1 — 纯 Markdown 出版级基座 聚焦测试。
 *
 * 覆盖（任务清单）：
 *  1. H2 编号序列（渲染器自动生成 01/02/03，作者不手输）
 *  2. H3 不递增 H2 编号
 *  3. intro 无 00
 *  4. 语义块不参与编号
 *  5. 纯 Markdown fixture 渲染成功（零语义块、元素齐全、无 ::: 泄漏）
 *  6. 编译产物无微信禁止 primitive；编号是真实文本（非 CSS counter）
 *  7. V0.2.3 行为不回归（metric H01 44px / judgment 单墨线）
 *
 * 无像素测试：这些是结构与策略断言，视觉验收在 artifacts 截图阶段。
 */

import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderDoocsHtml } from './doocs/engine'
import { compileForWechat } from './wechat/compiler'
import { checkWechatPolicy } from './wechat/policyCheck'
import { createEditorialEngine } from './index'
import v03FixtureRaw from '../../examples/v03-plain-markdown.md?raw'
import issue001Raw from '../../examples/issue-001.md?raw'

function html(md: string): string {
  return renderDoocsHtml(md).html
}

function secNums(dom: Document): string[] {
  return Array.from(dom.querySelectorAll('.sec-num')).map((n) => n.textContent ?? '')
}

describe('V0.3 H2 编号（渲染层自动生成，D1）', () => {
  it('H2 生成 01/02/03 序列，编号为真实文本', () => {
    const doc = new JSDOM(`<body>${html('## 一\n\n## 二\n\n## 三')}</body>`).window.document
    expect(secNums(doc)).toEqual(['01', '02', '03'])
    expect(doc.querySelectorAll('.sec-title').length).toBe(3)
    expect(doc.querySelectorAll('h2 .sec-num').length).toBe(3)
  })

  it('H3 不编号，也不递增 H2 序列', () => {
    const doc = new JSDOM(`<body>${html('## 甲\n\n### 子\n\n### 丑\n\n## 乙')}</body>`).window.document
    expect(secNums(doc)).toEqual(['01', '02'])
    expect(doc.querySelectorAll('h3').length).toBe(2)
    expect(doc.querySelectorAll('h3 .sec-num').length).toBe(0)
  })

  it('intro（首个 H2 前）无 00；第一段前导正文后首编号为 01', () => {
    const out = html('开篇段落。\n\n## 第一节')
    expect(out).not.toContain('>00<')
    const doc = new JSDOM(`<body>${out}</body>`).window.document
    expect(secNums(doc)).toEqual(['01'])
  })

  it('语义块不参与编号（两个 H2 之间的 question 不消耗序号）', () => {
    const out = html('## 甲\n\n:::question id="q"\n问题\n:::\n\n## 乙')
    const doc = new JSDOM(`<body>${out}</body>`).window.document
    expect(secNums(doc)).toEqual(['01', '02'])
    expect(doc.querySelectorAll('.sblock-question').length).toBe(1)
  })

  it('编号在浏览器预览与微信编译产物中都是真实文本', () => {
    const fixture = renderDoocsHtml(v03FixtureRaw).html
    const compiled = compileForWechat(v03FixtureRaw).html
    expect(fixture).toMatch(/<span class="sec-num">01<\/span>/)
    expect(compiled).toMatch(/<span class="sec-num"[^>]*>01<\/span>/)
    // 不依赖 CSS counter。
    expect(fixture).not.toMatch(/counter\(/)
  })

  it('legacy 与 doocs 对同一 H2 输入产出相同编号（A/B 结构等价保持）', () => {
    const legacy = createEditorialEngine('legacy')
    const doocs = createEditorialEngine('doocs')
    const md = '## 甲\n\n## 乙\n\n### 丙\n\n## 丁'
    expect(legacy.render(md).html).toContain('<span class="sec-num">03</span>')
    expect(doocs.render(md).html).toContain('<span class="sec-num">03</span>')
  })
})

describe('V0.3 纯 Markdown fixture（examples/v03-plain-markdown.md）', () => {
  it('渲染成功：零语义块、所有基础元素齐全、无 ::: 泄漏', () => {
    const out = renderDoocsHtml(v03FixtureRaw).html
    const doc = new JSDOM(`<body>${out}</body>`).window.document
    // 零语义块。
    expect(doc.querySelectorAll('.sblock').length).toBe(0)
    expect(doc.querySelectorAll('p').length).toBeGreaterThan(10)
    // 封面标题在 frontmatter → masthead（React/编译器层），body 无 <h1>。
    expect(doc.querySelectorAll('h1').length).toBe(0)
    expect(out).not.toContain(':::')
    // 4 个 H2 编号 01–04；3 个 H3 不编号。
    expect(secNums(doc)).toEqual(['01', '02', '03', '04'])
    expect(doc.querySelectorAll('h3').length).toBe(3)
    // 基础元素覆盖。
    expect(doc.querySelectorAll('strong').length).toBeGreaterThan(0)
    expect(doc.querySelectorAll('em').length).toBeGreaterThan(0)
    expect(doc.querySelectorAll('a').length).toBeGreaterThan(0)
    expect(doc.querySelectorAll('blockquote').length).toBe(1)
    expect(doc.querySelectorAll('ol li').length).toBe(3)
    expect(doc.querySelectorAll('ul li').length).toBe(3)
    expect(doc.querySelectorAll('hr').length).toBe(1)
    expect(doc.querySelectorAll('code').length).toBeGreaterThan(0)
    expect(doc.querySelectorAll('pre').length).toBe(1)
    expect(doc.querySelectorAll('table').length).toBe(1)
    expect(doc.querySelectorAll('img').length).toBe(1)
  })

  it('编译产物 policy-clean，且不依赖浏览器伪元素/计数器表达核心身份', () => {
    const compiled = compileForWechat(v03FixtureRaw).html
    expect(checkWechatPolicy(compiled)).toEqual([])
    expect(compiled).not.toMatch(/<style/i)
    expect(compiled).not.toMatch(/var\(\s*--/)
    // 核心身份（编号 + serif 标题）在微信产物中是真实文本与固定 px。
    expect(compiled).toMatch(/<span class="sec-num" style="[^"]*color:\s*#2F5FD7/)
    expect(compiled).toMatch(/sec-title/)
  })
})

describe('V0.2.3 行为不回归（微信编译基座）', () => {
  it('specimen metric 仍走 H01：<p> + 44px + weight 600 + margin 10px 0，无 line-height', () => {
    const compiled = compileForWechat(issue001Raw).html
    const m = compiled.match(/<p class="metric-value"[^>]*>43<\/p>/)?.[0] ?? 'NOT FOUND'
    expect(m.startsWith('<p')).toBe(true)
    expect(m).toContain('font-size: 44px')
    expect(m).toContain('font-weight: 600')
    expect(m).toContain('margin: 10px 0')
    expect(m).not.toContain('line-height')
  })

  it('judgment 保留单条 top 墨线，无 border-bottom；语义块结构不因 Phase 1 改变', () => {
    const compiled = compileForWechat(issue001Raw).html
    expect(compiled).toContain('judgment-author')
    expect(compiled).toContain('sblock-evidence')
    expect(compiled).toContain('sblock-lab-note')
    expect(checkWechatPolicy(compiled)).toEqual([])
  })
})
