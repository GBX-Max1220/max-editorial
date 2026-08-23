// @vitest-environment jsdom
/**
 * V0.3 Phase 2 — RED-BLUE EDITORIAL：Markdown 全语法 + 微信安全输出 聚焦测试。
 *
 * 定位：结构与策略断言（无像素）。视觉验收在 artifacts 截图阶段（CDP 真视口）。
 * 覆盖任务 §十二 的 20 项：
 *   既有测试继续通过（另跑全套）；H1–H6 稳定；H4 解钳；7 语义块结构；
 *   Question 蓝 / Counterpoint 红 / Judgment 无红底 / quote 中性 / AI Output 无大蓝底；
 *   Metric ≤44px；产物无 var()/伪元素/counter；ol 序号非脆弱 counter；图片不超宽；
 *   长 URL/代码不溢出；390px 无横向滚动（CDP 层）；红蓝 token 编译为最终 hex；
 *   老 fixture 无结构回归；复制输出为合法 HTML。
 */

import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { renderDoocsHtml } from './doocs/engine'
import { compileForWechat } from './wechat/compiler'
import { checkWechatPolicy } from './wechat/policyCheck'
import { validateDocument } from './validate'
import fixtureRaw from '../../examples/red-blue-editorial.md?raw'

function html(md: string): string {
  return renderDoocsHtml(md).html
}

function compiled(md: string = fixtureRaw): string {
  return compileForWechat(md).html
}

function dom(md: string = fixtureRaw): Document {
  return new JSDOM(`<body>${html(md)}</body>`).window.document
}

const BLUE = '#2F5FD7'
const RED = '#D4473F'
const NEUTRAL = '#746F67'
const NEUTRAL_SURFACE = '#F4F1EB'
const BLUE_SURFACE = '#DCE8FF'
const RED_SURFACE = '#FBE2DE'

describe('H1–H6 输出稳定；H4 不再被钳制（§五）', () => {
  it('渲染 #–###### 为对应 h1–h6', () => {
    const md = ['# 一', '## 二', '### 三', '#### 四', '##### 五', '###### 六'].join('\n\n')
    const doc = dom(md)
    expect(doc.querySelector('h1')?.textContent).toBe('一')
    expect(doc.querySelector('h2')?.textContent).toContain('二')
    expect(doc.querySelector('h3')?.textContent).toBe('三')
    expect(doc.querySelector('h4')?.textContent).toBe('四')
    expect(doc.querySelector('h5')?.textContent).toBe('五')
    expect(doc.querySelector('h6')?.textContent).toBe('六')
  })

  it('H4 不再被钳到 h3（深度 4 真实产出 <h4>）', () => {
    const doc = dom('#### 四层标题')
    expect(doc.querySelectorAll('h4').length).toBe(1)
    expect(doc.querySelectorAll('h3').length).toBe(0)
  })

  it('H5/H6 为可区分低层级（非退化到正文）', () => {
    const doc = dom('##### 五\n\n###### 六')
    const h5 = doc.querySelector('h5')
    const h6 = doc.querySelector('h6')
    expect(h5).toBeTruthy()
    expect(h6).toBeTruthy()
    expect(h5?.textContent).not.toBe(h6?.textContent)
  })

  it('H2 短墨线为真实节点（sec-rule），编译产物含该节点 + 蓝色', () => {
    const out = html('## 章节')
    const doc = dom('## 章节')
    expect(doc.querySelector('h2 .sec-rule')).toBeTruthy()
    expect(out).not.toMatch(/<h2[^>]*>::after/)
    const c = compiled('## 章节')
    expect(c).toContain('sec-rule')
    expect(c).toMatch(/class="sec-rule"[^>]*style="[^"]*background:\s*#2F5FD7/)
  })
})

describe('七个语义块输出预期结构（§六）', () => {
  it('fixture 包含全部 7 个语义块（claim 为命题）', () => {
    const doc = dom()
    expect(doc.querySelector('.sblock-question')).toBeTruthy()
    expect(doc.querySelector('.sblock-ai-output')).toBeTruthy()
    expect(doc.querySelector('.sblock-judgment')).toBeTruthy()
    expect(doc.querySelector('.sblock-evidence')).toBeTruthy()
    expect(doc.querySelector('.sblock-counterpoint')).toBeTruthy()
    expect(doc.querySelector('.sblock-lab-note')).toBeTruthy()
    expect(doc.querySelector('.sblock-metric')).toBeTruthy()
  })

  it('Question 使用蓝色语义（label 蓝 + 蓝边 + 浅蓝面）', () => {
    const c = compiled(':::question\n问题\n:::')
    expect(c).toMatch(/sblock-question[^"]*"[^>]*style="[^"]*border-left: 2px solid #2F5FD7/)
    expect(c).toContain(`background: ${BLUE_SURFACE}`)
    // label 在编译产物内联蓝。
    const labelStyle = c.match(/class="sblock-label" style="[^"]*color: #2F5FD7/)?.[0]
    expect(labelStyle).toBeTruthy()
  })

  it('Counterpoint 使用红色语义（红边 + 红 label）', () => {
    const c = compiled(':::counterpoint\n反方\n:::')
    expect(c).toContain('border-left: 2px solid #D4473F')
    expect(c).toMatch(/class="sblock-label" style="[^"]*color: #D4473F/)
  })

  it('Evidence 使用蓝色语义，且与 Counterpoint 同容器同排版（parity）', () => {
    const ev = compiled(':::evidence\n证据\n:::')
    const cp = compiled(':::counterpoint\n反方\n:::')
    expect(ev).toContain('border-left: 2px solid #2F5FD7')
    expect(cp).toContain('border-left: 2px solid #D4473F')
    // legibility parity（INVARIANT A2）：同容器同排版，仅 border/label 色不同。
    // evidence 无对照时内容在 .evidence-prose；counterpoint 恒为 .sblock-body。
    const evDoc = new JSDOM(ev).window.document
    const cpDoc = new JSDOM(cp).window.document
    const evBody = evDoc.querySelector('.sblock-evidence .evidence-prose') ?? evDoc.querySelector('.sblock-evidence .sblock-body')
    const cpBody = cpDoc.querySelector('.sblock-counterpoint .sblock-body')
    expect(evBody).toBeTruthy()
    expect(cpBody).toBeTruthy()
    const evStyle = (evBody as Element).getAttribute('style') ?? ''
    const cpStyle = (cpBody as Element).getAttribute('style') ?? ''
    for (const prop of ['font-size', 'line-height', 'color']) {
      expect(evStyle).toContain(prop)
      expect(cpStyle).toContain(prop)
    }
  })

  it('Judgment 不输出红色大背景，仅红色小标签 + 墨线', () => {
    const c = compiled(':::judgment\n判断\n:::')
    expect(c).toContain('border-top: 1px solid #252421')
    expect(c).not.toContain(`background: ${'#D4473F'}`)
    expect(c).not.toContain(`background: ${RED_SURFACE}`)
    expect(c).toMatch(/class="sblock-label" style="[^"]*color: #D4473F/)
  })

  it('AI Output 使用不透明蓝面（Owner 真机反馈：整块蓝底，非仅左边框）', () => {
    const c = compiled(':::ai-output source="来源" status="raw"\n输出\n:::')
    const sec = c.match(/class="sblock sblock-ai-output"[^>]*>/)?.[0] ?? ''
    expect(sec).toContain(`background: ${BLUE_SURFACE}`)
    expect(sec).not.toContain('rgba(') // 不透明，非半透明
  })

  it('Evidence / Metric 整块蓝面；Counterpoint 整块红面（非仅左边框）', () => {
    const ev = compiled(':::evidence\n证据\n:::')
    const cp = compiled(':::counterpoint\n反方\n:::')
    const mt = compiled(':::metric value="90%" display_function="inspection_specimen"\n:::')
    const mn = compiled(':::metric value="-18%" negative="true" display_function="reported_result"\n:::')
    expect(ev).toMatch(/class="sblock sblock-evidence[^"]*"[^>]*style="[^"]*background: #DCE8FF/)
    expect(cp).toMatch(/class="sblock sblock-counterpoint[^"]*"[^>]*style="[^"]*background: #FBE2DE/)
    expect(mt).toMatch(/class="sblock sblock-metric[^"]*"[^>]*style="[^"]*background: #DCE8FF/)
    // negative metric → 红面
    expect(mn).toMatch(/data-negative="true"[^>]*style="[^"]*background: #FBE2DE/)
  })

  it('Metric 字号不超过 44px（specimen 44px 上限）', () => {
    const c = compiled()
    // 所有 metric-value 的 font-size 均 ≤ 44px。
    const sizes = [...c.matchAll(/metric-value[^>]*style="([^"]*)"/g)].map((m) => {
      const fs = m[1].match(/font-size: (\d+)px/)?.[1]
      return fs ? Number(fs) : 0
    })
    expect(sizes.length).toBeGreaterThan(0)
    for (const s of sizes) expect(s).toBeLessThanOrEqual(44)
  })

  it('Metric negative：数字转红且伴随文本标签', () => {
    const c = compiled(':::metric value="-18%" negative="true" display_function="reported_result"\n:::')
    expect(c).toContain('metric-value-negative')
    expect(c).toMatch(/metric-value-negative"[^>]*style="[^"]*color: #D4473F/)
    // 伴随文本标签（label 或默认"负向风险"）。
    expect(c).toMatch(/metric-label[^>]*>负向风险|负向风险/)
  })

  it('红蓝对立：label 为真实文本（观点 A / 观点 B）', () => {
    const c = compiled()
    expect(c).toContain('观点 A')
    expect(c).toContain('观点 B')
  })
})

describe('普通 Markdown 中性（§五）', () => {
  it('普通 blockquote 保持中性：中性灰边 + neutral surface，不用蓝/红', () => {
    const c = compiled('> 引用\n')
    expect(c).toContain(`border-left: 2px solid ${NEUTRAL}`)
    expect(c).toContain(`background: ${NEUTRAL_SURFACE}`)
    expect(c).not.toContain('border-left: 2px solid #2F5FD7')
    expect(c).not.toContain('border-left: 2px solid #D4473F')
  })

  it('q-source：以 —— 开头的末段渲染为 .q-source（真实文本）', () => {
    const out = html('> 引文正文。\n> —— 来源示例\n')
    const doc = new JSDOM(`<body>${out}</body>`).window.document
    expect(doc.querySelector('blockquote .q-source')).toBeTruthy()
    expect(doc.querySelector('blockquote .q-source')?.textContent).toContain('来源示例')
    // 无来源的引用不产生 .q-source。
    const noSource = html('> 无来源引用\n')
    expect(noSource).not.toContain('q-source')
  })

  it('粗体仍为墨色加粗（不默认变红）；链接用蓝色 + 下划线（不只靠颜色）', () => {
    const c = compiled('**粗体** 与 [链接](https://example.com)')
    expect(c).toContain('font-weight: 600')
    expect(c).not.toMatch(/<strong[^>]*style="[^"]*color:/)
    expect(c).toContain('color: #2F5FD7')
    expect(c).toContain('border-bottom: 1px solid #2F5FD7')
  })

  it('task list：真实符号 ☑/☐（微信稳定），已完成=蓝，未完成=neutral', () => {
    const c = compiled('- [x] 完成项\n- [ ] 待办项')
    expect(c).toContain('☑')
    expect(c).toContain('☐')
    expect(c).not.toContain('<input')
    expect(c).toMatch(/task-done"[^>]*style="[^"]*color: #2F5FD7/)
    expect(c).toMatch(/task-mark"[^>]*style="[^"]*color: #6F6B63/)
  })

  it('图片 max-width:100% 且高度自适应；不固定宽度', () => {
    const c = compiled()
    expect(c).toMatch(/<img[^>]*style="[^"]*max-width: 100%[^"]*height: auto/)
  })
})

describe('微信安全编译（§八/§十二）', () => {
  it('产物无 var()、无伪元素、无 counter()、无 clamp/vw、无 rgba 半透明', () => {
    const c = compiled()
    expect(c).not.toMatch(/var\(\s*--/)
    expect(c).not.toMatch(/::before|::after/)
    expect(c).not.toMatch(/counter\(/)
    expect(c).not.toMatch(/clamp\s*\(|\b\d+vw\b/)
    expect(c).not.toMatch(/rgba\(/)
    expect(checkWechatPolicy(c)).toEqual([])
  })

  it('红蓝 token 编译为最终 hex（无 token 名称泄漏）', () => {
    const c = compiled()
    expect(c).toContain(BLUE)
    expect(c).toContain(RED)
    expect(c).not.toMatch(/var\(--blue\)|var\(--red\)|--blue|--red/)
  })

  it('有序列表在微信产物中用原生 <ol>，不依赖 CSS counter', () => {
    const c = compiled('1. 甲\n2. 乙')
    expect(c).toContain('<ol')
    expect(c).not.toContain('counter(')
    expect(c).not.toMatch(/content:\s*counter/)
  })

  it('长 URL / 代码不造成 article 级溢出（overflow-wrap + 局部横滚）', () => {
    const c = compiled()
    expect(c).toMatch(/overflow-wrap: break-word/)
    expect(c).toMatch(/class="table-wrap" style="[^"]*overflow-x: auto/)
    expect(c).toMatch(/<pre[^>]*style="[^"]*overflow-x: auto/)
  })

  it('复制输出为完整合法 HTML（可被 DOM 解析，无 ::: 泄漏）', () => {
    const c = compiled()
    const doc = new JSDOM(c).window.document
    expect(doc.body.innerHTML.length).toBeGreaterThan(0)
    expect(c).not.toContain(':::')
    // 自包含：masthead + article + footer 都在。
    expect(c).toContain('masthead-title')
    expect(c).toContain('article-footer')
  })

  it('fixture 渲染零诊断（认识论 lint 无 error）', () => {
    const { tokens } = renderDoocsHtml(fixtureRaw)
    const diags = validateDocument(tokens)
    expect(diags.filter((d) => d.severity === 'error')).toEqual([])
  })
})
