import type { PointerEvent as ReactPointerEvent, ReactElement } from "react"
import { CollapseChevronIcon } from "@/components/icons/CollapseChevronIcon"
import { chrome } from "./chromeTheme"

export type CollapseButtonPosition = "top" | "bottom" | "left" | "right"

export type CollapseButtonRegion = "topBar" | "timeline" | "leftSidebar" | "rightSidebar"

export type ChromeGroup = "top" | "left" | "right" | "timeline"

const POSITION_CLASS: Record<CollapseButtonPosition, string> = {
  top: "-top-3 left-1/2 -translate-x-1/2",
  bottom: "-bottom-3 left-1/2 -translate-x-1/2",
  left: "-left-3 top-1/2 -translate-y-1/2",
  right: "-right-3 top-1/2 -translate-y-1/2",
}

/** Group-hover tail only (shared expand prefix is inlined on `reveal`). */
const GROUP_HOVER_REVEAL: Record<ChromeGroup, string> = {
  top: "group-hover/top:opacity-100 group-hover/top:pointer-events-auto",
  left: "group-hover/left:opacity-100 group-hover/left:pointer-events-auto",
  right: "group-hover/right:opacity-100 group-hover/right:pointer-events-auto",
  timeline: "group-hover/timeline:opacity-100 group-hover/timeline:pointer-events-auto",
}

const REGION_LABEL: Record<CollapseButtonRegion, string> = {
  topBar: "top bar",
  timeline: "timeline",
  leftSidebar: "left sidebar",
  rightSidebar: "right sidebar",
}

/** Base SVG is a chevron pointing right; rotation maps to prior ▲▼◀▲ semantics. */
const chevronRotateClass = (
  region: CollapseButtonRegion,
  position: CollapseButtonPosition,
  collapsed: boolean,
): string => {
  if (region === "topBar" && position === "top") {
    return collapsed ? "rotate-90" : "-rotate-90"
  }
  switch (position) {
    case "top":
      return collapsed ? "-rotate-90" : "rotate-90"
    case "bottom":
      return collapsed ? "rotate-90" : "-rotate-90"
    case "right":
      return collapsed ? "rotate-0" : "rotate-180"
    case "left":
      return collapsed ? "rotate-180" : "rotate-0"
    default:
      return "rotate-0"
  }
}

const title = (region: CollapseButtonRegion, collapsed: boolean): string => {
  const name = REGION_LABEL[region]
  return collapsed ? `Expand ${name}` : `Collapse ${name}`
}

export const CollapseButton = ({
  position,
  region,
  collapsed,
  onClick,
  groupPeer,
}: {
  position: CollapseButtonPosition
  region: CollapseButtonRegion
  collapsed: boolean
  onClick: () => void
  groupPeer: ChromeGroup
}): ReactElement => {
  const reveal = collapsed
    ? "opacity-100"
    : `opacity-0 pointer-events-none ${GROUP_HOVER_REVEAL[groupPeer]}`
  const rotate = chevronRotateClass(region, position, collapsed)

  const stopPtr = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
  }

  return (
    <button
      type="button"
      title={title(region, collapsed)}
      onClick={onClick}
      onPointerDown={stopPtr}
      onPointerDownCapture={stopPtr}
      className={`absolute z-30 transition-opacity ${chrome.collapseBtn} pointer-events-auto ${POSITION_CLASS[position]} ${reveal}`}
    >
      <span className={`inline-flex text-current ${chrome.mutedText}`}>
        <CollapseChevronIcon className={rotate} />
      </span>
    </button>
  )
}
