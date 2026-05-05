import { savePhotoState } from "../lib/persistence"
import { produce } from "immer"
import { defaultBasicEffects } from "../types/domain"
import type { AppActions, StoreShape } from "./appStore.types"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export function createEffectsActions(
  set: SetStore,
): Pick<
  AppActions,
  "mergePhotoFromDisk" | "patchBasicEffects" | "setEditPreview" | "adjustEditPreviewPending"
> {
  return {
    mergePhotoFromDisk: (photoId, partial) => {
      set(
        produce((current: StoreShape) => {
          const photo = current.present.photos.find((p) => p.id === photoId)
          if (!photo) return
          Object.assign(photo, partial)
        }),
      )
    },
    patchBasicEffects: (photoId, effects) => {
      set(
        produce((current: StoreShape) => {
          const photo = current.present.photos.find((p) => p.id === photoId)
          if (!photo) return
          photo.basicEffects = {
            ...defaultBasicEffects(),
            ...photo.basicEffects,
            ...effects,
          }
          void savePhotoState(photo)
        }),
      )
    },
    setEditPreview: (photoId, path) => {
      set(
        produce((current: StoreShape) => {
          current.editPreviewPhotoId = photoId
          current.editPreviewPath = path
          current.editPreviewEpoch += 1
        }),
      )
    },
    adjustEditPreviewPending: (delta) => {
      set(
        produce((current: StoreShape) => {
          current.editPreviewPending = Math.max(0, current.editPreviewPending + delta)
        }),
      )
    },
  }
}
