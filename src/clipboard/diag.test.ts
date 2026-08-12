// @vitest-environment jsdom
/**
 * 剪贴板传输诊断测试。
 *
 * 定位：断言 payload/MIME 构造、错误传播不被吞、环境快照形状。
 * 注意：自动化测试【不证明】浏览器剪贴板权限/用户激活行为 —— 那必须真机手测
 * （见 CLIPBOARD_TRANSPORT_DIAGNOSTIC_REPORT.md 手测步骤 A/B/C/D）。
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  TEST_A_TEXT,
  TEST_B_HTML,
  TEST_B_PLAIN,
  TEST_C_HTML,
  TEST_C_PLAIN,
  clipboardPayload,
  collectClipboardEnv,
  runPlainTextTest,
  runTestA,
  runTestB,
  runTestD,
} from './diag'
import { compileForWechat } from '../engine/wechat/compiler'
import { copyHtml } from '../engine/doocs/vendor/browser-clipboard'
import { doocsEngine } from '../engine/doocs/engine'
import {
  clearClipboardErrors,
  readClipboardErrors,
  recordClipboardError,
} from './errors'
import fixtureRaw from '../../examples/issue-001.md?raw'

class FakeClipboardItem {
  static supports(t: string): boolean {
    return t === 'text/html'
  }
  constructor(public data: Record<string, Blob>) {}
}

interface StubOpts {
  /** 缺省 = 成功 no-op；显式 null = 「存在但非函数」（模拟 write 缺失/异常）。 */
  write?: ((items: unknown[]) => Promise<void>) | null
  writeText?: ((text: string) => Promise<void>) | null
  clipboardItemThrows?: boolean
}

function stubModernClipboard(opts: StubOpts = {}): void {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      write: opts.write === undefined ? async () => {} : opts.write,
      writeText: opts.writeText === undefined ? async () => {} : opts.writeText,
    },
    configurable: true,
  })
  const Item = opts.clipboardItemThrows
    ? class {
        constructor() {
          throw new Error('ctor boom')
        }
      }
    : FakeClipboardItem
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

describe('payload builders', () => {
  it('TEST_B is minimal inline-styled HTML with both plain fallback', () => {
    expect(TEST_B_HTML).toContain('<p')
    expect(TEST_B_HTML).toContain('style=')
    expect(TEST_B_HTML).not.toContain('<style')
    expect(TEST_B_HTML).not.toContain('class=')
    expect(TEST_B_HTML).toContain('font-size:24px')
    expect(TEST_B_HTML).toContain('#3157D5')
    expect(TEST_B_PLAIN).toBe('MAX EDITORIAL HTML TEST')
  })

  it('TEST_C uses only WeChat-safe primitives (<p> + fixed px, no forbidden layout)', () => {
    for (const re of [/<style/i, /class=/i, /display:\s*flex/i, /clamp\s*\(/i, /\b\d+vw\b/i, /@media/i, /white-space:\s*nowrap/i, /display:\s*grid/i]) {
      expect(TEST_C_HTML, re.toString()).not.toMatch(re)
    }
    // 只有 <p> 块级 primitive，全部固定 px。
    const pTags = TEST_C_HTML.match(/<p /g)?.length ?? 0
    expect(pTags).toBeGreaterThanOrEqual(2)
    expect(TEST_C_HTML).toMatch(/font-size:\s*\d+px/)
    expect(TEST_C_HTML).toMatch(/border-left:\s*2px/)
    expect(TEST_C_PLAIN).toContain('MAX EDITORIAL STATIC TEST')
  })

  it('clipboardPayload constructs BOTH text/html and text/plain MIME entries', () => {
    const payload = clipboardPayload('<p>hi</p>', 'hi')
    expect(Object.keys(payload)).toEqual(['text/html', 'text/plain'])
    expect(payload['text/html'].type).toBe('text/html')
    expect(payload['text/plain'].type).toBe('text/plain')
  })

  it('production artifact payload contains BOTH text/html and text/plain (same artifact as COPY → WECHAT)', () => {
    const artifact = compileForWechat(fixtureRaw)
    const payload = clipboardPayload(artifact.html, artifact.plainText)
    expect(Object.keys(payload)).toEqual(['text/html', 'text/plain'])
    // 产物非空且含完整结构（masthead + body + footer）。
    expect(artifact.html.length).toBeGreaterThan(500)
    expect(artifact.plainText.length).toBeGreaterThan(0)
    expect(payload['text/html'].size).toBeGreaterThan(500)
  })
})

describe('environment snapshot', () => {
  it('collects shape without throwing in a plain jsdom (no modern APIs)', () => {
    const env = collectClipboardEnv()
    expect(env.href).toBeTruthy()
    expect(env.isSecureContext).toBe(false) // jsdom 默认非安全上下文
    expect(env.clipboardAvailable).toBe(false)
    expect(env.writeAvailable).toBe(false)
    expect(env.writeTextAvailable).toBe(false)
    expect(env.clipboardItemAvailable).toBe(false)
    expect(env.clipboardItemSupportsHtml).toBe('n/a')
    expect(typeof env.hasFocus).toBe('boolean')
    expect(typeof env.userAgent).toBe('string')
  })

  it('reports modern APIs as available once stubbed', () => {
    stubModernClipboard()
    const env = collectClipboardEnv()
    expect(env.isSecureContext).toBe(true)
    expect(env.clipboardAvailable).toBe(true)
    expect(env.writeAvailable).toBe(true)
    expect(env.writeTextAvailable).toBe(true)
    expect(env.clipboardItemAvailable).toBe(true)
    expect(env.clipboardItemSupportsHtml).toBe(true)
  })
})

describe('TEST A — plain text write', () => {
  it('fails cleanly (no throw) when isSecureContext is false, stage env-check', async () => {
    const r = await runPlainTextTest(TEST_A_TEXT)
    expect(r.pass).toBe(false)
    expect(r.stage).toBe('env-check')
    expect(r.errorMessage).toMatch(/isSecureContext/)
    // 意图写入的 MIME 仍在结果中暴露（诊断信息），即便写入未发生。
    expect(r.mimeTypes).toEqual(['text/plain'])
  })

  it('surfaces rejection from navigator.clipboard.writeText (not swallowed)', async () => {
    stubModernClipboard({
      writeText: async () => {
        throw new DOMException('Write permission denied', 'NotAllowedError')
      },
    })
    const r = await runPlainTextTest(TEST_A_TEXT)
    expect(r.pass).toBe(false)
    expect(r.stage).toBe('writeText')
    expect(r.errorName).toBe('NotAllowedError')
    expect(r.errorMessage).toContain('Write permission denied')
  })
})

describe('TEST B — minimal rich HTML write', () => {
  it('passes when ClipboardItem + clipboard.write resolve', async () => {
    stubModernClipboard()
    const r = await runTestB()
    expect(r.pass).toBe(true)
    expect(r.mimeTypes).toEqual(['text/html', 'text/plain'])
    expect(r.htmlLength).toBe(TEST_B_HTML.length)
    expect(r.plainLength).toBe(TEST_B_PLAIN.length)
  })

  it('reports stage clipboard.write when write rejects (error NOT swallowed)', async () => {
    stubModernClipboard({
      write: async () => {
        throw new DOMException('The request is not allowed by the user agent', 'NotAllowedError')
      },
    })
    const r = await runTestB()
    expect(r.pass).toBe(false)
    expect(r.stage).toBe('clipboard.write')
    expect(r.errorName).toBe('NotAllowedError')
    expect(r.errorMessage).toMatch(/not allowed/i)
  })

  it('reports stage clipboarditem when ClipboardItem construction throws', async () => {
    stubModernClipboard({ clipboardItemThrows: true })
    const r = await runTestB()
    expect(r.pass).toBe(false)
    expect(r.stage).toBe('clipboarditem')
    expect(r.errorName).toBe('Error')
    expect(r.errorMessage).toContain('ctor boom')
  })

  it('fails at stage clipboard.write when navigator.clipboard.write is not a function', async () => {
    stubModernClipboard({ write: null })
    const r = await runTestB()
    expect(r.pass).toBe(false)
    expect(r.stage).toBe('clipboard.write')
    expect(r.errorMessage).toMatch(/write is not a function/i)
  })
})

describe('TEST D — production artifact', () => {
  it('passes with the exact production artifact and reports lengths', async () => {
    stubModernClipboard()
    const artifact = compileForWechat(fixtureRaw, { mode: 'editorial' })
    const r = await runTestD(fixtureRaw, 'editorial')
    expect(r.pass).toBe(true)
    expect(r.htmlLength).toBe(artifact.html.length)
    expect(r.plainLength).toBe(artifact.plainText.length)
    expect(r.mimeTypes).toEqual(['text/html', 'text/plain'])
    expect((r.topLevelElementCount ?? -1)).toBeGreaterThanOrEqual(1)
  })
})

describe('production instrumentation — errors are recorded, not swallowed', () => {
  it('recordClipboardError captures name/message/stage; clear works', () => {
    recordClipboardError('probe', new DOMException('denied', 'NotAllowedError'))
    const rec = readClipboardErrors()[0]
    expect(rec.stage).toBe('probe')
    expect(rec.name).toBe('NotAllowedError')
    expect(rec.message).toBe('denied')
    clearClipboardErrors()
    expect(readClipboardErrors()).toHaveLength(0)
  })

  it('copyHtml records the modern-write failure before falling back (no silent swallow)', async () => {
    stubModernClipboard({
      write: async () => {
        throw new DOMException('The request is not allowed by the user agent', 'NotAllowedError')
      },
      writeText: async () => {
        throw new DOMException('Read permission denied', 'NotAllowedError')
      },
    })
    // execCommand 在 jsdom 返回 false → legacy 拒绝 → copyHtml reject。
    await expect(copyHtml('<p>x</p>', 'x')).rejects.toBeTruthy()
    const stages = readClipboardErrors().map((r) => r.stage)
    expect(stages).toContain('copyHtml → ClipboardItem/clipboard.write')
    expect(stages).toContain('copyPlain → navigator.clipboard.writeText')
    // 至少有一条含 NotAllowedError 真实异常。
    const withErr = readClipboardErrors().filter((r) => r.name === 'NotAllowedError')
    expect(withErr.length).toBeGreaterThan(0)
  })

  it('doocsEngine.copyToWechat records engine-level failure instead of silent {}', async () => {
    stubModernClipboard({
      write: async () => {
        throw new DOMException('The request is not allowed by the user agent', 'NotAllowedError')
      },
      writeText: async () => {
        throw new DOMException('Read permission denied', 'NotAllowedError')
      },
    })
    const r = await doocsEngine.copyToWechat(fixtureRaw)
    expect(r.ok).toBe(false)
    const stages = readClipboardErrors().map((x) => x.stage)
    expect(stages).toContain('doocsEngine.copyToWechat')
    expect(readClipboardErrors().length).toBeGreaterThanOrEqual(2)
  })
})
