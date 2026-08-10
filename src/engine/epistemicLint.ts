/**
 * V0.2 认识论 lint —— 作者时检查，把 rev1 五问（§14.1）与治理层级落到具体规则。
 *
 * 权威：canonical rev1 §13（组件强制元数据）、§14（lint 三级化）、§7.4（中断密度）、
 * §12.5（引用语义化）、§12.11（hr 频率）、§17-B（EDITORIAL CONSTRAINTS）、§19（enforcement）。
 *
 * 治理分层（与 governance.ts 一致）：
 *  - machine-lint      ：结构可查（AI source/status、VERIFIED substantiation、Evidence claim_id）
 *  - editorial-constraint：默认执行、可带理由豁免（JUDGMENT anchor、interrupt density、blockquote 来源）
 *  - heuristic         ：只提示、可豁免（question/hr 频率、scope-limiting、uncertainty boilerplate）
 *
 * 执行契约（§19）：本模块全部函数为【只读纯函数】——不 mutate AST、不改 CSS、不自动修复、
 * 不影响 build 退出码。heuristic/editorial-constraint 支持块级 `suppress="rule1,rule2"` 显式豁免
 * （machine-lint 结构性错误不可豁免）。
 */

import type { Token, Tokens } from 'marked'
import type { EditorialDiagnostic } from './governance'
import type { SemanticBlockToken } from './doocs/semantic'

/** 块级 props.suppress 检查（仅 editorial-constraint / heuristic 使用）。 */
function suppressed(props: Record<string, string>, code: string): boolean {
  const list = (props.suppress ?? '').split(',').map((s) => s.trim())
  return list.includes(code)
}

function isSemantic(t: Token): t is SemanticBlockToken {
  return t.type === 'semanticBlock'
}

const HIGH_INTERRUPT = new Set(['ai-output', 'judgment'])

/** 连续 HIGH 中断：ai-output / judgment / table / specimen 请求的 metric（§7.1）。 */
function isHighInterrupt(t: Token): boolean {
  if (t.type === 'table') return true
  if (!isSemantic(t)) return false
  if (HIGH_INTERRUPT.has(t.sType)) return true
  if (t.sType === 'metric') return t.props.display_function === 'inspection_specimen'
  return false
}

/** 任意块内行文本（去 markdown，用于 scope/来源启发式）。 */
function blockText(t: SemanticBlockToken): string {
  return t.lines.join(' ')
}

/** §14.1 machine-checkable：AI OUTPUT 强制 source + status；VERIFIED 无 substantiation → RAW。 */
export function validateAiOutputSemantics(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  for (const t of tokens) {
    if (!isSemantic(t) || t.sType !== 'ai-output') continue
    if ((t.props.source ?? '').trim() === '') {
      out.push({
        code: 'ep-ai-source',
        governance: 'machine-lint',
        severity: 'warning',
        blockId: t.id,
        blockType: 'ai-output',
        message: 'AI OUTPUT 缺少 source（§13.2 强制元数据；无来源时渲染降级为普通引用）',
      })
    }
    if ((t.props.status ?? '').trim() === '') {
      out.push({
        code: 'ep-ai-status',
        governance: 'machine-lint',
        severity: 'warning',
        blockId: t.id,
        blockType: 'ai-output',
        message: 'AI OUTPUT 缺少 status（§13.2 强制；raw / verified / excerpt）',
      })
    }
    if (t.props.status === 'verified' && (t.props.verified_by ?? t.props.verification_method ?? '').trim() === '') {
      out.push({
        code: 'ep-ai-verified',
        governance: 'machine-lint',
        severity: 'warning',
        blockId: t.id,
        blockType: 'ai-output',
        message: 'status="verified" 缺少 verified_by/verification_method（§14.1：VERIFIED 无 substantiation 按 RAW OUTPUT 处理）',
      })
    }
  }
  return out
}

/** §13.4 / INVARIANT A7：EVIDENCE 必须引用被支持的 claim_id（machine-lint error）。 */
export function validateEvidenceClaimRef(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  for (const t of tokens) {
    if (!isSemantic(t) || t.sType !== 'evidence') continue
    if ((t.props.supports ?? '').trim() === '') {
      out.push({
        code: 'ep-evidence-claim',
        governance: 'machine-lint',
        severity: 'error',
        blockId: t.id,
        blockType: 'evidence',
        message: 'EVIDENCE 必须引用被支持的 claim_id（§13.4 / INVARIANT A7；渲染已降级为中性引用）',
      })
    }
  }
  return out
}

/** §7.5-3 / 17-B-C1：load-bearing JUDGMENT（有 relates_to）必须携带 evidence/counterpoint anchor。 */
export function validateJudgmentAdjacency(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  for (const t of tokens) {
    if (!isSemantic(t) || t.sType !== 'judgment') continue
    if ((t.props.anchor ?? '').trim() !== '') continue
    if ((t.props.relates_to ?? '').trim() === '') continue
    if (suppressed(t.props, 'ep-judgment-anchor')) continue
    out.push({
      code: 'ep-judgment-anchor',
      governance: 'editorial-constraint',
      severity: 'warning',
      blockId: t.id,
      blockType: 'judgment',
      message: 'load-bearing JUDGMENT 缺少 evidence/counterpoint anchor（§7.5 epistemic adjacency；仅 lint 提示，不自动重排）',
    })
  }
  return out
}

/** §13.1：QUESTION 默认 section opener，全文 ≤2（heuristic，可豁免）。 */
export function validateQuestionFrequency(tokens: readonly Token[]): EditorialDiagnostic[] {
  const questions = tokens.filter((t) => isSemantic(t) && t.sType === 'question')
  if (questions.length <= 2) return []
  const first = questions[0] as SemanticBlockToken
  if (suppressed(first.props, 'ep-question-frequency')) return []
  return [
    {
      code: 'ep-question-frequency',
      governance: 'heuristic',
      severity: 'info',
      blockId: first.id,
      blockType: 'question',
      message: `检测到 ${questions.length} 个 QUESTION（§13.1 频率纪律：2000–3000 字全文 ≤2）——仅提示，可带理由豁免`,
    },
  ]
}

/** §12.11：horizontal rule 全文 ≤2（heuristic）。 */
export function validateHrFrequency(tokens: readonly Token[]): EditorialDiagnostic[] {
  const hrs = tokens.filter((t) => t.type === 'hr')
  if (hrs.length <= 2) return []
  return [
    {
      code: 'ep-hr-frequency',
      governance: 'heuristic',
      severity: 'info',
      message: `检测到 ${hrs.length} 个水平分隔线（§12.11：全文 ≤2）——仅提示，可带理由豁免`,
    },
  ]
}

/** §14.3：scope-limiting metadata（"你不能从它推出什么"）。文章 ≥1 条；含数字/结论块鼓励携带。 */
export function validateScopeLimiting(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  const scopeRe = /not a human study|system evaluation|非人类研究|系统评估|不能.*推出|无法.*推出|不代表|并非.*结论|does not|scope|边界|仅限|不得|不意味着/i
  const blocks = tokens.filter(isSemantic)
  const whole = blocks.map(blockText).join(' ')

  if (!scopeRe.test(whole)) {
    out.push({
      code: 'ep-scope-limiting',
      governance: 'heuristic',
      severity: 'warning',
      message: '文章缺少 scope-limiting 声明（§14.3 / §18-D14：至少一条"你不能从它推出什么"）',
    })
  }

  const numericBlocks = blocks.filter(
    (t) => t.sType === 'metric' || t.sType === 'lab-note' || (t.sType === 'evidence' && /\d/.test(blockText(t))),
  )
  for (const b of numericBlocks) {
    if (suppressed(b.props, 'ep-scope-limiting')) continue
    if (!scopeRe.test(blockText(b))) {
      out.push({
        code: 'ep-scope-limiting',
        governance: 'heuristic',
        severity: 'info',
        blockId: b.id,
        blockType: b.sType,
        message: '含数字/结论的块建议携带 scope-limiting 声明（§14.3）',
      })
    }
  }
  return out
}

/** §12.5：blockquote 必须注明来源（他人观点 → 引用条 + 来源名）。无来源视为设计错误 → 约束警告。 */
export function validateBlockquoteSource(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  const sourceRe = /——|—\s*[A-Z一-龥]|（[^）]+）|\([^)]+\)|via|according\s+to|from|引自|摘自|来源|cite/i
  const walk = (list: readonly Token[] | undefined) => {
    if (!list) return
    for (const t of list) {
      if (t.type === 'blockquote') {
        const text = blockquoteText(t as Tokens.Blockquote)
        if (text.trim() !== '' && !sourceRe.test(text)) {
          out.push({
            code: 'ep-blockquote-source',
            governance: 'editorial-constraint',
            severity: 'warning',
            message: '引用未注明来源（§12.5：他人观点必须带来源名；作者强调应改用 strong 或 JUDGMENT）',
          })
        }
      }
      if ('tokens' in t && Array.isArray((t as { tokens?: unknown }).tokens)) {
        walk((t as { tokens: Token[] }).tokens)
      }
    }
  }
  walk(tokens)
  return out
}

function blockquoteText(bq: Tokens.Blockquote): string {
  let s = ''
  const walk = (list: readonly Token[] | undefined) => {
    if (!list) return
    for (const t of list) {
      switch (t.type) {
        case 'text':
          s += (t as Tokens.Text).text
          break
        case 'strong':
        case 'em':
          walk((t as Tokens.Em).tokens)
          break
        case 'paragraph':
          walk((t as Tokens.Paragraph).tokens)
          break
        case 'link':
          walk((t as Tokens.Link).tokens)
          break
        default:
          break
      }
    }
  }
  walk(bq.tokens)
  return s
}

/** §7.4 / 17-B-C4：连续 HIGH 中断 ≤2，第 3 个前必须插入 prose。editorial-constraint warning。 */
export function validateInterruptDensity(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  let streak = 0
  let streakStart: Token | null = null
  for (const t of tokens) {
    if (isHighInterrupt(t)) {
      if (streak === 0) streakStart = t
      streak++
      if (streak > 2 && (!isSemantic(t) || !suppressed(t.props, 'ep-interrupt-density'))) {
        out.push({
          code: 'ep-interrupt-density',
          governance: 'editorial-constraint',
          severity: 'warning',
          message: `连续 ${streak} 个 HIGH 中断元素（§7.4 / 17-B-C4：≤2，其后必须接 prose）`,
        })
        break
      }
    } else if (streak > 0) {
      streak = 0
      streakStart = null
    }
  }
  void streakStart
  return out
}

/** §14.2：UNCERTAINTY 防 boilerplate —— 有效回答必须指明是谁的 + 哪一层不确定。 */
export function validateUncertainty(tokens: readonly Token[]): EditorialDiagnostic[] {
  const out: EditorialDiagnostic[] = []
  const boilerplateRe = /^(仍存在|存在|有)?一定?的?不确定性|存在一定风险|some uncertainty|still.*uncertain/i
  const typeHintRe = /model|模型|author|作者|evidence|证据|statistical|统计|outcome|结果概率|抽样|估计/i
  for (const t of tokens) {
    if (!isSemantic(t)) continue
    const u = (t.props.uncertainty ?? '').trim()
    if (!u) continue
    if (suppressed(t.props, 'ep-uncertainty')) continue
    if (boilerplateRe.test(u) && !typeHintRe.test(u)) {
      out.push({
        code: 'ep-uncertainty',
        governance: 'editorial-constraint',
        severity: 'warning',
        blockId: t.id,
        blockType: t.sType,
        message: 'uncertainty 是模板句，未指明"是谁的、哪一层不确定"（§14.2：model/author/evidence/statistical/outcome）',
      })
    }
  }
  return out
}

/** 聚合全部认识论 lint（供 validate.ts 调用）。 */
export function runEpistemicLint(tokens: readonly Token[]): EditorialDiagnostic[] {
  return [
    ...validateAiOutputSemantics(tokens),
    ...validateEvidenceClaimRef(tokens),
    ...validateJudgmentAdjacency(tokens),
    ...validateQuestionFrequency(tokens),
    ...validateHrFrequency(tokens),
    ...validateScopeLimiting(tokens),
    ...validateBlockquoteSource(tokens),
    ...validateInterruptDensity(tokens),
    ...validateUncertainty(tokens),
  ]
}
