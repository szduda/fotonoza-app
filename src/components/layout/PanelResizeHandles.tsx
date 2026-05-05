import type { ReactElement } from "react";

export type PanelResizeEdge = "bottom" | "top" | "right" | "left";

type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

type EdgeCfg = {
  orientation: "horizontal" | "vertical";
  collapsed: string;
  expanded: string;
};

const edges: Record<PanelResizeEdge, EdgeCfg> = {
  bottom: {
    orientation: "horizontal",
    collapsed: "bottom-0 left-10 right-10",
    expanded: "bottom-0 left-0 right-0",
  },
  top: {
    orientation: "horizontal",
    collapsed: "left-10 right-10 top-0",
    expanded: "left-0 right-0 top-0",
  },
  right: {
    orientation: "vertical",
    collapsed: "right-0 top-10 bottom-10",
    expanded: "right-0 top-0 bottom-0",
  },
  left: {
    orientation: "vertical",
    collapsed: "left-0 top-10 bottom-10",
    expanded: "left-0 top-0 bottom-0",
  },
};

const GRIP_BASE = "absolute z-10";

function axisClasses(orientation: "horizontal" | "vertical"): string {
  return orientation === "horizontal" ? "h-2.5 cursor-row-resize" : "w-3 cursor-col-resize";
}

function ResizeGrip({
  orientation,
  layoutClass,
  ...ptr
}: {
  orientation: "horizontal" | "vertical";
  layoutClass: string;
} & PointerHandlers): ReactElement {
  const classes = [GRIP_BASE, axisClasses(orientation), layoutClass].join(" ");

  return (
    <div role="separator" aria-orientation={orientation} className={classes} {...ptr} />
  );
}

export function PanelResizeHandles({
  edge,
  collapsed,
  ...ptr
}: {
  edge: PanelResizeEdge;
  collapsed: boolean;
} & PointerHandlers): ReactElement {
  const cfg = edges[edge];
  const layout = collapsed ? cfg.collapsed : cfg.expanded;
  
  return <ResizeGrip orientation={cfg.orientation} layoutClass={layout} {...ptr} />;
}
