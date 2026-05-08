import { useEffect, useState } from "react"
import type { Photo } from "@/types/domain"
import { useAppStore } from "@/store/appStore"

/** Ignores basicEffects / shadows / darktable changes — timeline strip metadata only. */
const timelineStripEq = (a: Photo[], b: Photo[]): boolean => {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (
      x.id !== y.id ||
      x.selected !== y.selected ||
      x.sourcePath !== y.sourcePath ||
      x.fileName !== y.fileName ||
      x.thumbnailPath !== y.thumbnailPath ||
      (x.thumbnailNonce ?? 0) !== (y.thumbnailNonce ?? 0)
    ) {
      return false
    }
  }
  return true
}

export const useTimelinePhotosStable = (): Photo[] => {
  const [photos, setPhotos] = useState<Photo[]>(() => useAppStore.getState().present.photos)

  useEffect(() => {
    return useAppStore.subscribe((state) => {
      const next = state.present.photos
      setPhotos((prev) => (timelineStripEq(prev, next) ? prev : next))
    })
  }, [])

  return photos
}
