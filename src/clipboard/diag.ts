/**
 * DEV-ONLY 剪贴板传输诊断核心（面板 + 测试共用）。
 *
 * 四层隔离测试（A/B/C/D）：
 *   A 纯文本       → navigator.clipboard.writeText（最简单路径）
 *   B 最小富文本   → ClipboardItem(text/html + text/plain)，最小固定 payload
 *   C 静态安全富文本 → 只用已验证微信安全 primitive（<p> + 固定 px + margin/color/weight/border）
 *   D 生产 artifact → compileForWechat(source) 与真实 COPY → WECHAT 同一产物
 *
 * 原则：现代写入【直写、不吞错】。每个失败返回真实异常 name/message/stack 与失败 stage。
 * 不做 execCommand / textarea 降级——降级是诊断完成之后才考虑的事（任务 STEP 5）。
 */

import { compileForWechat } from '../engine/wechat/compiler'
import { describeError } from './errors'
import type { PreviewMode } from '../engine/types'

export const TEST_A_TEXT = 'MAX_EDITORIAL_CLIPBOARD_TEXT_TEST'

export const TEST_B_HTML =
  '<p style="font-size:24px;font-weight:700;color:#3157D5;">\n  MAX EDITORIAL HTML TEST\n</p>'
export const TEST_B_PLAIN = 'MAX EDITORIAL HTML TEST'

// 只由已验证微信安全的 primitive 构成：<p> + 固定 px font-size + margin + color + font-weight + border。
export const TEST_C_HTML = [
  '<p style="font-size:20px;font-weight:700;color:#171612;margin:0 0 12px;">MAX EDITORIAL STATIC TEST</p>',
  '<p style="font-size:15px;color:#6b6a63;margin:0 0 12px;border-left:2px solid #3157D5;padding-left:10px;">STATIC · WECHAT-SAFE PRIMITIVES</p>',
].join('\n')
export const TEST_C_PLAIN = 'MAX EDITORIAL STATIC TEST\nSTATIC · WECHAT-SAFE PRIMITIVES'

export interface ClipboardEnvInfo {
  href: string
  isSecureContext: boolean
  hasFocus: boolean
  clipboardAvailable: boolean
  writeAvailable: boolean
  writeTextAvailable: boolean
  clipboardItemAvailable: boolean
  clipboardItemSupportsHtml: boolean | 'n/a'
  userAgent: string
}

export function collectClipboardEnv(): ClipboardEnvInfo {
  const w = typeof window !== 'undefined' ? window : undefined
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const clipboard = nav?.clipboard
  const CI = (w as unknown as { ClipboardItem?: typeof ClipboardItem })?.ClipboardItem

  let clipboardItemSupportsHtml: boolean | 'n/a' = 'n/a'
  if (typeof CI !== 'undefined') {
    clipboardItemSupportsHtml = typeof CI.supports === 'function' ? CI.supports('text/html') : 'n/a'
  }

  return {
    href: w?.location?.href ?? 'n/a',
    isSecureContext: w?.isSecureContext ?? false,
    hasFocus: w?.document?.hasFocus?.() ?? false,
    clipboardAvailable: Boolean(clipboard),
    writeAvailable: typeof clipboard?.write === 'function',
    writeTextAvailable: typeof clipboard?.writeText === 'function',
    clipboardItemAvailable: typeof CI !== 'undefined',
    clipboardItemSupportsHtml,
    userAgent: nav?.userAgent ?? 'n/a',
  }
}

export type DiagStage = 'env-check' | 'payload' | 'clipboarditem' | 'clipboard.write' | 'writeText'

export interface DiagResult {
  pass: boolean
  stage?: DiagStage
  errorName?: string
  errorMessage?: string
  errorStack?: string
  htmlLength?: number
  plainLength?: number
  topLevelElementCount?: number
  mimeTypes: string[]
}

/** MIME → Blob 的剪贴板 payload 构造（纯函数，测试可断言双 MIME）。 */
export function clipboardPayload(html: string, plain: string): Record<string, Blob> {
  return {
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([plain], { type: 'text/plain' }),
  }
}

function failure(stage: DiagStage, err: unknown, extra?: Partial<DiagResult>): DiagResult {
  const { name, message, stack } = describeError(err)
  return {
    pass: false,
    stage,
    errorName: name,
    errorMessage: message,
    errorStack: stack,
    mimeTypes: [],
    ...extra,
  }
}

function success(extra: Partial<DiagResult>): DiagResult {
  return { pass: true, mimeTypes: [], ...extra }
}

function getWindow(): Window {
  const w = typeof window !== 'undefined' ? window : undefined
  if (!w) throw new Error('no window (non-browser environment)')
  return w
}

function countTopLevelElements(html: string): number {
  try {
    if (typeof DOMParser === 'undefined') return -1
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.childElementCount
  } catch {
    return -1
  }
}

/** 纯文本写入（A）：直连 writeText，不吞错。 */
export async function runPlainTextTest(text: string): Promise<DiagResult> {
  const base = { plainLength: text.length, mimeTypes: ['text/plain'] }
  let w: Window
  try {
    w = getWindow()
  } catch (err) {
    return failure('env-check', err, base)
  }
  if (!w.isSecureContext) {
    return failure('env-check', new Error('window.isSecureContext is false — modern Clipboard API unavailable'), base)
  }
  if (typeof w.navigator.clipboard?.writeText !== 'function') {
    return failure('writeText', new Error('navigator.clipboard.writeText is not a function'), base)
  }
  try {
    await w.navigator.clipboard.writeText(text)
    return success(base)
  } catch (err) {
    return failure('writeText', err, base)
  }
}

/** 富文本写入（B/C/D 共用）：ClipboardItem + clipboard.write，构造与写入分 stage。 */
async function writeRich(html: string, plain: string): Promise<DiagResult> {
  const base: Partial<DiagResult> = {
    htmlLength: html.length,
    plainLength: plain.length,
    topLevelElementCount: countTopLevelElements(html),
    mimeTypes: ['text/html', 'text/plain'],
  }
  let w: Window
  try {
    w = getWindow()
  } catch (err) {
    return failure('env-check', err, base)
  }
  if (!w.isSecureContext) {
    return failure('env-check', new Error('window.isSecureContext is false — modern Clipboard API unavailable'), base)
  }
  const CI = (w as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem
  if (typeof CI === 'undefined') {
    return failure('clipboarditem', new Error('ClipboardItem is not defined in this browser'), base)
  }
  if (typeof w.navigator.clipboard?.write !== 'function') {
    return failure('clipboard.write', new Error('navigator.clipboard.write is not a function'), base)
  }
  let item: ClipboardItem
  try {
    item = new CI(clipboardPayload(html, plain))
  } catch (err) {
    return failure('clipboarditem', err, base)
  }
  try {
    await w.navigator.clipboard.write([item])
    return success(base)
  } catch (err) {
    return failure('clipboard.write', err, base)
  }
}

export async function runTestA(): Promise<DiagResult> {
  return runPlainTextTest(TEST_A_TEXT)
}

export async function runTestB(): Promise<DiagResult> {
  return writeRich(TEST_B_HTML, TEST_B_PLAIN)
}

export async function runTestC(): Promise<DiagResult> {
  return writeRich(TEST_C_HTML, TEST_C_PLAIN)
}

/** D：与生产 COPY → WECHAT 完全相同的 artifact（compileForWechat），但直写不吞错。 */
export async function runTestD(source: string, mode: PreviewMode): Promise<DiagResult> {
  let artifact: ReturnType<typeof compileForWechat>
  try {
    artifact = compileForWechat(source, { mode })
  } catch (err) {
    return failure('payload', err)
  }
  const rich = await writeRich(artifact.html, artifact.plainText)
  return { ...rich, htmlLength: artifact.html.length, plainLength: artifact.plainText.length }
}
