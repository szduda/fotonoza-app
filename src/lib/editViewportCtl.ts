/** Avoid routing edit viewport callbacks through React props so chrome sidebars do not re-render on slider ticks. */
export type EditViewportCtl = {
  fitToView: () => void
  centerView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

const ctl: { current: EditViewportCtl | null } = { current: null }

export function setEditViewportCtl(next: EditViewportCtl | null): void {
  ctl.current = next
}

export function getEditViewportCtl(): EditViewportCtl | null {
  return ctl.current
}
