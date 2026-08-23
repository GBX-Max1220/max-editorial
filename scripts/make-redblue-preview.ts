/**
 * V0.3 Phase 2 RED-BLUE — 生产渲染证据产物生成器。
 *
 * 输出（均为【生产 renderer + 生产 CSS】的真实渲染，非孤立手写 design study）：
 *   - design-studies/v03-phase2-red-blue/preview.html      生产预览（renderDoocsHtml + tokens/base/article.css，
 *     masthead/footer 结构与 App/编译器一致）
 *   - design-studies/v03-phase2-red-blue/wechat-artifact.html 微信目标编译产物（compileForWechat，纯 inline-style）
 *
 * 用法（同 Phase 1/2 study 模式，CJS 打包解决 juice 的 CJS require）：
 *   node_modules/.bin/esbuild scripts/make-redblue-preview.ts \
 *     --bundle --platform=node --format=cjs --outfile=.tmp/make-redblue-preview.cjs
 *   node .tmp/make-redblue-preview.cjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderDoocsHtml } from '../src/engine/doocs/engine'
import { compileForWechat } from '../src/engine/wechat/compiler'

// CJS 打包运行：__dirname = .tmp → root = 仓库根。
const root = join(__dirname, '..')
const OUT_DIR = 'design-studies/v03-phase2-red-blue'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function mastheadHtml(fm: Record<string, unknown>): string {
  const issue = fm.issue !== undefined ? String(fm.issue).padStart(3, '0') : null
  return [
    `<header class="masthead">`,
    `<div class="masthead-brand"><span class="dot">●</span> MAX大郭的判断局</div>`,
    fm.series ? `<div class="masthead-series">${esc(fm.series)}${issue ? ` / ${issue}` : ''}</div>` : '',
    fm.title ? `<h1 class="masthead-title">${esc(fm.title)}</h1>` : '',
    fm.tagline ? `<div class="masthead-deck">${esc(fm.tagline)}</div>` : '',
    fm.date ? `<div class="masthead-date">${esc(String(fm.date).replace(/-/g, ' / '))}</div>` : '',
    `</header>`,
  ]
    .filter(Boolean)
    .join('')
}

function footerHtml(fm: Record<string, unknown>): string {
  const issue = fm.issue !== undefined ? String(fm.issue).padStart(3, '0') : null
  const brand = ['MAX', fm.series ? String(fm.series) : '', issue].filter(Boolean).join(' / ')
  const next = fm.next as Record<string, unknown> | undefined
  return [
    `<footer class="article-footer">`,
    `<div class="footer-brand">${esc(brand || 'MAX')}</div>`,
    fm.tagline ? `<div class="footer-tagline">${esc(fm.tagline)}</div>` : '',
    next?.title ? `<div class="next"><div class="next-label">NEXT</div><div class="next-title">${esc(next.title)}</div></div>` : '',
    `</footer>`,
  ]
    .filter(Boolean)
    .join('')
}

function main(): void {
  mkdirSync(join(root, OUT_DIR), { recursive: true })
  const fixture = readFileSync(join(root, 'examples/red-blue-editorial.md'), 'utf8')
  const title = 'AI 说自己 90% 确定，这个数字到底意味着什么？'

  // ── 1) 生产预览：renderDoocsHtml + tokens/base/article.css（App 预览同一渲染管线） ──
  const rendered = renderDoocsHtml(fixture)
  const fm = { ...rendered.frontmatter, title }
  const css = [
    readFileSync(join(root, 'src/styles/tokens.css'), 'utf8'),
    readFileSync(join(root, 'src/styles/base.css'), 'utf8'),
    readFileSync(join(root, 'src/styles/article.css'), 'utf8'),
  ].join('\n')

  const preview = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · MAX EDITORIAL RED-BLUE production preview</title>
<style>
${css}
/* ═══ preview shell（编辑器工作台，不导出） ═══ */
body { background: var(--bg); }
.stage { padding: 36px 28px 80px; }
@media (max-width: 480px) {
  .stage { padding: 20px 14px 64px; }
}
</style>
</head>
<body>
<div class="stage">
  <article class="article paper" data-mode="editorial">
${mastheadHtml(fm)}
    <div class="article-body">
${rendered.html}
    </div>
${footerHtml(fm)}
  </article>
</div>
</body>
</html>
`
  writeFileSync(join(root, OUT_DIR, 'preview.html'), preview, 'utf8')

  // 灰度变体：预置 html{filter:grayscale(1)}（运行时不再注入/移除样式，避免状态污染与 computed 怪癖）。
  // 注意：必须插到 </style> 之前（style 元素内），否则是 head 里无效的裸文本。
  const grayscale = preview.replace('</style>', 'html { filter: grayscale(1) !important; } img { filter: grayscale(1) !important; }\n</style>')
  writeFileSync(join(root, OUT_DIR, 'preview-grayscale.html'), grayscale, 'utf8')

  // ── 2) 微信目标编译产物（纯 inline-style 自包含 HTML，粘贴进微信的就是它） ──
  const artifact = compileForWechat(fixture, { mode: 'editorial' })
  const artifactPage = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · WECHAT TARGET ARTIFACT</title>
<style>body { margin: 0; background: #E9E3D9; } .shell { max-width: 677px; margin: 0 auto; }</style>
</head>
<body>
<div class="shell">
${artifact.html}
</div>
</body>
</html>
`
  writeFileSync(join(root, OUT_DIR, 'wechat-artifact.html'), artifactPage, 'utf8')

  console.log('wrote:', join(OUT_DIR, 'preview.html'))
  console.log('wrote:', join(OUT_DIR, 'wechat-artifact.html'))
  console.log('wechat artifact bytes:', artifact.html.length)
  console.log('plain text bytes:', artifact.plainText.length)
}

main()
