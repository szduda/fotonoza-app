import { savePhotoState } from "@/lib/persistence"
import { current, produce } from "immer"
import {
  defaultBasicEffects,
  defaultColorEffects,
  defaultDarktableFx,
  defaultShadowsHighlights,
} from "@/types/domain"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo, withoutTemporalRecord } from "./history.store"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export const createEffectsActions = (
  set: SetStore,
): Pick<
  AppActions,
  | "mergePhotoFromDisk"
  | "patchBasicEffects"
  | "patchColorEffects"
  | "patchShadowsHighlights"
  | "patchDarktableFx"
  | "setEditPreview"
  | "adjustEditPreviewPending"
> => {
  return {
    mergePhotoFromDisk: (photoId, partial) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            const photo = current.present.photos.find((p) => p.id === photoId)
            if (!photo) return
            Object.assign(photo, partial)
          }),
        ),
      )
    },
    patchBasicEffects: (photoId, effects, historyLabel, historyDelta) => {
      let toPersist: ReturnType<typeof buildPhotoPersistPayload> | null = null
      withUndo(set, historyLabel, (s) => {
        const photo = s.photos.find((p) => p.id === photoId)
        if (!photo) return
        photo.basicEffects = {
          ...defaultBasicEffects(),
          ...photo.basicEffects,
          ...effects,
        }
        toPersist = buildPhotoPersistPayload(current(photo))
      }, undefined, historyDelta)
      if (toPersist) {
        void savePhotoState(toPersist).catch(() => {
          // Persistence is best-effort; UI state remains authoritative.
        })
      }
    },
    patchColorEffects: (photoId, fx, historyLabel, historyDelta) => {
      let toPersist: ReturnType<typeof buildPhotoPersistPayload> | null = null
      withUndo(set, historyLabel, (s) => {
        const photo = s.photos.find((p) => p.id === photoId)
        if (!photo) return
        photo.colorEffects = {
          ...defaultColorEffects(),
          ...photo.colorEffects,
          ...fx,
        }
        toPersist = buildPhotoPersistPayload(current(photo))
      }, undefined, historyDelta)
      if (toPersist) {
        void savePhotoState(toPersist).catch(() => {
          // Persistence is best-effort; UI state remains authoritative.
        })
      }
    },
    patchShadowsHighlights: (photoId, fx, historyLabel, historyDelta) => {
      let toPersist: ReturnType<typeof buildPhotoPersistPayload> | null = null
      withUndo(set, historyLabel, (s) => {
        const photo = s.photos.find((p) => p.id === photoId)
        if (!photo) return
        photo.shadowsHighlights = {
          ...defaultShadowsHighlights(),
          ...photo.shadowsHighlights,
          ...fx,
        }
        toPersist = buildPhotoPersistPayload(current(photo))
      }, undefined, historyDelta)
      if (toPersist) {
        void savePhotoState(toPersist).catch(() => {
          // Persistence is best-effort; UI state remains authoritative.
        })
      }
    },
    patchDarktableFx: (photoId, fx) => {
      let toPersist: ReturnType<typeof buildPhotoPersistPayload> | null = null
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            const photo = current.present.photos.find((p) => p.id === photoId)
            if (!photo) return
            photo.darktableFx = {
              ...defaultDarktableFx(),
              ...photo.darktableFx,
              ...fx,
            }
            toPersist = buildPhotoPersistPayload(photo)
          }),
        ),
      )
      if (toPersist) {
        void savePhotoState(toPersist).catch(() => {
          // Persistence is best-effort; UI state remains authoritative.
        })
      }
    },
    setEditPreview: (photoId, path) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            current.editPreviewPhotoId = photoId
            current.editPreviewPath = path
            current.editPreviewEpoch += 1
          }),
        ),
      )
    },
    adjustEditPreviewPending: (delta) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            current.editPreviewPending = Math.max(0, current.editPreviewPending + delta)
          }),
        ),
      )
    },
  }
}

const buildPhotoPersistPayload = (
  photo: StoreShape["present"]["photos"][number],
): StoreShape["present"]["photos"][number] => {
  return {
    ...photo,
    adjustments: [...photo.adjustments],
    basicEffects: photo.basicEffects ? { ...photo.basicEffects } : undefined,
    colorEffects: photo.colorEffects ? { ...photo.colorEffects } : undefined,
    shadowsHighlights: photo.shadowsHighlights ? { ...photo.shadowsHighlights } : undefined,
    darktableFx: photo.darktableFx ? { ...photo.darktableFx } : undefined,
  }
}
