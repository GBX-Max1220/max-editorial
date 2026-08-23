/**
 * V0.3 渲染层标题渲染器（H2 编号 D1 + Phase 2 H4 进入生产 + sec-rule 真实节点）。
 *
 * - 编号由渲染器自动生成（作者不手输）：H2 仅编号，`01/02/03…`。
 * - H3 不编号；intro（首个 H2 前）无 `00`；语义块不参与编号。
 * - 产物为**真实文本** `<span class="sec-num">01</span>`（非 CSS counter），
 *   微信编译依赖同一 HTML，天然得到显式文本序号。
 * - H2 短墨线为**真实节点** `<span class="sec-rule" aria-hidden="true"></span>`
 *   （Phase 2：不依赖伪元素承载装饰，浏览器与微信同一结构）。
 * - H4 进入生产（Owner 决策）：depth 不再钳到 3，`####` 真实产出 `<h4>`；
 *   H5/H6 为更低层级段内标签。H1 仍产出 `<h1>`（body 内一级标题，语义为封面外的章节）。
 * - 编号注入在渲染层（HTML 字符串），不污染 parser AST / lint / relations。
 *
 * 用法：每个文档渲染调用一次工厂，闭包计数器按文档重置。
 */

export interface V03HeadingRenderer {
  /** 渲染一个标题；depth 2 时注入序号，其余原样。depth 1–6 原样产出。 */
  renderHeading(depth: number, innerHtml: string): string
}

export function createV03HeadingRenderer(): V03HeadingRenderer {
  let h2 = 0
  return {
    renderHeading(depth: number, innerHtml: string): string {
      const tag = `h${Math.min(Math.max(depth, 1), 6)}`
      if (depth === 2) {
        h2 += 1
        const num = String(h2).padStart(2, '0')
        return `<h2><span class="sec-num">${num}</span><span class="sec-title">${innerHtml}</span><span class="sec-rule" aria-hidden="true"></span></h2>`
      }
      return `<${tag}>${innerHtml}</${tag}>`
    },
  }
}
