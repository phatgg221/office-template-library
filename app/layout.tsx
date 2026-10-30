import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Thư viện mẫu văn bản", template: "%s | Thư viện mẫu" },
  description: "Tìm kiếm, xem trước và tạo tài liệu mới từ các mẫu văn bản chuyên nghiệp.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
