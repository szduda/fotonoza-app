import {
  useCallback,
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
import { localImageSrc } from "@/lib/localImageSrc"
import { useAppStore } from "@/store/appStore"
import { EDIT_ZOOM_MAX, EDIT_ZOOM_MIN, EDIT_ZOOM_STEP } from "@/components/WorkingArea/constants"
import {
  clamp,
  clampPan,
  fitContainSize,
  isPhotoEqual,
  type Pan,
  type Size,
} from "@/components/WorkingArea/geometry"
import type { Photo } from "@/types/domain"

export type EditModeModel = {
  selectedPhoto: Photo | undefined
  editImageSrc: string
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
}

export const useEditMode = (): EditModeModel => {
  const mode = useAppStore((s) => s.present.mode)
  const photos = useAppStore((s) => s.present.photos)
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const actions = useAppStore((s) => s.actions)
  const editPreviewPath = useAppStore((s) => s.editPreviewPath)
  const editPreviewPhotoId = useAppStore((s) => s.editPreviewPhotoId)
  const previewEpoch = useAppStore((s) => s.editPreviewEpoch)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 })
  const [imageNatural, setImageNatural] = useState<Size>({ width: 0, height: 0 })
  const [imageFailed, setImageFailed] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null)
  const previousWorkedPhotoRef = useRef<{ id: string; sourcePath: string } | undefined>(undefined)

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const viewportRefSize = useRef(viewport)
  const imageNaturalRef = useRef(imageNatural)
  const renderedRef = useRef<Size>({ width: 0, height: 0 })
  zoomRef.current = zoom
  panRef.current = pan
  viewportRefSize.current = viewport
  imageNaturalRef.current = imageNatural

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

  const selectedPhotoRef = useRef(selectedPhoto)
  const editImageSrcRef = useRef(editImageSrc)
  const imageFailedRef = useRef(imageFailed)
  selectedPhotoRef.current = selectedPhoto
  editImageSrcRef.current = editImageSrc
  imageFailedRef.current = imageFailed

  const rendered = useMemo(
    () => fitContainSize(viewport, imageNatural, zoom),
    [viewport, imageNatural, zoom],
  )
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

  useEffect(() => {
    actions.syncEditChrome({
      canZoomIn,
      canZoomOut,
      hasWorkPhoto: !!(selectedPhoto && editImageSrc && !imageFailed),
    })
  }, [actions, canZoomIn, canZoomOut, selectedPhoto, editImageSrc, imageFailed])

  useEffect(() => {
    const node = viewportRef.current
    if (!node || mode !== "edit") return
    const measure = () => {
      const rect = node.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      setViewport((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(node)
    return () => obs.disconnect()
  }, [mode])

  const fitToView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const centerView = useCallback(() => {
    setPan({ x: 0, y: 0 })
  }, [])

  const applyZoomAtCenter = useCallback((nextZoom: number) => {
    const sel = selectedPhotoRef.current
    const src = editImageSrcRef.current
    if (!sel || !src || imageFailedRef.current) return

    const currentZoom = zoomRef.current
    const pan = panRef.current
    const vp = viewportRefSize.current
    const nat = imageNaturalRef.current
    if (nextZoom === currentZoom) return

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

    const cursorFromCenterX = 0
    const cursorFromCenterY = 0
    const nextPan = {
      x:
        cursorFromCenterX -
        ((cursorFromCenterX - pan.x) / currentRendered.width) * nextRendered.width,
      y:
        cursorFromCenterY -
        ((cursorFromCenterY - pan.y) / currentRendered.height) * nextRendered.height,
    }

    setZoom(nextZoom)
    setPan(clampPan(nextPan, nextRendered, vp))
  }, [])

  const zoomIn = useCallback(() => {
    const z = zoomRef.current
    const sel = selectedPhotoRef.current
    const src = editImageSrcRef.current
    if (!sel || !src || imageFailedRef.current) return
    const next = clamp(z * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    if (next <= z + 1e-9) return
    applyZoomAtCenter(next)
  }, [applyZoomAtCenter])

  const zoomOut = useCallback(() => {
    const z = zoomRef.current
    const sel = selectedPhotoRef.current
    const src = editImageSrcRef.current
    if (!sel || !src || imageFailedRef.current) return
    const next = clamp(z / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
    if (next >= z - 1e-9) return
    applyZoomAtCenter(next)
  }, [applyZoomAtCenter])

  useEffect(() => {
    const currentWorked = selectedPhoto
      ? { id: selectedPhoto.id, sourcePath: selectedPhoto.sourcePath }
      : undefined
    if (!isPhotoEqual(previousWorkedPhotoRef.current, currentWorked)) {
      fitToView()
      setImageNatural({ width: 0, height: 0 })
      setImageFailed(false)
      previousWorkedPhotoRef.current = currentWorked
    }
  }, [selectedPhoto, fitToView])

  useEffect(() => {
    setImageFailed(false)
  }, [editImageSrc, previewEpoch])

  useEffect(() => {
    setPan((prev) => {
      const next = clampPan(prev, rendered, viewport)
      if (next.x === prev.x && next.y === prev.y) return prev
      return next
    })
  }, [rendered, viewport])

  useEffect(() => {
    if (mode !== "edit") return
    if (currentPhotoId) return
    if (photos.length === 0) return
    actions.openInEditor(photos[0].id)
  }, [mode, currentPhotoId, photos, actions])

  const onEditWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    const sel = selectedPhotoRef.current
    const src = editImageSrcRef.current
    if (!sel || !src || imageFailedRef.current) return
    e.preventDefault()

    const currentZoom = zoomRef.current
    const pan = panRef.current
    const vp = viewportRefSize.current
    const nat = imageNaturalRef.current

    const nextZoom =
      e.deltaY > 0
        ? clamp(currentZoom / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
        : clamp(currentZoom * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)

    if (nextZoom === currentZoom) return

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

    const rect = e.currentTarget.getBoundingClientRect()
    const cursorFromCenterX = e.clientX - rect.left - rect.width / 2
    const cursorFromCenterY = e.clientY - rect.top - rect.height / 2

    const nextPan = {
      x:
        cursorFromCenterX -
        ((cursorFromCenterX - pan.x) / currentRendered.width) * nextRendered.width,
      y:
        cursorFromCenterY -
        ((cursorFromCenterY - pan.y) / currentRendered.height) * nextRendered.height,
    }

    setZoom(nextZoom)
    setPan(clampPan(nextPan, nextRendered, vp))
  }, [])

  const onEditPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const sel = selectedPhotoRef.current
    const r = renderedRef.current
    if (e.button !== 0 || !sel || r.width <= 0 || r.height <= 0) return
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY }
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onEditPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    dragRef.current = { ...drag, lastX: e.clientX, lastY: e.clientY }
    const r = renderedRef.current
    const vp = viewportRefSize.current
    setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, r, vp))
  }, [])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag && drag.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
      dragRef.current = null
      setIsDragging(false)
    }
  }, [])

  return {
    selectedPhoto,
    editImageSrc,
    previewEpoch,
    imageFailed,
    setImageNatural,
    setImageFailed,
    viewportRef,
    isDragging,
    rendered,
    pan,
    zoom,
    canZoomIn,
    canZoomOut,
    onEditWheel,
    onEditPointerDown,
    onEditPointerMove,
    endDrag,
    fitToView,
    zoomIn,
    zoomOut,
    centerView,
  }
}
