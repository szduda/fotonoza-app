import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

/** Webview-safe URL for a local filesystem image path (Tauri asset protocol). */
export function localImageSrc(filePath: string): string {
  if (!filePath) return "";
  if (isTauri()) {
    return convertFileSrc(filePath);
  }
  return filePath;
}
