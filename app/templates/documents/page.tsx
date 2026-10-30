import { Suspense } from "react"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { TemplateLibrary } from "@/components/template-library"

export const metadata: Metadata = { title: "Mẫu văn bản" }

export default function DocumentTemplatesPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <TemplateLibrary kind="document" />
      </Suspense>
    </>
  )
}
