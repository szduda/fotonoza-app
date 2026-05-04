import { EDIT_PAN_EPSILON_PX } from "./constants";

export type Size = { width: number; height: number };
export type Pan = { x: number; y: number };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fitContainSize(viewport: Size, image: Size, zoom: number): Size {
  if (viewport.width <= 0 || viewport.height <= 0 || image.width <= 0 || image.height <= 0) {
    return { width: 0, height: 0 };
  }
  const fit = Math.min(viewport.width / image.width, viewport.height / image.height);
  const scale = fit * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

export function clampPan(next: Pan, rendered: Size, viewport: Size): Pan {
  const maxX = Math.abs(rendered.width - viewport.width) / 2 + EDIT_PAN_EPSILON_PX;
  const maxY = Math.abs(rendered.height - viewport.height) / 2 + EDIT_PAN_EPSILON_PX;
  return {
    x: clamp(next.x, -maxX, maxX),
    y: clamp(next.y, -maxY, maxY)
  };
}

export function isPhotoEqual(
  a: { id: string; sourcePath: string } | undefined,
  b: { id: string; sourcePath: string } | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.sourcePath === b.sourcePath;
}
