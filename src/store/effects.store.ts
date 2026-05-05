import { savePhotoState } from "../lib/persistence"
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
      set((current) => ({
        ...current,
        present: {
          ...current.present,
          photos: current.present.photos.map((p) => (p.id === photoId ? { ...p, ...partial } : p)),
        },
      }))
    },
    patchBasicEffects: (photoId, effects) => {
      set((current) => {
        const photos = current.present.photos.map((p) => {
          if (p.id !== photoId) return p
          const nextFx = { ...defaultBasicEffects(), ...p.basicEffects, ...effects }
          return { ...p, basicEffects: nextFx }
        })
        const present = { ...current.present, photos }
        const updated = photos.find((p) => p.id === photoId)
        if (updated) void savePhotoState(updated)
        return { ...current, present }
      })
    },
    setEditPreview: (photoId, path) => {
      set((current) => ({
        ...current,
        editPreviewPhotoId: photoId,
        editPreviewPath: path,
        editPreviewEpoch: current.editPreviewEpoch + 1,
      }))
    },
    adjustEditPreviewPending: (delta) => {
      set((current) => ({
        ...current,
        editPreviewPending: Math.max(0, current.editPreviewPending + delta),
      }))
    },
  }
}
