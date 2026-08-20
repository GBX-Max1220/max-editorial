/**
 * V0.3 Phase 2 — Editorial Surface & Hierarchy Study artifact 生成器。
 *
 * 用真实 doocs 渲染器 + 同一份 fixture（字节相同正文）产出两个样张：
 *   - 01_CURRENT_BASELINE.html   生产 CSS（tokens.css + base.css + article.css）
 *   - 02_RESTRAINED_HYBRID.html  hybrid CSS（styles/hybrid-tokens.css + styles/hybrid-article.css）
 *
 * 正文内容两个页面字节相同（同 fixture、同 masthead/footer、同 rendered.html），
 * 仅 <style> 与 shell canvas 不同。
 *
 * 用法（同 Phase 1 模式）：
 *   node_modules/.bin/esbuild design-studies/v03-phase2-surface-hierarchy/scripts/build-study.ts \
 *     --bundle --platform=node --format=cjs --outfile=.tmp/build-study.mjs
 *   node .tmp/build-study.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import fm from 'front-matter'
import { renderDoocsHtml } from '../../../src/engine/doocs/engine'

// 以 CJS 打包运行（juice 的 CJS 动态 require 在 ESM 产物下不可用）。
// bundle 输出到 .tmp/ 下，__dirname = .tmp → root = 仓库根。
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
  cssBlocks: string[]
  file: string
}

function buildPage({ markdown, title, cssBlocks, file }: PageOpts): string {
  const rendered = renderDoocsHtml(markdown)
  // 最小复现（§18 披露）：生产渲染器将 #### 钳制为 <h3>（v03Heading.ts depth clamp 1–3）。
  // 本研究需比较真实 H4 层级，故把唯一一处 #### 定向提升为 <h4>。
  // 两页同一替换 → 正文仍字节相同；baseline 的 h4 命中 UA 默认（生产 CSS 无 .article h4 规则），
  // hybrid 的 h4 命中本研究新规则。这是"若渲染器不钳制时生产 CSS 的真实表现"的最小复现。
  const bodyHtml = rendered.html.replace(
    '<h3>为什么区分很重要</h3>',
    '<h4>为什么区分很重要</h4>',
  )
  const fmData = { ...rendered.frontmatter, title }
  const page = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MAX EDITORIAL V0.3 Phase 2 study</title>
<style>
${cssBlocks.map((c) => c + '\n').join('/* ─── next sheet ─── */\n')}
/* ═══ study shell：preview canvas（编辑器专用，不导出） ═══ */
body { background: var(--bg); }
.stage { padding: 36px 28px 80px; }
</style>
</head>
<body>
<div class="stage">
  <article class="article paper" data-mode="editorial">
${mastheadHtml(fmData)}
    <div class="article-body">
${bodyHtml}
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
  const outDir = 'design-studies/v03-phase2-surface-hierarchy'
  mkdirSync(join(root, outDir), { recursive: true })
  const fixture = read(`${outDir}/fixture-phase2.md`)
  const title = 'AI 说自己 90% 确定，这个数字到底意味着什么？'

  const baseline = buildPage({
    markdown: fixture,
    title,
    cssBlocks: [
      read('src/styles/tokens.css'),
      read('src/styles/base.css'),
      read('src/styles/article.css'),
    ],
    file: `${outDir}/01_CURRENT_BASELINE.html`,
  })

  const hybrid = buildPage({
    markdown: fixture,
    title,
    cssBlocks: [
      read('src/styles/base.css'),
      read(`${outDir}/styles/hybrid-tokens.css`),
      read(`${outDir}/styles/hybrid-article.css`),
    ],
    file: `${outDir}/02_RESTRAINED_HYBRID.html`,
  })

  console.log('wrote:', baseline)
  console.log('wrote:', hybrid)
}

main()
