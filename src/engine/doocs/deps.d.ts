/** 最小类型声明：front-matter / juice（npm 依赖，非 vendored）。 */

declare module 'front-matter' {
  interface FrontMatterResult<T> {
    attributes: T
    body: string
    bodyBegin: number
  }
  function frontMatter<T = Record<string, unknown>>(str: string): FrontMatterResult<T>
  export default frontMatter
}

declare module 'juice' {
  interface JuiceOptions {
    applyStyleTags?: boolean
    removeStyleTags?: boolean
    preserveMediaQueries?: boolean
    preserveImportant?: boolean
    inlinePseudoElements?: boolean
    resolveCSSVariables?: boolean
    xmlMode?: boolean
  }
  function juice(html: string, options?: JuiceOptions): string
  export default juice
}
