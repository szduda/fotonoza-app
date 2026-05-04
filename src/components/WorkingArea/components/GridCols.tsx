import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { chrome } from "../../layout/chromeTheme";
import { VIEW_GRID_COLS_DEFAULT, VIEW_GRID_COLS_MAX, VIEW_GRID_COLS_MIN } from "../constants";
import { GridColsContext, useGridCols } from "../hooks/useGridCols";
import { MinusIcon } from "./MinusIcon";
import { PlusIcon } from "./PlusIcon";

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

  const iconBtn = `flex h-7 w-7 items-center justify-center rounded border border-neutral-600/50 ${chrome.panelBg} ${chrome.panelText} transition-colors enabled:hover:bg-neutral-400/35 disabled:cursor-not-allowed disabled:opacity-35`;

  return (
    <footer
      className={`flex h-8 w-full shrink-0 items-center justify-center gap-2 border-t border-neutral-600/50 ${chrome.panelBg}`}
    >
      <button
        type="button"
        className={iconBtn}
        aria-label="Zoom in"
        disabled={viewGridCols <= VIEW_GRID_COLS_MIN}
        onClick={() => setViewGridCols((c) => Math.max(VIEW_GRID_COLS_MIN, c - 1))}
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        className={iconBtn}
        aria-label="Zoom out"
        disabled={viewGridCols >= VIEW_GRID_COLS_MAX}
        onClick={() => setViewGridCols((c) => Math.min(VIEW_GRID_COLS_MAX, c + 1))}
      >
        <MinusIcon />
      </button>
    </footer>
  );
}
