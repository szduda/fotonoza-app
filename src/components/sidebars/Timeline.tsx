import { Grid, type GridImperativeAPI } from "react-window"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTimelinePhotosStable } from "@/hooks/useTimelinePhotosStable"
import { useAppStore } from "@/store/appStore"
import { TimelineThumb } from "./TimelineThumb"
import type { Photo } from "@/types/domain"

type ThumbExtras = { photos: Photo[] }

/** Single-row virtual strip — sizing from {@link Grid} `onResize` only (like {@link ViewModeArea}). */
export const Timeline = () => {
  const mode = useAppStore((s) => s.present.mode)
  const currentPhotoId = useAppStore((s) => s.present.currentPhotoId)
  const photos = useTimelinePhotosStable()

  const [vh, setVh] = useState(0)
  const gridCtl = useRef<GridImperativeAPI | null>(null)

  useLayoutEffect(() => {
    const root = gridCtl.current?.element ?? null
    if (!root) return

    const onWheel = (e: WheelEvent) => {
      const maxLeft = Math.max(0, root.scrollWidth - root.clientWidth)
      const { scrollLeft } = root
      root.scrollLeft = Math.min(maxLeft, Math.max(0, scrollLeft + e.deltaY))
      e.preventDefault()
    }

    root.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => root.removeEventListener("wheel", onWheel, true)
  }, [gridCtl.current])

  const grid = useMemo(() => {
    const rowH = vh > 0 ? vh : 48
    const strideW = vh > 0 ? vh * (3 / 2) : 120
    return {
      columnCount: photos.length,
      strideW,
      rowH,
      cellProps: { photos } satisfies { photos: Photo[] },
    }
  }, [photos, vh])

  useEffect(() => {
    if (mode !== "edit" || photos.length === 0 || vh <= 0) return
    const idx = Math.max(
      0,
      photos.findIndex((p) => p.id === currentPhotoId),
    )
    const raf = requestAnimationFrame(() => {
      gridCtl.current?.scrollToColumn({
        align: "center",
        behavior: "auto",
        index: idx,
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [currentPhotoId, mode, photos, vh])

  if (mode !== "edit") {
    return null
  }

  return (
    <div className="flex min-h-0 h-full w-full flex-1 overflow-hidden">
      {photos.length > 0 ? (
        <Grid<ThumbExtras>
          gridRef={(api) => {
            gridCtl.current = api
          }}
          overscanCount={4}
          columnCount={grid.columnCount}
          rowCount={1}
          columnWidth={grid.strideW}
          rowHeight={grid.rowH}
          cellProps={grid.cellProps}
          cellComponent={TimelineThumb}
          onResize={(s) => {
            setVh((h) => (h === s.height ? h : s.height))
          }}
        />
      ) : null}
    </div>
  )
}
