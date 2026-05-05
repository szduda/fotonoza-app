import type { ReactElement } from "react";
import { useAppStore } from "../../store/appStore";
import { ExportProgressPanel } from "../panels/ExportProgressPanel";
import { HistoryPanel } from "../panels/HistoryPanel";
import { ViewPanel } from "../panels/ViewPanel";

export function LeftSidebar({
  fitToView,
  centerView,
  zoomIn,
  zoomOut,
  canUseView,
  canZoomIn,
  canZoomOut,
}: {
  fitToView: () => void;
  centerView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canUseView: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
}): ReactElement {
  const mode = useAppStore((s) => s.present.mode);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <HistoryPanel />

        {mode === "edit" && (
          <ViewPanel
            fitToView={fitToView}
            centerView={centerView}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            canUseView={canUseView}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
          />
        )}
      </div>

      <ExportProgressPanel />
    </div>
  );
}
