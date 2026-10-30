import { describe, expect, it } from "vitest"
import JSZip from "jszip"
import mammoth from "mammoth"
import { tiptapToDocx } from "@/lib/exporters/docx"
import { docxToHtml, looksLikeDocx } from "@/lib/importers/docx"
import { documentTemplates } from "@/lib/seed/document-templates"
import { b, doc, h, i, ol, p, table, u, ul } from "@/lib/seed/builders"

const sample = doc(
  h(1, "BÁO CÁO TỔNG KẾT", "center"),
  p([b("Đậm"), " ", i("nghiêng"), " ", u("gạch chân")], "justify"),
  ul("Mục một", "Mục hai"),
  ol("Bước một", "Bước hai"),
  table(["Cột A", "Cột B"], [["1", "2"]]),
)

async function documentXml(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  return zip.file("word/document.xml")!.async("string")
}

describe("tiptapToDocx", () => {
  it("produces a valid .docx (zip) with Vietnamese text and basic formatting", async () => {
    const buffer = await tiptapToDocx(sample, { title: "Báo cáo" })
    expect(looksLikeDocx(buffer)).toBe(true)
    const xml = await documentXml(buffer)
    expect(xml).toContain("BÁO CÁO TỔNG KẾT")
    expect(xml).toContain('w:val="Heading1"') // heading style
    expect(xml).toContain('<w:jc w:val="center"/>') // alignment
    expect(xml).toContain('<w:jc w:val="both"/>') // justify
    expect(xml).toMatch(/<w:b\/>|<w:b w:val="true"\/>/) // bold
    expect(xml).toMatch(/<w:i\/>|<w:i w:val="true"\/>/) // italic
    expect(xml).toContain("<w:u ") // underline
    expect(xml).toContain("<w:tbl>") // table
    expect(xml).toContain("<w:tblHeader") // header row
    expect(xml).toContain("<w:numPr>") // lists
  })

  it("keeps structure when the exported file is read back (round trip)", async () => {
    const buffer = await tiptapToDocx(sample, { title: "Báo cáo" })
    const { value } = await mammoth.convertToHtml({ buffer }, { styleMap: ["u => u"] })
    expect(value).toContain("<h1>BÁO CÁO TỔNG KẾT</h1>")
    expect(value).toContain("<strong>Đậm</strong>")
    expect(value).toContain("<em>nghiêng</em>")
    expect(value).toContain("<u>gạch chân</u>")
    expect(value).toMatch(/<ul><li>Mục một<\/li><li>Mục hai<\/li><\/ul>/)
    expect(value).toMatch(/<ol><li>Bước một<\/li><li>Bước hai<\/li><\/ol>/)
    expect(value).toMatch(/<table>.*<th>.*Cột A.*<\/th>.*<td>.*1.*<\/td>/s)
  })

  it("exports every seed template", async () => {
    for (const t of documentTemplates) {
      const buffer = await tiptapToDocx(t.content, { title: t.name })
      expect(looksLikeDocx(buffer)).toBe(true)
      expect(await documentXml(buffer)).toContain("<w:tbl>")
    }
  })
})

describe("docx import", () => {
  it("converts a .docx into semantic HTML", async () => {
    const buffer = await tiptapToDocx(sample, { title: "x" })
    const { html } = await docxToHtml(buffer)
    expect(html).toContain("<h1>")
    expect(html).toContain("<table>")
    expect(html).toContain("<u>gạch chân</u>")
  })

  it("rejects files that are not zip containers", () => {
    expect(looksLikeDocx(Buffer.from("not a docx"))).toBe(false)
  })
})
