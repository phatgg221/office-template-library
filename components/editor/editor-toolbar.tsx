"use client"

import { useEditorState, type Editor } from "@tiptap/react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent [&_svg]:size-4",
        active && "bg-blue-50 text-blue-700 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

export function EditorToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      heading: ([1, 2, 3] as const).find((level) => e.isActive("heading", { level })) ?? 0,
      align: (["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
      inTable: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()

  return (
    <div
      role="toolbar"
      aria-label="Định dạng"
      className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-white px-3 py-1.5"
    >
      <ToolButton label="Hoàn tác (Ctrl+Z)" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Làm lại (Ctrl+Y)" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 />
      </ToolButton>
      <Divider />
      <select
        aria-label="Kiểu đoạn"
        value={s.heading}
        onChange={(e) => {
          const level = Number(e.target.value) as 0 | 1 | 2 | 3
          if (level === 0) chain().setParagraph().run()
          else chain().setHeading({ level }).run()
        }}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
      >
        <option value={0}>Văn bản thường</option>
        <option value={1}>Tiêu đề 1</option>
        <option value={2}>Tiêu đề 2</option>
        <option value={3}>Tiêu đề 3</option>
      </select>
      <Divider />
      <ToolButton label="In đậm (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="In nghiêng (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton label="Gạch chân (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline />
      </ToolButton>
      <ToolButton label="Gạch ngang" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </ToolButton>
      <Divider />
      <ToolButton label="Danh sách dấu chấm" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton label="Danh sách đánh số" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton label="Trích dẫn" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <ToolButton label="Đường kẻ ngang" onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </ToolButton>
      <Divider />
      <ToolButton label="Căn trái" active={s.align === "left"} onClick={() => chain().setTextAlign("left").run()}>
        <AlignLeft />
      </ToolButton>
      <ToolButton label="Căn giữa" active={s.align === "center"} onClick={() => chain().setTextAlign("center").run()}>
        <AlignCenter />
      </ToolButton>
      <ToolButton label="Căn phải" active={s.align === "right"} onClick={() => chain().setTextAlign("right").run()}>
        <AlignRight />
      </ToolButton>
      <ToolButton label="Căn đều" active={s.align === "justify"} onClick={() => chain().setTextAlign("justify").run()}>
        <AlignJustify />
      </ToolButton>
      <Divider />
      <ToolButton
        label="Chèn bảng 3×3"
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table2 />
      </ToolButton>
      {s.inTable && (
        <>
          <ToolButton label="Thêm hàng bên dưới" onClick={() => chain().addRowAfter().run()}>
            <Rows3 />
          </ToolButton>
          <ToolButton label="Thêm cột bên phải" onClick={() => chain().addColumnAfter().run()}>
            <Columns3 />
          </ToolButton>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => chain().deleteRow().run()}
            className="h-8 rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100"
          >
            Xoá hàng
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => chain().deleteColumn().run()}
            className="h-8 rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100"
          >
            Xoá cột
          </button>
          <ToolButton label="Xoá bảng" onClick={() => chain().deleteTable().run()}>
            <Trash2 />
          </ToolButton>
        </>
      )}
    </div>
  )
}
