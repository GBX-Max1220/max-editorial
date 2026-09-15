/**
 * :::principles 视觉 artifact 生成器（沿用 make-v03-phase1-artifact.ts 惯例）。
 *
 *   - artifacts/principles-browser-preview.html   浏览器预览（tokens/base/article 内联，含 390px 溢出探针）
 *   - artifacts/principles-wechat-compiled.html   微信编译产物（剪贴板实际写入内容，自包含 inline style）
 *
 * 用法：
 *   npx esbuild scripts/make-principles-artifact.ts --bundle --platform=node --format=cjs --outfile=.tmp/make-principles-artifact.cjs
 *   node .tmp/make-principles-artifact.cjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import fm from 'front-matter'
import { renderDoocsHtml } from '../src/engine/doocs/engine'
import { compileForWechat } from '../src/engine/wechat/compiler'

// 约定从仓库根运行（CJS bundle 下无 import.meta.url）。
const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function mastheadHtml(fmData: Record<string, unknown>): string {
  const issue = fmData.issue !== undefined ? String(fmData.issue).padStart(3, '0') : null
  return [
    `<header class="masthead">`,
    `<div class="masthead-brand"><span class="dot">●</span> MAX大郭的判断局</div>`,
    fmData.series ? `<div class="masthead-series">${esc(fmData.series)}${issue ? ` / ${issue}` : ''}</div>` : '',
    fmData.title ? `<h1 class="masthead-title">${esc(fmData.title)}</h1>` : '',
    fmData.tagline ? `<div class="masthead-deck">${esc(fmData.tagline)}</div>` : '',
    fmData.date ? `<div class="masthead-date">${esc(String(fmData.date).replace(/-/g, ' / '))}</div>` : '',
    `</header>`,
  ]
    .filter(Boolean)
    .join('')
}

function footerHtml(fmData: Record<string, unknown>): string {
  const issue = fmData.issue !== undefined ? String(fmData.issue).padStart(3, '0') : null
  const brand = ['MAX', fmData.series ? String(fmData.series) : '', issue].filter(Boolean).join(' / ')
  const next = fmData.next as Record<string, unknown> | undefined
  return [
    `<footer class="article-footer">`,
    `<div class="footer-brand">${esc(brand || 'MAX')}</div>`,
    fmData.tagline ? `<div class="footer-tagline">${esc(fmData.tagline)}</div>` : '',
    next?.title ? `<div class="next"><div class="next-label">NEXT</div><div class="next-title">${esc(next.title)}</div></div>` : '',
    `</footer>`,
  ]
    .filter(Boolean)
    .join('')
}

/** 390px 溢出探针：把测量结果写进 DOM 属性，供 `--headless --dump-dom` 抓取。 */
const PROBE = `
<script>
window.addEventListener('load', function () {
  var vw = window.innerWidth;
  var html = document.documentElement, body = document.body;
  var bad = [];
  document.querySelectorAll('.paper, .article-body, .sblock, .sblock-principles, .p-item, .p-head, .p-desc, blockquote, table, pre, img, ul, ol, h1, h2, h3').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) bad.push(el.tagName + '.' + String(el.className).slice(0, 30) + '@' + Math.round(r.right));
  });
  document.body.setAttribute('data-probe', JSON.stringify({
    vw: vw,
    htmlScroll: html.scrollWidth, htmlClient: html.clientWidth,
    bodyScroll: body.scrollWidth, bodyClient: body.clientWidth,
    overflowEls: bad.slice(0, 10),
    pass: html.scrollWidth <= html.clientWidth && body.scrollWidth <= body.clientWidth && bad.length === 0
  }));
});
</script>`

function main(): void {
  mkdirSync(join(root, 'artifacts'), { recursive: true })
  const markdown = read('tests/wechat-copy/fixtures/principles-fixture.md')
  const fmData = fm<Record<string, unknown>>(markdown).attributes ?? {}

  const preview = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>principles · browser preview</title>
<style>
${read('src/styles/tokens.css')}
${read('src/styles/base.css')}
${read('src/styles/article.css')}
body { background: var(--bg); }
.stage { padding: 36px 28px 80px; }
</style>
</head>
<body>
<div class="stage">
  <article class="article paper" data-mode="editorial">
${mastheadHtml(fmData)}
    <div class="article-body">
${renderDoocsHtml(markdown).html}
    </div>
${footerHtml(fmData)}
  </article>
</div>
${PROBE}
</body>
</html>
`
  const out1 = 'artifacts/principles-browser-preview.html'
  writeFileSync(join(root, out1), preview, 'utf8')

  const compiled = compileForWechat(markdown, { mode: 'editorial' }).html
  const wechatPage = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>principles · wechat compiled</title>
<style>html,body{margin:0;padding:0;background:#ededed;}</style>
</head>
<body>
${compiled}
</body>
${PROBE}
</html>
`
  const out2 = 'artifacts/principles-wechat-compiled.html'
  writeFileSync(join(root, out2), wechatPage, 'utf8')

  console.log('wrote:', out1)
  console.log('wrote:', out2)
}

main()
