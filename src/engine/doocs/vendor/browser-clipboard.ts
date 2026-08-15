/**
 * VENDORED from doocs/md (trimmed).
 * Upstream: https://github.com/doocs/md
 * Commit:   4699016755d0a699197aa6d634ed87f5a693b649
 * Source:   apps/web/src/lib/browser/clipboard.ts
 * License:  WTFPL v2
 * Modifications: removed i18n / toast coupling and the read-from-clipboard helper;
 *   kept the copy pipeline (ClipboardItem html+plain, execCommand fallback);
 *   added dev diagnostic error recording (recordClipboardError) at each catch —
 *   control flow unchanged, only surfaces the otherwise-swallowed DOMException.
 */

import { recordClipboardError } from '../../../clipboard/errors'

function legacyCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement(`textarea`)
      textarea.value = text
      textarea.setAttribute(`readonly`, `true`)
      textarea.style.position = `fixed`
      textarea.style.opacity = `0`
      document.body.appendChild(textarea)

      textarea.select()
      const ok = document.execCommand(`copy`)
      document.body.removeChild(textarea)

      if (ok) {
        resolve()
      } else {
        recordClipboardError(`legacyCopy → execCommand returned false`, new Error(`execCommand failed`))
        reject(new Error(`execCommand failed`))
      }
    }
    catch (err) {
      recordClipboardError(`legacyCopy → execCommand threw`, err)
      reject(err)
    }
  })
}

export async function copyPlain(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    }
    catch (err) {
      recordClipboardError(`copyPlain → navigator.clipboard.writeText`, err)
    }
  }
  await legacyCopy(text)
}

/**
 * 富文本剪贴板写入是否可用（确定性能力门）。
 *
 * 三个条件缺一不可：
 *  1. 安全上下文（非 HTTPS/localhost 一律无现代 Clipboard API）；
 *  2. `navigator.clipboard.write` 存在；
 *  3. `ClipboardItem` 存在，且（若暴露 `supports`）确认支持 `text/html`。
 * 该门把「写入层能力」从隐式假设变成可测试的纯函数，避免在不支持的环境里
 * 用空 catch 静默降级（降级必须被显式观测，见 copyHtml 返回值）。
 */
export function richCopyAvailable(): boolean {
  if (!window.isSecureContext) return false
  if (typeof navigator.clipboard?.write !== 'function') return false
  const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem
  if (typeof CI === 'undefined') return false
  if (typeof CI.supports === 'function' && !CI.supports('text/html')) return false
  return true
}

export interface CopyOutcome {
  /** rich = 双 MIME（text/html + text/plain）写入成功；plain = 富文本不可用/失败后的纯文本降级。 */
  mode: 'rich' | 'plain'
}

/**
 * 复制富文本到剪贴板：优先双 MIME，失败/不可用时降级纯文本。
 *
 * 与旧实现的差异：**降级不再静默**。返回值区分 `rich`/`plain`，调用方（引擎 → UI）
 * 能据此告诉用户「样式已复制」还是「只复制了纯文本」。所有失败路径仍记录到
 * 诊断缓冲（recordClipboardError），但 copyHtml 本身不再假装成功。
 * 若降级后的纯文本写入也失败（execCommand 返回 false），异常向上传播，由引擎返回 ok:false。
 */
export async function copyHtml(html: string, fallback?: string): Promise<CopyOutcome> {
  const plain = fallback ?? html.replace(/<[^>]+>/g, ``)
  if (richCopyAvailable()) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: `text/html` }),
        'text/plain': new Blob([plain], { type: `text/plain` }),
      })
      await navigator.clipboard.write([item])
      return { mode: 'rich' }
    }
    catch (err) {
      recordClipboardError(`copyHtml → ClipboardItem/clipboard.write`, err)
    }
  } else {
    recordClipboardError(
      `copyHtml → rich unavailable`,
      new Error(`rich clipboard unavailable (isSecureContext=${window.isSecureContext}, ClipboardItem=${typeof (window as unknown as { ClipboardItem?: unknown }).ClipboardItem})`),
    )
  }
  await copyPlain(plain)
  return { mode: 'plain' }
}
