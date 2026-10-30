"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { EditorContent, useEditor } from "@tiptap/react"
import { AlertCircle, ArrowLeft, Check, ChevronDown, Download, FileCode2, FileText, Info, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { editorExtensions } from "@/lib/editor/extensions"
import { apiFetch } from "@/lib/client-api"
import type { DocumentRecord } from "@/lib/repositories/types"

type SaveStatus = "saved" | "dirty" | "saving" | "error"
const AUTOSAVE_MS = 1500

export function DocumentEditor({ document: initial }: { document: DocumentRecord }) {
  const [title, setTitle] = useState(initial.title)
  const [status, setStatus] = useState<SaveStatus>("saved")
  const [menuOpen, setMenuOpen] = useState(false)
  // Monotonic change counter: a save only marks "saved" if nothing changed while it was in flight.
  const revision = useRef(0)
  const titleRef = useRef(initial.title)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inFlight = useRef<Promise<boolean> | null>(null)

  const editor = useEditor({
    extensions: editorExtensions,
    content: initial.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "doc-content a4-page mx-auto shadow-[0_1px_4px_rgba(15,23,42,0.08),0_8px_30px_rgba(15,23,42,0.06)]",
        "aria-label": "Nội dung tài liệu",
        spellcheck: "false",
      },
    },
    onUpdate: () => markDirty(),
  })

  const save = useCallback(async (): Promise<boolean> => {
    if (!editor) return false
    if (inFlight.current) await inFlight.current
    const rev = revision.current
    const run = (async () => {
      setStatus("saving")
      try {
        await apiFetch(`/api/documents/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: titleRef.current.trim() || "Tài liệu không tên", content: editor.getJSON() }),
        })
        setStatus(revision.current === rev ? "saved" : "dirty")
        return true
      } catch (error) {
        setStatus("error")
        toast.error(`Lưu thất bại: ${(error as Error).message}`)
        return false
      } finally {
        inFlight.current = null
      }
    })()
    inFlight.current = run
    return run
  }, [editor, initial.id])

  const saveRef = useRef(save)
  saveRef.current = save

  function markDirty() {
    revision.current += 1
    setStatus("dirty")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS)
  }

  // Ctrl/Cmd+S saves immediately.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        clearTimeout(timer.current)
        void saveRef.current().then((ok) => ok && toast.success("Đã lưu"))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (status === "saved") return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [status])

  useEffect(() => () => clearTimeout(timer.current), [])

  async function download(format: "docx" | "html") {
    setMenuOpen(false)
    clearTimeout(timer.current)
    if (status !== "saved" && !(await save())) return
    const a = window.document.createElement("a")
    a.href = `/api/documents/${initial.id}/export?format=${format}`
    a.download = ""
    a.click()
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/my-files" aria-label="Quay lại tài liệu của tôi" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <FileText className="size-4" />
          </div>
          <input
            value={title}
            maxLength={200}
            onChange={(e) => {
              setTitle(e.target.value)
              titleRef.current = e.target.value
              markDirty()
            }}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-base font-semibold outline-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-blue-500 sm:max-w-md"
            aria-label="Tên tài liệu"
          />
          <SaveIndicator status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            disabled={status === "saving"}
            onClick={() => {
              clearTimeout(timer.current)
              void save().then((ok) => ok && toast.success("Đã lưu"))
            }}
          >
            <Save /> Lưu
          </Button>
          <div className="relative">
            <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu">
              <Download /> Tải xuống <ChevronDown />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button role="menuitem" onClick={() => download("docx")} className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50">
                    <FileText className="mt-0.5 size-4 text-blue-600" />
                    <span>
                      <span className="block text-sm font-medium">Microsoft Word (.docx)</span>
                      <span className="text-xs text-slate-500">Mở bằng Word, Google Docs, LibreOffice</span>
                    </span>
                  </button>
                  <button role="menuitem" onClick={() => download("html")} className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50">
                    <FileCode2 className="mt-0.5 size-4 text-orange-500" />
                    <span>
                      <span className="block text-sm font-medium">Trang web (.html)</span>
                      <span className="text-xs text-slate-500">Xem trên trình duyệt hoặc in PDF</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {editor && <EditorToolbar editor={editor} />}
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-2 text-xs text-blue-800">
        <Info className="size-3.5 shrink-0" />
        <span>
          Tạo từ mẫu: <strong>{initial.templateName ?? "mẫu đã bị xoá"}</strong> (phiên bản {initial.templateVersion}) — đây là bản sao độc lập, mẫu gốc không bị thay đổi.
        </span>
      </div>
      <div className="flex-1 overflow-auto px-2 py-8 sm:px-6">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="a4-page mx-auto animate-pulse" aria-busy="true" aria-label="Đang tải trình soạn thảo" />
        )}
      </div>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map = {
    saved: { icon: <Check className="size-3.5" />, text: "Đã lưu", className: "text-emerald-600" },
    dirty: { icon: null, text: "Có thay đổi chưa lưu", className: "text-amber-600" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Đang lưu...", className: "text-slate-500" },
    error: { icon: <AlertCircle className="size-3.5" />, text: "Lưu thất bại", className: "text-red-600" },
  }[status]
  return (
    <span className={`hidden shrink-0 items-center gap-1 text-xs sm:flex ${map.className}`} aria-live="polite">
      {map.icon}
      {map.text}
    </span>
  )
}
