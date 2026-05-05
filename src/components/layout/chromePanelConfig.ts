import type { CSSProperties } from "react";
import type { CollapseButtonPosition, ChromeGroup } from "./CollapseButton";
import type { PanelResizeEdge } from "./PanelResizeHandles";
import { CHROME_STRIP_PX, defaultUiLayout, type UiLayoutState } from "../../types/domain";
import { chrome } from "./chromeTheme";

export const CHROME_PANEL_IDS = ["topBar", "leftSidebar", "rightSidebar", "timeline"] as const;
export type ChromePanelId = (typeof CHROME_PANEL_IDS)[number];

/** Which screen edge the chrome strip sits on (timeline = bottom strip). */
export type ChromeEdgePosition = "top" | "bottom" | "left" | "right";

export type ChromeDragKind = "left" | "right" | "timeline" | "top";

export const CHROME_PANEL_EDGE: Record<ChromePanelId, ChromeEdgePosition> = {
  topBar: "top",
  leftSidebar: "left",
  rightSidebar: "right",
  timeline: "bottom"
};

const EDGE_GROUP: Record<ChromeEdgePosition, ChromeGroup> = {
  top: "top",
  bottom: "timeline",
  left: "left",
  right: "right"
};

const EDGE_BORDER: Record<ChromeEdgePosition, string> = {
  top: chrome.borderB,
  bottom: chrome.borderT,
  left: chrome.borderR,
  right: chrome.borderL
};

/** Resize seam on the side of the strip that faces the working area. */
const EDGE_RESIZE: Record<ChromeEdgePosition, PanelResizeEdge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};

/** Collapse control sits on the opposite edge from the strip’s dock side. */
const EDGE_COLLAPSE: Record<ChromeEdgePosition, CollapseButtonPosition> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};

const EDGE_DRAG: Record<ChromeEdgePosition, ChromeDragKind> = {
  top: "top",
  bottom: "timeline",
  left: "left",
  right: "right"
};

export type ChromeEdgeLayout = {
  groupPeer: ChromeGroup;
  borderClass: string;
  resizeEdge: PanelResizeEdge;
  collapsePosition: CollapseButtonPosition;
  dragKind: ChromeDragKind;
  /** Bottom strip (timeline): resize + collapse above content. Other edges: content first. */
  controlsFirst: boolean;
};

export function chromeEdgeLayout(edge: ChromeEdgePosition): ChromeEdgeLayout {
  return {
    groupPeer: EDGE_GROUP[edge],
    borderClass: EDGE_BORDER[edge],
    resizeEdge: EDGE_RESIZE[edge],
    collapsePosition: EDGE_COLLAPSE[edge],
    dragKind: EDGE_DRAG[edge],
    controlsFirst: edge === "bottom"
  };
}

export function chromePanelDimensionStyle(
  panel: ChromePanelId,
  layout: UiLayoutState
): CSSProperties {
  const lw = Math.round(layout.leftSidebarWidthPx);
  const rw = Math.round(layout.rightSidebarWidthPx);
  const th = Math.round(layout.timelineHeightPx);
  const tbh = Math.round(layout.topBarHeightPx);

  switch (panel) {
    case "topBar":
      return { height: layout.topBarCollapsed ? CHROME_STRIP_PX : tbh };
    case "leftSidebar":
      return { width: layout.leftSidebarCollapsed ? CHROME_STRIP_PX : lw };
    case "rightSidebar":
      return { width: layout.rightSidebarCollapsed ? CHROME_STRIP_PX : rw };
    case "timeline":
      return { height: layout.timelineCollapsed ? CHROME_STRIP_PX : th };
    default:
      return {};
  }
}

export function readCollapsed(panel: ChromePanelId, layout: UiLayoutState): boolean {
  const L = layout ?? defaultUiLayout;
  switch (panel) {
    case "topBar":
      return L.topBarCollapsed;
    case "leftSidebar":
      return L.leftSidebarCollapsed;
    case "rightSidebar":
      return L.rightSidebarCollapsed;
    case "timeline":
      return L.timelineCollapsed;
    default:
      return false;
  }
}
