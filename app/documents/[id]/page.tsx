import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DocumentEditor } from "@/components/editor/document-editor"
import { documentsRepo } from "@/lib/repositories/documents"
import { uuidSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

function load(id: string) {
  return uuidSchema.safeParse(id).success ? documentsRepo.get(id) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: load((await params).id)?.title ?? "Không tìm thấy tài liệu" }
}

export default async function DocumentPage({ params }: Props) {
  const document = load((await params).id)
  if (!document || document.kind !== "document") notFound()
  return <DocumentEditor document={document} />
}
