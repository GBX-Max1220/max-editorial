/**
 * Phase 0.5 — EditorialAuthorization（编辑授权层）。
 *
 * 与 Markdown props / SemanticBlockToken / MetricSemanticRequest / 结构资格【完全分离】：
 * 授权不落在语义内容文件里（内容文件不得通过一个 prop 自授渲染特权），而是作为独立的
 * 渲染/复核输入注入。
 *
 * 作用不是"证明这个编辑决定正确"，而是记录：
 *   > 某个明确授权了这项视觉特权的决定。
 * 它是审计痕迹（decision provenance），不是机器真理。
 *
 * 关键约束：
 *  - 必须 block-ID 绑定：不授权"所有 metric"、不按类型/CSS 选择器/数组位置。
 *  - 授权不能绕过结构校验：结构资格失败时，授权无效（见 resolveMetricTreatment）。
 *  - 不做通用审批系统：无数据库、无工作流引擎、无角色/签名/权限、无 admin UI。
 */

import type { MetricEligibilityResult } from './metric'

/** 本切片唯一支持的视觉特权。 */
export type EditorialTreatment = 'inspection-specimen'

export interface EditorialAuthorization {
  /** 稳定语义块 id（文档内唯一）；特权决定必须具体、可审计。 */
  blockId: string
  treatment: EditorialTreatment
  /** 人类可读理由；审计痕迹，机器不可验证。 */
  reason: string
}

export type EditorialAuthorizationMap = ReadonlyMap<string, EditorialAuthorization>

/** 把授权列表按 blockId 建索引；同一 blockId 重复时后者覆盖（调用方应避免重复）。 */
export function indexAuthorizations(
  authorizations: readonly EditorialAuthorization[],
): EditorialAuthorizationMap {
  const map = new Map<string, EditorialAuthorization>()
  for (const a of authorizations) {
    map.set(a.blockId, a)
  }
  return map
}

/**
 * 渲染边界上的 specimen 特权门。
 * 只有 BOTH 为真才授予：
 *   A. structurallyEligibleForInspectionSpecimen === true
 *   B. 存在匹配该 blockId 的显式 EditorialAuthorization
 *
 * 绝不因 raw 作者枚举、结构资格单独、或 effectiveDisplayFunction 单独而授予。
 * 这是派生渲染决定，不回写 Markdown / token。
 */
export function resolveMetricTreatment(
  blockId: string | undefined,
  eligibility: MetricEligibilityResult,
  authMap: ReadonlyMap<string, EditorialAuthorization>,
): 'inspection-specimen' | null {
  // 授权不能绕过结构无效。
  if (!eligibility.structurallyEligibleForInspectionSpecimen) return null
  // 无稳定 id 的 metric 无法被 block-ID 绑定授权。
  if (!blockId) return null
  const auth = authMap.get(blockId)
  if (!auth || auth.treatment !== 'inspection-specimen') return null
  return 'inspection-specimen'
}
