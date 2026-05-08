import type { CSSProperties } from "react"
import { PhotoThumbnail } from "@/components/PhotoThumbnail"
import { useAppStore } from "@/store/appStore"
import type { Photo } from "@/types/domain"

/** Virtual grid cell — reads actions from store to keep parent props minimal. */
export const ViewModeGridThumb = ({
  columnIndex,
  rowIndex,
  style,
  cols,
  cellW,
  photos,
}: {
  ariaAttributes: { "aria-colindex": number; role: "gridcell" }
  columnIndex: number
  rowIndex: number
  style: CSSProperties
  cols: number
  cellW: number
  photos: Photo[]
}) => {
  const idx = rowIndex * cols + columnIndex
  if (idx >= photos.length) {
    return <div style={style} />
  }

  const photo = photos[idx]

  return (
    <div style={style}>
      <button
        type="button"
        className={`border-r border-b border-neutral-600/20 hover:outline-2 -outline-offset-2 outline-yellow-400/30 flex flex-col p-2 text-xs transition-colors duration-150 ease-out ${
          photo.selected ? `bg-neutral-500/40` : `bg-neutral-700/20`
        }`}
        style={{ width: cellW, height: cellW }}
        onPointerEnter={() => {
          if (useAppStore.getState().present.mode !== "view") return
          useAppStore.getState().actions.setViewHoveredPhoto(photo.id)
        }}
        onClick={() => {
          useAppStore.getState().actions.toggleSelectPhoto(photo.id)
        }}
        onDoubleClick={() => {
          useAppStore.getState().actions.openInEditor(photo.id)
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
