/** 从 V0.1 解析器 AST 提取引擎无关的结构信息（供兼容性检查与回归测试使用）。 */

import type { Block, InlineNode } from '../../markdown/types'
import type { EngineStructure, SemanticBlockInfo } from '../types'

function imageSrcs(blocks: Block[]): string[] {
  const out: string[] = []
  const walkInline = (nodes: InlineNode[]) => {
    for (const n of nodes) {
      if (n.type === 'image') out.push(n.src)
      else if (n.type === 'strong' || n.type === 'em' || n.type === 'link') walkInline(n.children)
    }
  }
  for (const b of blocks) {
    if (b.kind === 'image') out.push(b.src)
    else if (b.kind === 'paragraph' || b.kind === 'heading' || b.kind === 'blockquote') walkInline(b.inline)
    else if (b.kind === 'list') for (const it of b.items) walkInline(it.inline)
  }
  return out
}

export function structureFromBlocks(blocks: Block[]): EngineStructure {
  const images = imageSrcs(blocks)
  const tableCols: number[] = []
  const semanticBlocks: SemanticBlockInfo[] = []

  for (const b of blocks) {
    if (b.kind === 'table') tableCols.push(b.headers.length)
    else if (b.kind === 'semantic') {
      semanticBlocks.push({ type: b.type, props: b.props, lines: b.lines, invalid: b.invalid, unknown: b.unknown })
    }
  }

  return { images, tableCols, semanticBlocks }
}
