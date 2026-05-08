import type { CSSProperties, ReactElement, ReactNode } from "react"
import { useAppStore } from "@/store/appStore"
import { defaultUiLayout } from "@/types/domain"
import type { CollapseButtonRegion } from "./CollapseButton"
import {
  CHROME_PANEL_EDGE,
  chromeEdgeLayout,
  chromePanelDimensionStyle,
  readCollapsed,
  type ChromePanelId,
} from "./chromePanelConfig"
import { useChromeLayoutControllerContext } from "./chromeLayoutController"
import { CollapseButton, type ChromeGroup } from "./CollapseButton"
import { PanelResizeHandles } from "./PanelResizeHandles"

const GROUP_WRAP: Record<ChromeGroup, string> = {
  top: "group/top",
  left: "group/left",
  right: "group/right",
  timeline: "group/timeline",
}

/**
 * Chrome strip: content, resize seam toward the working area, collapse control.
 * Layout is derived from which screen edge the panel sits on (`CHROME_PANEL_EDGE`).
 */
export const ChromeEdgePanel = ({
  panel,
  className,
  children,
}: {
  panel: ChromePanelId
  className?: string
  children: ReactNode
}): ReactElement | null => {
  const mode = useAppStore((s) => s.present.mode)
  const layout = useAppStore((s) => s.present.layout ?? defaultUiLayout)
  const patchLayout = useAppStore((s) => s.actions.patchLayout)
  const ctx = useChromeLayoutControllerContext()

  if ((panel === "timeline" || panel === "rightSidebar") && mode === "view") {
    return null
  }

  const cfg = chromeEdgeLayout(CHROME_PANEL_EDGE[panel])
  const collapsed = readCollapsed(panel, layout)
  const style: CSSProperties = chromePanelDimensionStyle(panel, layout)

  const onCollapseToggle = () => {
    ctx.clearTabSnapshot()
    switch (panel) {
      case "topBar":
        patchLayout({ topBarCollapsed: !layout.topBarCollapsed })
        break
      case "leftSidebar":
        patchLayout({ leftSidebarCollapsed: !layout.leftSidebarCollapsed })
        break
      case "rightSidebar":
        patchLayout({ rightSidebarCollapsed: !layout.rightSidebarCollapsed })
        break
      case "timeline":
        patchLayout({ timelineCollapsed: !layout.timelineCollapsed })
        break
    }
  }

  const wrap = `${GROUP_WRAP[cfg.groupPeer]} relative flex min-h-0 shrink-0 flex-col ${cfg.borderClass}${
    className ? ` ${className}` : ""
  }`

  const contentGrow = panel === "topBar" ? "shrink-0" : "min-h-0 flex-1"
  const contentShell = (
    <div className={collapsed ? "hidden" : `${contentGrow} overflow-hidden`}>{children}</div>
  )

  const handles =
    cfg.resizable && cfg.dragKind ? (
      <PanelResizeHandles
        edge={cfg.resizeEdge}
        collapsed={collapsed}
        onPointerDown={ctx.startResizeDrag(cfg.dragKind)}
        onPointerMove={ctx.onResizePointerMove}
        onPointerUp={ctx.onResizePointerUp}
        onPointerCancel={ctx.onResizePointerCancel}
      />
    ) : null

  const btn = (
    <CollapseButton
      position={cfg.collapsePosition}
      region={panel as CollapseButtonRegion}
      collapsed={collapsed}
      onClick={onCollapseToggle}
      groupPeer={cfg.groupPeer}
    />
  )

  const body = cfg.controlsFirst ? (
    <>
      {handles}
      {btn}
      {contentShell}
    </>
  ) : (
    <>
      {contentShell}
      {handles}
      {btn}
    </>
  )

  return (
    <div className={wrap} style={style}>
      {body}
    </div>
  )
}
