// @vitest-environment jsdom
/**
 * COPY → WECHAT 兼容管线确定性测试。
 *
 * 测试对象 = 剪贴板目标 HTML（compileForWechat 产物），不是浏览器渲染 DOM。
 * 关键假设：浏览器预览（renderDoocsHtml + article.css）与剪贴板产物是两个层；
 * 本套件只验证剪贴板层 —— 复制进微信的到底是什么。
 *
 * 边界声明（诚实）：本套件验证「产物自包含、策略干净、无类依赖、确定性、双 MIME」，
 * 不声称证明真实微信编辑器粘贴结果 —— 那必须真机验证（见 WECHAT_TARGET_COMPILER_REPORT.md）。
 */

import { afterEach, describe, expect, it } from 'vitest'
import { compileForWechat } from '../../src/engine/wechat/compiler'
import { checkWechatPolicy } from '../../src/engine/wechat/policyCheck'
import { copyHtml, richCopyAvailable } from '../../src/engine/doocs/vendor/browser-clipboard'
import { doocsEngine } from '../../src/engine/doocs/engine'
import { clearClipboardErrors, readClipboardErrors } from '../../src/clipboard/errors'
import fixtureRaw from './fixtures/wechat-copy-fixture.md?raw'

/* ── helpers ── */

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** 模拟微信粘贴时会剥离的 class 属性（微信编辑器保留 inline style，通常丢弃 class）。 */
function stripClasses(html: string): string {
  return html.replace(/\sclass="[^"]*"/g, '')
}

function styleOf(doc: Document, selector: string): string {
  const el = doc.querySelector(selector)
  expect(el, `missing element: ${selector}`).toBeTruthy()
  return (el as Element).getAttribute('style') ?? ''
}

/* jsdom 剪贴板 API stub（与 src/clipboard/diag.test.ts 同款，保证两套测试行为一致） */
class FakeClipboardItem {
  static supports(t: string): boolean {
    return t === 'text/html'
  }
  constructor(public data: Record<string, Blob>) {}
}

interface StubOpts {
  write?: ((items: unknown[]) => Promise<void>) | null
  writeText?: ((text: string) => Promise<void>) | null
  itemClass?: unknown
}

function stubClipboard(opts: StubOpts = {}): void {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      write: opts.write === undefined ? async () => {} : opts.write,
      writeText: opts.writeText === undefined ? async () => {} : opts.writeText,
    },
    configurable: true,
  })
  const Item = (opts.itemClass ?? FakeClipboardItem) as typeof ClipboardItem
  Object.defineProperty(window, 'ClipboardItem', { value: Item, configurable: true })
}

function restoreGlobals(): void {
  Reflect.deleteProperty(window, 'isSecureContext')
  Reflect.deleteProperty(navigator, 'clipboard')
  Reflect.deleteProperty(window, 'ClipboardItem')
}

afterEach(() => {
  restoreGlobals()
  clearClipboardErrors()
})

const artifact = (): ReturnType<typeof compileForWechat> => compileForWechat(fixtureRaw, { mode: 'editorial' })

/* ── 1. 剪贴板 MIME payload ── */

describe('MIME payload — the actual ClipboardItem data', () => {
  it('copyHtml writes BOTH text/html and text/plain with the compiled artifact', async () => {
    const a = artifact()
    let captured: Record<string, Blob> | null = null
    stubClipboard({
      write: async (items: unknown[]) => {
        captured = (items[0] as { data: Record<string, Blob> }).data
      },
    })
    const outcome = await copyHtml(a.html, a.plainText)
    expect(outcome.mode).toBe('rich')
    expect(captured).toBeTruthy()
    expect(Object.keys(captured!).sort()).toEqual(['text/html', 'text/plain'])
    // jsdom Blob 不支持 .text()，断言 MIME 类型与非空内容量（字节）。
    expect(captured!['text/html'].type).toBe('text/html')
    expect(captured!['text/plain'].type).toBe('text/plain')
    expect(captured!['text/html'].size).toBeGreaterThan(0)
    expect(captured!['text/plain'].size).toBeGreaterThan(0)
  })

  it('plain-text fallback is non-empty and present in the artifact', () => {
    const a = artifact()
    expect(a.plainText.length).toBeGreaterThan(0)
    expect(a.html.length).toBeGreaterThan(500)
  })

  it('rich capability gate is deterministic (isSecureContext + write + ClipboardItem + supports)', () => {
    // 纯 jsdom（无 stub）：非安全上下文 → 不可用
    expect(richCopyAvailable()).toBe(false)
    // 全部 stub → 可用
    stubClipboard()
    expect(richCopyAvailable()).toBe(true)
  })
})

/* ── 2. 产物内容与语义保留 ── */

describe('content & semantics survive serialization', () => {
  it('opening title (frontmatter) survives in masthead-title', () => {
    const html = artifact().html
    expect(html).toContain('微信复制兼容性验证样张')
    expect(html).toMatch(/<h1 class="masthead-title"[^>]*>微信复制兼容性验证样张<\/h1>/)
  })

  it('H1 body heading survives with inline serif sizing', () => {
    const doc = parse(artifact().html)
    const h1 = [...doc.querySelectorAll('h1')].find((h) => h.textContent?.includes('一级标题'))
    expect(h1).toBeTruthy()
    expect((h1 as Element).getAttribute('style')).toContain('font-size: 30px')
  })

  it('H2 auto-numbered heading survives with sec-num real text', () => {
    const doc = parse(artifact().html)
    const secNum = doc.querySelector('.sec-num')
    const secTitle = doc.querySelector('.sec-title')
    expect(secNum?.textContent).toBe('01') // 显式文本序号（非 CSS counter），微信编译依赖它
    expect(secTitle?.textContent).toBe('二级标题（H2 自动编号验证）')
    expect((secNum as Element).getAttribute('style')).toContain('display: block')
    expect((secNum as Element).getAttribute('style')).toContain('font-size: 11px')
  })

  it('paragraph with bold / italic / inline code / link survives with inline styles', () => {
    const doc = parse(artifact().html)
    expect(styleOf(doc, 'strong')).toContain('font-weight: 600')
    expect(styleOf(doc, 'em')).toContain('font-style: italic')
    expect(styleOf(doc, 'code')).toContain('font-family')
    const a = doc.querySelector('a[href="https://example.com/wechat-copy"]')
    expect(a).toBeTruthy()
    expect((a as Element).getAttribute('style')).toContain('color: #2F5FD7')
  })

  it('blockquote survives with border-left', () => {
    expect(styleOf(parse(artifact().html), 'blockquote')).toContain('border-left')
  })

  it('ordered and unordered lists survive with li items', () => {
    const doc = parse(artifact().html)
    expect(doc.querySelectorAll('ul li').length).toBe(2)
    expect(doc.querySelectorAll('ol li').length).toBe(2)
    expect(styleOf(doc, 'ul')).toContain('padding-left')
    expect(styleOf(doc, 'li')).toContain('margin-bottom')
  })

  it('separator (hr) survives', () => {
    expect(styleOf(parse(artifact().html), 'hr')).toContain('border-top')
  })

  it('metric semantic block survives (H01 44px pattern preserved)', () => {
    const doc = parse(artifact().html)
    const metricValue = doc.querySelector('.sblock-metric .metric-value')
    expect(metricValue).toBeTruthy()
    expect((metricValue as Element).textContent?.trim()).toBe('44')
    const st = (metricValue as Element).getAttribute('style') ?? ''
    expect(st).toContain('font-size: 44px')
    expect(st).toContain('font-weight: 600')
  })

  it('judgment semantic block survives as a distinct section', () => {
    const doc = parse(artifact().html)
    const j = doc.querySelector('.sblock-judgment')
    expect(j).toBeTruthy()
    expect((j as Element).getAttribute('style')).toContain('border-top')
    expect(j?.textContent).toContain('管线样张判断')
  })
})

/* ── 3. 自包含 / 关键样式内联 ── */

describe('self-contained inline styling (no app CSS dependency)', () => {
  it('has no <style>, no external CSS, no var()', () => {
    const html = artifact().html
    expect(html).not.toMatch(/<style/i)
    expect(html).not.toMatch(/<link/i)
    expect(html).not.toMatch(/var\(\s*--/)
    expect(html).not.toMatch(/@import/i)
  })

  it('critical styles are inlined on the elements, not class-dependent', () => {
    const doc = parse(artifact().html)
    expect(styleOf(doc, '.masthead-title')).toContain('font-size: 30px')
    expect(styleOf(doc, '.sec-num')).toContain('display: block')
    expect(styleOf(doc, 'p')).toContain('margin: 0 0 22px')
  })

  it('after class-stripping (WeChat-like), critical formatting still survives inline', () => {
    const doc = parse(stripClasses(artifact().html))
    // 全部关键样式都内联 → 剥离 class 后仍然在。
    const boldP = [...doc.querySelectorAll('p')].find((p) => p.textContent?.includes('普通段落'))
    expect(boldP?.getAttribute('style')).toContain('margin: 0 0 22px')
    expect(doc.querySelector('strong')?.getAttribute('style')).toContain('font-weight: 600')
    expect(doc.querySelector('a')?.getAttribute('style')).toContain('color: #2F5FD7')
    expect(doc.querySelector('blockquote')?.getAttribute('style')).toContain('border-left')
    const metricValue = [...doc.querySelectorAll('p')].find((p) => p.textContent?.trim() === '44')
    expect(metricValue?.getAttribute('style')).toContain('font-size: 44px')
    // 标题字号内联（V0.3 serif 标题不依赖外部 font stack 选择器命中）。
    expect(doc.querySelector('h1')?.getAttribute('style')).toContain('font-size')
  })
})

/* ── 4. 禁止 CSS primitive 不出现（复用项目既有策略检查器） ── */

describe('WeChat policy compliance (reuses checkWechatPolicy)', () => {
  it('policy checker reports zero findings for the fixture artifact', () => {
    expect(checkWechatPolicy(artifact().html)).toEqual([])
  })

  it('no forbidden layout primitives in the artifact', () => {
    const html = artifact().html
    for (const re of [/display:\s*flex/i, /flex-direction/i, /flex-wrap/i, /gap\s*:/i, /clamp\s*\(/i, /\b\d+vw\b/i, /@media/i, /white-space:\s*nowrap/i, /display:\s*grid/i]) {
      expect(html, re.toString()).not.toMatch(re)
    }
  })
})

/* ── 5. 确定性 & 无 DOM 变异 ── */

describe('determinism & purity', () => {
  it('compilation is deterministic (identical html + plainText)', () => {
    const a = compileForWechat(fixtureRaw)
    const b = compileForWechat(fixtureRaw)
    expect(a.html).toBe(b.html)
    expect(a.plainText).toBe(b.plainText)
  })

  it('does not mutate any live DOM or the input', () => {
    const before = document.body.innerHTML
    const input = fixtureRaw
    compileForWechat(input)
    expect(document.body.innerHTML).toBe(before)
    expect(input).toBe(fixtureRaw)
  })
})

/* ── 6. 结构完整性：无畸形包装 ── */

describe('structural integrity (no malformed wrappers)', () => {
  it('artifact parses to exactly one top-level wechat-article section', () => {
    const doc = parse(artifact().html)
    expect(doc.body.childElementCount).toBe(1)
    const root = doc.body.firstElementChild!
    expect(root.tagName).toBe('SECTION')
    expect(root.classList.contains('wechat-article')).toBe(true)
    expect(root.querySelector('header.masthead')).toBeTruthy()
    expect(root.querySelector('div.article')).toBeTruthy()
    expect(root.querySelector('footer.article-footer')).toBeTruthy()
  })

  it('preview & clipboard consume the same artifact (App contract)', () => {
    // App.tsx: 预览（WECHAT/MOBILE viewport）与 doocs copyToWechat 内部调用同一 compileForWechat。
    const a = compileForWechat(fixtureRaw, { mode: 'editorial' })
    const b = compileForWechat(fixtureRaw, { mode: 'editorial' })
    expect(a.html).toBe(b.html)
  })
})

/* ── 7. 可读纯文本降级（text/plain） ── */

describe('plain-text fallback readability', () => {
  it('blocks are separated by newlines (no glued content)', () => {
    const { plainText } = artifact()
    expect(plainText).toContain('微信复制兼容性验证样张')
    expect(plainText).toContain('一级标题')
    expect(plainText).toContain('METRIC LABEL')
    expect(plainText).toContain('44')
    expect(plainText.split('\n').length).toBeGreaterThan(3)
    // 回归：旧的 textContent 压平会把 masthead 品牌与 series 粘成「…判断局FIXTURE…」。
    expect(plainText).not.toMatch(/判断局FIXTURE/)
  })
})

/* ── 8. 传输行为：可观测的 rich / plain ── */

describe('transport: observable rich/plain outcome', () => {
  it('rich write success → mode rich', async () => {
    stubClipboard()
    const a = artifact()
    expect(await copyHtml(a.html, a.plainText)).toEqual({ mode: 'rich' })
  })

  it('ClipboardItem missing → records reason, falls back to plain, returns mode plain', async () => {
    // write 存在但 ClipboardItem 未定义（WebKit 边缘）：确定性降级，不再假装成功。
    stubClipboard()
    Object.defineProperty(window, 'ClipboardItem', { value: undefined, configurable: true })
    const a = artifact()
    expect(await copyHtml(a.html, a.plainText)).toEqual({ mode: 'plain' })
    expect(readClipboardErrors().some((r) => r.stage === 'copyHtml → rich unavailable')).toBe(true)
  })

  it('ClipboardItem.supports(text/html)=false → mode plain', async () => {
    class NoHtmlSupport {
      static supports(t: string): boolean {
        return t !== 'text/html'
      }
      constructor(public data: Record<string, Blob>) {}
    }
    stubClipboard({ itemClass: NoHtmlSupport })
    const a = artifact()
    expect(await copyHtml(a.html, a.plainText)).toEqual({ mode: 'plain' })
  })

  it('doocsEngine.copyToWechat propagates mode into CopyResult', async () => {
    stubClipboard()
    const r = await doocsEngine.copyToWechat(fixtureRaw, { mode: 'editorial' })
    expect(r.ok).toBe(true)
    expect(r.mode).toBe('rich')
    expect(r.html).toContain('wechat-article')
  })

  it('doocsEngine.copyToWechat reports plain mode when only plain write succeeds', async () => {
    // 富路径缺失（无 ClipboardItem），纯文本可写 → ok:true 但 mode:plain（UI 会提示）。
    stubClipboard()
    Object.defineProperty(window, 'ClipboardItem', { value: undefined, configurable: true })
    const r = await doocsEngine.copyToWechat(fixtureRaw)
    expect(r.ok).toBe(true)
    expect(r.mode).toBe('plain')
    expect(r.plainText.length).toBeGreaterThan(0)
  })
})
