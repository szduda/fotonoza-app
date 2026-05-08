import type { ReactElement } from "react"
import { useAppStore } from "@/store/appStore"
import { ExportProgressPanel } from "@/components/panels/ExportProgressPanel"
import { HistoryPanel } from "@/components/panels/HistoryPanel"
import { CollectionPanel } from "@/components/panels/CollectionPanel"
import { FilterPanel } from "@/components/panels/FilterPanel"
import { MetadataPanel } from "@/components/panels/MetadataPanel"
import { ViewPanel } from "@/components/panels/ViewPanel"

export const LeftSidebar = (): ReactElement => {
  const mode = useAppStore((s) => s.present.mode)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <HistoryPanel />
      <CollectionPanel />
      <MetadataPanel />
      <FilterPanel />

      {mode === "edit" && <ViewPanel />}
      <ExportProgressPanel />
    </div>
  )
}
