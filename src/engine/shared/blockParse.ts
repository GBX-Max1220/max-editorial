/**
 * 语义块内部数据的共享解析。
 * 从 V0.1 的 src/render/parseHelpers.ts 迁出，供 legacy / doocs 两个引擎共用，
 * 避免 React 预览与引擎 HTML 生成两套逻辑漂移。
 * （逻辑与 V0.1 完全一致，未改动。）
 */

export interface EvidenceRow {
  label: string
  value: string
}

const EVIDENCE_LABEL_RE = /^[A-Z][A-Z\s·–\-]*$/

export function parseEvidence(lines: string[]): EvidenceRow[] {
  const rows: EvidenceRow[] = []
  let label = ''
  let valueParts: string[] = []
  const flush = () => {
    if (valueParts.length > 0 || label !== '') rows.push({ label, value: valueParts.join(' · ') })
    label = ''
    valueParts = []
  }
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (EVIDENCE_LABEL_RE.test(t) && !/\d/.test(t)) {
      flush()
      label = t
    } else {
      valueParts.push(t)
    }
  }
  flush()
  return rows
}

export interface LabStat {
  value: string
  label: string
}

export interface LabNoteData {
  stats: LabStat[]
  notes: string[]
}

const LEADING_NUM_RE = /^[\d%.––\-]+$/

export function parseLabNote(lines: string[]): LabNoteData {
  const stats: LabStat[] = []
  const notes: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    const parts = t.split(/\s+/)
    const first = parts[0] ?? ''
    if (LEADING_NUM_RE.test(first)) {
      stats.push({ value: first, label: parts.slice(1).join(' ') })
    } else {
      notes.push(t)
    }
  }
  return { stats, notes }
}
