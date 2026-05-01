import type { ReactElement } from "react";

/** Which inner seam the resize grips sit on (inside the panel, toward the working area). */
export type PanelResizeEdge = "innerBottom" | "innerTop" | "innerRight" | "innerLeft";

type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

export function PanelResizeHandles({
  edge,
  collapsed,
  ...ptr
}: {
  edge: PanelResizeEdge;
  collapsed: boolean;
} & PointerHandlers): ReactElement {
  if (edge === "innerBottom") {
    return collapsed ? (
      <div
        role="separator"
        aria-orientation="horizontal"
        className="absolute bottom-0 left-10 right-10 z-20 h-2.5 cursor-row-resize"
        {...ptr}
      />
    ) : (
      <>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="absolute bottom-0 left-0 z-20 h-2.5 w-[calc(50%-40px)] cursor-row-resize"
          {...ptr}
        />
        <div
          role="separator"
          aria-orientation="horizontal"
          className="absolute bottom-0 right-0 z-20 h-2.5 w-[calc(50%-40px)] cursor-row-resize"
          {...ptr}
        />
      </>
    );
  }

  if (edge === "innerTop") {
    return collapsed ? (
      <div
        role="separator"
        aria-orientation="horizontal"
        className="absolute left-10 right-10 top-0 z-20 h-2.5 cursor-row-resize"
        {...ptr}
      />
    ) : (
      <>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="absolute left-0 top-0 z-20 h-2.5 w-[calc(50%-40px)] cursor-row-resize"
          {...ptr}
        />
        <div
          role="separator"
          aria-orientation="horizontal"
          className="absolute right-0 top-0 z-20 h-2.5 w-[calc(50%-40px)] cursor-row-resize"
          {...ptr}
        />
      </>
    );
  }

  if (edge === "innerRight") {
    return collapsed ? (
      <div
        role="separator"
        aria-orientation="vertical"
        className="absolute right-0 top-10 bottom-10 z-20 w-3 cursor-col-resize"
        {...ptr}
      />
    ) : (
      <>
        <div
          role="separator"
          aria-orientation="vertical"
          className="absolute right-0 top-2 z-20 h-[calc(50%-2.25rem)] w-3 cursor-col-resize"
          {...ptr}
        />
        <div
          role="separator"
          aria-orientation="vertical"
          className="absolute bottom-2 right-0 z-20 h-[calc(50%-2.25rem)] w-3 cursor-col-resize"
          {...ptr}
        />
      </>
    );
  }

  /* innerLeft */
  return collapsed ? (
    <div
      role="separator"
      aria-orientation="vertical"
      className="absolute left-0 top-10 bottom-10 z-20 w-3 cursor-col-resize"
      {...ptr}
    />
  ) : (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        className="absolute left-0 top-2 z-20 h-[calc(50%-2.25rem)] w-3 cursor-col-resize"
        {...ptr}
      />
      <div
        role="separator"
        aria-orientation="vertical"
        className="absolute bottom-2 left-0 z-20 h-[calc(50%-2.25rem)] w-3 cursor-col-resize"
        {...ptr}
      />
    </>
  );
}
