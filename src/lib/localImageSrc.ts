import { convertFileSrc, isTauri } from "@tauri-apps/api/core"

/** Webview-safe URL for a local filesystem image path (Tauri asset protocol). */
export const localImageSrc = (filePath: string, cacheNonce?: number): string => {
  if (!filePath) return ""
  const converted = isTauri() ? convertFileSrc(filePath) : filePath
  if (cacheNonce === undefined || cacheNonce === 0) return converted
  const sep = converted.includes("?") ? "&" : "?"
  return `${converted}${sep}rev=${cacheNonce}`
}

