/**
 * V0.2 共享语义块 HTML 渲染（legacy 与 doocs 两个引擎共用，禁止各自实现漂移）。
 *
 * 权威：canonical rev1 §9（五容器语法族）、§13（7 组件）、§14（认识论 lint 的渲染边界）。
 *
 * 设计约束（本模块的 epistemic 边界）：
 *  - 渲染器只消费【派生状态】（claimMap 存在性、deriveMetricEligibility 的 effectiveDisplayFunction），
 *    绝不直接按作者 props 里的强度词/枚举分支给 salience（§6.2 / §13.7 防 classification laundering）。
 *  - 结构上无效的关系【降级渲染，不镀金】：Evidence 无有效 claim 目标 → 中性引用 + `sblock-degraded`；
 *    AI OUTPUT 无 source → 降为普通引用（§14 degradation）。
 *  - stale/unversioned（文本已变更但关系快照没更新）属于【编辑复核】问题（relations.ts 语义），
 *    由 lint 标记；渲染层仍显示当前 claim 文本（live text），不额外镀金也不隐藏。
 *  - label 文案：英文 label 总数 ≤4（AI OUTPUT / JUDGMENT / EVIDENCE / COUNTERPOINT，§9.4），
 *    QUESTION / LAB NOTE 用中文（提问 / 实验注记）。label 不含任何评价词（§14.6-3）。
 */

import { parseEvidence, parseLabNote } from './blockParse'
import { deriveMetricEligibility, parseMetricRequest } from '../doocs/metric'

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

export interface SemanticRenderInput {
  sType: string
  props: Record<string, string>
  /** 去缩进后的原始行（evidence/lab-note 的结构化解析用）。 */
  lines: string[]
  /** 逐行已渲染的内联 HTML（不加 <br/>，由本模块按块类型拼接）。 */
  lineHtml: string[]
  /** 全部行拼接后的纯文本（已转义），用于 pre/注释类块。 */
  rawText: string
  /** claim id → 当前 claim 展示文本（live text，引擎解析期构建）。 */
  claimMap: ReadonlyMap<string, string>
  /** 文档内重复的 claim id（关系目标有歧义 → 降级）。 */
  ambiguousIds: ReadonlySet<string>
}

const ORIGIN_LABELS: Record<string, string> = {
  model_output: '模型输出',
  internal_evaluation: '内部评估',
  external_source: '外部来源',
  author_computed: '作者计算',
}

const ROLE_LABELS: Record<string, string> = {
  inspection_specimen: '检查对象',
  reported_result: '报告结果',
  contextual_reference: '上下文参考',
}

/** AI OUTPUT status 归一化：VERIFIED 无 substantiation → 按 RAW OUTPUT（rev1 §14.1）。 */
function aiStatus(props: Record<string, string>): { label: string; verified: boolean } {
  const s = props.status
  if (s === 'verified') {
    const substantiated = (props.verified_by ?? props.verification_method ?? '').trim() !== ''
    return substantiated ? { label: 'VERIFIED', verified: true } : { label: 'RAW OUTPUT', verified: false }
  }
  if (s === 'excerpt') return { label: 'EXCERPT', verified: false }
  if (s === 'raw' || s === 'raw_output') return { label: 'RAW OUTPUT', verified: false }
  return { label: '状态未标注', verified: false }
}

function renderClaim(input: SemanticRenderInput): string {
  // rev1 §8.1：claim 是命题（可被定位为"被支持/待查"），不是块状视觉组件 → prose 渲染。
  return input.lineHtml.map((l) => `<p>${l}</p>`).join('')
}

function renderQuestion(input: SemanticRenderInput): string {
  const major = input.props.major === 'true'
  // §13.1：section opener，左对齐，proximity + 底部 hairline；major QUESTION 才借 PAUSE 语法（§9.2）。
  return `<section class="sblock sblock-question${major ? ' sblock-question-major' : ''}"><div class="sblock-label">提问</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div></section>`
}

function renderAiOutput(input: SemanticRenderInput): string {
  const source = (input.props.source ?? '').trim()
  // §14 degradation：AI OUTPUT 无 source = 无归属的"原始输出"，不得以 AI OUTPUT 身份呈现 → 降为普通引用。
  if (!source) {
    return `<blockquote class="sblock-degraded" data-degraded="ai-no-source">${input.lineHtml.join('<br/>')}<div class="degraded-note">来源未标注 · 无法以 AI 原话呈现</div></blockquote>`
  }
  const status = aiStatus(input.props)
  const statusAttr = status.verified ? ' data-status="verified"' : ''
  return `<section class="sblock sblock-ai-output"${statusAttr}><div class="sblock-label">AI OUTPUT</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div><div class="sblock-meta"><span class="meta-source">来源：${esc(source)}</span><span class="meta-status">${esc(status.label)}</span></div></section>`
}

function renderJudgment(input: SemanticRenderInput): string {
  const author = (input.props.author ?? 'Max').trim()
  const uncertainty = (input.props.uncertainty ?? '').trim()
  const anchor = (input.props.anchor ?? '').trim()
  // §13.3：居中 + 双发丝线 + 署名行（author-owned cue，INVARIANT A6）；uncertainty cue 在 weak evidence 时默认显示。
  return `<section class="sblock sblock-judgment"><div class="sblock-label">JUDGMENT</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div>${uncertainty ? `<div class="judgment-uncertainty">${esc(uncertainty)}</div>` : ''}<div class="judgment-author">— ${esc(author)}</div>${anchor ? `<div class="judgment-anchor">证据与反方见后文</div>` : ''}</section>`
}

function renderEvidence(input: SemanticRenderInput): string {
  const supports = (input.props.supports ?? '').trim()
  const claimText = supports ? input.claimMap.get(supports) : undefined
  const ambiguous = supports ? input.ambiguousIds.has(supports) : false
  const degraded = !supports || claimText === undefined || ambiguous
  const rows = parseEvidence(input.lines)
  const rowsHtml = rows
    .map(
      (r) =>
        `<div class="evidence-row"><span class="evidence-label">${esc(r.label || ' ')}</span><span class="evidence-value">${esc(r.value)}</span></div>`,
    )
    .join('')
  // §13.4 强制：被支持的 claim 引用行在最前，文本来自 claim_id 关系（live claim text），非作者复制的旧文本。
  const claimRef = degraded
    ? `<div class="evidence-claim is-degraded"><span class="evidence-claim-label">支持：</span><span class="evidence-claim-text">${supports ? '〈引用目标待复核〉' : '〈未声明 claim_id〉'}</span></div>`
    : `<div class="evidence-claim"><span class="evidence-claim-label">支持：</span><span class="evidence-claim-text">${esc(claimText!)}</span></div>`
  const metaParts = [
    input.props.source ? `来源：${input.props.source}` : '',
    input.props.evidence_strength ? `强度：${input.props.evidence_strength}` : '',
    input.props.boundary ? `边界：${input.props.boundary}` : '',
  ].filter(Boolean)
  return `<section class="sblock sblock-evidence${degraded ? ' sblock-degraded' : ''}"><div class="sblock-label">EVIDENCE</div>${claimRef}<div class="evidence-rows">${rowsHtml}</div>${metaParts.length ? `<div class="sblock-meta">${esc(metaParts.join(' · '))}</div>` : ''}</section>`
}

function renderCounterpoint(input: SemanticRenderInput): string {
  // §13.5：与 EVIDENCE 同一容器同一排版，仅 label 不同（legibility parity，INVARIANT A2）。
  return `<section class="sblock sblock-counterpoint"><div class="sblock-label">COUNTERPOINT</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div></section>`
}

function renderLabNote(input: SemanticRenderInput): string {
  const { stats, notes } = parseLabNote(input.lines)
  const title = input.props.title
  // §13.6：ANNOTATION 语法；数字平铺在文本中（不孤立不放大），不是 dashboard。
  const statsFlat = stats.map((s) => `${esc(s.value)} ${esc(s.label || '')}`).join(' · ')
  const notesHtml = notes.map((n) => `<div class="lab-note-line">${esc(n)}</div>`).join('')
  return `<section class="sblock sblock-lab-note"><div class="sblock-label">实验注记${title ? ` · ${esc(title)}` : ''}</div><div class="lab-body">${statsFlat ? `<div class="lab-stats-flat">${statsFlat}</div>` : ''}${notesHtml}</div></section>`
}

function renderMetric(input: SemanticRenderInput): string {
  const value = input.props.value ?? ''
  const label = input.props.label
  // §13.7：渲染器只消费 deriveMetricEligibility 的派生状态（effectiveDisplayFunction），
  // 绝不直接读作者枚举；specimen 视觉处理必须携带覆盖标记（标记权重 ≥ 数字，§3.4）。
  const el = deriveMetricEligibility(parseMetricRequest({ props: input.props }))
  const role = el.effectiveDisplayFunction
  const originLabel = el.requestedOrigin ? ORIGIN_LABELS[el.requestedOrigin] : undefined
  const roleLabel = ROLE_LABELS[role]

  let cover = ''
  if (role === 'inspection_specimen') {
    cover = `<div class="metric-cover"><div class="metric-cover-label">被检查对象 · 非结论</div>${input.props.inspection_question ? `<div class="metric-cover-question">${esc(input.props.inspection_question)}</div>` : ''}${input.props.specimen_source ? `<div class="metric-cover-source">${esc(input.props.specimen_source)}</div>` : ''}</div>`
  }

  const roleMeta = [originLabel, roleLabel].filter(Boolean).join(' · ')
  const provParts = [
    input.props.source ? `来源：${input.props.source}` : '',
    input.props.method ? `方法：${input.props.method}` : '',
    input.props.boundary ? `边界：${input.props.boundary}` : '',
  ].filter(Boolean)

  return `<section class="sblock sblock-metric" data-salience="${role}">${label ? `<div class="metric-label">${esc(label)}</div>` : ''}<div class="metric-value">${esc(value)}</div>${cover}${roleMeta ? `<div class="metric-meta">${esc(roleMeta)}</div>` : ''}${provParts.length ? `<div class="metric-provenance">${esc(provParts.join(' · '))}</div>` : ''}</section>`
}

function renderUnknown(input: SemanticRenderInput): string {
  return `<section class="sblock sblock-unknown"><div class="sblock-label">UNKNOWN · ${esc(input.sType)}</div><pre class="sblock-body">${input.rawText}</pre></section>`
}

export function renderSemanticHtml(input: SemanticRenderInput): string {
  switch (input.sType) {
    case 'claim':
      return renderClaim(input)
    case 'question':
      return renderQuestion(input)
    case 'ai-output':
      return renderAiOutput(input)
    case 'judgment':
      return renderJudgment(input)
    case 'evidence':
      return renderEvidence(input)
    case 'counterpoint':
      return renderCounterpoint(input)
    case 'lab-note':
      return renderLabNote(input)
    case 'metric':
      return renderMetric(input)
    default:
      return renderUnknown(input)
  }
}

/**
 * 从语义块列表构建 claim 索引（claim id → 展示文本）与歧义集合。
 * 供 legacy/doocs 两个引擎复用，保证 claimMap 一致 → 渲染一致。
 */
export function buildClaimIndex(
  blocks: readonly { type: string; props: Record<string, string>; lines: string[] }[],
): { claimMap: Map<string, string>; ambiguousIds: Set<string> } {
  const claimMap = new Map<string, string>()
  const ambiguousIds = new Set<string>()
  for (const b of blocks) {
    if (b.type !== 'claim') continue
    const id = (b.props.id ?? '').trim()
    if (!id) continue
    if (claimMap.has(id)) ambiguousIds.add(id)
    else claimMap.set(id, b.lines.join(' '))
  }
  return { claimMap, ambiguousIds }
}
