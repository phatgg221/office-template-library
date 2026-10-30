import Link from "next/link"
import { ArrowRight, FileText, Presentation } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { templatesRepo } from "@/lib/repositories/templates"
import { documentsRepo } from "@/lib/repositories/documents"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const docTemplates = templatesRepo.list({ kind: "document", sort: "newest", page: 1, limit: 1 }).total
  const recent = documentsRepo.list().slice(0, 5)
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-12 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bắt đầu nhanh với thư viện mẫu</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Chọn mẫu, xem trước, tạo bản sao để chỉnh sửa và tải xuống. Mẫu gốc luôn được giữ nguyên.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/templates/documents"
            className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-7 transition hover:border-blue-300 hover:shadow-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="size-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Thư viện mẫu văn bản</h2>
            <p className="mt-2 text-sm text-slate-500">{docTemplates} mẫu DOCX: công văn, hợp đồng, biên bản, báo cáo...</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
              Mở thư viện <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-200 p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Presentation className="size-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-700">Thư viện mẫu trình chiếu</h2>
            <p className="mt-2 text-sm text-slate-500">Mẫu PPTX — đang phát triển (Sản phẩm 2).</p>
          </div>
        </div>
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tài liệu gần đây</h2>
            <Link href="/my-files" className="text-sm font-medium text-blue-700 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Chưa có tài liệu nào. Hãy chọn một mẫu để bắt đầu.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {recent.map((d) => (
                <li key={d.id}>
                  <Link href={`/documents/${d.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50">
                    <FileText className="size-4 text-blue-600" />
                    <span className="flex-1 truncate font-medium">{d.title}</span>
                    <span className="hidden text-xs text-slate-400 sm:block">{d.templateName ?? "Mẫu đã xoá"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
