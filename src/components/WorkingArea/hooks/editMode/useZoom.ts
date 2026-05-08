import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type {
  Dispatch,
  RefObject,
  SetStateAction,
  WheelEvent as ReactWheelEvent,
} from "react"
import { setEditViewportCtl } from "@/lib/editViewportCtl"
import { EDIT_ZOOM_MAX, EDIT_ZOOM_MIN, EDIT_ZOOM_STEP } from "@/components/WorkingArea/constants"
import { clamp, clampPan, fitContainSize, type Pan, type Size } from "@/components/WorkingArea/geometry"
import type { CurrentPhotoModel } from "./useCurrentPhoto"
import type { ImageAssetModel } from "./useImageAsset"

type ZoomInput = {
  curr: Pick<CurrentPhotoModel, "selectedPhoto" | "editImageSrc">
  asset: Pick<ImageAssetModel, "imageFailed" | "viewport" | "imageNatural">
}

export type ZoomModel = {
  zoom: number
  pan: Pan
  setPan: Dispatch<SetStateAction<Pan>>
  rendered: Size
  renderedRef: RefObject<Size>
  viewportRefSize: RefObject<Size>
  canZoomIn: boolean
  canZoomOut: boolean
  onEditWheel: (e: ReactWheelEvent<HTMLDivElement>) => void
  fitToView: () => void
  zoomIn: () => void
  zoomOut: () => void
  centerView: () => void
}

export const useZoom = ({
  curr,
  asset,
}: ZoomInput): ZoomModel => {
  const { selectedPhoto, editImageSrc } = curr
  const { imageFailed, viewport, imageNatural } = asset
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const viewportRefSize = useRef(viewport)
  const imageNaturalRef = useRef(imageNatural)
  const selectedPhotoRef = useRef(selectedPhoto)
  const editImageSrcRef = useRef(editImageSrc)
  const imageFailedRef = useRef(imageFailed)
  zoomRef.current = zoom
  panRef.current = pan
  viewportRefSize.current = viewport
  imageNaturalRef.current = imageNatural
  selectedPhotoRef.current = selectedPhoto
  editImageSrcRef.current = editImageSrc
  imageFailedRef.current = imageFailed

  const rendered = useMemo(
    () => fitContainSize(viewport, imageNatural, zoom),
    [viewport, imageNatural, zoom],
  )
  const renderedRef = useRef<Size>(rendered)
  renderedRef.current = rendered

  const canZoomIn = useMemo(() => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return false
    const next = clamp(zoom * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    return next > zoom + 1e-9
  }, [zoom, selectedPhoto, editImageSrc, imageFailed])

  const canZoomOut = useMemo(() => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return false
    const next = clamp(zoom / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    return next < zoom - 1e-9
  }, [zoom, selectedPhoto, editImageSrc, imageFailed])

  const fitToView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const centerView = useCallback(() => {
    setPan({ x: 0, y: 0 })
  }, [])

  const applyZoomAt = useCallback((nextZoom: number, cursorX: number, cursorY: number) => {
    const sel = selectedPhotoRef.current
    const src = editImageSrcRef.current
    if (!sel || !src || imageFailedRef.current) return

    const currentZoom = zoomRef.current
    if (nextZoom === currentZoom) return

    const vp = viewportRefSize.current
    const nat = imageNaturalRef.current
    const currentPan = panRef.current
    const currentRendered = fitContainSize(vp, nat, currentZoom)
    const nextRendered = fitContainSize(vp, nat, nextZoom)
    if (
      currentRendered.width <= 0 ||
      currentRendered.height <= 0 ||
      nextRendered.width <= 0 ||
      nextRendered.height <= 0
    ) {
      setZoom(nextZoom)
      return
    }

    const nextPan = {
      x: cursorX - ((cursorX - currentPan.x) / currentRendered.width) * nextRendered.width,
      y: cursorY - ((cursorY - currentPan.y) / currentRendered.height) * nextRendered.height,
    }

    setZoom(nextZoom)
    setPan(clampPan(nextPan, nextRendered, vp))
  }, [])

  const zoomIn = useCallback(() => {
    const z = zoomRef.current
    const next = clamp(z * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    if (next <= z + 1e-9) return
    applyZoomAt(next, 0, 0)
  }, [applyZoomAt])

  const zoomOut = useCallback(() => {
    const z = zoomRef.current
    const next = clamp(z / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    if (next >= z - 1e-9) return
    applyZoomAt(next, 0, 0)
  }, [applyZoomAt])

  useLayoutEffect(() => {
    setEditViewportCtl({ fitToView, centerView, zoomIn, zoomOut })
    return () => setEditViewportCtl(null)
  }, [fitToView, centerView, zoomIn, zoomOut])

  useEffect(() => {
    setPan((prev) => {
      const next = clampPan(prev, rendered, viewport)
      if (next.x === prev.x && next.y === prev.y) return prev
      return next
    })
  }, [rendered, viewport])

  const onEditWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    if (!selectedPhotoRef.current || !editImageSrcRef.current || imageFailedRef.current) return
    e.preventDefault()

    const z = zoomRef.current
    const next =
      e.deltaY > 0
        ? clamp(z / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
        : clamp(z * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    if (next === z) return

    const rect = e.currentTarget.getBoundingClientRect()
    const cursorX = e.clientX - rect.left - rect.width / 2
    const cursorY = e.clientY - rect.top - rect.height / 2
    applyZoomAt(next, cursorX, cursorY)
  }, [applyZoomAt])

  return {
    zoom,
    pan,
    setPan,
    rendered,
    renderedRef,
    viewportRefSize,
    canZoomIn,
    canZoomOut,
    onEditWheel,
    fitToView,
    zoomIn,
    zoomOut,
    centerView,
  }
}
