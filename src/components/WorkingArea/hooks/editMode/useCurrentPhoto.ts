import { useEffect, useMemo } from "react"
import { localImageSrc } from "@/lib/localImageSrc"
import { useAppStore } from "@/store/appStore"
import type { Photo } from "@/types/domain"

export type CurrentPhotoModel = {
  mode: "import" | "view" | "edit"
  selectedPhoto: Photo | undefined
  editImageSrc: string
  diskSourcePath?: string
  previewEpoch: number
}

export const useCurrentPhoto = (): CurrentPhotoModel => {
  const mode = useAppStore((s) => s.present.mode)
  const photos = useAppStore((s) => s.present.photos)
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const actions = useAppStore((s) => s.actions)
  const editPreviewPath = useAppStore((s) => s.editPreviewPath)
  const editPreviewPhotoId = useAppStore((s) => s.editPreviewPhotoId)
  const previewEpoch = useAppStore((s) => s.editPreviewEpoch)

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === currentPhotoId),
    [photos, currentPhotoId],
  )

  const editImageSrc = useMemo(() => {
    if (!selectedPhoto) return ""
    if (editPreviewPath && editPreviewPhotoId === selectedPhoto.id) {
      return localImageSrc(editPreviewPath)
    }
    return localImageSrc(selectedPhoto.sourcePath)
  }, [selectedPhoto, editPreviewPath, editPreviewPhotoId])

  const diskSourcePath = useMemo(() => {
    if (!selectedPhoto) return undefined
    if (editPreviewPath && editPreviewPhotoId === selectedPhoto.id) return editPreviewPath
    return selectedPhoto.sourcePath
  }, [selectedPhoto, editPreviewPath, editPreviewPhotoId])

  useEffect(() => {
    if (mode !== "edit") return
    if (currentPhotoId) return
    if (photos.length === 0) return
    actions.openInEditor(photos[0].id)
  }, [mode, currentPhotoId, photos, actions])

  useEffect(() => {
    const onCtrlArrow = (e: KeyboardEvent) => {
      if (mode !== "edit") return
      if (!e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      if (photos.length === 0) return
      const idx = Math.max(0, photos.findIndex((photo) => photo.id === currentPhotoId))

      if (e.key === "ArrowLeft") {
        const next = photos[idx - 1]
        if (next) actions.openInEditor(next.id)
        return
      }

      const next = photos[idx + 1]
      if (next) actions.openInEditor(next.id)
    }

    window.addEventListener("keydown", onCtrlArrow, { capture: true })
    return () => window.removeEventListener("keydown", onCtrlArrow, { capture: true })
  }, [mode, photos, currentPhotoId, actions])

  return { mode, selectedPhoto, editImageSrc, diskSourcePath, previewEpoch }
}
