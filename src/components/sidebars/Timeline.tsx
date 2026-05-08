import { Grid, type GridImperativeAPI } from "react-window"
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react"
import { useTimelinePhotosStable } from "@/hooks/useTimelinePhotosStable"
import { takeTimelineKeyboardStepScroll } from "@/lib/timelineKeyboardStepScroll"
import { useAppStore } from "@/store/appStore"
import { TimelineThumb } from "./TimelineThumb"
import type { Photo } from "@/types/domain"

type ThumbExtras = { photos: Photo[] }

const columnIntersectsViewport = (
  col: number,
  stride: number,
  scrollLeft: number,
  viewportW: number,
): boolean => {
  const left = col * stride
  const right = left + stride
  const viewLeft = scrollLeft
  const viewRight = scrollLeft + viewportW
  return right > viewLeft && left < viewRight
}

/** Single-row virtual strip — sizing from {@link Grid} `onResize` only (like {@link ViewModeArea}). */
export const Timeline = () => {
  const height = useAppStore((s) => s.present.layout.timelineHeightPx)
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const photos = useTimelinePhotosStable()

  const gridCtl = useRef<GridImperativeAPI | null>(null)
  const [gridEpoch, bumpGridRef] = useReducer((n: number) => n + 1, 0)
  const [isReady, setIsReady] = useState(false)
  const initIdxRef = useRef(0)
  const centeredRef = useRef(false)
  const prevSelIdxRef = useRef<number | null>(null)

  const gridRef = useCallback(
    (api: GridImperativeAPI | null) => {
      gridCtl.current = api
      bumpGridRef()
      if (api) queueMicrotask(bumpGridRef)
    },
    [bumpGridRef],
  )

  useLayoutEffect(() => {
    const root = gridCtl.current?.element ?? null
    if (!root) return

    const onWheel = (e: WheelEvent) => {
      root.scrollLeft += e.deltaY
      e.preventDefault()
    }

    root.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => root.removeEventListener("wheel", onWheel, true)
  }, [gridEpoch])

  const grid = useMemo(() => {
    return {
      columnCount: photos.length,
      strideW: height * (3 / 2),
      rowH: height - 1,
      cellProps: { photos } satisfies { photos: Photo[] },
    }
  }, [photos, height])

  useEffect(() => {
    initIdxRef.current = Math.max(0, photos.findIndex((p) => p.id === currentPhotoId))
  }, [currentPhotoId, photos])

  /** After initial centering, Ctrl+Arrow steps the strip when the prior column was visible; clicks never scroll. */
  useLayoutEffect(() => {
    const keyboardStep = takeTimelineKeyboardStepScroll()
    const idx = Math.max(0, photos.findIndex((p) => p.id === currentPhotoId))
    const root = gridCtl.current?.element ?? null
    if (!centeredRef.current || !root) return

    const prev = prevSelIdxRef.current
    prevSelIdxRef.current = idx
    if (prev === null || prev === idx) return

    if (!keyboardStep) return

    const stride = height * (3 / 2)
    if (!columnIntersectsViewport(prev, stride, root.scrollLeft, root.clientWidth)) return

    root.scrollBy({ left: (idx - prev) * stride, behavior: "smooth" })
  }, [currentPhotoId, photos, height, gridEpoch])

  const onGridResize = useCallback(({ width }: { width: number; height: number }) => {
    if (centeredRef.current || width <= 0) return

    centeredRef.current = true
    requestAnimationFrame(() => {
      gridCtl.current?.scrollToColumn({
        align: "center",
        behavior: "auto",
        index: initIdxRef.current,
      })
      setIsReady(true)
    })
  }, [])

  if (!photos.length) return null

  return (
    <Grid<ThumbExtras>
      gridRef={gridRef}
      overscanCount={4}
      columnCount={grid.columnCount}
      rowCount={1}
      columnWidth={grid.strideW}
      rowHeight={grid.rowH}
      cellProps={grid.cellProps}
      cellComponent={TimelineThumb}
      onResize={onGridResize}
      style={isReady ? undefined : { visibility: "hidden" }}
    />
  )
}
