import { useState, type ReactElement } from "react";
import { ChromeLayout } from "./layout/ChromeLayout";
import { TopBarLayout } from "./layout/TopBarLayout";
import { LeftSidebarLayout } from "./layout/LeftSidebarLayout";
import { RightSidebarLayout } from "./layout/RightSidebarLayout";
import { TimelineLayout } from "./layout/TimelineLayout";
import { WorkingAreaLayout } from "./layout/WorkingAreaLayout";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { Timeline } from "./Timeline";
import { WorkingArea } from "./WorkingArea";
import { ExportModal } from "./ExportModal";

export function AppLayout(): ReactElement {
  const [exportOpen, setExportOpen] = useState(false);

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
          <TimelineLayout>
            <Timeline />
          </TimelineLayout>
        }
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
