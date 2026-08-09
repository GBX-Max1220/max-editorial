import { describe, expect, it } from 'vitest'
import {
  canDiagnosticFailBuild,
  canDiagnosticMutateRender,
  canSuppress,
  getEnforcementPolicy,
  type EditorialDiagnostic,
  type GovernanceLevel,
} from './governance'
import { validateDocument } from './validate'
import { heuristicPauseDensity } from './heuristics'
import { renderDoocsHtml } from './doocs/engine'
import { validateBlockIds } from './doocs/blockIds'
import { validateRelations, hashSemanticText } from './doocs/relations'

const diag = (governance: GovernanceLevel, severity: EditorialDiagnostic['severity']): EditorialDiagnostic => ({
  code: 'test',
  governance,
  severity,
  message: 'x',
})

describe('governance model', () => {
  it('represents four distinct governance levels', () => {
    const levels: GovernanceLevel[] = [
      'safety-invariant',
      'machine-lint',
      'editorial-constraint',
      'heuristic',
    ]
    expect(new Set(levels).size).toBe(4)
  })

  it('keeps governance and severity as independent dimensions', () => {
    const dup = validateBlockIds(
      renderDoocsHtml(':::claim id="a"\nx\n:::\n\n:::claim id="a"\ny\n:::').tokens,
    )
    const unversioned = validateRelations(
      renderDoocsHtml(':::claim id="a"\nx\n:::\n\n:::evidence id="e" supports="a"\nz\n:::').tokens,
    )
    // 同一 governance（machine-lint），两种 severity（error vs warning）→ 两轴正交
    expect(dup[0].governance).toBe('machine-lint')
    expect(dup[0].severity).toBe('error')
    expect(unversioned[0].governance).toBe('machine-lint')
    expect(unversioned[0].severity).toBe('warning')
    expect(dup[0].severity).not.toBe(unversioned[0].severity)
  })

  it('maps existing id diagnostics to machine-lint', () => {
    const md = [':::claim id="a"\nx\n:::', '', ':::evidence\n无 id\n:::'].join('\n')
    const diags = validateBlockIds(renderDoocsHtml(md).tokens)
    expect(diags.length).toBeGreaterThan(0)
    expect(diags.every((d) => d.governance === 'machine-lint')).toBe(true)
  })

  it('maps existing relation diagnostics to machine-lint', () => {
    const md = [':::claim id="a"\nx\n:::', '', ':::evidence id="e" supports="ghost"\nz\n:::'].join('\n')
    const diags = validateRelations(renderDoocsHtml(md).tokens)
    expect(diags.length).toBeGreaterThan(0)
    expect(diags.every((d) => d.governance === 'machine-lint')).toBe(true)
  })

  it('stale stays a machine-detectable warning, never a build failure', () => {
    // 构造真实 stale：hash 取自"文本 A"，当前 claim 是"文本 B"
    const hashA = hashSemanticText(
      renderDoocsHtml(':::claim id="claim-a"\n原始文本 A\n:::').tokens.find(
        (t): t is import('./doocs/semantic').SemanticBlockToken => t.type === 'semanticBlock',
      )!,
    )
    const md = [
      ':::claim id="claim-a"',
      '修改后的文本 B',
      ':::',
      '',
      `:::evidence id="ev-1" supports="claim-a" supports_hash="${hashA}"`,
      'SUPPORTED',
      'x',
      ':::',
    ].join('\n')
    const stale = validateRelations(renderDoocsHtml(md).tokens)
    expect(stale[0].code).toBe('relation-target-stale')
    expect(stale[0].governance).toBe('machine-lint')
    expect(stale[0].severity).toBe('warning')
    expect(canDiagnosticFailBuild(stale[0])).toBe(false)
  })

  it('heuristics cannot fail build or mutate render, but are suppressible', () => {
    const h = diag('heuristic', 'error') // 即使 severity=error
    expect(canDiagnosticFailBuild(h)).toBe(false)
    expect(canDiagnosticMutateRender(h)).toBe(false)
    expect(canSuppress(h)).toBe(true)
    expect(getEnforcementPolicy('heuristic').mayAutofix).toBe(false)
    expect(getEnforcementPolicy('heuristic').mayReorder).toBe(false)
    expect(getEnforcementPolicy('heuristic').mayMutateAst).toBe(false)
  })

  it('editorial constraints cannot fail build, but are suppressible', () => {
    const c = diag('editorial-constraint', 'warning')
    expect(canDiagnosticFailBuild(c)).toBe(false)
    expect(canSuppress(c)).toBe(true)
    expect(getEnforcementPolicy('editorial-constraint').mayMutateRender).toBe(false)
  })

  it('safety invariants are not suppressible and may gate an error build', () => {
    expect(canSuppress(diag('safety-invariant', 'error'))).toBe(false)
    expect(canDiagnosticFailBuild(diag('safety-invariant', 'error'))).toBe(true)
    expect(canDiagnosticFailBuild(diag('safety-invariant', 'warning'))).toBe(false)
  })

  it('machine-lint errors may gate build, warnings may not; not suppressible', () => {
    expect(canDiagnosticFailBuild(diag('machine-lint', 'error'))).toBe(true)
    expect(canDiagnosticFailBuild(diag('machine-lint', 'warning'))).toBe(false)
    expect(canSuppress(diag('machine-lint', 'error'))).toBe(false)
  })

  it('dummy heuristic is advisory and does not mutate tokens', () => {
    const md = ':::judgment id="j-1"\n判断\n:::'
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    const diags = heuristicPauseDensity(tokens)
    expect(diags.length).toBeGreaterThan(0)
    expect(diags.every((d) => d.governance === 'heuristic' && d.severity === 'info')).toBe(true)
    expect(JSON.stringify(tokens)).toBe(before)
  })

  it('validateDocument aggregates and stays pure', () => {
    const md = [
      ':::claim id="a"',
      'x',
      ':::',
      '',
      ':::evidence id="e" supports="ghost"', // missing target
      'z',
      ':::',
      '',
      ':::judgment id="j-1"', // triggers dummy heuristic
      '判断',
      ':::',
      '',
      ':::claim', // missing id
      'y',
      ':::',
    ].join('\n')
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    const diags = validateDocument(tokens)
    expect(diags.some((d) => d.code === 'relation-target-missing')).toBe(true)
    expect(diags.some((d) => d.code === 'missing-id')).toBe(true)
    expect(diags.some((d) => d.governance === 'heuristic')).toBe(true)
    expect(JSON.stringify(tokens)).toBe(before)
  })

  it('rendering is identical with and without validation (validators not in render path)', () => {
    const md = ':::claim id="a"\nx\n:::\n\n:::evidence id="e" supports="ghost"\nz\n:::'
    const html = renderDoocsHtml(md).html
    const tokens = renderDoocsHtml(md).tokens
    const before = JSON.stringify(tokens)
    validateDocument(tokens)
    expect(JSON.stringify(tokens)).toBe(before)
    expect(renderDoocsHtml(md).html).toBe(html)
  })
})
