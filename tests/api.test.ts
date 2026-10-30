import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { GET as listTemplates, POST as createTemplate } from "@/app/api/templates/route"
import { GET as getTemplate, PUT as updateTemplate } from "@/app/api/templates/[id]/route"
import { GET as getTemplateFile } from "@/app/api/templates/[id]/file/route"
import { GET as getCategories } from "@/app/api/templates/categories/route"
import { GET as listDocuments, POST as createDocument } from "@/app/api/documents/route"
import { DELETE as deleteDocument, GET as getDocument, PATCH as patchDocument } from "@/app/api/documents/[id]/route"
import { GET as exportDocument } from "@/app/api/documents/[id]/export/route"
import { ADMIN, call } from "./helpers"
import { doc, h, p } from "@/lib/seed/builders"

type Id = { id: string }
const MISSING = "00000000-0000-4000-8000-000000000000"

async function firstTemplate(q = "hop dong") {
  const { body } = await call(listTemplates, `/api/templates?kind=document&q=${encodeURIComponent(q)}`)
  return body.items[0] as { id: string; name: string; version: number }
}

const sha = (buffer: ArrayBuffer) => createHash("sha256").update(Buffer.from(buffer)).digest("hex")

describe("GET /api/templates", () => {
  it("lists seeded templates with pagination metadata and preview HTML", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?kind=document")
    expect(status).toBe(200)
    expect(body.total).toBe(6)
    expect(body.items[0]).toMatchObject({ kind: "document", previewHtml: expect.any(String) })
    expect(body.items[0].content).toBeUndefined() // list stays light
  })

  it("searches accent-insensitively and ranks name matches first", async () => {
    const { body } = await call(listTemplates, "/api/templates?q=hop%20dong")
    expect(body.items[0].name).toBe("Hợp đồng lao động")
  })

  it("filters by category", async () => {
    const { body } = await call(listTemplates, `/api/templates?category=${encodeURIComponent("Nhân sự")}`)
    expect(body.total).toBe(2)
    expect(body.items.every((t: { category: string }) => t.category === "Nhân sự")).toBe(true)
  })

  it("returns an empty list (not an error) when nothing matches", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?q=khongtontai")
    expect(status).toBe(200)
    expect(body).toMatchObject({ total: 0, items: [] })
  })

  it("validates query parameters", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?kind=spreadsheet")
    expect(status).toBe(400)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("returns categories with counts", async () => {
    const { body } = await call(getCategories, "/api/templates/categories?kind=document")
    expect(body.items).toContainEqual({ category: "Hành chính", count: 2 })
  })
})

describe("GET /api/templates/:id", () => {
  it("returns 400 for a malformed id and 404 for an unknown one", async () => {
    expect((await call<Id>(getTemplate, "/x", { params: { id: "abc" } })).status).toBe(400)
    const missing = await call<Id>(getTemplate, "/x", { params: { id: MISSING } })
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe("NOT_FOUND")
  })
})

describe("creating a document from a template", () => {
  it("creates an independent copy and never modifies the template or its file", async () => {
    const template = await firstTemplate()
    const before = await call<Id>(getTemplate, "/x", { params: { id: template.id } })
    const fileBefore = sha(await (await getTemplateFile(new Request("http://x"), { params: Promise.resolve({ id: template.id }) })).arrayBuffer())

    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ templateId: template.id, templateVersion: 1, title: template.name })
    expect(created.body.content).toEqual(before.body.content)

    const edited = doc(h(1, "Nội dung đã sửa"), p("Hoàn toàn mới"))
    const patched = await call<Id>(patchDocument, "/x", {
      method: "PATCH",
      params: { id: created.body.id },
      json: { title: "Bản của tôi", content: edited },
    })
    expect(patched.status).toBe(200)

    const after = await call<Id>(getTemplate, "/x", { params: { id: template.id } })
    expect(after.body.content).toEqual(before.body.content)
    expect(after.body.version).toBe(before.body.version)
    const fileAfter = sha(await (await getTemplateFile(new Request("http://x"), { params: Promise.resolve({ id: template.id }) })).arrayBuffer())
    expect(fileAfter).toBe(fileBefore)

    const saved = await call<Id>(getDocument, "/x", { params: { id: created.body.id } })
    expect(saved.body).toMatchObject({ title: "Bản của tôi", content: edited })
  })

  it("rejects unknown templates and invalid input", async () => {
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: MISSING } })).status).toBe(404)
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: "nope" } })).status).toBe(400)
    expect((await call(createDocument, "/api/documents", { method: "POST", body: "{not json" })).status).toBe(400)
  })

  it("rejects content with unsupported node types", async () => {
    const template = await firstTemplate()
    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const res = await call<Id>(patchDocument, "/x", {
      method: "PATCH",
      params: { id: created.body.id },
      json: { content: { type: "doc", content: [{ type: "script" }] } },
    })
    expect(res.status).toBe(400)
    expect(res.body.error.details[0].path).toContain("content")
  })

  it("rejects bodies larger than 1MB", async () => {
    const template = await firstTemplate()
    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const huge = doc(p("x".repeat(1_100_000)))
    const res = await call<Id>(patchDocument, "/x", { method: "PATCH", params: { id: created.body.id }, json: { content: huge } })
    expect(res.status).toBe(413)
  })

  it("exports the document as DOCX and HTML, lists and deletes it", async () => {
    const template = await firstTemplate()
    const { body: created } = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })

    const docx = await call<Id>(exportDocument, "/x?format=docx", { params: { id: created.id } })
    expect(docx.status).toBe(200)
    expect(docx.res.headers.get("content-type")).toContain("wordprocessingml")
    expect(docx.res.headers.get("content-disposition")).toContain("attachment")

    const html = await call<Id>(exportDocument, "/x?format=html", { params: { id: created.id } })
    expect(await html.res.text()).toContain("HỢP ĐỒNG LAO ĐỘNG")
    expect((await call<Id>(exportDocument, "/x?format=exe", { params: { id: created.id } })).status).toBe(400)

    expect((await call(listDocuments, "/api/documents?kind=document")).body.items).toHaveLength(1)
    expect((await call<Id>(deleteDocument, "/x", { method: "DELETE", params: { id: created.id } })).status).toBe(204)
    expect((await call<Id>(getDocument, "/x", { params: { id: created.id } })).status).toBe(404)
  })
})

describe("template management (admin)", () => {
  const newTemplate = {
    kind: "document",
    slug: "quyet-dinh-bo-nhiem",
    name: "Quyết định bổ nhiệm",
    category: "Nhân sự",
    description: "Mẫu quyết định",
    tags: ["quyết định"],
    content: doc(h(1, "QUYẾT ĐỊNH"), p("Về việc bổ nhiệm")),
  }

  it("requires the admin token", async () => {
    const res = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate })
    expect(res.status).toBe(401)
    const wrong = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: { "x-admin-token": "wrong" } })
    expect(wrong.status).toBe(401)
  })

  it("adds a template that immediately appears in the library; duplicate slugs conflict", async () => {
    const res = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: ADMIN })
    expect(res.status).toBe(201)
    const { body } = await call(listTemplates, "/api/templates?q=bo%20nhiem")
    expect(body.items[0].name).toBe("Quyết định bổ nhiệm")
    const dup = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: ADMIN })
    expect(dup.status).toBe(409)
  })

  it("validates template input", async () => {
    const res = await call(createTemplate, "/api/templates", {
      method: "POST",
      headers: ADMIN,
      json: { ...newTemplate, slug: "Có Dấu", content: { type: "doc" } },
    })
    expect(res.status).toBe(400)
    const paths = res.body.error.details.map((d: { path: string }) => d.path)
    expect(paths).toEqual(expect.arrayContaining(["slug", "content.content"]))
  })

  it("bumps the version on content updates; existing documents keep their copy", async () => {
    const template = await firstTemplate()
    const { body: document } = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const res = await call<Id>(updateTemplate, "/x", {
      method: "PUT",
      headers: ADMIN,
      params: { id: template.id },
      json: { content: doc(p("Phiên bản mới")) },
    })
    expect(res.body.version).toBe(2)
    const kept = await call<Id>(getDocument, "/x", { params: { id: document.id } })
    expect(kept.body.content).toEqual(document.content)
    expect(kept.body.templateVersion).toBe(1)
  })

  it("hides unpublished templates from the library and blocks new copies", async () => {
    const template = await firstTemplate()
    await call<Id>(updateTemplate, "/x", { method: "PUT", headers: ADMIN, params: { id: template.id }, json: { isPublished: false } })
    expect((await call(listTemplates, "/api/templates?q=hop%20dong%20lao")).body.total).toBe(0)
    expect((await call<Id>(getTemplate, "/x", { params: { id: template.id } })).status).toBe(404)
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })).status).toBe(404)
  })
})
