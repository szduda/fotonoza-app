import { Grid, type GridImperativeAPI } from "react-window"
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react"
import { useTimelinePhotosStable } from "@/hooks/useTimelinePhotosStable"
import { useAppStore } from "@/store/appStore"
import { TimelineThumb } from "./TimelineThumb"
import type { Photo } from "@/types/domain"

type ThumbExtras = { photos: Photo[] }

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
  }, [photos.length, height])

  useEffect(() => {
    initIdxRef.current = Math.max(
      0,
      photos.findIndex((p) => p.id === currentPhotoId),
    )
  }, [])

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
