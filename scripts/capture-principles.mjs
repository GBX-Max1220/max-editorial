/**
 * :::principles CDP 截图 + 390px 溢出检测（沿用 capture-redblue.mjs 的零依赖 CDP 方案；
 * --window-size=390 会被桌面 Chrome 最小窗宽钳制，必须用 Emulation.setDeviceMetricsOverride）。
 *
 * 前提：Chrome/Edge 已以 --remote-debugging-port=9222 启动（本脚本自行拉起 headless 实例）。
 * 用法：node scripts/capture-principles.mjs
 * 输出：artifacts/principles-*.png + artifacts/principles-probe-report.json
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const PORT = process.env.CDP_PORT || 9223
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const PREVIEW_URL = `file:///${root.replace(/\\/g, '/')}/artifacts/principles-browser-preview.html`
const WECHAT_URL = `file:///${root.replace(/\\/g, '/')}/artifacts/principles-wechat-compiled.html`
const OUT = join(root, 'artifacts')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function newTarget(url) {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!res.ok) throw new Error(`CDP /json/new failed: ${res.status}`)
  return res.json()
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl)
    this.nextId = 1
    this.pending = new Map()
  }
  async open() {
    await new Promise((res, rej) => {
      this.ws.onopen = res
      this.ws.onerror = rej
      this.ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data)
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)
          this.pending.delete(msg.id)
          msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
        }
      }
    })
  }
  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  close() {
    try { this.ws.close() } catch {}
  }
}

async function waitLoaded(cdp) {
  for (let i = 0; i < 60; i++) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true })
    if (result.value === 'complete') return
    await sleep(150)
  }
  throw new Error('page load timeout')
}

async function evalJson(cdp, expression) {
  const { result } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true })
  return result.value
}

const OVERFLOW_EXPR = `(() => {
  const vw = window.innerWidth;
  const html = document.documentElement, body = document.body;
  const bad = [];
  document.querySelectorAll('.paper, .article-body, .sblock, .sblock-principles, .p-item, .p-head, .p-desc, .p-num, blockquote, table, pre, img, ul, ol, h1, h2, h3').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) bad.push(el.tagName + '.' + String(el.className).slice(0, 30) + '@' + Math.round(r.right));
  });
  return { vw, htmlScroll: html.scrollWidth, htmlClient: html.clientWidth, bodyScroll: body.scrollWidth, bodyClient: body.clientWidth, overflowEls: bad.slice(0, 10), pass: html.scrollWidth <= html.clientWidth && body.scrollWidth <= body.clientWidth && bad.length === 0 };
})()`

async function capture(cdp, { file, url, width, height, scrollTo }) {
  await cdp.send('Page.navigate', { url })
  await waitLoaded(cdp)
  await sleep(500)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 700,
  })
  await sleep(400)
  let overflow = null
  if (width === 390) {
    overflow = await evalJson(cdp, OVERFLOW_EXPR)
  }
  if (scrollTo) {
    await evalJson(cdp, `(() => { const el = ${scrollTo}; if (el) el.scrollIntoView({ block: 'start' }); return !!el; })()`)
    await sleep(300)
  }
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(OUT, file), Buffer.from(shot.data, 'base64'))
  const ok = !overflow || overflow.pass
  console.log(`${ok ? '✓' : '✗'} ${file} (${width}×${height})` + (overflow ? ` overflow=${JSON.stringify(overflow)}` : ''))
  return { file, width, height, overflow, pass: ok }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--remote-debugging-port=${PORT}`, '--window-size=390,844', 'about:blank',
  ], { stdio: 'ignore' })
  try {
    // 等 CDP 端口就绪
    let up = false
    for (let i = 0; i < 40 && !up; i++) {
      await sleep(250)
      up = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.ok).catch(() => false)
    }
    if (!up) throw new Error('CDP port never came up')

    const target = await newTarget('about:blank')
    const cdp = new Cdp(target.webSocketDebuggerUrl)
    await cdp.open()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    const report = []
    report.push(await capture(cdp, { file: 'principles-desktop-top.png', url: PREVIEW_URL, width: 1440, height: 1000 }))
    report.push(await capture(cdp, { file: 'principles-mobile-top-390.png', url: PREVIEW_URL, width: 390, height: 844 }))
    report.push(await capture(cdp, {
      file: 'principles-mobile-principles-390.png', url: PREVIEW_URL, width: 390, height: 844,
      scrollTo: `document.querySelector('.sblock-principles')`,
    }))
    report.push(await capture(cdp, { file: 'principles-wechat-compiled-390.png', url: WECHAT_URL, width: 390, height: 844 }))
    report.push(await capture(cdp, {
      file: 'principles-wechat-compiled-principles-390.png', url: WECHAT_URL, width: 390, height: 844,
      scrollTo: `document.querySelector('.sblock-principles') || document.querySelector('[class*="principles"]')`,
    }))

    writeFileSync(join(OUT, 'principles-probe-report.json'), JSON.stringify({ shots: report }, null, 2), 'utf8')
    const failures = report.filter((r) => !r.pass)
    console.log(`\nfailures: ${failures.length}`)
    await cdp.send('Target.closeTarget', { targetId: target.id }).catch(() => {})
    cdp.close()
    if (failures.length) process.exit(2)
  } finally {
    chrome.kill()
  }
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
