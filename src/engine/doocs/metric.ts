/**
 * Phase 0.4 — METRIC 两轴语义 + inspection-specimen 资格边界。
 *
 * 权威：spec rev1 §13.7（两轴模型 / 资格条件 / 负向清单 / ambiguous defaults DOWN）、
 * INVARIANT A4（METRIC 必须声明 ORIGIN + DISPLAY FUNCTION）、
 * INVARIANT A5（inspection privilege 必须满足资格条件）、契约 §6。
 *
 * 两轴（独立、非互斥，绝不回到三选一 ROLE）：
 *   ORIGIN           → 决定 provenance requirements（谁给的 / 怎么算的 / 边界）
 *   DISPLAY FUNCTION → 决定 salience privilege（要不要放大）
 *   EXTERNAL_SOURCE + INSPECTION_SPECIMEN 合法 —— 两轴共存正是两轴模型存在的理由之一。
 *
 * 防 classification laundering（本模块的核心职责）：
 *   作者在 props 里填 display_function="inspection_specimen" 只是【请求】，不是权限。
 *   渲染特权只能来自 deriveMetricEligibility() 派生的 canUseInspectionSpecimenTreatment，
 *   该派生要求：结构资格齐全 + 无负向资格条件。
 *   未来 renderer 严禁直接读作者枚举（`if (props.display_function === "inspection_specimen") …`）。
 *
 * 三级门禁（契约 §6）：syntactic（本模块，机器）→ editorial（人，未来）→ rendering（未来 renderer
 * 只消费派生状态）。结构资格 ≠ 编辑合法性：三字段齐全不证明该数字"确实值得"被当标本检查，
 * 那部分留给人（本提交不做 editorial 批准流，也不发明机器主观检测）。
 *
 * 本文件只定义类型与纯函数：不改 token、不改 props、不重写 display function、
 * 不自动授予资格、不生成 provenance、不升级 salience、不碰 renderer / CSS。
 */

import type { Token } from 'marked'
import type { EditorialDiagnostic } from '../governance'
import type { SemanticBlockToken } from './semantic'

/** ORIGIN 轴（rev1 §13.7；契约 §6 用 snake_case 作为机制形式，等于 spec 的大写枚举）。 */
export type MetricOrigin =
  | 'model_output'
  | 'internal_evaluation'
  | 'external_source'
  | 'author_computed'

/** DISPLAY FUNCTION 轴（rev1 §13.7）。 */
export type MetricDisplayFunction =
  | 'inspection_specimen'
  | 'reported_result'
  | 'contextual_reference'

const ORIGINS: readonly MetricOrigin[] = [
  'model_output',
  'internal_evaluation',
  'external_source',
  'author_computed',
]

const DISPLAY_FUNCTIONS: readonly MetricDisplayFunction[] = [
  'inspection_specimen',
  'reported_result',
  'contextual_reference',
]

/**
 * 负向资格清单（rev1 §13.7：aggregate summary / author-computed result / evaluation pass rate
 * 不得作为 specimen，除非文章明确在检查"该结果的呈现/精度本身"）中【机器可检】的部分：
 *  - author_computed result → origin 枚举本身就是事实，可确定性检出；
 *  - aggregate summary      → 由资格字段 exact_value_visible="false"（精确值在来源中不可见）承载；
 *  - evaluation pass rate   → 属于内容分类，无可靠元数据信号，是编辑判断，本模块不发明机器检测。
 * 例外（"文章明确在检查呈现/精度本身"）同样是编辑判断：机器无法证明，故默认向下——拒绝特权 + 诊断，
 * 由编辑复核。本模块不实现 editorial 批准流。
 */
const NEGATIVE_SPECIMEN_ORIGIN: MetricOrigin = 'author_computed'

export type MetricDiagnosticCode =
  | 'metric-origin-invalid'
  | 'metric-display-function-invalid'
  | 'metric-origin-missing'
  | 'metric-display-function-missing'
  | 'metric-provenance-missing'
  | 'metric-specimen-source-missing'
  | 'metric-specimen-question-missing'
  | 'metric-specimen-exact-value-invalid'
  | 'metric-specimen-exact-value-false'
  | 'metric-specimen-negative-provenance'

export interface MetricDiagnostic extends EditorialDiagnostic {
  code: MetricDiagnosticCode
  blockType: 'metric'
  blockId?: string
}

/**
 * 作者请求（request）的 typed 表示。
 * 所有字段直接来自作者 props，没有任何字段在此被"升级"成权限。
 * 命名刻意用 requested*：与派生的 canUseInspectionSpecimenTreatment 明确区分。
 */
export interface MetricSemanticRequest {
  value: string
  unit?: string
  requestedOrigin: MetricOrigin | null
  requestedDisplayFunction: MetricDisplayFunction | null
  /** display_function 是否明确请求 inspection-specimen。请求 ≠ 权限。 */
  requestedSpecimen: boolean
  /** 资格证据（INVARIANT A5）：标本来源 / 检查问题 / 精确值在来源中可见。 */
  specimenSource?: string
  inspectionQuestion?: string
  exactValueVisible?: string
  /** 强制 provenance（rev1 §13.7：SOURCE；METHOD/BOUNDARY），与 salience 无关。 */
  source?: string
  method?: string
  boundary?: string
}

/**
 * 派生资格结果 —— 未来 renderer 唯一允许消费的 metric salience 输入。
 * 这个对象不可能由作者 props 直接提供；specimen_eligible / canUse* 只能由本函数派生。
 */
export interface MetricEligibilityResult {
  requestedOrigin: MetricOrigin | null
  requestedDisplayFunction: MetricDisplayFunction | null
  requestedSpecimen: boolean
  /** 结构资格：枚举合法 + 三字段齐全 + 有效。不等于编辑合法性。 */
  structurallyEligible: boolean
  /** 负向资格条件命中（author_computed + specimen 请求）→ 特权收回。 */
  negativeConditionHit: boolean
  /** 派生渲染特权：仅 requestedSpecimen && structurallyEligible && !negativeConditionHit。 */
  canUseInspectionSpecimenTreatment: boolean
  /** ambiguous 一律 defaults DOWN 后的有效展示函数；绝不经资格就给 inspection_specimen。 */
  effectiveDisplayFunction: MetricDisplayFunction
}

function parseOrigin(value: string | undefined): MetricOrigin | null {
  return value !== undefined && (ORIGINS as readonly string[]).includes(value)
    ? (value as MetricOrigin)
    : null
}

function parseDisplayFunction(value: string | undefined): MetricDisplayFunction | null {
  return value !== undefined && (DISPLAY_FUNCTIONS as readonly string[]).includes(value)
    ? (value as MetricDisplayFunction)
    : null
}

/** 从语义块 props 解析作者请求（沿用现有 key="value" 语法，无新 Markdown 扩展）。 */
export function parseMetricRequest(token: Pick<SemanticBlockToken, 'props'>): MetricSemanticRequest {
  const props = token.props
  const requestedDisplayFunction = parseDisplayFunction(props.display_function)
  return {
    value: props.value ?? '',
    unit: props.unit,
    requestedOrigin: parseOrigin(props.origin),
    requestedDisplayFunction,
    requestedSpecimen: requestedDisplayFunction === 'inspection_specimen',
    specimenSource: props.specimen_source,
    inspectionQuestion: props.inspection_question,
    exactValueVisible: props.exact_value_visible,
    source: props.source,
    method: props.method,
    boundary: props.boundary,
  }
}

/**
 * 派生资格（纯函数，无副作用）。
 * defaults DOWN 规则（rev1 §13.7 / INVARIANT A4）：
 *  - 缺 / 坏 display function → contextual_reference（最低 salience；rev1 允许
 *    reported_result 或 contextual_reference，这里取最低并记录为实现推导）。
 *  - 请求 specimen 但资格不全 / 负向命中 → reported_result（契约 §6：资格缺 → 按 reported_result）。
 *  - 显式 reported_result / contextual_reference → 原样保留。
 */
export function deriveMetricEligibility(req: MetricSemanticRequest): MetricEligibilityResult {
  const enumsValid = req.requestedOrigin !== null && req.requestedDisplayFunction !== null
  const specimenEvidenceComplete =
    req.requestedSpecimen &&
    (req.specimenSource ?? '').trim() !== '' &&
    (req.inspectionQuestion ?? '').trim() !== '' &&
    req.exactValueVisible === 'true'
  const structurallyEligible = enumsValid && specimenEvidenceComplete
  const negativeConditionHit = req.requestedSpecimen && req.requestedOrigin === NEGATIVE_SPECIMEN_ORIGIN
  const canUse = structurallyEligible && !negativeConditionHit

  let effectiveDisplayFunction: MetricDisplayFunction
  if (canUse) {
    effectiveDisplayFunction = 'inspection_specimen'
  } else if (req.requestedSpecimen) {
    // 请求了标本但没资格 / 负向命中 → 特权收回，按 reported_result 处理。
    effectiveDisplayFunction = 'reported_result'
  } else {
    effectiveDisplayFunction =
      req.requestedDisplayFunction === 'reported_result' ? 'reported_result' : 'contextual_reference'
  }

  return {
    requestedOrigin: req.requestedOrigin,
    requestedDisplayFunction: req.requestedDisplayFunction,
    requestedSpecimen: req.requestedSpecimen,
    structurallyEligible,
    negativeConditionHit,
    canUseInspectionSpecimenTreatment: canUse,
    effectiveDisplayFunction,
  }
}

/**
 * 纯校验：不改 token、不改 props、不重排、不自动修复、不生成资格。
 * 期望输入为块级 token 列表（如 renderDoocsHtml(markdown).tokens）。
 *
 * 治理映射：
 *  - 非法枚举（无法解析的结构）→ machine-lint error。
 *  - 缺失强制声明 / 缺失 provenance / 标本证据不全 / 负向命中 → machine-lint warning
 *    （legacy 迁移态与特权收回，皆不阻断；rev1 §13.7、契约 §6）。
 *  provenance 缺失只报 provenance，不收回已合法派生的 specimen salience（两轴分治）。
 */
export function validateMetricSemantics(tokens: readonly Token[]): MetricDiagnostic[] {
  const diagnostics: MetricDiagnostic[] = []

  for (const token of tokens) {
    if (token.type !== 'semanticBlock') continue
    const block = token as SemanticBlockToken
    if (block.sType !== 'metric') continue

    const props = block.props
    const req = parseMetricRequest(block)

    if (props.origin === undefined) {
      diagnostics.push({
        code: 'metric-origin-missing',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'METRIC 缺少 ORIGIN 声明（INVARIANT A4；legacy 迁移态，默认 DOWN）',
      })
    } else if (req.requestedOrigin === null) {
      diagnostics.push({
        code: 'metric-origin-invalid',
        governance: 'machine-lint',
        severity: 'error',
        blockType: 'metric',
        blockId: block.id,
        message: `METRIC ORIGIN 枚举非法："${props.origin}"`,
      })
    }

    if (props.display_function === undefined) {
      diagnostics.push({
        code: 'metric-display-function-missing',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'METRIC 缺少 DISPLAY FUNCTION 声明（INVARIANT A4；legacy 迁移态，默认 DOWN）',
      })
    } else if (req.requestedDisplayFunction === null) {
      diagnostics.push({
        code: 'metric-display-function-invalid',
        governance: 'machine-lint',
        severity: 'error',
        blockType: 'metric',
        blockId: block.id,
        message: `METRIC DISPLAY FUNCTION 枚举非法："${props.display_function}"`,
      })
    }

    // provenance（rev1 §13.7 强制：SOURCE；METHOD/BOUNDARY）——两轴分治，不碰 salience。
    const sourceMissing = (props.source ?? '').trim() === ''
    const methodBoundaryMissing = (props.method ?? '').trim() === '' && (props.boundary ?? '').trim() === ''
    if (sourceMissing || methodBoundaryMissing) {
      diagnostics.push({
        code: 'metric-provenance-missing',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'METRIC 缺少强制 provenance（SOURCE；METHOD/BOUNDARY）',
      })
    }

    if (!req.requestedSpecimen) continue

    // ——— specimen 资格证据（INVARIANT A5）———

    if ((props.specimen_source ?? '').trim() === '') {
      diagnostics.push({
        code: 'metric-specimen-source-missing',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'specimen 请求缺少 specimen_source（资格不成立，特权收回）',
      })
    }

    if ((props.inspection_question ?? '').trim() === '') {
      diagnostics.push({
        code: 'metric-specimen-question-missing',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'specimen 请求缺少 inspection_question（资格不成立，特权收回）',
      })
    }

    if (props.exact_value_visible === undefined || props.exact_value_visible === '') {
      diagnostics.push({
        code: 'metric-specimen-exact-value-invalid',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'specimen 请求缺少 exact_value_visible（资格不成立，特权收回）',
      })
    } else if (props.exact_value_visible === 'false') {
      // 负向资格：汇总数字（精确值在来源中不可见）不得作为 specimen。
      diagnostics.push({
        code: 'metric-specimen-exact-value-false',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'exact_value_visible=false：汇总数字不得作为 specimen（资格不成立，特权收回）',
      })
    } else if (props.exact_value_visible !== 'true') {
      diagnostics.push({
        code: 'metric-specimen-exact-value-invalid',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: `exact_value_visible 必须是 true/false，收到 "${props.exact_value_visible}"`,
      })
    }

    // 负向资格（rev1 §13.7）：author-computed result 不得作为 specimen。
    if (req.requestedOrigin === NEGATIVE_SPECIMEN_ORIGIN) {
      diagnostics.push({
        code: 'metric-specimen-negative-provenance',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: 'metric',
        blockId: block.id,
        message: 'author_computed 结果不得作为 specimen（负向资格；如确需请在文章中明确检查呈现/精度本身，由编辑复核）',
      })
    }
  }

  return diagnostics
}
