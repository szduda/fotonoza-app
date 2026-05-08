import { useMemo } from "react"
import { shallow } from "zustand/shallow"
import { photoMatchesCollection } from "@/lib/collections"
import { photoMatchesFilters } from "@/lib/photoFilters"
import { useAppStore } from "@/store/appStore"
import type { StoreShape } from "@/store/appStore.types"
import type { Photo } from "@/types/domain"

/**
 * Zustand + React 19 `useSyncExternalStore` requires getSnapshot to return the same reference when
 * the filtered set is unchanged; a bare `.filter()` allocates every time and loops infinitely.
 */
export const useFilteredPhotos = (): Photo[] => {
  const selector = useMemo(() => {
    let last: Photo[] | undefined
    return (s: StoreShape): Photo[] => {
      const next = s.present.photos.filter((p) => {
        if (!photoMatchesFilters(p, s.present.photoFilters, s.exifCache[p.sourcePath]))
          return false
        return photoMatchesCollection(
          p,
          s.present.collectionFilter,
          s.present.collectionFolders ?? [],
        )
      })
      if (last !== undefined && shallow(last, next)) return last
      last = next
      return next
    }
  }, [])
  return useAppStore(selector)
}
