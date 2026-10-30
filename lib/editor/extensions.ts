import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import { TableKit } from "@tiptap/extension-table"
import type { Extensions } from "@tiptap/core"

/**
 * One extension list for the editor and for HTML->JSON import, so imported content can only
 * contain node/mark types the renderers and the DOCX exporter support.
 */
export const editorExtensions: Extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TableKit.configure({ table: { resizable: false } }),
]
