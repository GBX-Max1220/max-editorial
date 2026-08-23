/**
 * V0.3 Phase 2 RED-BLUE — CDP 真视口截图 + 像素级颜色状态断言 + 390px 溢出检测。
 *
 * 前提：Edge/Chrome 已以 --remote-debugging-port=9222 启动。
 * 零新依赖：Node ≥22 原生 WebSocket；PNG 解码用 scripts/png-pixels.mjs（zlib）。
 *
 * 修订（bounded visual-evidence repair）：
 *  - 每张截图前显式恢复彩色状态（移除上一张可能注入的 grayscale <style>），不依赖上一张状态。
 *  - 颜色截图断言实际像素包含 #2F5FD7 / #D4473F（±容差），不把"computed 正确但截图灰度"当通过。
 *  - 灰度截图断言无明显饱和色像素。
 *  - 每张关键截图记录 evidence/counterpoint 的 computed style。
 *  - 移动端 H1 行数检查（避免孤行）。
 *
 * 用法：node scripts/capture-redblue.mjs
 * 输出：design-studies/v03-phase2-red-blue/shots/*.png + screenshot-report.json
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodePng, hasColorNear, hasSaturation } from './png-pixels.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const PORT = process.env.CDP_PORT || 9222
const PREVIEW_URL = `file:///${root.replace(/\\/g, '/')}/design-studies/v03-phase2-red-blue/preview.html`
const GRAYSCALE_URL = `file:///${root.replace(/\\/g, '/')}/design-studies/v03-phase2-red-blue/preview-grayscale.html`
const OUT = join(root, 'design-studies/v03-phase2-red-blue/shots')

const BLUE = [47, 95, 215] // #2F5FD7
const RED = [212, 71, 63] // #D4473F
const BLUE_TOL = 48
const RED_TOL = 48
const GRAY_SAT = 24 // 饱和度 >24 视为非灰

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function newTarget(url) {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!res.ok) throw new Error(`CDP /json/new failed: ${res.status} — 请先启动 Edge --remote-debugging-port=${PORT}`)
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
  for (let i = 0; i < 50; i++) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true })
    if (result.value === 'complete') return
    await sleep(120)
  }
  throw new Error('page load timeout')
}

async function evalJson(cdp, expression) {
  const { result } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true })
  return result.value
}

async function capture(cdp, file, { width, height, beyond, scrollTo, url, checkOverflow, checkH1, assert }) {
  // 每张截图独立导航（彩色页 / 预置灰度页），不做运行时样式注入/移除 → 零状态污染。
  await cdp.send('Page.navigate', { url })
  await waitLoaded(cdp)
  await sleep(600)

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height,
  })

  if (scrollTo) {
    await evalJson(cdp, `(() => { const el = ${scrollTo}; if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -20); } return !!el; })()`)
    await sleep(300)
  }

  let overflow = null
  if (checkOverflow) {
    overflow = await evalJson(cdp, `(() => {
      const html = document.documentElement; const body = document.body; const vw = window.innerWidth;
      const els = [];
      document.querySelectorAll('.paper, .article-body, .masthead-title, h2, h3, h4, .sblock, blockquote, table, pre, img, ul, ol, .table-wrap, .figure').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) els.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,40), right: Math.round(r.right), left: Math.round(r.left) });
      });
      return { vw, htmlScroll: html.scrollWidth, htmlClient: html.clientWidth, bodyScroll: body.scrollWidth, bodyClient: body.clientWidth, overflowEls: els, pass: html.scrollWidth <= html.clientWidth && body.scrollWidth <= body.clientWidth && els.length === 0 };
    })()`)
  }

  let h1 = null
  if (checkH1) {
    // 行数 + 每行字数（逐字符 Range 按 top 分组），检查末行孤字。
    h1 = await evalJson(cdp, `(() => {
      const el = document.querySelector('.masthead-title'); if (!el) return null;
      const tn = el.firstChild; if (!tn) return null;
      const text = tn.textContent || '';
      const groups = [];
      let current = { top: null, chars: 0, charsStr: '' };
      for (let i = 0; i < text.length; i++) {
        const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + 1);
        const rect = r.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const top = Math.round(rect.top);
        if (current.top === null) current.top = top;
        if (Math.abs(top - current.top) > 4) { groups.push(current); current = { top, chars: 0, charsStr: '' }; }
        current.chars++; current.charsStr += text[i];
      }
      groups.push(current);
      const last = groups[groups.length - 1];
      return { lineCount: groups.length, lastLineChars: last ? last.chars : 0, lines: groups.map(g => g.charsStr) };
    })()`)
  }

  let computed = null
  if (assert?.computed) {
    computed = await evalJson(cdp, `(() => {
      const pick = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
      const ev = pick('.sblock-evidence'); const cp = pick('.sblock-counterpoint');
      const evLabel = pick('.sblock-evidence .sblock-label'); const cpLabel = pick('.sblock-counterpoint .sblock-label');
      return {
        evidenceBorder: ev ? ev.borderLeftColor : null,
        evidenceLabel: evLabel ? evLabel.color : null,
        counterpointBorder: cp ? cp.borderLeftColor : null,
        counterpointLabel: cpLabel ? cpLabel.color : null,
      };
    })()`)
  }

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: beyond })
  const buf = Buffer.from(shot.data, 'base64')
  writeFileSync(join(OUT, file), buf)

  // 像素级断言（实际检查 PNG 内容，不看 computed 状态）。
  let pixels = null
  if (assert?.color || assert?.grayscale) {
    const png = decodePng(buf)
    pixels = {
      blue: hasColorNear(png, BLUE, BLUE_TOL),
      red: hasColorNear(png, RED, RED_TOL),
      saturated: hasSaturation(png, GRAY_SAT),
      w: png.width,
      h: png.height,
    }
  }

  const pass = {
    colorShot: assert?.color
      ? pixels.blue > 0 && pixels.red > 0
      : null,
    grayscaleShot: assert?.grayscale ? (pixels.saturated ?? 999) <= 50 : null,
    overflow: overflow ? overflow.pass : null,
    h1: checkH1 ? (h1 && h1.lineCount === 2) || (h1 && h1.lineCount === 3 && h1.lastLineChars >= 3) : null,
  }

  const failed = []
  if (pass.colorShot === false) failed.push('color-shot: blue/red pixels missing')
  if (pass.grayscaleShot === false) failed.push('grayscale-shot: saturated pixels present')
  if (pass.overflow === false) failed.push('overflow')
  if (pass.h1 === false) failed.push('h1 orphan line')

  console.log(`${failed.length ? '✗' : '✓'} ${file} (${width}×${height}${beyond ? ' full' : ''}${url === GRAYSCALE_URL ? ' gray' : ''}) ${(buf.length / 1024).toFixed(0)}KB` + (pixels ? ` blue=${pixels.blue} red=${pixels.red} sat=${pixels.saturated}` : ''))
  if (computed) console.log(`    computed ev=${computed.evidenceBorder}/${computed.evidenceLabel} cp=${computed.counterpointBorder}/${computed.counterpointLabel}`)
  if (h1) console.log(`    H1 lines=${h1.lineCount} lastLineChars=${h1.lastLineChars}`)

  return { file, width, height, beyond, gray: url === GRAYSCALE_URL, overflow, h1, computed, pixels, pass, failed }
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

  // 权威 390px 溢出测量：在任何截图 capture 之前做（capture 会污染 scrollWidth 状态，
  // 造成假 976px；clean 测量经 CDP 复现确认为 390/390 无溢出）。
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  await sleep(300)
  const cleanOverflow = await evalJson(cdp, `(() => {
    const html = document.documentElement; const body = document.body; const vw = window.innerWidth;
    const els = [];
    document.querySelectorAll('.paper, .article-body, .masthead-title, h2, h3, h4, .sblock, blockquote, table, pre, img, ul, ol, .table-wrap, .figure').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) els.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,40), right: Math.round(r.right) });
    });
    return { vw, htmlScroll: html.scrollWidth, htmlClient: html.clientWidth, bodyScroll: body.scrollWidth, bodyClient: body.clientWidth, overflowEls: els, pass: html.scrollWidth <= html.clientWidth && body.scrollWidth <= body.clientWidth && els.length === 0 };
  })()`)

  const shots = [
    { file: 'red-blue-desktop-top.png', width: 1440, height: 1000, beyond: false, url: PREVIEW_URL, assert: { color: true } },
    // full 用固定高视口（避开 captureBeyondViewport 对 emulation 的副作用——曾导致 976px 假溢出）。
    { file: 'red-blue-desktop-full.png', width: 1440, height: 9000, beyond: false, url: PREVIEW_URL },
    {
      file: 'red-blue-mobile-top.png', width: 390, height: 844, beyond: false, url: PREVIEW_URL,
      checkH1: true, assert: { color: true },
    },
    { file: 'red-blue-mobile-full.png', width: 390, height: 18000, beyond: false, url: PREVIEW_URL, assert: { color: true } },
    { file: 'red-blue-mobile-top-grayscale.png', width: 390, height: 844, beyond: false, url: GRAYSCALE_URL, assert: { grayscale: true } },
    {
      file: 'red-blue-opposition-blocks-color.png', width: 390, height: 844, beyond: false, url: PREVIEW_URL,
      scrollTo: `document.querySelector('.sblock-evidence')`,
      assert: { color: true, computed: true },
    },
    {
      file: 'red-blue-opposition-blocks-grayscale.png', width: 390, height: 844, beyond: false, url: GRAYSCALE_URL,
      scrollTo: `document.querySelector('.sblock-evidence')`, assert: { grayscale: true, computed: true },
    },
    {
      file: 'red-blue-markdown-coverage-color.png', width: 390, height: 844, beyond: false, url: PREVIEW_URL,
      scrollTo: `[...document.querySelectorAll('h2')].find(h => h.textContent.includes('长内容'))`,
      assert: { color: true },
    },
    {
      file: 'red-blue-markdown-coverage-grayscale.png', width: 390, height: 844, beyond: false, url: GRAYSCALE_URL,
      scrollTo: `[...document.querySelectorAll('h2')].find(h => h.textContent.includes('长内容'))`,
      assert: { grayscale: true },
    },
    // 兼容旧路径：覆盖为干净彩色版。
    {
      file: 'red-blue-opposition-blocks.png', width: 390, height: 844, beyond: false, url: PREVIEW_URL,
      scrollTo: `document.querySelector('.sblock-evidence')`, assert: { color: true },
    },
    {
      file: 'red-blue-markdown-coverage.png', width: 390, height: 844, beyond: false, url: PREVIEW_URL,
      scrollTo: `[...document.querySelectorAll('h2')].find(h => h.textContent.includes('长内容'))`, assert: { color: true },
    },
  ]

  const report = []
  for (const s of shots) report.push(await capture(cdp, s.file, s))

  const failures = report.flatMap((r) => r.failed)
  if (cleanOverflow && !cleanOverflow.pass) failures.push('clean-390-overflow')
  writeFileSync(join(OUT, 'screenshot-report.json'), JSON.stringify({ cleanOverflow, shots: report }, null, 2), 'utf8')

  console.log('\n=== SUMMARY ===')
  for (const r of report) {
    console.log(`${r.failed.length ? '✗' : '✓'} ${r.file}${r.failed.length ? ' → ' + r.failed.join(', ') : ''}`)
  }
  console.log(`\noverflow 390px (clean): ${cleanOverflow ? JSON.stringify(cleanOverflow) : 'n/a'}`)
  console.log(`failures: ${failures.length}`)

  await cdp.send('Target.closeTarget', { targetId: target.id }).catch(() => {})
  cdp.close()
  if (failures.length) process.exit(2)
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
