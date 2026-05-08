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
        className={`flex justify-center items-center border-r border-neutral-600/20 transition-colors duration-150 ease-out p-3 ${
          isCurr ? "bg-yellow-200/15 hover:bg-yellow-200/20" : "hover:bg-neutral-700/50"
        }`}
        style={{ width: "100%", height: "100%" }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          const { toggleSelectPhoto, openInEditor } = useAppStore.getState().actions
          if (e.ctrlKey) {
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
          style={{ aspectRatio: 3 / 2 }}
        />
      </button>
    </div>
  )
}
