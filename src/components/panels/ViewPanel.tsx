import type { ReactElement } from "react"
import { Button } from "@/components/generic/Button"
import { MinusIcon } from "@/components/icons/MinusIcon"
import { PlusIcon } from "@/components/icons/PlusIcon"
import { ToggleRow } from "@/components/generic/ToggleRow"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { getEditViewportCtl } from "@/lib/editViewportCtl"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"

export const ViewPanel = (): ReactElement => {
  const { canZoomIn, canZoomOut, hasWorkPhoto } = useAppStore((s) => s.editChrome)
  const locale = useAppStore((s) => s.present.locale)
  const { focusPeaking, highlightClipping } = useAppStore((s) => s.gpuPreviewAssist)
  const patchAssist = useAppStore((s) => s.actions.patchGpuPreviewAssist)

  return (
    <ToggledPanel id="edit-fit" label="View" contentPadding="">
      <div className="space-y-1 p-3">
        <ToggleRow
          label={t(locale, (m) => m.labels.focusPeaking)}
          enabled={focusPeaking}
          onChange={(v) => patchAssist({ focusPeaking: v })}
        />
        <ToggleRow
          label={t(locale, (m) => m.labels.highlightClipping)}
          enabled={highlightClipping}
          onChange={(v) => patchAssist({ highlightClipping: v })}
        />
      </div>
      <div className="flex gap-1 p-3 mt-0.5 flex-wrap justify-between border-t border-neutral-600/30">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outlined"
            size="xs"
            disabled={!hasWorkPhoto}
            onClick={() => getEditViewportCtl()?.centerView()}
          >
            Center
          </Button>

          <Button
            variant="outlined"
            size="xs"
            disabled={!hasWorkPhoto}
            onClick={() => getEditViewportCtl()?.fitToView()}
          >
            Fit To View
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            variant="subtle"
            size="sm"
            iconOnly
            aria-label="Zoom out 10%"
            disabled={!hasWorkPhoto || !canZoomOut}
            onClick={() => getEditViewportCtl()?.zoomOut()}
          >
            <MinusIcon />
          </Button>

          <Button
            variant="subtle"
            size="sm"
            iconOnly
            aria-label="Zoom in 10%"
            disabled={!hasWorkPhoto || !canZoomIn}
            onClick={() => getEditViewportCtl()?.zoomIn()}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
    </ToggledPanel>
  )
}
