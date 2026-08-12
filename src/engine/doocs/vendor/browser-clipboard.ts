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

export async function copyHtml(html: string, fallback?: string): Promise<void> {
  const plain = fallback ?? html.replace(/<[^>]+>/g, ``)
  if (window.isSecureContext && navigator.clipboard?.write) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: `text/html` }),
        'text/plain': new Blob([plain], { type: `text/plain` }),
      })
      await navigator.clipboard.write([item])
      return
    }
    catch (err) {
      recordClipboardError(`copyHtml → ClipboardItem/clipboard.write`, err)
    }
  }
  await copyPlain(plain)
}
