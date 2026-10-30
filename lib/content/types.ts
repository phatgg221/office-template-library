/**
 * Canonical editable content model for document templates (TipTap / ProseMirror JSON).
 * Templates and user documents both store this JSON; every renderer (thumbnail, preview,
 * editor, HTML export, DOCX export) reads the same structure.
 */
export type MarkType = "bold" | "italic" | "underline" | "strike" | "code" | "link"

export type Mark = {
  type: MarkType
  attrs?: Record<string, unknown>
}

export type NodeType =
  | "doc"
  | "paragraph"
  | "heading"
  | "text"
  | "bulletList"
  | "orderedList"
  | "listItem"
  | "blockquote"
  | "horizontalRule"
  | "hardBreak"
  | "table"
  | "tableRow"
  | "tableHeader"
  | "tableCell"

export type ContentNode = {
  type: NodeType
  attrs?: Record<string, unknown>
  content?: ContentNode[]
  marks?: Mark[]
  text?: string
}

export type DocContent = ContentNode & { type: "doc"; content: ContentNode[] }

export type TemplateKind = "document" | "presentation"
export const TEMPLATE_KINDS: TemplateKind[] = ["document", "presentation"]
