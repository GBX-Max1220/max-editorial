/**
 * Phase 0.1 — 稳定语义块身份校验。
 *
 * validateBlockIds 是纯函数：不改 token、不自动生成/改名 ID、不重排、不参与渲染。
 * 它只返回诊断。后续关系引用依赖这里的稳定 id。
 *
 * 治理映射（rev1 §14.1 machine-checkable）：missing/empty/duplicate 全部属
 * MACHINE-CHECKABLE LINT（结构性）。duplicate-id = error（引用不可判定）；
 * missing/empty = warning（历史内容过渡态，不阻断）。
 */

import type { Token } from 'marked'
import type { EditorialDiagnostic } from '../governance'
import type { SemanticBlockToken } from './semantic'

export type BlockIdDiagnosticCode = 'missing-id' | 'empty-id' | 'duplicate-id'

export interface BlockIdDiagnostic extends EditorialDiagnostic {
  code: BlockIdDiagnosticCode
  blockType: string
  blockId?: string
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
        governance: 'machine-lint',
        severity: 'warning',
        blockType: block.sType,
        message: `${block.sType} 块缺少稳定 id（后续关系引用需要）`,
      })
      continue
    }

    if (block.id.trim() === '') {
      diagnostics.push({
        code: 'empty-id',
        governance: 'machine-lint',
        severity: 'warning',
        blockType: block.sType,
        blockId: block.id,
        message: `${block.sType} 块的 id 为空`,
      })
      continue
    }

    const normalized = block.id.trim()
    if (seen.has(normalized)) {
      diagnostics.push({
        code: 'duplicate-id',
        governance: 'machine-lint',
        severity: 'error',
        blockType: block.sType,
        blockId: normalized,
        message: `重复语义块 id：${normalized}`,
      })
    } else {
      seen.add(normalized)
    }
  }

  return diagnostics
}
