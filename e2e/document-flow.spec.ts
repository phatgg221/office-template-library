import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("search → preview → use template → edit → autosave → download DOCX", async ({ page, request }) => {
  await page.goto("/templates/documents")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("mẫu văn bản")

  // Accent-insensitive search, reflected in the URL.
  await page.getByPlaceholder(/Tìm kiếm mẫu văn bản/).fill("hop dong")
  await expect(page).toHaveURL(/q=hop\+dong/)
  await expect(page.getByText(/mẫu văn bản cho “hop dong”/)).toBeVisible()

  // Preview dialog.
  await page.getByRole("button", { name: "Xem trước Hợp đồng lao động" }).click()
  const dialog = page.getByRole("dialog", { name: "Xem trước mẫu" })
  await expect(dialog.getByRole("heading", { name: "Hợp đồng lao động", exact: true })).toBeVisible()
  const templateId = new URL(page.url()).searchParams.get("preview")!
  const templateBefore = await (await request.get(`/api/templates/${templateId}`)).json()

  // Use the template → editor with an independent copy.
  await dialog.getByRole("button", { name: "Sử dụng mẫu này" }).click()
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]{36}$/)
  await expect(page.getByText(/bản sao độc lập/)).toBeVisible()

  const editor = page.getByLabel("Nội dung tài liệu")
  await editor.getByText("Hôm nay, ngày").click()
  await page.keyboard.press("End")
  await page.keyboard.type(" Nội dung E2E đã chỉnh sửa.")
  await page.getByLabel("Tên tài liệu").fill("Hợp đồng E2E")
  await expect(page.getByText("Đã lưu")).toBeVisible({ timeout: 10_000 })

  // Reload: changes persisted on the server.
  await page.reload()
  await expect(page.getByLabel("Nội dung tài liệu")).toContainText("Nội dung E2E đã chỉnh sửa.")
  await expect(page.getByLabel("Tên tài liệu")).toHaveValue("Hợp đồng E2E")

  // Download DOCX.
  await page.getByRole("button", { name: /Tải xuống/ }).click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("menuitem", { name: /Microsoft Word/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("Hợp đồng E2E.docx")
  const bytes = await readFile((await download.path())!)
  expect(bytes.subarray(0, 2).toString()).toBe("PK")

  // The template itself is unchanged.
  const templateAfter = await (await request.get(`/api/templates/${templateId}`)).json()
  expect(templateAfter.content).toEqual(templateBefore.content)
  expect(templateAfter.version).toBe(templateBefore.version)

  // The document shows up in "Tài liệu của tôi".
  await page.goto("/my-files")
  await expect(page.getByRole("link", { name: "Hợp đồng E2E", exact: true })).toBeVisible()
})

test("category filter, empty state and not-found page", async ({ page }) => {
  await page.goto("/templates/documents")
  await page.getByRole("tab", { name: /Nhân sự/ }).click()
  await expect(page).toHaveURL(/category=/)
  await expect(page.getByText("2 mẫu văn bản")).toBeVisible()

  await page.getByPlaceholder(/Tìm kiếm mẫu văn bản/).fill("zzzz khong co")
  await expect(page.getByText("Không tìm thấy mẫu phù hợp")).toBeVisible()
  await page.getByRole("button", { name: "Xoá bộ lọc" }).click()
  await expect(page.getByText("6 mẫu văn bản")).toBeVisible()

  await page.goto("/templates/documents/00000000-0000-4000-8000-000000000000")
  await expect(page.getByRole("heading", { name: "Không tìm thấy nội dung" })).toBeVisible()
})
