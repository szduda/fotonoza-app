import type { ReactElement } from "react";
import { ToggledPanel } from "./ToggledPanel";
import { chrome } from "./layout/chromeTheme";
import { useExportMonitor } from "../hooks/useExportMonitor";

export function ExportProgressPanel(): ReactElement | null {
  const { status, isVisible, isFinished, close } = useExportMonitor();

  if (!isVisible || !status) return null;

  const done = status.completed + status.failed;
  const percent = status.total > 0 ? Math.min(100, Math.round((done / status.total) * 100)) : 0;

  return (
    <div className="shrink-0 border-t border-neutral-600/50">
      <ToggledPanel id="export-progress" label="Export progress" height={120} defaultOpen>
        <div className="px-2 py-1.5 text-xs">
        <div className={`mb-1 flex items-center justify-between ${chrome.mutedText}`}>
          <span>{done} / {status.total}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-neutral-700/60">
          <div className="h-full bg-neutral-300/80 transition-all" style={{ width: `${percent}%` }} />
        </div>

        {isFinished && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <div className="flex items-center gap-1 text-emerald-400">
              <DoneIcon />
              <span>Export finished</span>
            </div>
            <button
              type="button"
              className={`rounded border border-neutral-600/50 px-2 py-1 text-[11px] ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/40 hover:text-neutral-800`}
              onClick={close}
            >
              Close
            </button>
          </div>
        )}
        </div>
      </ToggledPanel>
    </div>
  );
}

function DoneIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
