import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { ApiError, handler, requireAdmin } from "@/lib/api"
import { docxToHtml, looksLikeDocx } from "@/lib/importers/docx"
import { putFile } from "@/lib/storage"

const MAX_UPLOAD = 5_000_000

/**
 * POST /api/templates/import (admin, multipart "file") — stores the uploaded .docx as an
 * original file and returns its HTML so the admin UI can convert/preview it before saving.
 */
export const POST = handler(async (req) => {
  requireAdmin(req)
  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) throw new ApiError(400, "VALIDATION_ERROR", "Thiếu file .docx")
  if (file.size > MAX_UPLOAD) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "File vượt quá 5MB")
  if (!/\.docx$/i.test(file.name)) throw new ApiError(400, "VALIDATION_ERROR", "Chỉ hỗ trợ file .docx")
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!looksLikeDocx(buffer)) throw new ApiError(400, "VALIDATION_ERROR", "File không phải định dạng .docx hợp lệ")
  const { html, warnings } = await docxToHtml(buffer).catch(() => {
    throw new ApiError(400, "VALIDATION_ERROR", "Không đọc được nội dung file .docx")
  })
  const sourceFile = await putFile(`uploads/${randomUUID()}.docx`, buffer)
  return NextResponse.json({ html, warnings, sourceFile, fileName: file.name })
})
