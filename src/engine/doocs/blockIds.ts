/**
 * Phase 0 — 稳定语义块身份校验。
 *
 * validateBlockIds 是纯函数：不改 token、不自动生成/改名 ID、不重排、不参与渲染。
 * 它只返回诊断。后续关系引用（SECOND CODE CHANGE）依赖这里的稳定 id。
 *
 * 严重度选择（与 reconciliation 一致，不把旧内容变成发布阻断）：
 *  - missing-id / empty-id → warning（历史内容没有 id，逐条补；不阻断）
 *  - duplicate-id        → error（两个块共享同一身份 = 引用歧义）
 */

import type { Token } from 'marked'
import type { SemanticBlockToken } from './semantic'

export type BlockIdDiagnosticCode = 'missing-id' | 'empty-id' | 'duplicate-id'
export type BlockIdSeverity = 'warning' | 'error'

export interface BlockIdDiagnostic {
  code: BlockIdDiagnosticCode
  severity: BlockIdSeverity
  blockType: string
  id?: string
  message: string
}

/**
 * 校验语义块的稳定作者 id：存在性、非空、文档内唯一。
 * 期望输入为块级 token 列表（如 renderDoocsHtml(markdown).tokens）。
 */
export function validateBlockIds(tokens: readonly Token[]): BlockIdDiagnostic[] {
  const diagnostics: BlockIdDiagnostic[] = []
  const seen = new Set<string>()

  for (const token of tokens) {
    if (token.type !== 'semanticBlock') continue
    const block = token as SemanticBlockToken

    if (block.id === undefined) {
      diagnostics.push({
        code: 'missing-id',
        severity: 'warning',
        blockType: block.sType,
        message: `${block.sType} 块缺少稳定 id（后续关系引用需要）`,
      })
      continue
    }

    if (block.id.trim() === '') {
      diagnostics.push({
        code: 'empty-id',
        severity: 'warning',
        blockType: block.sType,
        id: block.id,
        message: `${block.sType} 块的 id 为空`,
      })
      continue
    }

    const normalized = block.id.trim()
    if (seen.has(normalized)) {
      diagnostics.push({
        code: 'duplicate-id',
        severity: 'error',
        blockType: block.sType,
        id: normalized,
        message: `重复语义块 id：${normalized}`,
      })
    } else {
      seen.add(normalized)
    }
  }

  return diagnostics
}
