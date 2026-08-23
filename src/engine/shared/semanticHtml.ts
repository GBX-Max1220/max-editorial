/**
 * V0.2 共享语义块 HTML 渲染（legacy 与 doocs 两个引擎共用，禁止各自实现漂移）。
 *
 * 权威：canonical rev1 §9（五容器语法族）、§13（7 组件）、§14（认识论 lint 的渲染边界）。
 * V0.2.1 polish（基于人工视觉验收）：
 *  - JUDGMENT 锚点文本方向感知（修复 "证据与反方见后文" 指向错误 —— §7.5 referential integrity）
 *  - METRIC specimen 去 provenance 重复（覆盖标记承担 role；provenance 收敛单行；不缩 salience）
 *  - EVIDENCE 二元判定是变体而非默认：无对比 verdict 结构时用 quiet relation grammar
 *
 * 设计约束（本模块的 epistemic 边界）：
 *  - 渲染器只消费【派生状态】（claimMap 存在性、deriveMetricEligibility 的 effectiveDisplayFunction、
 *    anchorDirections），绝不直接按作者 props 里的强度词/枚举分支给 salience（§6.2 / §13.7）。
 *  - 结构上无效的关系【降级渲染，不镀金】；AI OUTPUT 无 source 降为普通引用。
 *  - label 文案：英文 ≤4（AI OUTPUT / JUDGMENT / EVIDENCE / COUNTERPOINT），其余中文；无评价词。
 */

import { parseEvidence, parseLabNote } from './blockParse'
import { deriveMetricEligibility, parseMetricRequest } from '../doocs/metric'

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

/** 锚点目标相对判断块的方向（§7.5 epistemic adjacency）。missing = 目标不存在（lint 已报）。 */
export type AnchorDirection = 'above' | 'below' | 'mixed' | 'missing'

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
  /** judgment id → 其 anchor 目标相对位置（方向感知，修复 referential-integrity）。 */
  anchorDirections: ReadonlyMap<string, AnchorDirection>
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
  // §13.3：居中 + 双发丝线 + 署名行（author-owned cue，INVARIANT A6）。
  // V0.2.1：锚点文本按目标实际相对位置生成（§7.5 referential integrity —— 修复硬编码"见后文"指错方向）。
  let anchorHtml = ''
  if (anchor) {
    const dir = input.anchorDirections.get((input.props.id ?? '').trim())
    const text = dir === 'above' ? '证据与反方见上方' : dir === 'below' ? '证据与反方见下' : '证据与反方见上下文'
    anchorHtml = `<div class="judgment-anchor">${text}</div>`
  }
  return `<section class="sblock sblock-judgment"><div class="sblock-label">JUDGMENT</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div>${uncertainty ? `<div class="judgment-uncertainty">${esc(uncertainty)}</div>` : ''}<div class="judgment-author">— ${esc(author)}</div>${anchorHtml}</section>`
}

function renderEvidence(input: SemanticRenderInput): string {
  const label = (input.props.label ?? 'EVIDENCE').trim()
  const supports = (input.props.supports ?? '').trim()
  const claimText = supports ? input.claimMap.get(supports) : undefined
  const ambiguous = supports ? input.ambiguousIds.has(supports) : false
  // INVARIANT A7：evidence 必须引用被支持的 claim_id；无声明或解析失败 → 降级（lint 同步报 error）。
  // Phase 2 红蓝对立用 supports/challenges 引用同一 claim，天然不降级。
  const degraded = !supports || claimText === undefined || ambiguous

  // §13.4 强制：被支持的 claim 引用行在最前，文本来自 claim_id 关系（live claim text），非作者复制的旧文本。
  const claimRef = degraded
    ? `<div class="evidence-claim is-degraded"><span class="evidence-claim-label">支持：</span><span class="evidence-claim-text">${supports ? '〈引用目标待复核〉' : '〈未声明 claim_id〉'}</span></div>`
    : `<div class="evidence-claim"><span class="evidence-claim-label">支持：</span><span class="evidence-claim-text">${esc(claimText!)}</span></div>`

  // V0.2.1：二元对比判定（SUPPORTED / NOT SUPPORTED 等 verdict label）是变体而非默认。
  // 结构推断：parseEvidence 产出非空 label 行 → 作者用了对比 label 结构 → 保持二元呈现；
  // 否则 → quiet relation grammar（内容按 prose 排，不自动制造 SUPPORTED / NOT SUPPORTED 行）。
  const rows = parseEvidence(input.lines)
  const hasVerdict = rows.some((r) => r.label.trim() !== '')
  const contentHtml = hasVerdict
    ? `<div class="evidence-rows">${rows
        .map(
          (r) =>
            `<div class="evidence-row"><span class="evidence-label">${esc(r.label || ' ')}</span><span class="evidence-value">${esc(r.value)}</span></div>`,
        )
        .join('')}</div>`
    : `<div class="evidence-prose">${input.lineHtml.join('<br/>')}</div>`

  // quiet relation grammar 字段行（边界/来源/强度），二元与关系态共用。
  const fields = [
    input.props.boundary ? `边界：${input.props.boundary}` : '',
    input.props.source ? `来源：${input.props.source}` : '',
    input.props.evidence_strength ? `强度：${input.props.evidence_strength}` : '',
  ].filter(Boolean)
  const fieldsHtml = fields.length
    ? `<div class="evidence-fields">${fields.map((f) => `<div class="evidence-field">${esc(f)}</div>`).join('')}</div>`
    : ''

  return `<section class="sblock sblock-evidence${degraded ? ' sblock-degraded' : ''}"><div class="sblock-label">${esc(label)}</div>${claimRef}${contentHtml}${fieldsHtml}</section>`
}

function renderCounterpoint(input: SemanticRenderInput): string {
  // §13.5：与 EVIDENCE 同一容器同一排版，仅 label 不同（legibility parity，INVARIANT A2）。
  // Phase 2：可选 label prop 用于红蓝对立（观点 A / 观点 B 等真实文本标签）。
  const label = (input.props.label ?? 'COUNTERPOINT').trim()
  return `<section class="sblock sblock-counterpoint"><div class="sblock-label">${esc(label)}</div><div class="sblock-body">${input.lineHtml.join('<br/>')}</div></section>`
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

  const provParts = [
    input.props.source ? `来源：${input.props.source}` : '',
    input.props.method ? `方法：${input.props.method}` : '',
    input.props.boundary ? `边界：${input.props.boundary}` : '',
  ].filter(Boolean)

  let cover = ''
  let metaLine = ''
  let provLine = ''
  if (role === 'inspection_specimen') {
    // V0.2.1：覆盖标记承担 role 声明（被检查对象），provenance 收敛为单行（模型输出 · 来源 · 方法 · 边界），
    // 不再重复展示 source/role。salience（大数字）保持不变。
    cover = `<div class="metric-cover"><div class="metric-cover-label">被检查对象 · 非结论</div>${input.props.inspection_question ? `<div class="metric-cover-question">${esc(input.props.inspection_question)}</div>` : ''}</div>`
    provLine = [originLabel, ...provParts].filter(Boolean).join(' · ')
  } else {
    metaLine = [originLabel, roleLabel].filter(Boolean).join(' · ')
    provLine = provParts.join(' · ')
  }

  // V0.2.3：数字行用 <p>（对齐 H01 探针的 P+44PX 结构）。所有 metric role 的 value 一致改 <p>（小重构，保持编译器一致）。
  // Phase 2：negative="true" → 数字红（负向风险），且必须伴随文本标签（label 或默认"负向风险"）。
  const negative = input.props.negative === 'true'
  const effLabel = negative && !label ? '负向风险' : label
  return `<section class="sblock sblock-metric" data-salience="${role}"${negative ? ' data-negative="true"' : ''}>${effLabel ? `<div class="metric-label">${esc(effLabel)}</div>` : ''}<p class="metric-value${negative ? ' metric-value-negative' : ''}">${esc(value)}</p>${cover}${metaLine ? `<div class="metric-meta">${esc(metaLine)}</div>` : ''}${provLine ? `<div class="metric-provenance">${esc(provLine)}</div>` : ''}</section>`
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

type BlockLike = { type: string; props: Record<string, string>; lines: string[] }

/**
 * 从语义块列表构建 claim 索引（claim id → 展示文本）与歧义集合。
 * 供 legacy/doocs 两个引擎复用，保证 claimMap 一致 → 渲染一致。
 */
export function buildClaimIndex(
  blocks: readonly BlockLike[],
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

/**
 * 构建 JUDGMENT anchor 方向（§7.5 方向感知）。
 * anchor 目标相对该判断块的位置：全部在上方 → 'above'，全部在下方 → 'below'，
 * 混合 → 'mixed'，目标不存在 → 'missing'。legacy/doocs 共用，保证方向一致。
 */
export function buildAnchorDirections(blocks: readonly BlockLike[]): Map<string, AnchorDirection> {
  const idPos = new Map<string, number>()
  const judgments: { id: string; index: number; anchorIds: string[] }[] = []
  blocks.forEach((b, i) => {
    const id = (b.props.id ?? '').trim()
    if (!id) return
    if (b.type === 'judgment') {
      idPos.set(id, i)
      judgments.push({
        id,
        index: i,
        anchorIds: (b.props.anchor ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      })
    } else {
      idPos.set(id, i)
    }
  })

  const out = new Map<string, AnchorDirection>()
  for (const j of judgments) {
    let above = 0
    let below = 0
    let found = 0
    for (const a of j.anchorIds) {
      const pos = idPos.get(a)
      if (pos === undefined) continue
      found++
      if (pos < j.index) above++
      else if (pos > j.index) below++
    }
    out.set(j.id, found === 0 ? 'missing' : below === 0 ? 'above' : above === 0 ? 'below' : 'mixed')
  }
  return out
}
