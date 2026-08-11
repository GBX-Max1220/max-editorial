/**
 * V0.3 渲染层 H2 编号（冻结决策 D1）。
 *
 * - 编号由渲染器自动生成（作者不手输）：H2 仅编号，`01/02/03…`。
 * - H3 不编号；intro（首个 H2 前）无 `00`；语义块不参与编号。
 * - 产物为**真实文本** `<span class="sec-num">01</span>`（非 CSS counter），
 *   微信编译依赖同一 HTML，天然得到显式文本序号。
 * - 编号注入在渲染层（HTML 字符串），不污染 parser AST / lint / relations。
 *
 * 用法：每个文档渲染调用一次工厂，闭包计数器按文档重置。
 */

export interface V03HeadingRenderer {
  /** 渲染一个标题；depth 2 时注入序号，其余原样。depth 钳到 1–3（与 legacy 一致）。 */
  renderHeading(depth: number, innerHtml: string): string
}

export function createV03HeadingRenderer(): V03HeadingRenderer {
  let h2 = 0
  return {
    renderHeading(depth: number, innerHtml: string): string {
      const tag = `h${Math.min(Math.max(depth, 1), 3)}`
      if (depth === 2) {
        h2 += 1
        const num = String(h2).padStart(2, '0')
        return `<h2><span class="sec-num">${num}</span><span class="sec-title">${innerHtml}</span></h2>`
      }
      return `<${tag}>${innerHtml}</${tag}>`
    },
  }
}
