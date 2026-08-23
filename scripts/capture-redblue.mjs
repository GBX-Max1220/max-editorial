/**
 * V0.3 Phase 2 RED-BLUE — CDP 真视口截图 + 390px 溢出自动检测。
 *
 * 前提：Edge/Chrome 已以 --remote-debugging-port=9222 启动（见仓库 README / 报告）。
 * 零新依赖：Node ≥22 原生 WebSocket。
 *
 * 用法：node scripts/capture-redblue.mjs
 * 输出：design-studies/v03-phase2-red-blue/shots/red-blue-*.png + overflow-report.json
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const PORT = process.env.CDP_PORT || 9222
const PREVIEW_URL = `file:///${root.replace(/\\/g, '/')}/design-studies/v03-phase2-red-blue/preview.html`
const OUT = join(root, 'design-studies/v03-phase2-red-blue/shots')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 创建新 page target，返回其 webSocketDebuggerUrl。 */
async function newTarget(url) {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!res.ok) throw new Error(`CDP /json/new failed: ${res.status} — 是否已启动 Edge --remote-debugging-port=${PORT}？`)
  const t = await res.json()
  return t
}

/** 简易 CDP 客户端（id 配对）。 */
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
  for (let i = 0; i < 50; i++) {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `document.readyState`,
      returnByValue: true,
    })
    if (result.value === 'complete') return
    await sleep(120)
  }
  throw new Error('page load timeout')
}

async function capture(cdp, file, { width, height, beyond, scrollTo, grayscale, checkOverflow }) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height,
  })

  if (scrollTo) {
    await cdp.send('Runtime.evaluate', {
      expression: `(() => { const el = ${scrollTo}; if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -20); } return !!el; })()`,
      returnByValue: true,
    })
    await sleep(300)
  }

  let overflow = null
  if (checkOverflow) {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const html = document.documentElement;
        const body = document.body;
        const vw = window.innerWidth;
        const els = [];
        document.querySelectorAll('.paper, .article-body, .masthead-title, h2, h3, h4, .sblock, blockquote, table, pre, img, ul, ol, .table-wrap, .figure').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.left < -1) els.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,40), right: Math.round(r.right), left: Math.round(r.left) });
        });
        return {
          vw,
          htmlScroll: html.scrollWidth, htmlClient: html.clientWidth,
          bodyScroll: body.scrollWidth, bodyClient: body.clientWidth,
          overflowEls: els,
          pass: html.scrollWidth <= html.clientWidth && body.scrollWidth <= body.clientWidth && els.length === 0,
        };
      })()`,
      returnByValue: true,
    })
    overflow = result.value
  }

  if (grayscale) {
    await cdp.send('Runtime.evaluate', {
      expression: `(() => { const st = document.createElement('style'); st.textContent = 'html{filter:grayscale(1) !important}img{filter:grayscale(1) !important}'; document.head.appendChild(st); return true; })()`,
    })
    await sleep(200)
  }

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: beyond })
  const buf = Buffer.from(shot.data, 'base64')
  writeFileSync(join(OUT, file), buf)
  console.log(`✓ ${file} (${width}×${height}${beyond ? ' full' : ' top'}${grayscale ? ' grayscale' : ''}) ${(buf.length / 1024).toFixed(0)}KB`)
  return overflow
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const target = await newTarget('about:blank')
  const cdp = new Cdp(target.webSocketDebuggerUrl)
  await cdp.open()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Page.navigate', { url: PREVIEW_URL })
  await waitLoaded(cdp)
  await sleep(800)

  const shots = [
    { file: 'red-blue-desktop-top.png', width: 1440, height: 1000, beyond: false },
    { file: 'red-blue-desktop-full.png', width: 1440, height: 1000, beyond: true },
    { file: 'red-blue-mobile-top.png', width: 390, height: 844, beyond: false },
    { file: 'red-blue-mobile-full.png', width: 390, height: 844, beyond: true, checkOverflow: true },
    { file: 'red-blue-mobile-top-grayscale.png', width: 390, height: 844, beyond: false, grayscale: true },
    {
      file: 'red-blue-opposition-blocks.png', width: 390, height: 844, beyond: false,
      scrollTo: `document.querySelector('.sblock-evidence')`,
    },
    {
      file: 'red-blue-markdown-coverage.png', width: 390, height: 844, beyond: false,
      scrollTo: `[...document.querySelectorAll('h2')].find(h => h.textContent.includes('长内容'))`,
    },
  ]

  const overflowReport = []
  for (const s of shots) {
    const overflow = await capture(cdp, s.file, s)
    if (overflow) overflowReport.push({ shot: s.file, ...overflow })
  }

  writeFileSync(join(OUT, 'overflow-report.json'), JSON.stringify(overflowReport, null, 2), 'utf8')
  console.log('\noverflow-report.json:', JSON.stringify(overflowReport, null, 2))

  await cdp.send('Target.closeTarget', { targetId: target.id }).catch(() => {})
  cdp.close()
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
