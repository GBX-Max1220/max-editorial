/**
 * V0.3 Phase 2 — Editorial Surface & Hierarchy Study artifact 生成器（Revision 1）。
 *
 * 用真实 doocs 渲染器 + 同一份 fixture（字节相同正文）产出两个样张：
 *   - 01_CURRENT_BASELINE.html   生产 CSS + 生产渲染原样（忠实）
 *   - 02_RESTRAINED_HYBRID.html  hybrid CSS + 少量 study-only 后处理（披露见下）
 *
 * 正文内容两个页面字节相同（同 fixture、同 masthead/footer、同 rendered.html），
 * 仅 <style>、shell canvas、以及 hybrid 的 study-only 节点不同。
 *
 * Revision 1 changes:
 *   - H4 注入**移除**（Owner Decision 3）：`####` 回到生产钳制为 <h3>，候选反映真实生产语法。
 *   - H2 短墨线改为真实装饰节点 `.sec-rule`（aria-hidden，非语义），替代 ::after（Decision 8）。
 *   - 有序列表数字真实文本化 `.ol-num`，替代 CSS counter（Decision 9）。
 *   - Quote 来源行拆为真实 `.q-source` 文本节点（Decision 5）。
 *   - AI Output 去背景（Decision 4，在 hybrid-article.css 实现）。
 *   - 所有后处理均为 **STUDY-ONLY**：生产 renderer / compiler 未修改。
 *
 * 用法（同 Phase 1 模式）：
 *   node_modules/.bin/esbuild design-studies/v03-phase2-surface-hierarchy/scripts/build-study.ts \
 *     --bundle --platform=node --format=cjs --outfile=.tmp/build-study.cjs
 *   node .tmp/build-study.cjs
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

/**
 * STUDY-ONLY 后处理（仅用于 hybrid 候选；生产 renderer 未修改）。
 * 每个替换都在注释中披露用途与未来生产要求。
 */
function hybridPostProcess(html: string): string {
  // 1) H2 短墨线 → 真实装饰节点（非语义，aria-hidden）。生产需渲染器/编译器产出同类节点。
  html = html.replace(/<\/h2>/g, '<span class="sec-rule" aria-hidden="true"></span></h2>')
  // 2) 有序列表 → 数字真实文本化（01/02…）。生产编译器需显式文本序号（Phase 6 已知映射）。
  html = html.replace(/<ol>([\s\S]*?)<\/ol>/g, (_m: string, inner: string) => {
    let n = 0
    const items = inner.replace(/<li>/g, () => `<li><span class="ol-num">${String(++n).padStart(2, '0')}</span>`)
    return `<ol>${items}</ol>`
  })
  // 3) Quote 来源行 → 真实 .q-source 文本节点（小字号/Secondary，与引文区分）。
  //    生产渲染器目前不产出 .q-source（Phase 1 已知限制）→ 标记 STUDY-ONLY FUTURE PRODUCTION REQUIREMENT。
  html = html.replace(
    /<blockquote>\s*<p>([^<]*?)\n(——[^<]*)<\/p>\s*<\/blockquote>/g,
    '<blockquote><p>$1</p><div class="q-source">$2</div></blockquote>',
  )
  return html
}

interface PageOpts {
  markdown: string
  title: string
  cssBlocks: string[]
  file: string
  postProcess?: (html: string) => string
}

function buildPage({ markdown, title, cssBlocks, file, postProcess }: PageOpts): string {
  const rendered = renderDoocsHtml(markdown)
  // 正文：两个页面同源（同 fixture 渲染）；hybrid 额外过 study-only 后处理。
  const bodyHtml = postProcess ? postProcess(rendered.html) : rendered.html
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
@media (max-width: 480px) {
  .stage { padding: 20px 14px 64px; }
}
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
    postProcess: hybridPostProcess,
  })

  console.log('wrote:', baseline)
  console.log('wrote:', hybrid)
}

main()
