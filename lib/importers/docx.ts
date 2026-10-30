import "server-only"
import mammoth from "mammoth"

/**
 * .docx -> semantic HTML with mammoth. The HTML is then parsed into TipTap JSON with the
 * editor's own schema (client side), which drops anything the schema doesn't know
 * (scripts, styles, unknown tags) — that schema pass is the sanitizer.
 */
export async function docxToHtml(buffer: Buffer): Promise<{ html: string; warnings: string[] }> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh", "u => u"],
      // Images are not part of the supported content model yet.
      convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
    },
  )
  return {
    html: result.value.replace(/<img[^>]*>/g, ""),
    warnings: result.messages.filter((m) => m.type === "warning").map((m) => m.message),
  }
}

/** Office files are ZIP containers: check the magic bytes instead of trusting the extension. */
export function looksLikeDocx(buffer: Buffer) {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
}
