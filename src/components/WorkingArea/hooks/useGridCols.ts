import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export type GridColsValue = {
  viewGridCols: number;
  setViewGridCols: Dispatch<SetStateAction<number>>;
};

export const GridColsContext = createContext<GridColsValue | null>(null);

export function useGridCols(): GridColsValue {
  const ctx = useContext(GridColsContext);
  if (!ctx) {
    throw new Error("useGridCols must be used within GridColsProvider");
  }
  return ctx;
}
