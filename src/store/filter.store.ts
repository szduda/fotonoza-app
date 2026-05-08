import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type { PhotoExifSummary } from "@/types/domain"
import { defaultPhotoFilters } from "@/types/domain"
import type { AppActions, StoreShape } from "./appStore.types"
import { getTemporalSnapshots, withoutTemporalRecord } from "./history.store"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export const createFilterActions = (
  set: SetStore,
): Pick<AppActions, "setPhotoFilter" | "mergeExifCache"> => ({
  setPhotoFilter: (partial) => {
    withoutTemporalRecord(() =>
      set(
        produce((current: StoreShape) => {
          current.present.photoFilters = {
            ...defaultPhotoFilters(),
            ...current.present.photoFilters,
            ...partial,
          }
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(current.present, past, future)
        }),
      ),
    )
  },
  mergeExifCache: (partial: Record<string, PhotoExifSummary>) => {
    withoutTemporalRecord(() =>
      set(
        produce((draft: StoreShape) => {
          Object.assign(draft.exifCache, partial)
        }),
      ),
    )
  },
})
