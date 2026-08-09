import type { EditorialEngine, EngineName } from './types'
import { legacyEngine } from './legacy/engine'
import { doocsEngine } from './doocs/engine'

const ENGINES: Record<EngineName, EditorialEngine> = {
  legacy: legacyEngine,
  doocs: doocsEngine,
}

/** UI 只通过这里拿引擎，不直接 import 具体实现。 */
export function createEditorialEngine(name: EngineName): EditorialEngine {
  return ENGINES[name]
}

export const AVAILABLE_ENGINES: EngineName[] = ['legacy', 'doocs']

export type {
  EditorialEngine,
  EngineName,
  PreviewMode,
  Viewport,
  RenderOptions,
  RenderResult,
  CopyOptions,
  CopyResult,
  EngineStructure,
  SemanticBlockInfo,
  WordCount,
} from './types'
