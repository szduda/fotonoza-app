import { useTimelinePhotosStable } from "@/hooks/useTimelinePhotosStable"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"
import { PhotoThumbnail } from "@/components/PhotoThumbnail"

export const Timeline = () => {
  const mode = useAppStore((s) => s.present.mode)
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const photos = useTimelinePhotosStable()
  const actions = useAppStore((s) => s.actions)

  const photoStyle =
    "w-24 shrink-0 rounded p-1 text-left text-xs transition-colors ring-2 hover:ring-neutral-400/50"
  const selectedPhotoStyle = "bg-neutral-500/40"
  const currentPhotoStyle = "ring-yellow-300/30"

  if (mode !== "edit") {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden pt-2 pb-3 px-2">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          className={`${photoStyle} ${photo.id === currentPhotoId ? currentPhotoStyle : "ring-neutral-700/30"} ${photo.selected ? selectedPhotoStyle : ""}`}
          onClick={(e) => {
            if (e.ctrlKey) {
              actions.toggleSelectPhoto(photo.id)
              return
            }
            actions.openInEditor(photo.id)
          }}
        >
          <div className={`mb-1 h-18 w-full min-w-0 overflow-hidden rounded ${chrome.panelBg}`}>
            <PhotoThumbnail sourcePath={photo.sourcePath} alt={photo.fileName} />
          </div>
          <span className="block truncate text-[10px]">{photo.fileName}</span>
        </button>
      ))}
    </div>
  )
}
