# Tài liệu API

Base URL: `http://localhost:3000`. Tất cả body request/response là JSON (trừ upload và tải file).

## Định dạng lỗi

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ", "details": [{ "path": "slug", "message": "..." }] } }
```

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query sai schema, ID không phải UUID, JSON hỏng, file không phải .docx |
| 401 | `UNAUTHORIZED` | Thiếu/sai `x-admin-token` cho API quản trị |
| 404 | `NOT_FOUND` | Không tìm thấy mẫu/tài liệu (hoặc mẫu đang ẩn) |
| 409 | `CONFLICT` | Trùng `slug` |
| 413 | `PAYLOAD_TOO_LARGE` | Body > 1MB, file tải lên > 5MB |
| 500 | `INTERNAL` | Lỗi không mong muốn (không lộ chi tiết) |

---

## Templates

### `GET /api/templates`
Danh sách mẫu đã xuất bản (nhẹ: không kèm `content`, có `previewHtml` cho thumbnail).

| Query | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `kind` | `document` \| `presentation` | — | Lọc theo loại |
| `q` | string ≤ 100 | — | Tìm không dấu trên tên, mô tả, danh mục, thẻ và nội dung; mọi từ phải khớp; khớp tên/mô tả được xếp trước |
| `category` | string | — | Lọc danh mục |
| `sort` | `newest` \| `name` | `newest` | `name` sắp xếp theo thứ tự tiếng Việt |
| `page` | int ≥ 1 | 1 | |
| `limit` | 1–100 | 24 | |

```json
{
  "items": [{
    "id": "aed1caf4-...", "slug": "hop-dong-lao-dong", "kind": "document",
    "name": "Hợp đồng lao động", "description": "...", "category": "Nhân sự",
    "tags": ["hợp đồng", "lao động"], "thumbnailUrl": null,
    "fileUrl": "/api/templates/aed1caf4-.../file", "originalFile": null,
    "version": 1, "isPublished": true,
    "createdAt": "2026-10-02T08:00:00.000Z", "updatedAt": "2026-10-02T08:00:00.000Z",
    "previewHtml": "<p style=\"text-align:center\"><strong>CỘNG HÒA...</strong></p>..."
  }],
  "total": 6, "page": 1, "limit": 24
}
```

### `GET /api/templates/categories?kind=document`
```json
{ "items": [{ "category": "Hành chính", "count": 2 }, { "category": "Nhân sự", "count": 2 }] }
```

### `GET /api/templates/:id`
Chi tiết mẫu, kèm `content` (TipTap JSON). Mẫu đang ẩn chỉ admin xem được.

### `GET /api/templates/:id/file`
Tải file gốc `.docx` (`Content-Disposition: attachment`). Mẫu tải lên → trả nguyên file đã upload;
mẫu seed/JSON → file được render một lần từ nội dung rồi lưu lại, các lần sau trả về đúng file đó.

### `POST /api/templates` *(admin)*
Header `x-admin-token`. Tạo mẫu mới — xuất hiện ngay trong thư viện.

```json
{
  "kind": "document",
  "slug": "quyet-dinh-bo-nhiem",
  "name": "Quyết định bổ nhiệm",
  "category": "Nhân sự",
  "description": "Mẫu quyết định bổ nhiệm cán bộ",
  "tags": ["quyết định"],
  "thumbnailUrl": null,
  "isPublished": true,
  "content": { "type": "doc", "content": [
    { "type": "heading", "attrs": { "level": 1, "textAlign": "center" }, "content": [{ "type": "text", "text": "QUYẾT ĐỊNH" }] }
  ] },
  "sourceFile": "uploads/2b06de5c-bd5e-4068-9f40-4a2303e1fc02.docx"
}
```
`sourceFile` (tuỳ chọn) là giá trị nhận được từ `POST /api/templates/import`. → `201` + template.

### `PUT /api/templates/:id` *(admin)*
Cập nhật một phần (mọi trường trừ `kind`). Đổi `content` → `version + 1`; tài liệu đã tạo trước đó không bị ảnh hưởng.
Dùng `{ "isPublished": false }` để ẩn mẫu.

### `POST /api/templates/import` *(admin)*
`multipart/form-data`, trường `file` (.docx ≤ 5MB). Lưu file gốc và trả về HTML để chuyển sang nội dung chỉnh sửa được.
```json
{ "html": "<h1>...</h1>", "warnings": [], "sourceFile": "uploads/<uuid>.docx", "fileName": "Mau.docx" }
```

### `GET /api/admin/templates` *(admin)*
Như `GET /api/templates` nhưng gồm cả mẫu đang ẩn.

---

## Documents (tài liệu người dùng)

### `POST /api/documents`
Tạo tài liệu mới từ mẫu bằng cách sao chép sâu (deep copy) nội dung. Template không bị ghi.
```json
{ "templateId": "aed1caf4-...", "title": "Hợp đồng - Nguyễn Văn An" }
```
→ `201`, header `Location`, body:
```json
{
  "id": "30fdee7d-...", "kind": "document", "templateId": "aed1caf4-...", "templateVersion": 1,
  "templateName": "Hợp đồng lao động", "title": "Hợp đồng - Nguyễn Văn An",
  "content": { "type": "doc", "content": [] }, "createdAt": "...", "updatedAt": "..."
}
```

### `GET /api/documents?kind=document`
`{ "items": [DocumentSummary] }` — không kèm `content`, mới cập nhật trước.

### `GET /api/documents/:id`
Tài liệu đầy đủ (kèm `content`).

### `PATCH /api/documents/:id`
```json
{ "title": "Tên mới", "content": { "type": "doc", "content": [] } }
```
Cần ít nhất một trường. → `{ "id", "title", "updatedAt" }`.

### `DELETE /api/documents/:id`
→ `204`. Template gốc không bị ảnh hưởng.

### `GET /api/documents/:id/export?format=docx|html`
Sinh file từ nội dung hiện tại. `docx`: Office Open XML (A4, Times New Roman 13pt); `html`: trang HTML độc lập để xem/in PDF.
Tên file lấy theo tiêu đề tài liệu (hỗ trợ tiếng Việt qua `filename*`).

---

## Mô hình nội dung (TipTap JSON)

```ts
type ContentNode = {
  type: "doc" | "paragraph" | "heading" | "text" | "bulletList" | "orderedList" | "listItem"
      | "blockquote" | "horizontalRule" | "hardBreak" | "table" | "tableRow" | "tableHeader" | "tableCell"
  attrs?: Record<string, unknown>   // vd. { level: 1 }, { textAlign: "center" }, { colspan: 2 }
  content?: ContentNode[]
  marks?: { type: "bold" | "italic" | "underline" | "strike" | "code" | "link"; attrs?: { href?: string } }[]
  text?: string
}
```

Quy ước: bảng có hàng `tableHeader` là bảng dữ liệu (có viền); bảng không có header là bảng bố cục
(quốc hiệu, chữ ký) — hiển thị không viền và căn giữa, cả trên web lẫn trong DOCX.

## Thêm mẫu mới mà không sửa giao diện
1. **Giao diện quản trị** `/admin/templates` → "Thêm mẫu" → tải .docx hoặc dán JSON; hoặc
2. **API** `POST /api/templates`; hoặc
3. **Seed**: thêm phần tử vào `lib/seed/document-templates.ts` (áp dụng cho database mới).
