/**
 * 语义块内部数据的共享解析。
 * React 预览与剪贴板 HTML 生成共用，避免两套逻辑漂移。
 */

export interface EvidenceRow {
  label: string
  value: string
}

const EVIDENCE_LABEL_RE = /^[A-Z][A-Z\s·–\-]*$/

/** evidence 体：全大写行视为 label，其余行归入当前 label 的 value。 */
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

/** lab-note 体：以数字开头的行 → stat（value + label），其余行 → note。 */
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
