/**
 * validateDocument：把现有纯 validator 聚合为一个纯函数入口。
 * 只收集诊断，绝不修改 Markdown / tokens / relations / hashes / AST 顺序 / 渲染。
 */

import type { Token } from 'marked'
import type { EditorialDiagnostic } from './governance'
import { validateBlockIds } from './doocs/blockIds'
import { validateRelations } from './doocs/relations'
import { validateMetricSemantics } from './doocs/metric'
import { heuristicPauseDensity } from './heuristics'
import { runEpistemicLint } from './epistemicLint'

export function validateDocument(tokens: readonly Token[]): EditorialDiagnostic[] {
  return [
    ...validateBlockIds(tokens),
    ...validateRelations(tokens),
    ...validateMetricSemantics(tokens),
    ...heuristicPauseDensity(tokens),
    ...runEpistemicLint(tokens),
  ]
}
