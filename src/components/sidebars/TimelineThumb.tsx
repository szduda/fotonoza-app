import type { CSSProperties } from "react"
import type { MouseEvent } from "react"
import { PhotoThumbnail } from "@/components/PhotoThumbnail"
import { useAppStore } from "@/store/appStore"
import type { Photo } from "@/types/domain"

/** Timeline cell — same interaction pattern as {@link ViewModeGridThumb}. */
export const TimelineThumb = ({
  columnIndex,
  rowIndex: _row,
  style,
  photos,
}: {
  ariaAttributes: { "aria-colindex": number; role: "gridcell" }
  columnIndex: number
  rowIndex: number
  style: CSSProperties
  photos: Photo[]
}) => {
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const photo = photos[columnIndex]
  if (!photo) return <div style={style} />

  const isCurr = photo.id === currentPhotoId
  return (
    <div style={style}>
      <button
        type="button"
        className={`flex justify-center items-center border-r border-neutral-700/20  transition-colors duration-150 ease-out p-3 ${
          isCurr
            ? "bg-yellow-200/15 hover:bg-yellow-200/20"
            : photo.selected
              ? "bg-neutral-600/30 hover:bg-neutral-500/40"
              : "bg-neutral-900/20 hover:bg-yellow-200/5"
        }`}
        style={{ width: "100%", height: "100%" }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          const { toggleSelectPhoto, openInEditor } = useAppStore.getState().actions
          const multiSelect = e.ctrlKey || e.metaKey
          if (multiSelect) {
            e.preventDefault()
            e.stopPropagation()
            toggleSelectPhoto(photo.id)
            return
          }
          openInEditor(photo.id)
        }}
      >
        <PhotoThumbnail
          photoId={photo.id}
          thumbnailPath={photo.thumbnailPath}
          thumbnailNonce={photo.thumbnailNonce}
          alt={photo.fileName}
          fit="contain"
          className="border border-neutral-700/30"
          style={{ aspectRatio: 3 / 2 }}
        />
      </button>
    </div>
  )
}
