/**
 * DEV 剪贴板诊断：错误记录器（生产 copy 路径 instrumentation 的落点）。
 *
 * 定位：不吞错。生产路径的每个 catch 都把真实异常记到这里，
 * 面板读取后展示 name / message / stack / stage。纯内存环形缓冲，无 UI，无网络。
 */

export interface ClipboardErrorRecord {
  timestamp: string
  stage: string
  name: string
  message: string
  stack?: string
}

const MAX_RECORDS = 50
const buffer: ClipboardErrorRecord[] = []

/** 稳健地提取 name/message/stack。DOMException 在部分环境（jsdom/旧 Node）不是 `instanceof Error`，但仍有 name/message。 */
export function describeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err && typeof err === 'object') {
    const e = err as { name?: unknown; message?: unknown; stack?: unknown }
    const name = typeof e.name === 'string' && e.name !== '' ? e.name : 'Error'
    const message = typeof e.message === 'string' ? e.message : String(err)
    const stack = typeof e.stack === 'string' ? e.stack : undefined
    return { name, message, stack }
  }
  return { name: 'Error', message: String(err) }
}

export function recordClipboardError(stage: string, err: unknown): ClipboardErrorRecord {
  const { name, message, stack } = describeError(err)
  const rec: ClipboardErrorRecord = {
    timestamp: new Date().toISOString(),
    stage,
    name,
    message,
    stack,
  }
  buffer.push(rec)
  if (buffer.length > MAX_RECORDS) buffer.shift()
  return rec
}

export function readClipboardErrors(): readonly ClipboardErrorRecord[] {
  return buffer
}

export function clearClipboardErrors(): void {
  buffer.length = 0
}
