import { z } from "zod"
import { handler, notFound, parseId } from "@/lib/api"
import { documentsRepo } from "@/lib/repositories/documents"
import { DOCX_MIME, tiptapToDocx } from "@/lib/exporters/docx"
import { tiptapToHtmlDocument } from "@/lib/content/html"
import { contentDisposition } from "@/lib/text"

const formatSchema = z.enum(["docx", "html"]).default("docx")

/** GET /api/documents/:id/export?format=docx|html */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const id = parseId((await params).id)
  const format = formatSchema.parse(new URL(req.url).searchParams.get("format") ?? undefined)
  const document = documentsRepo.get(id)
  if (!document) notFound("Không tìm thấy tài liệu")
  const headers = { "Content-Disposition": contentDisposition(document.title, format), "Cache-Control": "no-store" }
  if (format === "html") {
    return new Response(tiptapToHtmlDocument(document.content, document.title), {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    })
  }
  const buffer = await tiptapToDocx(document.content, { title: document.title })
  return new Response(new Uint8Array(buffer), { headers: { ...headers, "Content-Type": DOCX_MIME } })
})
