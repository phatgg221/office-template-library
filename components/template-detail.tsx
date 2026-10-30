"use client"

import { useMemo } from "react"
import { CalendarDays, Download, Hash, Layers, Tag } from "lucide-react"
import { DocumentPage } from "@/components/documents/document-page"
import { UseTemplateButton } from "@/components/documents/use-template-button"
import { buttonVariants } from "@/components/ui/button"
import { tiptapToHtml } from "@/lib/content/html"
import { formatDate } from "@/lib/client-api"
import type { Template } from "@/lib/repositories/types"
import { cn } from "@/lib/utils"

/** Template preview body shared by the preview dialog and the /templates/documents/[id] page. */
export function TemplateDetail({ template, headerSlot }: { template: Template; headerSlot?: React.ReactNode }) {
  const html = useMemo(() => tiptapToHtml(template.content), [template.content])
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-[640px]">
          <DocumentPage html={html} mode="full" className="rounded-sm shadow-md" />
        </div>
      </div>
      <aside className="flex w-full shrink-0 flex-col border-t border-slate-100 p-6 md:w-[340px] md:border-l md:border-t-0">
        {headerSlot}
        <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{template.category}</span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{template.name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{template.description}</p>
        <div className="mt-6 flex flex-col gap-3">
          <UseTemplateButton templateId={template.id} className="w-full" />
          <a
            href={template.fileUrl}
            download
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <Download /> Tải file gốc (.docx)
          </a>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          “Sử dụng mẫu” tạo một bản sao độc lập để chỉnh sửa. File mẫu gốc không bị thay đổi.
        </p>
        <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Layers className="size-4" />
            <dt className="sr-only">Phiên bản</dt>
            <dd>Phiên bản {template.version}</dd>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="size-4" />
            <dt className="sr-only">Cập nhật</dt>
            <dd>Cập nhật {formatDate(template.updatedAt)}</dd>
          </div>
          {template.tags.length > 0 && (
            <div className="flex items-start gap-2 text-slate-500">
              <Tag className="mt-0.5 size-4" />
              <dt className="sr-only">Thẻ</dt>
              <dd className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">
                    #{tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <Hash className="size-4" />
            <dt className="sr-only">Mã</dt>
            <dd className="truncate font-mono text-xs">{template.slug}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
