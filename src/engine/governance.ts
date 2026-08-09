/**
 * Phase 0.3 — 诊断治理模型（governance / enforcement boundary）。
 *
 * rev1 的治理层级必须保持**四种**语义类别，绝不能塌缩进单一 warning/error 系统：
 *   safety-invariant / machine-lint / editorial-constraint / heuristic
 *
 * 关键不变量：
 *  - governance（规则为什么存在）与 severity（当前工具对此做什么）是两个独立维度，
 *    不得把 governance 编码成 severity（"safety=error / heuristic=warning" 是错误映射）。
 *  - HEURISTIC ≠ EDITORIAL CONSTRAINT：两者不可合并。
 *  - 本文件只定义类型与策略查询；不实现构建门禁、不实现规则引擎、不实现 autofix。
 */

export type GovernanceLevel =
  | 'safety-invariant'
  | 'machine-lint'
  | 'editorial-constraint'
  | 'heuristic'

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface EditorialDiagnostic {
  code: string
  governance: GovernanceLevel
  severity: DiagnosticSeverity
  message: string
  blockId?: string
  blockType?: string
}

export interface EnforcementPolicy {
  governance: GovernanceLevel
  mayMutateAst: boolean
  mayMutateRender: boolean
  mayAutofix: boolean
  mayReorder: boolean
  suppressible: boolean
}

const POLICY: Record<GovernanceLevel, Omit<EnforcementPolicy, 'governance'>> = {
  'safety-invariant': {
    mayMutateAst: false,
    mayMutateRender: false,
    mayAutofix: false,
    mayReorder: false,
    suppressible: false, // 认识论安全不变量不得被 lint-disable 静默豁免
  },
  'machine-lint': {
    mayMutateAst: false,
    mayMutateRender: false,
    mayAutofix: false,
    mayReorder: false,
    suppressible: false, // 结构性错误不得被静默豁免
  },
  'editorial-constraint': {
    mayMutateAst: false,
    mayMutateRender: false,
    mayAutofix: false,
    mayReorder: false,
    suppressible: true, // 可带理由豁免
  },
  heuristic: {
    mayMutateAst: false,
    mayMutateRender: false,
    mayAutofix: false,
    mayReorder: false,
    suppressible: true, // 可带理由豁免
  },
}

export function getEnforcementPolicy(governance: GovernanceLevel): EnforcementPolicy {
  return { governance, ...POLICY[governance] }
}

/** 该治理层是否允许被显式豁免。safety-invariant / structural machine-lint：否。 */
export function canSuppress(d: Pick<EditorialDiagnostic, 'governance'>): boolean {
  return getEnforcementPolicy(d.governance).suppressible
}

/**
 * 该诊断是否可能参与构建失败。这是策略查询，不是行为——本提交不实现构建门禁。
 * heuristic / editorial-constraint：rev1 下永远 NO。
 * machine-lint / safety-invariant：仅 severity=error 时"可能"（具体阻断语义由后续 spec 授权）。
 */
export function canDiagnosticFailBuild(d: Pick<EditorialDiagnostic, 'governance' | 'severity'>): boolean {
  switch (d.governance) {
    case 'safety-invariant':
    case 'machine-lint':
      return d.severity === 'error'
    case 'editorial-constraint':
    case 'heuristic':
      return false
  }
}

/** 任何治理层的诊断都不得改变渲染输出（validator 与渲染路径隔离）。 */
export function canDiagnosticMutateRender(_d: EditorialDiagnostic): boolean {
  return false
}
