export interface WordCount {
  cjk: number
  latin: number
  total: number
}

const CJK_RE = /[㐀-䶿一-鿿豈-﫿]/g
const LATIN_RE = /[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g

/** 中英混排字数：CJK 按字计，英文/数字按词计。 */
export function countWords(text: string): WordCount {
  const cjk = (text.match(CJK_RE) || []).length
  const stripped = text.replace(CJK_RE, ' ')
  const latin = (stripped.match(LATIN_RE) || []).length
  return { cjk, latin, total: cjk + latin }
}
