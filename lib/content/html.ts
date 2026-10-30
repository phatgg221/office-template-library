import type { ContentNode, Mark } from "./types"

/**
 * Pure TipTap JSON -> HTML serializer. Used for thumbnails, previews and the HTML export,
 * so all read-only views share one renderer. Every text value is escaped and only a
 * whitelist of attributes is emitted, which makes the output safe to inject.
 */
const ALIGNMENTS = new Set(["left", "center", "right", "justify"])

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null
  const trimmed = href.trim()
  return /^(https?:|mailto:|tel:|#|\/)/i.test(trimmed) ? trimmed : null
}

function alignStyle(node: ContentNode): string {
  const align = node.attrs?.textAlign
  return typeof align === "string" && ALIGNMENTS.has(align) && align !== "left"
    ? ` style="text-align:${align}"`
    : ""
}

function intAttr(value: unknown, min: number, max: number): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

function wrapMark(html: string, mark: Mark): string {
  switch (mark.type) {
    case "bold":
      return `<strong>${html}</strong>`
    case "italic":
      return `<em>${html}</em>`
    case "underline":
      return `<u>${html}</u>`
    case "strike":
      return `<s>${html}</s>`
    case "code":
      return `<code>${html}</code>`
    case "link": {
      const href = safeHref(mark.attrs?.href)
      return href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${html}</a>` : html
    }
    default:
      return html
  }
}

function cellAttrs(node: ContentNode): string {
  const colspan = intAttr(node.attrs?.colspan, 2, 50)
  const rowspan = intAttr(node.attrs?.rowspan, 2, 50)
  return `${colspan ? ` colspan="${colspan}"` : ""}${rowspan ? ` rowspan="${rowspan}"` : ""}`
}

function children(node: ContentNode): string {
  return (node.content ?? []).map(renderNode).join("")
}

export function renderNode(node: ContentNode): string {
  switch (node.type) {
    case "doc":
      return children(node)
    case "text":
      return (node.marks ?? []).reduce(wrapMark, escapeHtml(node.text ?? ""))
    case "paragraph":
      return `<p${alignStyle(node)}>${children(node) || "<br>"}</p>`
    case "heading": {
      const level = intAttr(node.attrs?.level, 1, 6) ?? 1
      return `<h${level}${alignStyle(node)}>${children(node)}</h${level}>`
    }
    case "bulletList":
      return `<ul>${children(node)}</ul>`
    case "orderedList": {
      const start = intAttr(node.attrs?.start, 2, 100000)
      return `<ol${start ? ` start="${start}"` : ""}>${children(node)}</ol>`
    }
    case "listItem":
      return `<li>${children(node)}</li>`
    case "blockquote":
      return `<blockquote>${children(node)}</blockquote>`
    case "horizontalRule":
      return "<hr>"
    case "hardBreak":
      return "<br>"
    case "table":
      return `<table><tbody>${children(node)}</tbody></table>`
    case "tableRow":
      return `<tr>${children(node)}</tr>`
    case "tableHeader":
      return `<th${cellAttrs(node)}>${children(node)}</th>`
    case "tableCell":
      return `<td${cellAttrs(node)}>${children(node)}</td>`
    default:
      return ""
  }
}

export function tiptapToHtml(doc: ContentNode, options: { maxBlocks?: number } = {}): string {
  if (options.maxBlocks !== undefined && doc.content) {
    return renderNode({ ...doc, content: doc.content.slice(0, options.maxBlocks) })
  }
  return renderNode(doc)
}

/** Shared stylesheet so the exported HTML looks like the in-app preview. */
export const DOCUMENT_CSS = `
body{margin:0;background:#f1f5f9;font-family:"Times New Roman",Times,serif;color:#111827}
.page{max-width:794px;margin:32px auto;background:#fff;padding:72px 76px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
h1{font-size:20pt;margin:0 0 12px}h2{font-size:15pt;margin:18px 0 8px}h3{font-size:13pt;margin:14px 0 6px}
p{font-size:13pt;line-height:1.5;margin:0 0 6px}li p{margin:0}
table{border-collapse:collapse;width:100%;margin:8px 0 12px}td,th{border:1px solid #444;padding:4px 8px;vertical-align:top}
th{background:#eef2f7;font-weight:bold;text-align:left}td p,th p{margin:0}
table:not(:has(th)) td{border-color:transparent;text-align:center}
blockquote{border-left:3px solid #cbd5e1;margin:8px 0;padding-left:12px;color:#475569}
`

export function tiptapToHtmlDocument(doc: ContentNode, title: string): string {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>${DOCUMENT_CSS}</style></head>
<body><main class="page">${tiptapToHtml(doc)}</main></body></html>`
}

export function extractPlainText(node: ContentNode, limit = 5000): string {
  const parts: string[] = []
  const walk = (n: ContentNode) => {
    if (parts.join(" ").length > limit) return
    if (n.text) parts.push(n.text)
    n.content?.forEach(walk)
  }
  walk(node)
  return parts.join(" ").slice(0, limit)
}
