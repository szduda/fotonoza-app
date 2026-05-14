import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useAppStore } from "@/store/appStore"
import { defaultUiLayout } from "@/types/domain"
import type { ChromeDragKind } from "./chromePanelConfig"

const MIN_SIDEBAR = 120
const MAX_SIDEBAR = 720
const MIN_TIMELINE = 72
const MAX_TIMELINE = 520
type CollapseSnap = {
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  timelineCollapsed: boolean
  topBarCollapsed: boolean
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

const isExportModalOpen = (): boolean => document.body?.dataset.exportModalOpen === "1"

export type ChromeLayoutControllerValue = {
  clearTabSnapshot: () => void
  startResizeDrag: (kind: ChromeDragKind) => (e: ReactPointerEvent) => void
  onResizePointerMove: (e: ReactPointerEvent) => void
  onResizePointerUp: (e: ReactPointerEvent) => void
  onResizePointerCancel: (e: ReactPointerEvent) => void
}

const ChromeLayoutControllerContext = createContext<ChromeLayoutControllerValue | null>(null)

export const useChromeLayoutControllerContext = (): ChromeLayoutControllerValue => {
  const v = useContext(ChromeLayoutControllerContext)
  if (!v) {
    throw new Error("useChromeLayoutControllerContext must be used under ChromeLayout")
  }
  return v
}

export const ChromeLayoutControllerProvider = ({ children }: { children: ReactNode }) => {
  const value = useChromeLayoutController()
  return (
    <ChromeLayoutControllerContext.Provider value={value}>
      {children}
    </ChromeLayoutControllerContext.Provider>
  )
}

const useChromeLayoutController = (): ChromeLayoutControllerValue => {
  const patchLayout = useAppStore((s) => s.actions.patchLayout)

  const tabHideSnapshotRef = useRef<CollapseSnap | null>(null)
  const dragKindRef = useRef<ChromeDragKind | null>(null)
  const dragStartRef = useRef({ coord: 0, size: 0 })

  const clearTabSnapshot = useCallback(() => {
    tabHideSnapshotRef.current = null
  }, [])

  const readLayout = useCallback(() => useAppStore.getState().present.layout ?? defaultUiLayout, [])

  const onTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.repeat) return
      if (isExportModalOpen()) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()

      const L = readLayout()
      const v: CollapseSnap = {
        leftSidebarCollapsed: L.leftSidebarCollapsed,
        rightSidebarCollapsed: L.rightSidebarCollapsed,
        timelineCollapsed: L.timelineCollapsed,
        topBarCollapsed: L.topBarCollapsed,
      }

      const anyExpanded =
        !v.leftSidebarCollapsed ||
        !v.rightSidebarCollapsed ||
        !v.timelineCollapsed ||
        !v.topBarCollapsed

      if (anyExpanded) {
        tabHideSnapshotRef.current = { ...v }
        patchLayout({
          leftSidebarCollapsed: true,
          rightSidebarCollapsed: true,
          timelineCollapsed: true,
          topBarCollapsed: true,
        })
        return
      }

      const snap = tabHideSnapshotRef.current
      if (!snap) {
        patchLayout({
          leftSidebarCollapsed: false,
          rightSidebarCollapsed: false,
          timelineCollapsed: false,
          topBarCollapsed: false,
        })
        return
      }

      if (!snap.timelineCollapsed || !snap.topBarCollapsed) {
        patchLayout({
          leftSidebarCollapsed: snap.leftSidebarCollapsed,
          rightSidebarCollapsed: snap.rightSidebarCollapsed,
          timelineCollapsed: snap.timelineCollapsed,
          topBarCollapsed: snap.topBarCollapsed,
        })
      } else {
        patchLayout({
          leftSidebarCollapsed: snap.leftSidebarCollapsed,
          rightSidebarCollapsed: snap.rightSidebarCollapsed,
          timelineCollapsed: true,
          topBarCollapsed: true,
        })
      }
      tabHideSnapshotRef.current = null
    },
    [readLayout, patchLayout],
  )

  useEffect(() => {
    window.addEventListener("keydown", onTabKey)
    return () => window.removeEventListener("keydown", onTabKey)
  }, [onTabKey])

  const startResizeDrag = useCallback(
    (kind: ChromeDragKind) => (e: ReactPointerEvent) => {
      e.preventDefault()
      const L = readLayout()
      if (kind === "left") {
        if (L.leftSidebarCollapsed) patchLayout({ leftSidebarCollapsed: false })
      } else if (kind === "right") {
        if (L.rightSidebarCollapsed) patchLayout({ rightSidebarCollapsed: false })
      } else if (kind === "timeline") {
        if (L.timelineCollapsed) patchLayout({ timelineCollapsed: false })
      }

      const next = useAppStore.getState().present.layout ?? defaultUiLayout
      dragKindRef.current = kind
      if (kind === "left") {
        dragStartRef.current = { coord: e.clientX, size: next.leftSidebarWidthPx }
      } else if (kind === "right") {
        dragStartRef.current = { coord: e.clientX, size: next.rightSidebarWidthPx }
      } else {
        dragStartRef.current = { coord: e.clientY, size: next.timelineHeightPx }
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [readLayout, patchLayout],
  )

  const onResizePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const kind = dragKindRef.current
      if (!kind) return
      const L = readLayout()
      if (kind === "left") {
        if (L.leftSidebarCollapsed) return
        const delta = e.clientX - dragStartRef.current.coord
        const next = Math.round(
          Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, dragStartRef.current.size + delta)),
        )
        patchLayout({ leftSidebarWidthPx: next })
      } else if (kind === "right") {
        if (L.rightSidebarCollapsed) return
        const delta = dragStartRef.current.coord - e.clientX
        const next = Math.round(
          Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, dragStartRef.current.size + delta)),
        )
        patchLayout({ rightSidebarWidthPx: next })
      } else {
        if (L.timelineCollapsed) return
        const delta = dragStartRef.current.coord - e.clientY
        const next = Math.round(
          Math.min(MAX_TIMELINE, Math.max(MIN_TIMELINE, dragStartRef.current.size + delta)),
        )
        patchLayout({ timelineHeightPx: next })
      }
    },
    [readLayout, patchLayout],
  )

  const onResizePointerUp = useCallback((e: ReactPointerEvent) => {
    if (dragKindRef.current) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    dragKindRef.current = null
  }, [])

  const onResizePointerCancel = onResizePointerUp

  return useMemo(
    () => ({
      clearTabSnapshot,
      startResizeDrag,
      onResizePointerMove,
      onResizePointerUp,
      onResizePointerCancel,
    }),
    [
      clearTabSnapshot,
      startResizeDrag,
      onResizePointerMove,
      onResizePointerUp,
      onResizePointerCancel,
    ],
  )
}
