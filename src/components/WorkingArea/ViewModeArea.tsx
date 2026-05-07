import { useEffect, useMemo, useState, type ReactElement } from "react"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"
import { PhotoThumbnail } from "@/components/PhotoThumbnail"
import { GridCols } from "./components/GridCols"
import type { ViewGridMeasure } from "./hooks/useViewGridLayout"
import { useGridCols } from "./hooks/useGridCols"

export const ViewModeArea = ({ viewGridHeight, viewGridRef }: ViewGridMeasure): ReactElement => {
  const { photos, locale } = useAppStore((s) => s.present)
  const actions = useAppStore((s) => s.actions)
  const { viewGridCols } = useGridCols()
  const [scrollTop, setScrollTop] = useState(0)
  const [gridWidth, setGridWidth] = useState(0)

  useEffect(() => {
    const node = viewGridRef.current
    if (!node) return
    const onScroll = () => setScrollTop(node.scrollTop)
    const onResize = () => setGridWidth(node.clientWidth)
    onResize()
    onScroll()
    node.addEventListener("scroll", onScroll, { passive: true })
    const obs = new ResizeObserver(onResize)
    obs.observe(node)
    return () => {
      node.removeEventListener("scroll", onScroll)
      obs.disconnect()
    }
  }, [viewGridRef])

  const virtual = useMemo(() => {
    const total = photos.length
    if (total === 0) {
      return { from: 0, to: 0, topPx: 0, bottomPx: 0 }
    }
    const cols = Math.max(1, viewGridCols)
    const gap = 12
    const pad = 32
    const safeWidth = Math.max(0, gridWidth - pad)
    const cellW = Math.max(1, (safeWidth - (cols - 1) * gap) / cols)
    const rowH = cellW + 34
    const totalRows = Math.ceil(total / cols)
    const marginRows = 2
    const startRow = Math.max(0, Math.floor(scrollTop / rowH) - marginRows)
    const endRow = Math.min(totalRows, Math.ceil((scrollTop + viewGridHeight) / rowH) + marginRows)
    const from = startRow * cols
    const to = Math.min(total, endRow * cols)
    return {
      from,
      to,
      topPx: startRow * rowH,
      bottomPx: Math.max(0, (totalRows - endRow) * rowH),
    }
  }, [gridWidth, photos.length, scrollTop, viewGridCols, viewGridHeight])

  const visiblePhotos = photos.slice(virtual.from, virtual.to)

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={viewGridRef}
        className="grid min-h-0 flex-1 auto-rows-auto content-start items-start gap-3 overflow-auto p-4"
        style={{
          gridTemplateColumns: `repeat(${viewGridCols}, minmax(0, 1fr))`,
        }}
      >
        {photos.length === 0 && (
          <p className={chrome.mutedText}>{t(locale, (m) => m.labels.noPhotos)}</p>
        )}
        {photos.length > 0 && virtual.topPx > 0 && (
          <div style={{ height: `${virtual.topPx}px`, gridColumn: "1 / -1" }} />
        )}
        {visiblePhotos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className={`border hover:border-neutral-400/70 flex w-full max-w-full flex-col self-start rounded p-2 text-left text-xs transition-colors ${
              photo.selected
                ? `bg-neutral-500/40 border-neutral-500/50 ${chrome.panelText}`
                : `bg-neutral-700/20 border-neutral-600/20 ${chrome.mutedText}`
            }`}
            onClick={() => actions.toggleSelectPhoto(photo.id)}
            onDoubleClick={() => actions.openInEditor(photo.id)}
          >
            <PhotoThumbnail
              sourcePath={photo.thumbnailPath || photo.sourcePath}
              alt={photo.fileName}
              fit="contain"
              className={chrome.panelBg}
              style={{ aspectRatio: "1 / 1" }}
            />
            <p className={`mt-2 truncate ${chrome.panelText}`}>{photo.fileName}</p>
          </button>
        ))}
        {photos.length > 0 && virtual.bottomPx > 0 && (
          <div style={{ height: `${virtual.bottomPx}px`, gridColumn: "1 / -1" }} />
        )}
      </div>

      <GridCols />
    </section>
  )
}
