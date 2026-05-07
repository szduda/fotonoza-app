import type { MouseEvent } from "react"
import { useAppStore } from "@/store/appStore"
import { PhotoThumbnail } from "@/components/PhotoThumbnail"

export const Timeline = () => {
  const { mode, photos, currentPhotoId } = useAppStore((s) => s.present)
  const actions = useAppStore((s) => s.actions)
  const limit = 50

  if (mode !== "edit") {
    return null
  }

  const currentIndex = Math.max(
    0,
    photos.findIndex((photo) => photo.id === currentPhotoId),
  )
  const half = Math.floor(limit / 2)
  const maxStart = Math.max(0, photos.length - limit)
  const start = Math.min(maxStart, Math.max(0, currentIndex - half))
  const end = Math.min(photos.length, start + limit)
  const visiblePhotos = photos.slice(start, end)

  return (
    <div className="flex w-full min-h-0 h-full flex-1 gap-2 overflow-x-auto overflow-y-hidden pt-2 pb-3 px-2">
      {visiblePhotos.map((photo) => (
        <PhotoThumbnail
          key={photo.id}
          sourcePath={photo.thumbnailPath || photo.sourcePath}
          alt={photo.fileName}
          fit="contain"
          heightDriven
          className={`h-full w-auto shrink-0 p-1 ring-2 transition-colors hover:ring-neutral-400/50 ${
            photo.id === currentPhotoId ? "ring-yellow-300/30" : "ring-neutral-700/30"
          } ${photo.selected ? "bg-neutral-500/40" : ""}`}
          onClick={(e: MouseEvent<HTMLImageElement>) => {
            if (e.ctrlKey) {
              actions.toggleSelectPhoto(photo.id)
              return
            }
            actions.openInEditor(photo.id)
          }}
        />
      ))}
    </div>
  )
}
