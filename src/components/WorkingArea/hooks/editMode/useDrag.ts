import { useCallback, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { clampPan } from "@/components/WorkingArea/geometry"
import type { CurrentPhotoModel } from "./useCurrentPhoto"
import type { ZoomModel } from "./useZoom"

type DragInput = {
  curr: Pick<CurrentPhotoModel, "selectedPhoto">
  zoom: Pick<ZoomModel, "renderedRef" | "viewportRefSize" | "setPan">
}

export type DragModel = {
  isDragging: boolean
  onEditPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  onEditPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  endDrag: (e: ReactPointerEvent<HTMLDivElement>) => void
}

export const useDrag = ({
  curr,
  zoom,
}: DragInput): DragModel => {
  const { selectedPhoto } = curr
  const { renderedRef, viewportRefSize, setPan } = zoom
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null)
  const selectedPhotoRef = useRef(selectedPhoto)
  selectedPhotoRef.current = selectedPhoto

  const onEditPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const sel = selectedPhotoRef.current
    const r = renderedRef.current
    if (e.button !== 0 || !sel || r.width <= 0 || r.height <= 0) return
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY }
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [renderedRef])

  const onEditPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    dragRef.current = { ...drag, lastX: e.clientX, lastY: e.clientY }
    const r = renderedRef.current
    const vp = viewportRefSize.current
    setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, r, vp))
  }, [renderedRef, viewportRefSize, setPan])

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

  return { isDragging, onEditPointerDown, onEditPointerMove, endDrag }
}
