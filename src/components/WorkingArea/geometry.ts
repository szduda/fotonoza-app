import { EDIT_PAN_EPSILON_PX } from "./constants"

export type Size = { width: number; height: number }
export type Pan = { x: number; y: number }

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

/** Contain-fit for zoom; unknown viewport axes fall back to image size so layout 0×0 does not zero out display. */
export const fitContainSize = (viewport: Size, image: Size, zoom: number): Size => {
  if (image.width <= 0 || image.height <= 0) {
    return { width: 0, height: 0 }
  }
  const vw = viewport.width > 0 ? viewport.width : image.width
  const vh = viewport.height > 0 ? viewport.height : image.height
  const fit = Math.min(vw / image.width, vh / image.height)
  const scale = fit * zoom
  return { width: image.width * scale, height: image.height * scale }
}

export const clampPan = (next: Pan, rendered: Size, viewport: Size): Pan => {
  const maxX = Math.abs(rendered.width - viewport.width) / 2 + EDIT_PAN_EPSILON_PX
  const maxY = Math.abs(rendered.height - viewport.height) / 2 + EDIT_PAN_EPSILON_PX
  return {
    x: clamp(next.x, -maxX, maxX),
    y: clamp(next.y, -maxY, maxY),
  }
}

export const isPhotoEqual = (
  a: { id: string; sourcePath: string } | undefined,
  b: { id: string; sourcePath: string } | undefined,
): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.id === b.id && a.sourcePath === b.sourcePath
}
