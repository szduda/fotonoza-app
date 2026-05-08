import { useEffect } from "react"
import { useAppStore } from "@/store/appStore"

/** In browse mode, keys 0–5 rate the last hovered grid photo (see view hover on thumbs). */
export const useViewModeRating = (): void => {
  const mode = useAppStore((s) => s.present.mode)

  useEffect(() => {
    if (mode !== "view") return

    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented) return
      const el = e.target as HTMLElement | null
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return
      const key = e.key
      if (key !== "0" && (key < "1" || key > "5")) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const hovered = useAppStore.getState().viewHoveredPhotoId
      if (!hovered) return

      useAppStore.getState().actions.setPhotoRating(hovered, Number(key))
      e.preventDefault()
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])
}
