import { describe, expect, it } from "vitest"
import { cloneContent } from "@/lib/content/clone"
import { tiptapToHtml } from "@/lib/content/html"
import { documentTemplates } from "@/lib/seed/document-templates"
import { docContentSchema } from "@/lib/schemas"
import { normalizeSearch, contentDisposition } from "@/lib/text"
import type { ContentNode } from "@/lib/content/types"

describe("cloneContent", () => {
  it("returns a deep copy: mutating the copy never touches the template", () => {
    const source = documentTemplates[0].content
    const snapshot = JSON.stringify(source)
    const copy = cloneContent(source)
    expect(copy).toEqual(source)
    expect(copy).not.toBe(source)
    copy.content[0].content![0].type = "paragraph"
    copy.content.push({ type: "paragraph" })
    expect(JSON.stringify(source)).toBe(snapshot)
  })
})

describe("seed templates", () => {
  it("has at least 5 templates and all of them validate against the content schema", () => {
    expect(documentTemplates.length).toBeGreaterThanOrEqual(5)
    for (const t of documentTemplates) expect(docContentSchema.safeParse(t.content).success).toBe(true)
  })
})

describe("tiptapToHtml", () => {
  it("renders formatting", () => {
    const html = tiptapToHtml({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2, textAlign: "center" }, content: [{ type: "text", text: "Tiêu đề" }] },
        { type: "paragraph", content: [{ type: "text", text: "đậm", marks: [{ type: "bold" }, { type: "underline" }] }] },
      ],
    })
    expect(html).toBe('<h2 style="text-align:center">Tiêu đề</h2><p><u><strong>đậm</strong></u></p>')
  })

  it("escapes text and drops unsafe links and attributes (XSS)", () => {
    const evil: ContentNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "center;background:url(x)", onclick: "alert(1)" },
          content: [
            { type: "text", text: "<script>alert(1)</script>" },
            { type: "text", text: "link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
          ],
        },
      ],
    }
    const html = tiptapToHtml(evil)
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("onclick")
    expect(html).not.toContain("background")
    expect(html).toContain("&lt;script&gt;")
  })
})

describe("text utils", () => {
  it("normalizes Vietnamese for accent-insensitive search", () => {
    expect(normalizeSearch("  Hợp ĐỒNG   lao động ")).toBe("hop dong lao dong")
  })
  it("builds a safe Content-Disposition header", () => {
    const header = contentDisposition('Biên bản "họp"/../x', "docx")
    expect(header).toContain('filename="bien-ban-hop-x.docx"')
    expect(header).not.toContain("/")
  })
})
