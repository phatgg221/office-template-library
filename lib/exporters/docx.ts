import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IRunOptions,
  type ParagraphChild,
} from "docx"
import type { ContentNode, Mark } from "../content/types"
import { safeHref } from "../content/html"

/**
 * TipTap JSON -> real .docx (Office Open XML) using the `docx` package.
 * Supported: headings 1-6, paragraphs with alignment, bold/italic/underline/strike/code,
 * links, hard breaks, bullet + numbered lists (nested), blockquotes, horizontal rules,
 * tables (header cells, colspan/rowspan).
 */

const FONT = "Times New Roman"
const BODY_SIZE = 26 // half-points => 13pt, the usual size for Vietnamese administrative documents
const ORDERED_REF = "ordered-list"

const HEADINGS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const

const ALIGN: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

type ListContext = { kind: "bullet" | "ordered"; level: number; instance: number }
type Ctx = {
  list?: ListContext
  quote?: boolean
  bold?: boolean
  /** Default alignment inside borderless layout tables (signature blocks, letterheads). */
  defaultAlign?: "center"
  nextListInstance: () => number
}

function runOptions(text: string | undefined, marks: Mark[] = [], extra: Partial<IRunOptions> = {}): IRunOptions {
  const has = (t: Mark["type"]) => marks.some((m) => m.type === t)
  return {
    text,
    bold: has("bold") || undefined,
    italics: has("italic") || undefined,
    underline: has("underline") ? {} : undefined,
    strike: has("strike") || undefined,
    font: has("code") ? "Courier New" : undefined,
    ...extra,
  }
}

function inlineRuns(nodes: ContentNode[] = [], style: { quote?: boolean; bold?: boolean } = {}): ParagraphChild[] {
  const runs: ParagraphChild[] = []
  for (const node of nodes) {
    if (node.type === "hardBreak") {
      runs.push(new TextRun({ break: 1 }))
      continue
    }
    if (node.type !== "text") continue
    const marks = node.marks ?? []
    const link = marks.find((m) => m.type === "link")
    const href = link ? safeHref(link.attrs?.href) : null
    const opts = runOptions(node.text, marks, {
      ...(style.quote ? { italics: true } : {}),
      ...(style.bold ? { bold: true } : {}),
    })
    if (href && /^(https?:|mailto:)/i.test(href)) {
      runs.push(new ExternalHyperlink({ link: href, children: [new TextRun({ ...opts, style: "Hyperlink" })] }))
    } else {
      runs.push(new TextRun(opts))
    }
  }
  return runs
}

function alignment(node: ContentNode) {
  const value = node.attrs?.textAlign
  return typeof value === "string" ? ALIGN[value] : undefined
}

function listProps(ctx: Ctx) {
  if (!ctx.list) return {}
  return ctx.list.kind === "bullet"
    ? { bullet: { level: ctx.list.level } }
    : { numbering: { reference: ORDERED_REF, level: ctx.list.level, instance: ctx.list.instance } }
}

function blocks(nodes: ContentNode[] = [], ctx: Ctx): (Paragraph | Table)[] {
  return nodes.flatMap((node) => block(node, ctx))
}

function block(node: ContentNode, ctx: Ctx): (Paragraph | Table)[] {
  switch (node.type) {
    case "paragraph":
      return [
        new Paragraph({
          children: inlineRuns(node.content, ctx),
          alignment: alignment(node) ?? (ctx.defaultAlign ? AlignmentType.CENTER : undefined),
          indent: ctx.quote ? { left: 567 } : undefined,
          ...listProps(ctx),
        }),
      ]
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6)
      return [new Paragraph({ heading: HEADINGS[level - 1], children: inlineRuns(node.content), alignment: alignment(node) })]
    }
    case "bulletList":
    case "orderedList": {
      const level = ctx.list ? Math.min(ctx.list.level + 1, 8) : 0
      const kind = node.type === "bulletList" ? "bullet" : "ordered"
      const instance = kind === "ordered" ? ctx.nextListInstance() : 0
      return (node.content ?? []).flatMap((item) => blocks(item.content, { ...ctx, list: { kind, level, instance } }))
    }
    case "listItem":
      return blocks(node.content, ctx)
    case "blockquote":
      return blocks(node.content, { ...ctx, quote: true })
    case "horizontalRule":
      return [
        new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
        }),
      ]
    case "table":
      return [tableBlock(node, ctx)]
    default:
      return []
  }
}

/**
 * Tables with a header row are data tables (bordered). Tables without one are layout tables
 * (letterhead, signature blocks): borderless and centered, matching the in-app rendering.
 */
export function isLayoutTable(node: ContentNode) {
  return !(node.content ?? []).some((row) => (row.content ?? []).some((cell) => cell.type === "tableHeader"))
}

function tableBlock(node: ContentNode, ctx: Ctx): Table {
  const layout = isLayoutTable(node)
  const border = layout
    ? { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
    : { style: BorderStyle.SINGLE, size: 4, color: "444444" }
  const rows = (node.content ?? []).map(
    (row) =>
      new TableRow({
        // Rows of header cells repeat on each page and re-import as <th>.
        tableHeader: (row.content ?? []).every((cell) => cell.type === "tableHeader") || undefined,
        children: (row.content ?? []).map((cell) => {
          const isHeader = cell.type === "tableHeader"
          // Header cells are bold by convention, like the HTML <th> rendering.
          const content = blocks(cell.content, { ...ctx, list: undefined, bold: isHeader, defaultAlign: layout ? "center" : undefined })
          return new TableCell({
            children: content.length ? content : [new Paragraph({ children: [] })],
            columnSpan: Number(cell.attrs?.colspan) > 1 ? Number(cell.attrs?.colspan) : undefined,
            rowSpan: Number(cell.attrs?.rowspan) > 1 ? Number(cell.attrs?.rowspan) : undefined,
            shading: isHeader ? { type: ShadingType.CLEAR, color: "auto", fill: "EEF2F7" } : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders: { top: border, bottom: border, left: border, right: border },
          })
        }),
      }),
  )
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: layout
      ? { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border }
      : undefined,
  })
}

function headingStyle(id: string, name: string, size: number) {
  return {
    id,
    name,
    basedOn: "Normal",
    next: "Normal",
    quickFormat: true,
    run: { font: FONT, size, bold: true, color: "000000" },
    paragraph: { spacing: { before: 240, after: 120 } },
  }
}

export function buildDocx(doc: ContentNode, meta: { title: string; description?: string }): Document {
  let instance = 0
  const ctx: Ctx = { nextListInstance: () => ++instance }
  return new Document({
    title: meta.title,
    description: meta.description,
    creator: "Office Template Library",
    styles: {
      default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { after: 80, line: 312 } } } },
      paragraphStyles: [
        headingStyle("Heading1", "Heading 1", 32),
        headingStyle("Heading2", "Heading 2", 28),
        headingStyle("Heading3", "Heading 3", 26),
        headingStyle("Heading4", "Heading 4", 26),
        headingStyle("Heading5", "Heading 5", 26),
        headingStyle("Heading6", "Heading 6", 26),
      ],
    },
    numbering: {
      config: [
        {
          reference: ORDERED_REF,
          levels: Array.from({ length: 9 }, (_, level) => ({
            level,
            format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level % 3],
            text: `%${level + 1}.`,
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [
      {
        // A4 with standard Vietnamese administrative margins (top/bottom 2cm, left 3cm, right 2cm).
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 },
          },
        },
        children: blocks(doc.content, ctx),
      },
    ],
  })
}

export async function tiptapToDocx(doc: ContentNode, meta: { title: string; description?: string }): Promise<Buffer> {
  return Packer.toBuffer(buildDocx(doc, meta))
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
