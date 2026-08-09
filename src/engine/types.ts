/** Engine 契约：UI 只依赖这个接口，不关心哪个引擎实现它。 */

export type EngineName = 'legacy' | 'doocs'

export type PreviewMode = 'normal' | 'editorial'
export type Viewport = 'desktop' | 'wechat' | 'mobile'

export interface SemanticBlockInfo {
  type: string
  props: Record<string, string>
  lines: string[]
  invalid: boolean
  unknown: boolean
}

export interface EngineStructure {
  images: string[]
  tableCols: number[]
  semanticBlocks: SemanticBlockInfo[]
}

export interface WordCount {
  cjk: number
  latin: number
  total: number
}

export interface RenderResult {
  /** 文章正文 HTML（不含 masthead / footer，那些由 UI 渲染）。 */
  html: string
  frontmatter: Record<string, unknown>
  structure: EngineStructure
  wordCount: WordCount
  readingTime: { words: number; minutes: number }
  blockCount: number
  diagnostics: string[]
}

export interface CopyResult {
  ok: boolean
  html: string
  plainText: string
}

export interface RenderOptions {
  mode?: PreviewMode
}

export interface CopyOptions {
  mode?: PreviewMode
  /** 预览中的 `.article.paper` 元素；Doocs 引擎优先克隆它。 */
  previewEl?: HTMLElement | null
}

export interface EditorialEngine {
  name: EngineName
  render(markdown: string, options?: RenderOptions): RenderResult
  copyToWechat(markdown: string, options?: CopyOptions): Promise<CopyResult>
}
