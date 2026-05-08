import { useState, type ReactElement } from "react"
import { ChromeLayout } from "./layout/ChromeLayout"
import { TopBarLayout } from "./layout/TopBarLayout"
import { LeftSidebarLayout } from "./layout/LeftSidebarLayout"
import { RightSidebarLayout } from "./layout/RightSidebarLayout"
import { TimelineLayout } from "./layout/TimelineLayout"
import { WorkingAreaLayout } from "./layout/WorkingAreaLayout"
import { TopBar } from "./sidebars/TopBar"
import { LeftSidebar } from "./sidebars/LeftSidebar"
import { RightSidebar } from "./sidebars/RightSidebar"
import { Timeline } from "./sidebars/Timeline"
import { WorkingArea } from "./WorkingArea"
import { ExportModal } from "./ExportModal"
import { useAppStore } from "@/store/appStore"

export const AppLayout = (): ReactElement => {
  const [exportOpen, setExportOpen] = useState(false)
  const mode = useAppStore((s) => s.present.mode)

  return (
    <>
      <ChromeLayout
        topBar={
          <TopBarLayout>
            <TopBar onOpenExport={() => setExportOpen(true)} />
          </TopBarLayout>
        }
        leftSidebar={
          <LeftSidebarLayout>
            <LeftSidebar />
          </LeftSidebarLayout>
        }
        workingArea={
          <WorkingAreaLayout>
            <WorkingArea />
          </WorkingAreaLayout>
        }
        rightSidebar={
          <RightSidebarLayout>
            <RightSidebar />
          </RightSidebarLayout>
        }
        timeline={
          <TimelineLayout mode={mode}>
            <Timeline />
          </TimelineLayout>
        }
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
