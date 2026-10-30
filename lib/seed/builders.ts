import type { ContentNode, DocContent, Mark } from "../content/types"

/** Tiny helpers for writing TipTap JSON by hand (seed data + tests). */
type Inline = string | ContentNode
type Align = "left" | "center" | "right" | "justify"

export const text = (value: string, ...marks: Mark["type"][]): ContentNode =>
  marks.length ? { type: "text", text: value, marks: marks.map((type) => ({ type })) } : { type: "text", text: value }
export const b = (value: string) => text(value, "bold")
export const i = (value: string) => text(value, "italic")
export const bi = (value: string) => text(value, "bold", "italic")
export const u = (value: string) => text(value, "underline")
export const br = (): ContentNode => ({ type: "hardBreak" })

const inline = (items: Inline[]): ContentNode[] =>
  items.filter((x) => x !== "").map((x) => (typeof x === "string" ? text(x) : x))

export const p = (items: Inline | Inline[] = [], align?: Align): ContentNode => {
  const content = inline(Array.isArray(items) ? items : [items])
  return {
    type: "paragraph",
    ...(align ? { attrs: { textAlign: align } } : {}),
    ...(content.length ? { content } : {}),
  }
}

export const h = (level: 1 | 2 | 3, items: Inline | Inline[], align?: Align): ContentNode => ({
  type: "heading",
  attrs: { level, ...(align ? { textAlign: align } : {}) },
  content: inline(Array.isArray(items) ? items : [items]),
})

const item = (x: Inline | Inline[] | ContentNode[]): ContentNode => ({
  type: "listItem",
  content: [p(x as Inline[])],
})
export const ul = (...items: (Inline | Inline[])[]): ContentNode => ({ type: "bulletList", content: items.map(item) })
export const ol = (...items: (Inline | Inline[])[]): ContentNode => ({ type: "orderedList", content: items.map(item) })
export const hr = (): ContentNode => ({ type: "horizontalRule" })

export const table = (header: string[] | null, rows: (Inline | Inline[])[][]): ContentNode => ({
  type: "table",
  content: [
    ...(header
      ? [{ type: "tableRow" as const, content: header.map((c) => ({ type: "tableHeader" as const, content: [p(b(c))] })) }]
      : []),
    ...rows.map((row) => ({
      type: "tableRow" as const,
      content: row.map((c) => ({ type: "tableCell" as const, content: [p(c as Inline[])] })),
    })),
  ],
})

export const doc = (...content: ContentNode[]): DocContent => ({ type: "doc", content })
