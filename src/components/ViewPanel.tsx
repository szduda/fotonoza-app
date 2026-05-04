import type { ReactElement } from "react";
import { MinusIcon } from "./WorkingArea/components/MinusIcon";
import { PlusIcon } from "./WorkingArea/components/PlusIcon";
import { chrome } from "./layout/chromeTheme";
import { ToggledPanel } from "./ToggledPanel";

const btn =
  `rounded border border-neutral-600/50 px-2 py-1 text-xs transition-colors ${chrome.panelBg} ${chrome.panelText} enabled:hover:bg-neutral-400/35 disabled:cursor-not-allowed disabled:opacity-35`;

const iconBtn = `flex h-7 w-7 shrink-0 items-center justify-center ${btn}`;

export function ViewPanel({
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
  return (
    <ToggledPanel
      id="edit-fit"
      label="View"
      height={120}
      className="border-b border-neutral-600/50"
    >
      <div className="flex flex-col gap-1.5 px-2 pb-2 pt-0">
        <div className="flex justify-center gap-1.5">
          <button
            type="button"
            className={iconBtn}
            aria-label="Zoom out 10%"
            disabled={!canUseView || !canZoomOut}
            onClick={zoomOut}
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            className={iconBtn}
            aria-label="Zoom in 10%"
            disabled={!canUseView || !canZoomIn}
            onClick={zoomIn}
          >
            <PlusIcon />
          </button>
        </div>
        <div className="flex justify-center gap-1.5">
          <button
            type="button"
            className={`min-w-0 flex-1 ${btn}`}
            disabled={!canUseView}
            onClick={centerView}
          >
            Center
          </button>
          <button
            type="button"
            className={`min-w-0 flex-1 ${btn}`}
            disabled={!canUseView}
            onClick={fitToView}
          >
            Fit To View
          </button>
        </div>
      </div>
    </ToggledPanel>
  );
}
