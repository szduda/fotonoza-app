import type { ReactElement } from "react"
import { useAppStore } from "@/store/appStore"
import { ExportProgressPanel } from "@/components/panels/ExportProgressPanel"
import { HistoryPanel } from "@/components/panels/HistoryPanel"
import { ViewPanel } from "@/components/panels/ViewPanel"

export const LeftSidebar = (): ReactElement => {
  const mode = useAppStore((s) => s.present.mode)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <HistoryPanel />

        {mode === "edit" && <ViewPanel />}
      </div>

      <ExportProgressPanel />
    </div>
  )
}
