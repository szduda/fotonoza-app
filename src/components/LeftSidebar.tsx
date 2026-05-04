import type { ReactElement } from "react";
import { HistoryPanel } from "./HistoryPanel";
import { ExportProgressPanel } from "./ExportProgressPanel";

export function LeftSidebar(): ReactElement {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-b border-neutral-600/50">
        <HistoryPanel />
      </div>
      <ExportProgressPanel />
    </div>
  );
}
