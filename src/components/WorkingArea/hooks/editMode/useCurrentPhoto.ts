import { useEffect, useMemo } from "react"
import { useFilteredPhotos } from "@/hooks/useFilteredPhotos"
import { localImageSrc } from "@/lib/localImageSrc"
import { armTimelineKeyboardStepScroll } from "@/lib/timelineKeyboardStepScroll"
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
  const visiblePhotos = useFilteredPhotos()
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
    if (visiblePhotos.length === 0) return
    if (!currentPhotoId || !visiblePhotos.some((p) => p.id === currentPhotoId)) {
      actions.ensureEditPhoto(visiblePhotos[0].id)
    }
  }, [mode, currentPhotoId, visiblePhotos, actions])

  useEffect(() => {
    const onCtrlArrow = (e: KeyboardEvent) => {
      if (mode !== "edit") return
      if (!e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      if (visiblePhotos.length === 0) return
      const idx = Math.max(0, visiblePhotos.findIndex((photo) => photo.id === currentPhotoId))

      if (e.key === "ArrowLeft") {
        const next = visiblePhotos[idx - 1]
        if (next && next.id !== currentPhotoId) {
          armTimelineKeyboardStepScroll()
          actions.openInEditor(next.id)
        }
        return
      }

      const next = visiblePhotos[idx + 1]
      if (next && next.id !== currentPhotoId) {
        armTimelineKeyboardStepScroll()
        actions.openInEditor(next.id)
      }
    }

    window.addEventListener("keydown", onCtrlArrow, { capture: true })
    return () => window.removeEventListener("keydown", onCtrlArrow, { capture: true })
  }, [mode, visiblePhotos, currentPhotoId, actions])

  return { mode, selectedPhoto, editImageSrc, diskSourcePath, previewEpoch }
}
