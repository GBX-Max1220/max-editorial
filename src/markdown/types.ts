export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; title?: string; children: InlineNode[] }
  | { type: 'image'; alt: string; src: string; title?: string }

export const SEMANTIC_TYPES = [
  'claim',
  'question',
  'ai-output',
  'judgment',
  'evidence',
  'counterpoint',
  'lab-note',
  'metric',
] as const

export interface SemanticBlock {
  kind: 'semantic'
  type: string
  props: Record<string, string>
  raw: string
  lines: string[]
  invalid: boolean
  unknown: boolean
}

export interface ListItem {
  inline: InlineNode[]
  blocks: Block[]
}

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; inline: InlineNode[]; raw: string }
  | { kind: 'paragraph'; inline: InlineNode[]; raw: string }
  | { kind: 'blockquote'; inline: InlineNode[]; raw: string }
  | { kind: 'list'; ordered: boolean; items: ListItem[] }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'hr' }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'image'; alt: string; src: string; title?: string }
  | SemanticBlock

export interface ParserDiagnostic {
  kind: 'invalid-semantic' | 'unclosed-fence' | 'bad-frontmatter'
  line: number
  message: string
}

export interface ParseResult {
  frontmatter: Record<string, unknown>
  blocks: Block[]
  diagnostics: ParserDiagnostic[]
}
