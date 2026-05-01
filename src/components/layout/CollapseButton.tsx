import type { ReactElement } from "react";
import { chrome } from "./chromeTheme";

export type CollapseButtonPosition = "top" | "bottom" | "left" | "right";

export type CollapseButtonRegion = "topBar" | "timeline" | "leftSidebar" | "rightSidebar";

export type ChromeGroup = "top" | "left" | "right" | "timeline";

const POSITION_CLASS: Record<CollapseButtonPosition, string> = {
  top: "-top-3 left-1/2 -translate-x-1/2",
  bottom: "-bottom-3 left-1/2 -translate-x-1/2",
  left: "-left-3 top-1/2 -translate-y-1/2",
  right: "-right-3 top-1/2 -translate-y-1/2"
};

const REVEAL_ON_EXPAND: Record<ChromeGroup, string> = {
  top: "opacity-0 group-hover/top:opacity-100",
  left: "opacity-0 group-hover/left:opacity-100",
  right: "opacity-0 group-hover/right:opacity-100",
  timeline: "opacity-0 group-hover/timeline:opacity-100"
};

const REGION_LABEL: Record<CollapseButtonRegion, string> = {
  topBar: "top bar",
  timeline: "timeline",
  leftSidebar: "left sidebar",
  rightSidebar: "right sidebar"
};

/** Base SVG is a chevron pointing right; rotation maps to prior ▲▼◀▲ semantics. */
function chevronRotateClass(
  region: CollapseButtonRegion,
  position: CollapseButtonPosition,
  collapsed: boolean
): string {
  if (region === "topBar" && position === "top") {
    return collapsed ? "rotate-90" : "-rotate-90";
  }
  switch (position) {
    case "top":
      return collapsed ? "-rotate-90" : "rotate-90";
    case "bottom":
      return collapsed ? "rotate-90" : "-rotate-90";
    case "right":
      return collapsed ? "rotate-0" : "rotate-180";
    case "left":
      return collapsed ? "rotate-180" : "rotate-0";
    default:
      return "rotate-0";
  }
}

function title(region: CollapseButtonRegion, collapsed: boolean): string {
  const name = REGION_LABEL[region];
  return collapsed ? `Expand ${name}` : `Collapse ${name}`;
}

function ChevronIcon({ className }: { className: string }): ReactElement {
  return (
    <svg
      className={`size-3.5 shrink-0 transition-transform duration-150 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <polyline
        points="7 5 13 10 7 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CollapseButton({
  position,
  region,
  collapsed,
  onClick,
  groupPeer
}: {
  position: CollapseButtonPosition;
  region: CollapseButtonRegion;
  collapsed: boolean;
  onClick: () => void;
  groupPeer: ChromeGroup;
}): ReactElement {
  const reveal = collapsed ? "opacity-100" : REVEAL_ON_EXPAND[groupPeer];
  const rotate = chevronRotateClass(region, position, collapsed);

  return (
    <button
      type="button"
      title={title(region, collapsed)}
      onClick={onClick}
      className={`pointer-events-auto z-50 transition-opacity ${chrome.collapseBtn} absolute ${POSITION_CLASS[position]} ${reveal}`}
    >
      <span className={`inline-flex text-current ${chrome.mutedText}`}>
        <ChevronIcon className={rotate} />
      </span>
    </button>
  );
}
