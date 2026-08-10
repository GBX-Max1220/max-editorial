/**
 * 启发式检查（rev1 §19 HEURISTICS）：advisory、不 mutate、不改渲染、不影响退出码。
 *
 * 治理：全部 governance='heuristic'，severity 至多 info（§19 enforcement contract 不允许
 * 启发式影响 build；本模块不输出 warning/error）。每类可被块级 `suppress="rule"` 豁免。
 *
 * 注意：中断密度 / viewport dominant / label 数 / adjacency 距离等依赖布局或语义裁决的
 * 启发式，headless 下只做"可机器测量"的子集；editorial-constraint 级的密度检查见
 * epistemicLint.ts（validateInterruptDensity / validateJudgmentAdjacency）。
 */

import type { Token } from 'marked'
import type { EditorialDiagnostic } from './governance'
import type { SemanticBlockToken } from './doocs/semantic'

/** PAUSE 语法成员（§9.1/§11.2）：JUDGMENT、METRIC-specimen、major QUESTION。§11.2 纪律 ≤3。 */
export function heuristicPauseDensity(tokens: readonly Token[]): EditorialDiagnostic[] {
  let pauses = 0
  let firstPause: SemanticBlockToken | undefined
  for (const t of tokens) {
    if (t.type !== 'semanticBlock') continue
    const s = t as SemanticBlockToken
    const isPause =
      s.sType === 'judgment' ||
      (s.sType === 'metric' && s.props.display_function === 'inspection_specimen') ||
      (s.sType === 'question' && s.props.major === 'true')
    if (isPause) {
      pauses++
      if (!firstPause) firstPause = s
    }
  }
  if (pauses === 0) return []
  if (pauses <= 3) {
    return [
      {
        code: 'HEUR-pause-density',
        governance: 'heuristic',
        severity: 'info',
        message: `检测到 ${pauses} 个 PAUSE 语法（§11.2 纪律 ≤3）——仅测量，无阈值判断`,
      },
    ]
  }
  const suppress = (firstPause?.props.suppress ?? '').split(',').map((s) => s.trim())
  if (suppress.includes('HEUR-pause-density')) return []
  return [
    {
      code: 'HEUR-pause-density',
      governance: 'heuristic',
      severity: 'info',
      message: `检测到 ${pauses} 个 PAUSE 语法（§11.2 纪律：2000–3000 字全文 ≤3）——仅提示，可带理由豁免`,
    },
  ]
}
