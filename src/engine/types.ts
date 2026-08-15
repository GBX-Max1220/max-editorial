/** Engine 契约：UI 只依赖这个接口，不关心哪个引擎实现它。 */

import type { EditorialDiagnostic } from './governance'

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
  /** V0.2 认识论诊断（作者时 lint）。doocs 引擎填充；legacy 引擎不提供（dev A/B 路径）。 */
  epistemicDiagnostics?: EditorialDiagnostic[]
}

export interface CopyResult {
  ok: boolean
  html: string
  plainText: string
  /**
   * 实际写入剪贴板的方式：`rich` = text/html + text/plain 双 MIME；`plain` = 富文本不可用/失败后的纯文本降级。
   * 缺失视为 `rich`（旧引擎向后兼容）。UI 用它与「样式已复制」区分「仅纯文本」。
   */
  mode?: 'rich' | 'plain'
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
