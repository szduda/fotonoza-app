import { Grid } from "react-window"
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"
import { useViewModeRating } from "@/hooks/useViewModeRating"
import { GridCols } from "./components/GridCols"
import { ViewModeGridThumb } from "./components/ViewModeGridThumb"
import { useGridCols } from "./hooks/useGridCols"
import type { Photo } from "@/types/domain"

type ThumbExtras = { cols: number; cellW: number; photos: Photo[] }

/** Simple virtual photo grid — sizing from {@link Grid} `onResize`. */
export const ViewModeArea = (): ReactElement => {
  const { photos, locale } = useAppStore((s) => s.present)
  useViewModeRating()
  const { viewGridCols } = useGridCols()
  const viewGridRef = useRef<HTMLDivElement | null>(null)

  const [vw, setVw] = useState(0)

  useEffect(() => {
    if (photos.length === 0) viewGridRef.current = null
  }, [photos.length, viewGridRef])

  const grid = useMemo(() => {
    const cellW = vw / viewGridCols
    return {
      cols: viewGridCols,
      rowCount: Math.max(1, Math.ceil(photos.length / viewGridCols)),
      strideW: cellW,
      strideH: cellW,
      cellProps: { cols: viewGridCols, cellW, photos },
    }
  }, [photos, viewGridCols, vw])

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {photos.length === 0 ? (
        <p className={`p-4 ${chrome.mutedText}`}>{t(locale, (m) => m.labels.noPhotos)}</p>
      ) : (
        <Grid<ThumbExtras>
          gridRef={(api) => {
            viewGridRef.current = api?.element ?? null
          }}
          overscanCount={2}
          columnCount={grid.cols}
          rowCount={grid.rowCount}
          columnWidth={grid.strideW}
          rowHeight={grid.strideH}
          cellProps={grid.cellProps}
          cellComponent={ViewModeGridThumb}
          onResize={(s) => {
            setVw((w) => (w === s.width ? w : s.width))
          }}
        />
      )}

      <GridCols />
    </section>
  )
}
