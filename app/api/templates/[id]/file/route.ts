import { handler, notFound, parseId } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { getTemplateOriginalFile } from "@/lib/template-files"
import { DOCX_MIME } from "@/lib/exporters/docx"
import { contentDisposition } from "@/lib/text"

/**
 * GET /api/templates/:id/file — download the original template file.
 * Uploaded templates return the stored original byte-for-byte; other templates return a file
 * rendered once from their content and then stored (see lib/template-files.ts).
 */
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const id = parseId((await params).id)
  const template = templatesRepo.get(id)
  if (!template || !template.isPublished) notFound("Không tìm thấy mẫu")
  const body = await getTemplateOriginalFile(template)
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": contentDisposition(`Mau - ${template.name}`, "docx"),
      "Cache-Control": "no-store",
    },
  })
})
