import { z } from "zod"
import type { ContentNode } from "./content/types"

const NODE_TYPES = [
  "doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "blockquote",
  "horizontalRule", "hardBreak", "table", "tableRow", "tableHeader", "tableCell",
] as const
const MARK_TYPES = ["bold", "italic", "underline", "strike", "code", "link"] as const

const markSchema = z.object({
  type: z.enum(MARK_TYPES),
  attrs: z.record(z.string(), z.unknown()).optional(),
})

// Unknown node/mark types are rejected so stored content always matches what the renderers support.
export const contentNodeSchema: z.ZodType<ContentNode> = z.lazy(() =>
  z.object({
    type: z.enum(NODE_TYPES),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(contentNodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().max(100_000).optional(),
  }),
)

export const docContentSchema = z
  .object({ type: z.literal("doc"), content: z.array(contentNodeSchema) })
  .passthrough()

export const kindSchema = z.enum(["document", "presentation"])

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang")

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20)

export const templateCreateSchema = z.object({
  kind: kindSchema.default("document"),
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  category: z.string().trim().min(2).max(60),
  tags: tagsSchema.default([]),
  thumbnailUrl: z.string().trim().url().max(500).nullable().optional(),
  content: docContentSchema,
  isPublished: z.boolean().default(true),
  /** Storage key returned by POST /api/templates/import, kept as the template's original file. */
  sourceFile: z
    .string()
    .regex(/^uploads\/[0-9a-f-]{36}\.docx$/)
    .optional(),
})
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>

export const templateUpdateSchema = templateCreateSchema.omit({ kind: true, sourceFile: true }).partial()
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>

export const templateListQuerySchema = z.object({
  kind: kindSchema.optional(),
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  sort: z.enum(["newest", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>

export const documentCreateSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
})

export const documentPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: docContentSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Cần ít nhất title hoặc content")

export const uuidSchema = z.string().uuid()
