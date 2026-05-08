import type { ReactElement } from "react"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"
import { GridColsProvider } from "./components/GridCols"
import { EditModeArea } from "./EditModeArea"
import { ViewModeArea } from "./ViewModeArea"

export const WorkingArea = (): ReactElement => {
  const mode = useAppStore((s) => s.present.mode)
  const locale = useAppStore((s) => s.present.locale)

  return (
    <GridColsProvider>
      {mode === "import" ? (
        <section className="grid flex-1 place-items-center">
          <div className={`text-center text-sm ${chrome.mutedText}`}>
            {t(locale, (m) => m.actions.importFromDevice)}
          </div>
        </section>
      ) : mode === "view" ? (
        <ViewModeArea />
      ) : (
        <EditModeArea />
      )}
    </GridColsProvider>
  )
}
