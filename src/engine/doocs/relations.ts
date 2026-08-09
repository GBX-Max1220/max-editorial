/**
 * Phase 0.2 — typed epistemic relations + referential-integrity validation.
 *
 * 只实现 rev1 当前阶段需要的两种关系：Evidence.supports → Claim、Counterpoint.challenges → Claim。
 * 不做通用图框架、不做关系注册表、不做 stale 自动修复。
 *
 * STALE 语义（关键，贯穿类型/诊断/测试）：
 *   STALE = "目标内容在关系快照之后发生了变化，需要编辑复核"
 *   ≠  "关系为假 / 支持无效"
 */

import type { Token, Tokens } from 'marked'
import type { SemanticBlockToken } from './semantic'

export type RelationKind = 'supports' | 'challenges'

export interface SupportsRelation {
  kind: 'supports'
  targetId: string
  /** 关系落笔时目标 claim 的规范文本 hash；缺失 = unversioned（历史内容过渡态）。 */
  targetTextHash?: string
}

export interface ChallengesRelation {
  kind: 'challenges'
  targetId: string
  targetTextHash?: string
}

export type Relation = SupportsRelation | ChallengesRelation

/** 单个关系的结构状态：STALE 属于 editorial re-review，不是 invalid。 */
export type RelationState =
  | 'valid'
  | 'missing'
  | 'ambiguous'
  | 'type_invalid'
  | 'stale'
  | 'unversioned'

export type RelationDiagnosticCode =
  | 'relation-target-missing'
  | 'relation-target-ambiguous'
  | 'relation-target-type-invalid'
  | 'relation-target-stale'
  | 'relation-target-unversioned'

export interface RelationDiagnostic {
  code: RelationDiagnosticCode
  severity: 'warning' | 'error'
  blockType: string
  blockId?: string
  relationKind: RelationKind
  targetId: string
  message: string
}

/** 从语义块 props 解析关系（沿用现有 key="value" 语法，无新 Markdown 扩展）。 */
export function parseRelations(props: Record<string, string>): Relation[] {
  const relations: Relation[] = []
  if (props.supports !== undefined) {
    relations.push({ kind: 'supports', targetId: props.supports, targetTextHash: props.supports_hash })
  }
  if (props.challenges !== undefined) {
    relations.push({ kind: 'challenges', targetId: props.challenges, targetTextHash: props.challenges_hash })
  }
  return relations
}

function inlineText(nodes: readonly Token[]): string {
  let s = ''
  for (const n of nodes) {
    switch (n.type) {
      case 'text':
        s += (n as Tokens.Text).text
        break
      case 'strong':
      case 'em':
        s += inlineText((n as Tokens.Em).tokens ?? [])
        break
      case 'codespan':
        s += (n as Tokens.Codespan).text
        break
      case 'link':
        s += inlineText((n as Tokens.Link).tokens ?? [])
        break
      case 'image':
        s += (n as Tokens.Image).text
        break
      default:
        break
    }
  }
  return s
}

/** 规范语义文本：剥离行内 markdown 格式、折叠空白。格式等价内容哈希一致（如 **AI confidence** ≡ AI confidence）。 */
export function canonicalizeSemanticText(token: Pick<SemanticBlockToken, 'lineInline'>): string {
  return token.lineInline.map((line) => inlineText(line)).join(' ').replace(/\s+/g, ' ').trim()
}

/** 确定性字符串 hash（djb2 → hex）。 */
export function hashText(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h) ^ text.charCodeAt(i)
    h = h >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function hashSemanticText(token: Pick<SemanticBlockToken, 'lineInline'>): string {
  return hashText(canonicalizeSemanticText(token))
}

/**
 * 判定单个关系的结构状态。输入 candidates = 文档内与该 targetId 匹配的块。
 * 不判定证据好坏、不判定语义真值。
 */
export function relationState(relation: Relation, candidates: readonly SemanticBlockToken[]): RelationState {
  if (!relation.targetId.trim()) return 'missing'
  const matching = candidates.filter((c) => c.id?.trim() === relation.targetId.trim())
  if (matching.length === 0) return 'missing'
  if (matching.length > 1) return 'ambiguous'
  const target = matching[0]
  if (target.sType !== 'claim') return 'type_invalid'
  if (!relation.targetTextHash) return 'unversioned'
  return relation.targetTextHash === hashSemanticText(target) ? 'valid' : 'stale'
}

const STATE_TO_CODE: Record<RelationState, RelationDiagnosticCode | null> = {
  valid: null,
  missing: 'relation-target-missing',
  ambiguous: 'relation-target-ambiguous',
  type_invalid: 'relation-target-type-invalid',
  stale: 'relation-target-stale',
  unversioned: 'relation-target-unversioned',
}

const STATE_MESSAGE: Record<RelationState, string> = {
  valid: '',
  missing: '关系目标不存在',
  ambiguous: '关系目标 id 有歧义（多个块共用同一 id）',
  type_invalid: '关系目标类型不兼容（supports/challenges 必须指向 claim）',
  stale: '目标已变更，关系需要编辑复核（STALE，非关系为假）',
  unversioned: '关系缺少目标快照 hash（历史内容过渡态）',
}

/**
 * 纯校验：不改 token、不改 hash、不重排、不生成/删除关系。只返回结构诊断。
 * 期望输入为块级 token 列表（如 renderDoocsHtml(markdown).tokens）。
 */
export function validateRelations(tokens: readonly Token[]): RelationDiagnostic[] {
  const blocks = tokens.filter((t): t is SemanticBlockToken => t.type === 'semanticBlock')

  const idIndex = new Map<string, SemanticBlockToken[]>()
  for (const b of blocks) {
    if (!b.id) continue
    const key = b.id.trim()
    idIndex.set(key, [...(idIndex.get(key) ?? []), b])
  }

  const diagnostics: RelationDiagnostic[] = []
  for (const block of blocks) {
    for (const rel of block.relations ?? []) {
      const candidates = idIndex.get(rel.targetId.trim()) ?? []
      const state = relationState(rel, candidates)
      const code = STATE_TO_CODE[state]
      if (!code) continue
      diagnostics.push({
        code,
        severity: state === 'stale' || state === 'unversioned' ? 'warning' : 'error',
        blockType: block.sType,
        blockId: block.id,
        relationKind: rel.kind,
        targetId: rel.targetId,
        message: STATE_MESSAGE[state],
      })
    }
  }
  return diagnostics
}
