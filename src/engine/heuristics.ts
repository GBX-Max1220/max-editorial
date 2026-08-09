/**
 * Phase 0.3 — 占位启发式。
 *
 * 只证明 governance 边界存在：heuristic 诊断是 advisory、不 mutate、不改渲染。
 * 真实 §19 规则（中断密度、viewport dominant、英文 label 数、adjacency 距离、
 * 表格行数、PAUSE 频率等）在后续阶段按各自治理层填充，本文件不放阈值规则。
 */

import type { Token } from 'marked'
import type { EditorialDiagnostic } from './governance'
import type { SemanticBlockToken } from './doocs/semantic'

/** 占位：报告 PAUSE 语法（judgment）块数量，仅测量、无阈值判断。 */
export function heuristicPauseDensity(tokens: readonly Token[]): EditorialDiagnostic[] {
  const pauses = tokens.filter(
    (t): t is SemanticBlockToken => t.type === 'semanticBlock' && t.sType === 'judgment',
  )
  if (pauses.length === 0) return []
  return [
    {
      code: 'HEUR-pause-density',
      governance: 'heuristic',
      severity: 'info',
      message: `检测到 ${pauses.length} 个 JUDGMENT（PAUSE 语法）——仅测量，无阈值判断`,
    },
  ]
}
