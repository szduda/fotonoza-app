import type { ReactElement } from "react"
import { Button } from "@/components/generic/Button"
import { MinusIcon } from "@/components/icons/MinusIcon"
import { PlusIcon } from "@/components/icons/PlusIcon"
import { ToggledPanel } from "@/components/generic/ToggledPanel"

export const ViewPanel = ({
  fitToView,
  centerView,
  zoomIn,
  zoomOut,
  canUseView,
  canZoomIn,
  canZoomOut,
}: {
  fitToView: () => void
  centerView: () => void
  zoomIn: () => void
  zoomOut: () => void
  canUseView: boolean
  canZoomIn: boolean
  canZoomOut: boolean
}): ReactElement => {
  return (
    <ToggledPanel id="edit-fit" label="View" className="border-b border-neutral-600/50 pb-2">
      <div className="flex gap-1 px-2 pt-1">
        <Button variant="outlined" size="sm" disabled={!canUseView} onClick={centerView}>
          Center
        </Button>

        <Button variant="outlined" size="sm" disabled={!canUseView} onClick={fitToView}>
          Fit To View
        </Button>

        <Button
          variant="subtle"
          size="sm"
          iconOnly
          aria-label="Zoom out 10%"
          disabled={!canUseView || !canZoomOut}
          onClick={zoomOut}
        >
          <MinusIcon />
        </Button>

        <Button
          variant="subtle"
          size="sm"
          iconOnly
          aria-label="Zoom in 10%"
          disabled={!canUseView || !canZoomIn}
          onClick={zoomIn}
        >
          <PlusIcon />
        </Button>
      </div>
    </ToggledPanel>
  )
}
