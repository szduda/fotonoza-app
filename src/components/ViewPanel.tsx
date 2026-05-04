import type { ReactElement } from "react";
import { Button } from "./Button";
import { MinusIcon } from "./WorkingArea/components/MinusIcon";
import { PlusIcon } from "./WorkingArea/components/PlusIcon";
import { ToggledPanel } from "./ToggledPanel";

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
      height={68}
      className="border-b border-neutral-600/50">
      <div className="flex gap-1 px-2 pt-1">
        <Button
          variant="outlined"
          size="sm"
          disabled={!canUseView}
          onClick={centerView}>
          Center
        </Button>

        <Button
          variant="outlined"
          size="sm"
          disabled={!canUseView}
          onClick={fitToView}>
          Fit To View
        </Button>

        <Button
          variant="subtle"
          size="sm"
          iconOnly
          aria-label="Zoom out 10%"
          disabled={!canUseView || !canZoomOut}
          onClick={zoomOut}>
          <MinusIcon />
        </Button>

        <Button
          variant="subtle"
          size="sm"
          iconOnly
          aria-label="Zoom in 10%"
          disabled={!canUseView || !canZoomIn}
          onClick={zoomIn}>
          <PlusIcon />
        </Button>
      </div>
    </ToggledPanel>
  );
}
