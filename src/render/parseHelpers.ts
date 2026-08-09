/** 共享解析逻辑已迁至 src/engine/shared/blockParse.ts，这里保持 re-export 以免破坏 V0.1 引用。 */
export { parseEvidence, parseLabNote } from '../engine/shared/blockParse'
export type { EvidenceRow, LabStat, LabNoteData } from '../engine/shared/blockParse'
