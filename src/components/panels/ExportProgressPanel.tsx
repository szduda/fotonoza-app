import { isTauri } from "@tauri-apps/api/core"
import { open as openInShell } from "@tauri-apps/plugin-shell"
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
  const outputDir = status.outputDir?.trim() ?? ""

  const showExportFolder = (): void => {
    if (!outputDir || !isTauri()) return
    void openInShell(outputDir).catch(() => {})
  }

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
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {isFinished && (
            <div className="w-full flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <DoneIcon />
                <span>Export finished</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outlined" size="xs" onClick={showExportFolder} disabled={!outputDir} >
                  Show
                </Button>
                <Button variant="subtle" size="xs" onClick={close} className="bg-transparent">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </ToggledPanel>
    </div>
  )
}
