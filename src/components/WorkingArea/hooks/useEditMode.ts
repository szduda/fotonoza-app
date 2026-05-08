import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { useAppStore } from "@/store/appStore"
import { isPhotoEqual, type Pan, type Size } from "@/components/WorkingArea/geometry"
import type { Photo } from "@/types/domain"
import { useCurrentPhoto } from "./editMode/useCurrentPhoto"
import { useImageAsset } from "./editMode/useImageAsset"
import { useZoom } from "./editMode/useZoom"
import { useDrag } from "./editMode/useDrag"

export type EditModeModel = {
  selectedPhoto: Photo | undefined
  editImageSrc: string
  /** Filesystem path for Tauri `readFile` (same photo as `editImageSrc`). */
  diskSourcePath?: string
  /** Remount preview `<img>` when a new preview file is ready. */
  previewEpoch: number
  imageFailed: boolean
  setImageNatural: Dispatch<SetStateAction<Size>>
  setImageFailed: Dispatch<SetStateAction<boolean>>
  viewportRef: RefObject<HTMLDivElement | null>
  isDragging: boolean
  rendered: Size
  pan: Pan
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  onEditWheel: (e: ReactWheelEvent<HTMLDivElement>) => void
  onEditPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  onEditPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  endDrag: (e: ReactPointerEvent<HTMLDivElement>) => void
  fitToView: () => void
  zoomIn: () => void
  zoomOut: () => void
  centerView: () => void
  setThumbNatural: Dispatch<SetStateAction<Size>>
}

export const useEditMode = (): EditModeModel => {
  const actions = useAppStore((s) => s.actions)
  const curr = useCurrentPhoto()
  const asset = useImageAsset(curr.editImageSrc)
  const [thumbNatural, setThumbNatural] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    setThumbNatural({ width: 0, height: 0 })
  }, [curr.selectedPhoto?.id])

  const layoutNatural = useMemo((): Size => {
    if (asset.imageNatural.width > 0 && asset.imageNatural.height > 0) return asset.imageNatural
    if (thumbNatural.width > 0 && thumbNatural.height > 0) return thumbNatural
    return { width: 0, height: 0 }
  }, [asset.imageNatural, thumbNatural])

  const zoom = useZoom({
    curr,
    asset: {
      ...asset,
      imageNatural: layoutNatural,
    },
  })
  const drag = useDrag({ curr, zoom })
  const previousWorkedPhotoRef = useRef<{ id: string; sourcePath: string } | undefined>(undefined)

  useEffect(() => {
    actions.syncEditChrome({
      canZoomIn: zoom.canZoomIn,
      canZoomOut: zoom.canZoomOut,
      hasWorkPhoto: !!(curr.selectedPhoto && curr.editImageSrc && !asset.imageFailed),
    })
  }, [
    actions,
    zoom.canZoomIn,
    zoom.canZoomOut,
    curr.selectedPhoto,
    curr.editImageSrc,
    asset.imageFailed,
  ])

  useEffect(() => {
    if (!curr.selectedPhoto) return
    const next = { id: curr.selectedPhoto.id, sourcePath: curr.selectedPhoto.sourcePath }
    if (!isPhotoEqual(previousWorkedPhotoRef.current, next)) {
      zoom.fitToView()
      asset.setImageNatural({ width: 0, height: 0 })
      asset.setImageFailed(false)
      previousWorkedPhotoRef.current = next
    }
  }, [
    curr.selectedPhoto?.id,
    curr.selectedPhoto?.sourcePath,
    curr.previewEpoch,
    zoom.fitToView,
    asset.setImageNatural,
    asset.setImageFailed,
  ])

  return {
    ...curr,
    ...asset,
    ...zoom,
    ...drag,
    setThumbNatural,
  } as const
}
