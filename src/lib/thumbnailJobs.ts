import type { ThumbPathEntry } from "@/lib/persistence"
import { ensureThumbnails, resolveThumbnailPaths } from "@/lib/persistence"

/**
 * Blocking disk work runs in Rust (`spawn_blocking`); this waits for thumbnails
 * before resolving stable paths — safe for setting `thumbnailPath` in UI state.
 */
export const ensureThumbnailBatchResolved = async (
  sourcePaths: string[],
): Promise<ThumbPathEntry[]> => {
  if (sourcePaths.length === 0) return []
  await ensureThumbnails(sourcePaths)
  return resolveThumbnailPaths(sourcePaths)
}
