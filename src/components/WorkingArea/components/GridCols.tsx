import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "../../generic/Button";
import { chrome } from "../../layout/chromeTheme";
import { VIEW_GRID_COLS_DEFAULT, VIEW_GRID_COLS_MAX, VIEW_GRID_COLS_MIN } from "../constants";
import { GridColsContext, useGridCols } from "../hooks/useGridCols";
import { MinusIcon } from "../../icons/MinusIcon";
import { PlusIcon } from "../../icons/PlusIcon";

export function GridColsProvider({ children }: { children: ReactNode }): ReactElement {
  const [viewGridCols, setViewGridCols] = useState(VIEW_GRID_COLS_DEFAULT);
  const value = useMemo(
    () => ({ viewGridCols, setViewGridCols }),
    [viewGridCols]
  );
  return <GridColsContext.Provider value={value}>{children}</GridColsContext.Provider>;
}

export function GridCols(): ReactElement {
  const { viewGridCols, setViewGridCols } = useGridCols();

  return (
    <footer
      className={`flex h-8 w-full shrink-0 items-center justify-center gap-2 border-t border-neutral-600/50 ${chrome.panelBg}`}
    >
      <Button
        variant="subtle"
        size="xs"
        iconOnly
        aria-label="Zoom in"
        disabled={viewGridCols <= VIEW_GRID_COLS_MIN}
        onClick={() => setViewGridCols((c) => Math.max(VIEW_GRID_COLS_MIN, c - 1))}
      >
        <PlusIcon />
      </Button>
      <Button
        variant="subtle"
        size="xs"
        iconOnly
        aria-label="Zoom out"
        disabled={viewGridCols >= VIEW_GRID_COLS_MAX}
        onClick={() => setViewGridCols((c) => Math.min(VIEW_GRID_COLS_MAX, c + 1))}
      >
        <MinusIcon />
      </Button>
    </footer>
  );
}
