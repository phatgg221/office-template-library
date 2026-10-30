import type { DocContent, TemplateKind } from "../content/types"

export type Template = {
  id: string
  slug: string
  kind: TemplateKind
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string | null
  fileUrl: string
  /** "uploaded": the admin's .docx kept byte-for-byte; "generated": rendered once from content. */
  originalFile: "uploaded" | "generated" | null
  content: DocContent
  version: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

/** Lightweight list item: no full content, only a pre-rendered preview for thumbnails. */
export type TemplateSummary = Omit<Template, "content"> & { previewHtml: string }

export type DocumentRecord = {
  id: string
  kind: TemplateKind
  templateId: string | null
  templateVersion: number
  templateName: string | null
  title: string
  content: DocContent
  createdAt: string
  updatedAt: string
}

export type DocumentSummary = Omit<DocumentRecord, "content">

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number }
