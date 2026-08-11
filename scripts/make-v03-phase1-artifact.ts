/**
 * V0.3 Phase 1 视觉 artifact 生成器。
 *
 * 读取 fixtures + 样式源文件，用真实 doocs 渲染器产出浏览器文章 HTML，
 * 生成自包含 artifact（内联 tokens/base/article CSS）：
 *   - artifacts/v03-phase1-plain-markdown.html   （长标题，fixture 正文）
 *   - artifacts/v03-phase1-title-variant.html    （短标题封面样本，用于 375px 标题质量检查）
 *
 * 用法：
 *   node_modules/.bin/esbuild scripts/make-v03-phase1-artifact.ts \
 *     --bundle --platform=node --format=esm --outfile=.tmp/make-artifact.mjs
 *   node .tmp/make-artifact.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import fm from 'front-matter'
import { renderDoocsHtml } from '../src/engine/doocs/engine'
import { compileForWechat } from '../src/engine/wechat/compiler'

// 以 CJS 打包运行（juice 的 CJS 动态 require 在 ESM 产物下不可用）。
const root = join(__dirname, '..')

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

interface PageOpts {
  markdown: string
  title: string
  /** 写入文件名 */
  file: string
}

function buildPage({ markdown, title, file }: PageOpts): string {
  const rendered = renderDoocsHtml(markdown)
  const fmData = { ...rendered.frontmatter, title }
  // 用覆盖后的 title 重新渲染正文（frontmatter title 不进 body，只有 masthead 用它）。
  const page = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MAX EDITORIAL V0.3 Phase 1</title>
<style>
/* ═══ tokens.css ═══ */
${read('src/styles/tokens.css')}
/* ═══ base.css ═══ */
${read('src/styles/base.css')}
/* ═══ article.css ═══ */
${read('src/styles/article.css')}
/* ═══ artifact shell：quiet neutral workspace，paper 居中 ═══ */
body { background: var(--bg); }
.stage { padding: 36px 28px 80px; }
</style>
</head>
<body>
<div class="stage">
  <article class="article paper" data-mode="editorial">
${mastheadHtml(fmData)}
    <div class="article-body">
${rendered.html}
    </div>
${footerHtml(fmData)}
  </article>
</div>
</body>
</html>
`
  writeFileSync(join(root, file), page, 'utf8')
  return file
}

function main(): void {
  mkdirSync(join(root, 'artifacts'), { recursive: true })
  const fixture = read('examples/v03-plain-markdown.md')
  const out1 = buildPage({
    markdown: fixture,
    title: '我本来只是想检查 AI 的健身建议，最后发现问题根本不在健身',
    file: 'artifacts/v03-phase1-plain-markdown.html',
  })
  const out2 = buildPage({
    markdown: fixture,
    title: '一个数字可以算得没错',
    file: 'artifacts/v03-phase1-title-variant.html',
  })
  // 微信目标编译产物页（生产输出本身，内联样式，自包含）。
  const compiled = compileForWechat(fixture).html
  const wechatPage = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>V0.3 Phase 1 · WeChat compiled</title>
<style>html,body{margin:0;padding:0;background:#ededed;}</style>
</head>
<body>
${compiled}
</body>
</html>
`
  const out3 = 'artifacts/v03-phase1-wechat-compiled.html'
  writeFileSync(join(root, out3), wechatPage, 'utf8')
  console.log('wrote:', out1)
  console.log('wrote:', out2)
  console.log('wrote:', out3)
}

main()
