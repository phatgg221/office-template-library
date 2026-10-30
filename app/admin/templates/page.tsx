"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { generateJSON } from "@tiptap/core"
import { AlertTriangle, Eye, FileUp, KeyRound, Loader2, LogOut, Plus, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { DocumentPage } from "@/components/documents/document-page"
import { Button } from "@/components/ui/button"
import { ClientApiError, apiFetch, formatDate } from "@/lib/client-api"
import { tiptapToHtml } from "@/lib/content/html"
import { editorExtensions } from "@/lib/editor/extensions"
import { slugify } from "@/lib/text"
import type { DocContent } from "@/lib/content/types"
import type { Paginated, TemplateSummary } from "@/lib/repositories/types"

const TOKEN_KEY = "otl-admin-token"

export default function AdminTemplatesPage() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY))
    setReady(true)
  }, [])

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <p className="text-sm font-medium text-slate-500">Quản trị nội dung</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Quản lý mẫu văn bản</h1>
        {ready &&
          (token ? (
            <AdminPanel
              token={token}
              onLogout={() => {
                sessionStorage.removeItem(TOKEN_KEY)
                setToken(null)
              }}
            />
          ) : (
            <TokenForm
              onSubmit={(t) => {
                sessionStorage.setItem(TOKEN_KEY, t)
                setToken(t)
              }}
            />
          ))}
      </main>
    </>
  )
}

function TokenForm({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [value, setValue] = useState("")
  return (
    <form
      className="mt-8 max-w-md rounded-2xl border border-slate-200 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
    >
      <KeyRound className="size-6 text-blue-600" />
      <h2 className="mt-3 font-semibold">Nhập mã quản trị</h2>
      <p className="mt-1 text-sm text-slate-500">
        Giá trị biến môi trường <code className="rounded bg-slate-100 px-1">ADMIN_TOKEN</code> (môi trường dev mặc định:{" "}
        <code className="rounded bg-slate-100 px-1">dev-admin-token</code>).
      </p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Mã quản trị"
        className="mt-4 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit" size="lg" className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
        Tiếp tục
      </Button>
    </form>
  )
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: TemplateSummary[] }
  >({ status: "loading" })
  const [reload, setReload] = useState(0)
  const [creating, setCreating] = useState(false)
  const headers = useMemo(() => ({ "x-admin-token": token }), [token])

  useEffect(() => {
    setState({ status: "loading" })
    apiFetch<Paginated<TemplateSummary>>("/api/admin/templates?kind=document", { headers })
      .then((res) => setState({ status: "ready", items: res.items }))
      .catch((error: ClientApiError) => {
        if (error.status === 401) {
          toast.error("Mã quản trị không đúng")
          onLogout()
        } else setState({ status: "error", message: error.message })
      })
  }, [headers, reload, onLogout])

  async function togglePublished(t: TemplateSummary) {
    try {
      await apiFetch(`/api/templates/${t.id}`, { method: "PUT", headers, body: JSON.stringify({ isPublished: !t.isPublished }) })
      setState((s) =>
        s.status === "ready" ? { ...s, items: s.items.map((x) => (x.id === t.id ? { ...x, isPublished: !t.isPublished } : x)) } : s,
      )
      toast.success(t.isPublished ? "Đã ẩn mẫu khỏi thư viện" : "Đã xuất bản mẫu")
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const categories = state.status === "ready" ? [...new Set(state.items.map((t) => t.category))] : []

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Mẫu mới xuất hiện ngay trong thư viện — giao diện không cần sửa đổi.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" onClick={onLogout}>
            <LogOut /> Thoát
          </Button>
          <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setCreating(true)}>
            <Plus /> Thêm mẫu
          </Button>
        </div>
      </div>

      {state.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}
      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto size-6 text-red-400" />
          <p className="mt-2 text-sm text-red-700">{state.message}</p>
          <Button variant="outline" className="mt-3" onClick={() => setReload((r) => r + 1)}>
            <RotateCcw /> Thử lại
          </Button>
        </div>
      )}
      {state.status === "ready" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên mẫu</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">File gốc</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Hiển thị</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="font-mono text-xs text-slate-400">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">{t.category}</td>
                  <td className="px-4 py-3">v{t.version}</td>
                  <td className="px-4 py-3 text-slate-500">{t.originalFile === "uploaded" ? "DOCX tải lên" : "Sinh từ nội dung"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={t.isPublished} onChange={() => togglePublished(t)} className="size-4 accent-blue-600" />
                      <span className="text-xs text-slate-500">{t.isPublished ? "Công khai" : "Ẩn"}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.isPublished && (
                      <Link href={`/templates/documents/${t.id}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                        <Eye className="size-4" /> Xem
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateTemplateDialog
          headers={headers}
          categories={categories}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            setReload((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}

const EXAMPLE_JSON = JSON.stringify(
  {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1, textAlign: "center" }, content: [{ type: "text", text: "TIÊU ĐỀ MẪU" }] },
      { type: "paragraph", content: [{ type: "text", text: "Nội dung " }, { type: "text", text: "in đậm", marks: [{ type: "bold" }] }] },
    ],
  },
  null,
  2,
)

function CreateTemplateDialog({
  headers,
  categories,
  onClose,
  onCreated,
}: {
  headers: Record<string, string>
  categories: string[]
  onClose: () => void
  onCreated: () => void
}) {
  const [mode, setMode] = useState<"docx" | "json">("docx")
  const [form, setForm] = useState({ name: "", slug: "", category: "", description: "", tags: "", thumbnailUrl: "" })
  const [slugTouched, setSlugTouched] = useState(false)
  const [json, setJson] = useState(EXAMPLE_JSON)
  const [imported, setImported] = useState<{ content: DocContent; sourceFile: string; fileName: string; warnings: string[] } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value, ...(key === "name" && !slugTouched ? { slug: slugify(value) } : {}) }))
  }

  const parsedJson = useMemo((): { content?: DocContent; error?: string } => {
    try {
      return { content: JSON.parse(json) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [json])

  const content = mode === "docx" ? imported?.content : parsedJson.content
  const previewHtml = useMemo(() => {
    try {
      return content ? tiptapToHtml(content) : ""
    } catch {
      return ""
    }
  }, [content])

  const upload = useCallback(
    async (file: File) => {
      setUploading(true)
      setErrors([])
      try {
        const body = new FormData()
        body.append("file", file)
        const res = await apiFetch<{ html: string; warnings: string[]; sourceFile: string; fileName: string }>("/api/templates/import", {
          method: "POST",
          headers,
          body,
        })
        // Parsing with the editor schema keeps only supported nodes/marks (acts as the sanitizer).
        const doc = generateJSON(res.html, editorExtensions) as DocContent
        setImported({ content: doc, sourceFile: res.sourceFile, fileName: res.fileName, warnings: res.warnings })
        if (!form.name) {
          const name = file.name.replace(/\.docx$/i, "")
          setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
        }
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setUploading(false)
      }
    },
    [headers, form.name, slugTouched],
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    if (!content) return toast.error(mode === "docx" ? "Hãy tải lên file .docx" : "JSON nội dung không hợp lệ")
    setSaving(true)
    try {
      await apiFetch("/api/templates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          kind: "document",
          name: form.name,
          slug: form.slug,
          category: form.category,
          description: form.description,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          thumbnailUrl: form.thumbnailUrl.trim() || null,
          content,
          sourceFile: mode === "docx" ? imported?.sourceFile : undefined,
        }),
      })
      toast.success("Đã thêm mẫu mới vào thư viện")
      onCreated()
    } catch (error) {
      const err = error as ClientApiError
      setErrors(err.details ?? [{ path: "", message: err.message }])
    } finally {
      setSaving(false)
    }
  }

  const field = "mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Thêm mẫu">
      <form onSubmit={submit} className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">Thêm mẫu văn bản</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Tên mẫu *
                <input required value={form.name} onChange={set("name")} className={field} maxLength={120} />
              </label>
              <label className="text-sm font-medium">
                Slug *
                <input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set("slug")(e)
                  }}
                  className={`${field} font-mono`}
                />
              </label>
              <label className="text-sm font-medium">
                Danh mục *
                <input required list="categories" value={form.category} onChange={set("category")} className={field} maxLength={60} />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="text-sm font-medium">
                Thẻ (phân cách bởi dấu phẩy)
                <input value={form.tags} onChange={set("tags")} className={field} placeholder="hợp đồng, nhân sự" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Mô tả ngắn
              <textarea value={form.description} onChange={set("description")} maxLength={500} rows={2} className={`${field} h-auto py-2`} />
            </label>
            <label className="block text-sm font-medium">
              Ảnh thumbnail (URL, không bắt buộc — mặc định sinh từ nội dung)
              <input type="url" value={form.thumbnailUrl} onChange={set("thumbnailUrl")} className={field} placeholder="https://..." />
            </label>

            <div>
              <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm" role="tablist">
                {(["docx", "json"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-md py-1.5 ${mode === m ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}
                  >
                    {m === "docx" ? "Tải lên file .docx" : "Nhập nội dung JSON"}
                  </button>
                ))}
              </div>
              {mode === "docx" ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-blue-300">
                  {uploading ? <Loader2 className="size-6 animate-spin text-blue-600" /> : <FileUp className="size-6 text-blue-600" />}
                  <span className="mt-2 text-sm font-medium">{imported ? imported.fileName : "Chọn file .docx (tối đa 5MB)"}</span>
                  <span className="mt-1 text-xs text-slate-500">
                    File gốc được lưu nguyên vẹn để tải về; nội dung được chuyển sang định dạng chỉnh sửa được.
                  </span>
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  />
                </label>
              ) : (
                <>
                  <textarea
                    value={json}
                    onChange={(e) => setJson(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    aria-label="Nội dung JSON"
                    className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {parsedJson.error && <p className="text-xs text-red-600">JSON lỗi: {parsedJson.error}</p>}
                </>
              )}
              {imported && imported.warnings.length > 0 && mode === "docx" && (
                <p className="mt-2 text-xs text-amber-700">
                  {imported.warnings.length} cảnh báo khi chuyển đổi (một số định dạng nâng cao không được hỗ trợ).
                </p>
              )}
            </div>

            {errors.length > 0 && (
              <ul role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>
                    {err.path && <code className="mr-1 font-mono text-xs">{err.path}:</code>}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden min-h-0 overflow-y-auto bg-slate-100 p-6 md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Xem trước</p>
            {previewHtml ? (
              <DocumentPage html={previewHtml} mode="full" className="shadow-md" />
            ) : (
              <p className="text-sm text-slate-400">Chưa có nội dung.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" size="lg" disabled={saving || uploading} className="bg-blue-600 text-white hover:bg-blue-700">
            {saving && <Loader2 className="animate-spin" />} Lưu mẫu
          </Button>
        </div>
      </form>
    </div>
  )
}
