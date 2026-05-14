import type { CollectionFolder } from "@/types/domain"
import { OTHERS_COLLECTION_ID } from "@/lib/collections"

/** Host OS for directory-segment rules (macOS vs Linux vs Windows). */
export type DirNamePlatform = "darwin" | "linux" | "windows" | "unknown"

/** Resolve runtime platform for filename sanitization (Tauri webview + web dev). */
export const resolveDirNamePlatform = (): DirNamePlatform => {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  const plat = navigator.platform
  if (/Win/i.test(ua) || plat === "Win32") return "windows"
  if (/Mac|iPhone|iPad|iPod/i.test(ua) || /^Mac/i.test(plat)) return "darwin"
  if (/Linux/i.test(ua) || /^Linux/i.test(plat)) return "linux"
  return "unknown"
}

const forbiddenRe = (p: DirNamePlatform): RegExp => {
  switch (p) {
    case "darwin":
      return /[\u0000/:]/g
    case "linux":
      return /[\u0000/]/g
    case "windows":
      return /[\u0000<>:"/\\|?*\u0001-\u001f]/g
    default:
      return /[\u0000<>:"/\\|?*:]/g
  }
}

/**
 * Strip/replace characters unsafe in a single path segment for the current OS.
 * Does not validate reserved Windows device names (CON, PRN, …).
 */
export const sanitizeDirNameSegment = (
  raw: string,
  platform: DirNamePlatform = resolveDirNamePlatform(),
): string => {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  const re = forbiddenRe(platform)
  const step = trimmed.replace(re, "_").replace(/_{2,}/g, "_").trim()
  return step.replace(/^\.+/, "").replace(/\.+$/, "")
}

/**
 * Default export “collection” folder name from the collection sidebar filter.
 * - All (no filter): empty
 * - No Collection / Others (`OTHERS_COLLECTION_ID`): empty
 * - A real folder: that folder’s `name`, sanitized for the filesystem
 */
export const presetExportCollectionName = (
  collectionFilter: string | undefined,
  folders: readonly CollectionFolder[],
): string => {
  if (collectionFilter == null || collectionFilter === "") return ""
  if (collectionFilter === OTHERS_COLLECTION_ID) return ""
  const folder = folders.find((f) => f.id === collectionFilter)
  if (!folder) return ""
  return sanitizeDirNameSegment(folder.name)
}
