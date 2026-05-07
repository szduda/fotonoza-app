import type { ReactElement } from "react"
import { Button } from "@/components/generic/Button"
import { MinusIcon } from "@/components/icons/MinusIcon"
import { PlusIcon } from "@/components/icons/PlusIcon"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { getEditViewportCtl } from "@/lib/editViewportCtl"
import { useAppStore } from "@/store/appStore"

export const ViewPanel = (): ReactElement => {
  const { canZoomIn, canZoomOut, hasWorkPhoto } = useAppStore((s) => s.editChrome)

  return (
    <ToggledPanel id="edit-fit" label="View" className="border-b border-neutral-600/50 pb-2">
      <div className="flex gap-1 px-2 pt-1">
        <Button
          variant="outlined"
          size="sm"
          disabled={!hasWorkPhoto}
          onClick={() => getEditViewportCtl()?.centerView()}
        >
          Center
        </Button>

        <Button
          variant="outlined"
          size="sm"
          disabled={!hasWorkPhoto}
          onClick={() => getEditViewportCtl()?.fitToView()}
        >
          Fit To View
        </Button>

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
    </ToggledPanel>
  )
}
