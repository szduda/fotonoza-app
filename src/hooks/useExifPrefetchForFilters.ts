import { useEffect, useRef } from "react"
import { getPhotoExif } from "@/lib/persistence"
import { useAppStore } from "@/store/appStore"
import type { PhotoExifSummary, PhotoFiltersState } from "@/types/domain"

const exifFiltersActive = (f: PhotoFiltersState): boolean =>
  f.dateTaken.trim() !== "" ||
  f.exposure.trim() !== "" ||
  f.camera.trim() !== "" ||
  f.lens.trim() !== ""

/** Loads EXIF summaries into {@link StoreShape.exifCache} while EXIF-related filters are active. */
export const useExifPrefetchForFilters = (): void => {
  const mergeExifCache = useAppStore((s) => s.actions.mergeExifCache)
  const genRef = useRef(0)

  const pathsKey = useAppStore((s) => s.present.photos.map((p) => p.sourcePath).join("|"))
  const exifFilterKey = useAppStore((s) =>
    [
      s.present.photoFilters.dateTaken,
      s.present.photoFilters.exposure,
      s.present.photoFilters.camera,
      s.present.photoFilters.lens,
    ].join("|"),
  )

  useEffect(() => {
    const { photos, photoFilters } = useAppStore.getState().present
    if (!exifFiltersActive(photoFilters) || photos.length === 0) return

    const gen = ++genRef.current
    let cancelled = false

    const run = async (): Promise<void> => {
      const pending = photos
        .map((p) => p.sourcePath)
        .filter((path) => !useAppStore.getState().exifCache[path])

      const chunkSize = 8
      for (let i = 0; i < pending.length && !cancelled && gen === genRef.current; i += chunkSize) {
        const slice = pending.slice(i, i + chunkSize)
        const results = await Promise.all(
          slice.map((path) => getPhotoExif(path).then((ex) => ({ path, ex }))),
        )
        if (cancelled || gen !== genRef.current) return
        const batch: Record<string, PhotoExifSummary> = {}
        for (const { path, ex } of results) batch[path] = ex
        mergeExifCache(batch)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [pathsKey, exifFilterKey, mergeExifCache])
}
