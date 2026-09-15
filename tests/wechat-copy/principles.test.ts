// @vitest-environment jsdom
/**
 * :::principles → 微信编译产物验证（独立样张，不改动 wechat-copy-fixture.md 的既有断言）。
 *
 * 测试对象 = compileForWechat 产物（剪贴板实际写入的 HTML），与 wechat-copy/pipeline.test.ts 同一层。
 * 验收要点（OPT-IN PRINCIPLES BLOCK §5/§6）：
 *  - 编号 01–05 是真实 DOM 文本（非伪元素/counter），class 剥离后仍存在；
 *  - 卡片背景/左边条/标题层级以 inline style 存活；
 *  - 普通有序列表不受影响（同文档 ol li 数量不变、无 p-item 类）；
 *  - policyCheck 零 findings（无 flex/gap/@media/var 等禁用 primitive）；
 *  - text/plain 降级路径仍含编号与标题。
 */

import { describe, expect, it } from 'vitest'
import { compileForWechat } from '../../src/engine/wechat/compiler'
import { checkWechatPolicy } from '../../src/engine/wechat/policyCheck'
import fixtureRaw from './fixtures/principles-fixture.md?raw'

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** 模拟微信粘贴剥离 class（保留 inline style）。 */
function stripClasses(html: string): string {
  return html.replace(/\sclass="[^"]*"/g, '')
}

const artifact = (): ReturnType<typeof compileForWechat> => compileForWechat(fixtureRaw, { mode: 'editorial' })

describe(':::principles wechat artifact', () => {
  it('renders five cards with real-text numbers 01–05', () => {
    const doc = parse(artifact().html)
    const nums = [...doc.querySelectorAll('.p-num')]
    expect(nums.map((n) => n.textContent)).toEqual(['01', '02', '03', '04', '05'])
    // 编号是真实文本节点，不属于伪元素（juice inlinePseudoElements 不会凭空造内容）。
    expect(artifact().html).not.toMatch(/::before|::after/)
  })

  it('keeps title/desc hierarchy inline (bold title strong, muted desc)', () => {
    const doc = parse(artifact().html)
    const items = [...doc.querySelectorAll('.p-item')]
    expect(items.length).toBe(5)
    const firstTitle = items[0].querySelector('.p-title')
    expect(firstTitle?.textContent).toContain('先明确解释要服务什么目标')
    expect(firstTitle?.querySelector('strong')).toBeTruthy()
    expect((firstTitle?.querySelector('strong') as Element).getAttribute('style')).toContain('font-weight: 600')
    const desc = items[0].querySelector('.p-desc')
    expect(desc?.textContent).toContain('理解模型、验证单次建议')
    expect((desc as Element).getAttribute('style')).toContain('font-size: 14px')
  })

  it('cycles the five-tone progression (data-tone 1..5, bg + left bar inlined)', () => {
    const doc = parse(artifact().html)
    const items = [...doc.querySelectorAll('.p-item')]
    expect(items.map((el) => el.getAttribute('data-tone'))).toEqual(['1', '2', '3', '4', '5'])
    // juice 保留基础 border-left，tone 覆盖以 border-left-color 级联内联。
    expect((items[0] as Element).getAttribute('style')).toContain('border-left: 3px solid #2D7FF9')
    expect((items[1] as Element).getAttribute('style')).toContain('border-left-color: #243F9E')
    expect((items[4] as Element).getAttribute('style')).toContain('border-left-color: #252421')
    expect((items[0] as Element).getAttribute('style')).toContain('background: #EAF1FF')
    expect((items[3] as Element).getAttribute('style')).toContain('background: #FBE2DE')
  })

  it('tone cycles back to 1 after five items (stable rule, no unpredictable colors)', () => {
    const md = fixtureRaw.replace(':::', ':::') + `\n:::principles\n1. **第六条**\n\n   说明六。\n\n2. **第七条**\n\n   说明七。\n:::\n`
    const doc = parse(compileForWechat(md).html)
    const tones = [...doc.querySelectorAll('.p-item')].map((el) => el.getAttribute('data-tone'))
    expect(tones.slice(-2)).toEqual(['1', '2'])
  })

  it('number capsule and card survive class stripping (WeChat-like paste)', () => {
    const doc = parse(stripClasses(artifact().html))
    const num = [...doc.querySelectorAll('span')].find((s) => s.textContent === '01')
    expect(num).toBeTruthy()
    expect(num?.getAttribute('style')).toContain('display: inline-block')
    expect(num?.getAttribute('style')).toContain('background: #2D7FF9')
    // 卡容器必须是 section：微信粘贴白名单保留 section 的 inline style，清掉 div 的（真机实证）。
    const card = [...doc.querySelectorAll('section')].find((d) => d.getAttribute('style')?.includes('border-left: 3px solid #2D7FF9'))
    expect(card, 'tone-1 card keeps its left bar inline after class stripping').toBeTruthy()
    expect(card?.tagName).toBe('SECTION')
    expect(card?.textContent).toContain('先明确解释要服务什么目标')
  })

  it('plain ordered list is untouched (no principles DOM, li count unchanged)', () => {
    const doc = parse(artifact().html)
    const plainOls = [...doc.querySelectorAll('ol')].filter((ol) => !ol.classList.contains('p-list'))
    expect(plainOls.length).toBe(1)
    expect(plainOls[0].querySelectorAll('li').length).toBe(2)
    expect(plainOls[0].querySelector('li')?.getAttribute('style') ?? '').not.toContain('p-item')
    // 普通 li 不带 principles 卡片背景。
    expect((plainOls[0].querySelector('li') as Element).getAttribute('style') ?? '').not.toContain('background')
  })

  it('policy checker reports zero findings (no forbidden primitives)', () => {
    expect(checkWechatPolicy(artifact().html)).toEqual([])
  })

  it('plain-text fallback keeps numbers and titles', () => {
    const { plainText } = artifact()
    expect(plainText).toContain('01')
    expect(plainText).toContain('先明确解释要服务什么目标')
    expect(plainText).toContain('05')
    expect(plainText).toContain('用行为和结果评价解释')
  })

  it('compilation is deterministic', () => {
    expect(compileForWechat(fixtureRaw).html).toBe(compileForWechat(fixtureRaw).html)
  })
})
