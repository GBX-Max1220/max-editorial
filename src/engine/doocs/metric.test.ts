import { describe, expect, it } from 'vitest'
import { renderDoocsHtml } from './engine'
import {
  deriveMetricEligibility,
  parseMetricRequest,
  validateMetricSemantics,
  type MetricDiagnostic,
  type MetricEligibilityResult,
} from './metric'
import type { SemanticBlockToken } from './semantic'
import { validateDocument } from '../validate'
import { canDiagnosticFailBuild } from '../governance'

/**
 * 测试用 authoring 语法（沿用现有 `key="value"` props，与 relations 测试一致）：
 *   :::metric id="m1" value="73" unit="%" origin="external_source"
 *     display_function="inspection_specimen" specimen_source="…" inspection_question="…"
 *     exact_value_visible="true" source="…" method="…" boundary="…"
 */

const FULL_SPECIMEN: Record<string, string> = {
  id: 'm1',
  value: '73',
  unit: '%',
  origin: 'external_source',
  display_function: 'inspection_specimen',
  specimen_source: 'AI OUTPUT 2024-06 报告',
  inspection_question: '这个 73% 是否经得起细看？',
  exact_value_visible: 'true',
  source: '模型报告 v3',
  method: '通过率统计',
  boundary: '仅限该次输出',
}

function withProps(
  base: Record<string, string>,
  overrides: Record<string, string | undefined>,
): Record<string, string> {
  const out = { ...base }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete out[k]
    else out[k] = v
  }
  return out
}

function propsLine(props: Record<string, string>): string {
  return Object.entries(props)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
}

function specimenMd(overrides: Record<string, string | undefined> = {}): string {
  const props = withProps(FULL_SPECIMEN, overrides)
  return `:::metric ${propsLine(props)}\n73%\n:::`
}

function metricToken(md: string): SemanticBlockToken {
  return renderDoocsHtml(md).tokens.find(
    (t): t is SemanticBlockToken => t.type === 'semanticBlock',
  )!
}

function eligibility(md: string): MetricEligibilityResult {
  return deriveMetricEligibility(parseMetricRequest(metricToken(md)))
}

function diags(md: string): MetricDiagnostic[] {
  return validateMetricSemantics(renderDoocsHtml(md).tokens)
}

function codes(md: string): string[] {
  return diags(md).map((d) => d.code)
}

describe('METRIC two-axis semantic model', () => {
  it('external_source + inspection_specimen is a valid, structurally complete combination', () => {
    // 两轴共存的 canonical 用例：旧的互斥三选一 ROLE 已死。
    expect(diags(specimenMd())).toEqual([])
    const e = eligibility(specimenMd())
    expect(e.requestedOrigin).toBe('external_source')
    expect(e.requestedDisplayFunction).toBe('inspection_specimen')
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(true)
    expect(e.effectiveDisplayFunction).toBe('inspection_specimen')
  })

  it('origin and display function vary independently (author_computed + contextual_reference)', () => {
    const md = specimenMd({ origin: 'author_computed', display_function: 'contextual_reference' })
    const e = eligibility(md)
    expect(e.requestedOrigin).toBe('author_computed')
    expect(e.requestedDisplayFunction).toBe('contextual_reference')
    expect(e.requestedSpecimen).toBe(false)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('contextual_reference')
  })

  it('origin does NOT dictate display function: model_output alone grants nothing', () => {
    const md = specimenMd({ origin: 'model_output', display_function: 'reported_result' })
    const e = eligibility(md)
    expect(e.requestedSpecimen).toBe(false)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('reported_result')
  })

  it('author-computed + reported_result stays a valid, non-specimen result', () => {
    const md = specimenMd({ origin: 'author_computed', display_function: 'reported_result' })
    expect(diags(md)).toEqual([]) // 无负向资格诊断：它不是 specimen 请求
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(eligibility(md).effectiveDisplayFunction).toBe('reported_result')
  })
})

describe('missing / malformed axis declarations', () => {
  it('missing origin: diagnostic, no structural eligibility, defaults DOWN', () => {
    const md = specimenMd({ origin: undefined })
    expect(codes(md)).toContain('metric-origin-missing')
    const e = eligibility(md)
    expect(e.requestedOrigin).toBeNull()
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('reported_result')
  })

  it('invalid origin enum: error diagnostic, no structural eligibility', () => {
    const md = specimenMd({ origin: 'external' })
    const d = diags(md)
    expect(d.some((x) => x.code === 'metric-origin-invalid' && x.severity === 'error')).toBe(true)
    const e = eligibility(md)
    expect(e.requestedOrigin).toBeNull()
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
  })

  it('missing display function: diagnostic, defaults to lowest-salience contextual_reference', () => {
    const md = specimenMd({ display_function: undefined })
    expect(codes(md)).toContain('metric-display-function-missing')
    const e = eligibility(md)
    expect(e.requestedSpecimen).toBe(false)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('contextual_reference')
  })

  it('unknown display function value: error diagnostic, never guesses upward to specimen', () => {
    const md = specimenMd({ display_function: 'inspection_specimen ' }) // trailing space → invalid enum
    const d = diags(md)
    expect(d.some((x) => x.code === 'metric-display-function-invalid' && x.severity === 'error')).toBe(true)
    const e = eligibility(md)
    expect(e.requestedSpecimen).toBe(false) // 不是合法枚举，不按 specimen 处理
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('contextual_reference')
  })
})

describe('inspection-specimen structural eligibility (INVARIANT A5)', () => {
  it('complete specimen evidence passes structural eligibility', () => {
    const e = eligibility(specimenMd())
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(true)
  })

  it('missing specimen_source: structural eligibility false, diagnostic', () => {
    const md = specimenMd({ specimen_source: undefined })
    expect(codes(md)).toContain('metric-specimen-source-missing')
    const e = eligibility(md)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('reported_result')
  })

  it('missing inspection_question: structural eligibility false, diagnostic', () => {
    const md = specimenMd({ inspection_question: undefined })
    expect(codes(md)).toContain('metric-specimen-question-missing')
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(false)
  })

  it('exact_value_visible=false (aggregate): structural eligibility false, diagnostic', () => {
    const md = specimenMd({ exact_value_visible: 'false' })
    expect(codes(md)).toContain('metric-specimen-exact-value-false')
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(eligibility(md).effectiveDisplayFunction).toBe('reported_result')
  })

  it('exact_value_visible malformed: structural eligibility false, diagnostic', () => {
    const md = specimenMd({ exact_value_visible: 'yes' })
    expect(codes(md)).toContain('metric-specimen-exact-value-invalid')
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(false)
  })

  it('requested specimen but incomplete evidence defaults DOWN', () => {
    const md = specimenMd({ specimen_source: undefined, inspection_question: undefined })
    const e = eligibility(md)
    expect(e.requestedSpecimen).toBe(true)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('reported_result')
  })

  it('missing origin while requesting specimen: not structurally eligible', () => {
    const md = specimenMd({ origin: undefined })
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(false)
  })
})

describe('negative specimen eligibility (rev1 §13.7)', () => {
  it('author_computed + specimen request: negative condition hit, structural eligibility false', () => {
    const md = specimenMd({ origin: 'author_computed' })
    expect(codes(md)).toContain('metric-specimen-negative-provenance')
    const e = eligibility(md)
    expect(e.negativeConditionHit).toBe(true)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('reported_result')
  })
})

describe('provenance requirements (rev1 §13.7: SOURCE; METHOD/BOUNDARY)', () => {
  it('complete specimen without general provenance: warning, but structural eligibility untouched (divorce)', () => {
    const md = specimenMd({ source: undefined, method: undefined, boundary: undefined })
    expect(codes(md)).toContain('metric-provenance-missing')
    // 两轴分治：provenance 缺失不影响 specimen 结构资格（provenance ≠ salience）。
    expect(eligibility(md).structurallyEligibleForInspectionSpecimen).toBe(true)
  })

  it('source present with method/boundary: no provenance diagnostic', () => {
    expect(codes(specimenMd())).not.toContain('metric-provenance-missing')
  })

  it('source missing but method+boundary present: provenance warning', () => {
    expect(codes(specimenMd({ source: undefined }))).toContain('metric-provenance-missing')
  })

  it('method and boundary both missing: provenance warning', () => {
    expect(codes(specimenMd({ method: undefined, boundary: undefined }))).toContain('metric-provenance-missing')
  })
})

describe('legacy METRIC blocks', () => {
  const legacy = ':::metric value="43" label="MINUTES · EXACTLY?" id="metric-43"\n43 分钟\n:::'

  it('legacy metric still parses and renders identically', () => {
    const html = renderDoocsHtml(legacy).html
    expect(html).toContain('sblock-metric')
    expect(html).toContain('metric-value">43</div>')
  })

  it('legacy metric produces migration diagnostics, never specimen structural eligibility', () => {
    const c = codes(legacy)
    expect(c).toContain('metric-origin-missing')
    expect(c).toContain('metric-display-function-missing')
    expect(c).toContain('metric-provenance-missing')
    const e = eligibility(legacy)
    expect(e.requestedSpecimen).toBe(false)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
    expect(e.effectiveDisplayFunction).toBe('contextual_reference')
  })
})

describe('render neutrality / pure validation', () => {
  it('two-axis metadata changes nothing in rendered HTML', () => {
    const plain = ':::metric value="73"\n73%\n:::'
    const rich = specimenMd()
    expect(renderDoocsHtml(plain).html).toBe(renderDoocsHtml(rich).html)
  })

  it('structurally eligible specimen renders exactly like a plain metric (no salience CSS yet)', () => {
    const html = renderDoocsHtml(specimenMd()).html
    expect(html).toContain('sblock-metric')
    // 本提交零视觉变化：没有任何 specimen/salience/放大通道。
    expect(html).not.toMatch(/data-salience|specimen-eligible|inspection-specimen|salience/i)
  })

  it('validateMetricSemantics does not mutate tokens', () => {
    const tokens = renderDoocsHtml(specimenMd()).tokens
    const before = JSON.stringify(tokens)
    validateMetricSemantics(tokens)
    expect(JSON.stringify(tokens)).toBe(before)
  })

  it('validateDocument aggregates metric diagnostics and stays pure', () => {
    const tokens = renderDoocsHtml(specimenMd({ specimen_source: undefined })).tokens
    const before = JSON.stringify(tokens)
    const all = validateDocument(tokens)
    expect(all.some((d) => d.code === 'metric-specimen-source-missing')).toBe(true)
    expect(JSON.stringify(tokens)).toBe(before)
  })
})

describe('classification-laundering regression (author request ≠ machine structural eligibility)', () => {
  it('raw inspection-specimen request alone cannot yield structural eligibility', () => {
    const md = specimenMd({ specimen_source: undefined })
    const e = eligibility(md)
    expect(e.requestedSpecimen).toBe(true)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(false)
  })

  it('author props never contain specimen_eligible or any derived result field', () => {
    const props = metricToken(specimenMd()).props
    expect(props.specimen_eligible).toBeUndefined()
    expect(props.canUseInspectionSpecimenTreatment).toBeUndefined()
    expect(props.specimenEligible).toBeUndefined()
    expect(props.structurallyEligibleForInspectionSpecimen).toBeUndefined()
  })

  it('parsed request exposes only requested* inputs, not derived results', () => {
    const req = parseMetricRequest(metricToken(specimenMd({ specimen_source: undefined })))
    expect(req.requestedSpecimen).toBe(true)
    expect(req).not.toHaveProperty('structurallyEligibleForInspectionSpecimen')
    expect(req).not.toHaveProperty('specimenEligible')
    expect(req).not.toHaveProperty('canUseInspectionSpecimenTreatment')
  })

  it('structural eligibility does NOT create any final visual-authorization field', () => {
    // 结构资格全满足（external_source + inspection_specimen + 完整证据 + provenance）。
    const md = specimenMd()
    const e = eligibility(md)
    expect(e.structurallyEligibleForInspectionSpecimen).toBe(true)
    // 三层分离：没有任何字段承诺"最终视觉待遇已授权"。
    expect(e).not.toHaveProperty('canUseInspectionSpecimenTreatment')
    expect(e).not.toHaveProperty('renderPrivilege')
    expect(e).not.toHaveProperty('canRenderInspectionSpecimen')
    expect(e).not.toHaveProperty('editoriallyApproved')
    expect(e).not.toHaveProperty('visualAuthorization')
    // 作者 props 同样无授权字段。
    const props = metricToken(md).props
    expect(props.specimen_approved).toBeUndefined()
    expect(props.specimen_eligible).toBeUndefined()
    // 渲染输出与普通 metric 完全相同。
    const plain = ':::metric value="73"\n73%\n:::'
    expect(renderDoocsHtml(md).html).toBe(renderDoocsHtml(plain).html)
  })

  it('governance mapping: invalid enums are machine-lint errors, missing evidence warnings', () => {
    const invalidOrigin = diags(specimenMd({ origin: 'external' })).find((d) => d.code === 'metric-origin-invalid')!
    const missingSource = diags(specimenMd({ specimen_source: undefined })).find(
      (d) => d.code === 'metric-specimen-source-missing',
    )!
    const negative = diags(specimenMd({ origin: 'author_computed' })).find(
      (d) => d.code === 'metric-specimen-negative-provenance',
    )!
    for (const d of [invalidOrigin, missingSource, negative]) {
      expect(d.governance).toBe('machine-lint')
    }
    expect(invalidOrigin.severity).toBe('error')
    expect(canDiagnosticFailBuild(invalidOrigin)).toBe(true)
    expect(missingSource.severity).toBe('warning')
    expect(canDiagnosticFailBuild(missingSource)).toBe(false)
    expect(negative.severity).toBe('warning')
    expect(canDiagnosticFailBuild(negative)).toBe(false)
  })
})
