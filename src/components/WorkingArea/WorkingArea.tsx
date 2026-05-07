import type { ReactElement } from "react"
import { useLayoutEffect } from "react"
import { t } from "@/lib/i18n"
import { setEditViewportCtl } from "@/lib/editViewportCtl"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"
import { GridColsProvider } from "./components/GridCols"
import { EditModeArea } from "./EditModeArea"
import { useEditMode } from "./hooks/useEditMode"
import { useViewGridLayout } from "./hooks/useViewGridLayout"
import { ViewModeArea } from "./ViewModeArea"

export const WorkingArea = (): ReactElement => {
  const mode = useAppStore((s) => s.present.mode)
  const locale = useAppStore((s) => s.present.locale)
  const viewGrid = useViewGridLayout()
  const edit = useEditMode()

  useLayoutEffect(() => {
    setEditViewportCtl({
      fitToView: edit.fitToView,
      centerView: edit.centerView,
      zoomIn: edit.zoomIn,
      zoomOut: edit.zoomOut,
    })
    return () => setEditViewportCtl(null)
  }, [edit.fitToView, edit.centerView, edit.zoomIn, edit.zoomOut])

  return (
    <GridColsProvider>
      {mode === "import" ? (
        <section className="grid flex-1 place-items-center">
          <div className={`text-center text-sm ${chrome.mutedText}`}>
            {t(locale, (m) => m.actions.importFromDevice)}
          </div>
        </section>
      ) : mode === "view" ? (
        <ViewModeArea {...viewGrid} />
      ) : (
        <EditModeArea {...edit} />
      )}
    </GridColsProvider>
  )
}
