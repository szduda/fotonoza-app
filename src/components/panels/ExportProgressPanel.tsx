import clsx from "clsx"
import type { ReactElement } from "react"
import { Button } from "@/components/generic/Button"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { chrome } from "@/components/layout/chromeTheme"
import { useExportMonitor } from "@/hooks/useExportMonitor"
import { DoneIcon } from "@/components/icons/DoneIcon"

export const ExportProgressPanel = (): ReactElement | null => {
  const { status, isVisible, isFinished, close } = useExportMonitor()

  if (!isVisible || !status) return null

  const done = status.completed + status.failed
  const percent = status.total > 0 ? Math.min(100, Math.round((done / status.total) * 100)) : 0

  return (
    <div className="shrink-0 border-t border-neutral-600/50 bg-neutral-900 z-10">
      <ToggledPanel
        id="export-progress"
        label="Export progress"
        className="bg-yellow-700/5"
        height={112}
        defaultOpen
      >
        <div className="px-2 pt-3 pb-2 text-xs flex flex-col gap-3">
          <div>
            <div className={`mb-1 flex items-center justify-between ${chrome.mutedText}`}>
              <span>
                {done} / {status.total}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-neutral-700/60">
              <div
                className="h-full bg-neutral-500/70 transition-all"
                style={{ width: `${percent / 2}%` }}
              />
            </div>
          </div>
          {isFinished && (
            <div className="w-full flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <DoneIcon />
                <span>Export finished</span>
              </div>
              <Button variant="outlined" size="sm" onClick={close}>
                Close
              </Button>
            </div>
          )}
        </div>
      </ToggledPanel>
    </div>
  )
}
