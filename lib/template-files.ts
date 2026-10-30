import "server-only"
import { tiptapToDocx } from "./exporters/docx"
import { templatesRepo } from "./repositories/templates"
import type { Template } from "./repositories/types"
import { getFile, putFile } from "./storage"

/**
 * Returns the template's original .docx. Uploaded templates keep the admin's file byte-for-byte.
 * Seed/JSON templates get their original rendered once from content and stored, so every later
 * download returns identical bytes. Nothing here ever modifies an existing original.
 */
export async function getTemplateOriginalFile(template: Template): Promise<Buffer> {
  const key = templatesRepo.filePath(template.id)
  const stored = key ? await getFile(key) : null
  if (stored) return stored
  const generated = await tiptapToDocx(template.content, { title: template.name, description: template.description })
  const newKey = `templates/${template.id}/v${template.version}.docx`
  await putFile(newKey, generated)
  const finalKey = templatesRepo.attachFileIfMissing(template.id, newKey)
  return finalKey === newKey ? generated : ((await getFile(finalKey)) ?? generated)
}
