import type { PointerEvent as ReactPointerEvent, ReactElement } from "react"
import { CollapseChevronIcon } from "@/components/icons/CollapseChevronIcon"
import { chrome } from "./chromeTheme"

export type CollapseButtonPosition = "top" | "bottom" | "left" | "right"

export type CollapseButtonRegion = "topBar" | "timeline" | "leftSidebar" | "rightSidebar"

export type ChromeGroup = "top" | "left" | "right" | "timeline"

const POSITION_CLASS: Record<CollapseButtonPosition, string> = {
  top: "-top-2 left-1/2 -translate-x-1/2 h-4 w-6",
  bottom: "-bottom-2 left-1/2 -translate-x-1/2 h-4 w-6",
  left: "-left-2 top-1/2 -translate-y-1/2 h-6 w-4",
  right: "-right-2 top-1/2 -translate-y-1/2 h-6 w-4",
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

const BASE_CLASS =
  "pointer-events-auto z-50 transition-opacity absolute flex shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 border border-neutral-600/30 hover:bg-neutral-800"

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
    ? "opacity-0 group-hover/top:opacity-100 group-hover/left:opacity-100 group-hover/right:opacity-100 group-hover/timeline:opacity-100 bg-neutral-950/80"
    : `opacity-0 pointer-events-none bg-neutral-900/95 ${GROUP_HOVER_REVEAL[groupPeer]}`
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
      className={`${BASE_CLASS} ${POSITION_CLASS[position]} ${reveal}`}
    >
      <span className={`inline-flex text-current ${chrome.mutedText}`}>
        <CollapseChevronIcon className={rotate} sizeClass="size-3" />
      </span>
    </button>
  )
}
