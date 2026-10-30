"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Renders pre-serialized document HTML (from lib/content/html.ts, which escapes all text and
 * whitelists attributes) on a 794px-wide A4 page, scaled to the container width so thumbnails
 * and previews always match the real layout.
 *  - mode "thumbnail": first page only (A4 aspect ratio, clipped)
 *  - mode "full": the whole document, height follows the content
 */
export function DocumentPage({
  html,
  mode = "thumbnail",
  className,
}: {
  html: string
  mode?: "thumbnail" | "full"
  className?: string
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const el = outer.current
    const page = inner.current
    if (!el || !page) return
    const update = () => {
      setScale(el.clientWidth / 794)
      setHeight(page.offsetHeight)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    observer.observe(page)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={outer}
      className={cn("relative w-full overflow-hidden bg-white", mode === "thumbnail" && "aspect-[1/1.414]", className)}
      style={mode === "full" ? { height: height * scale || undefined } : undefined}
      aria-hidden={mode === "thumbnail" ? true : undefined}
    >
      <div
        ref={inner}
        className={cn("absolute left-0 top-0 origin-top-left", mode === "thumbnail" && "pointer-events-none select-none")}
        style={{ transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        <div className="doc-content a4-page" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
