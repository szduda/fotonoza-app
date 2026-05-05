import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type { AppActions, StoreShape } from "./appStore.types"
import { getTemporalSnapshots, withUndo } from "./history.store"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export const createLibraryActions = (
  set: SetStore,
): Pick<
  AppActions,
  "toggleSelectPhoto" | "clearSelectedPhotos" | "openInEditor" | "approvePhoto" | "declinePhoto"
> => {
  return {
    toggleSelectPhoto: (photoId) =>
      withUndo(set, "toggle-select-photo", (s) => {
        const photo = s.photos.find((p) => p.id === photoId)
        if (photo) photo.selected = !photo.selected
      }),
    clearSelectedPhotos: () =>
      withUndo(set, "clear-selected-photos", (s) => {
        for (const photo of s.photos) {
          if (photo.selected) photo.selected = false
        }
      }),
    openInEditor: (photoId) => {
      set(
        produce((current: StoreShape) => {
          const present = {
            ...current.present,
            mode: "edit" as const,
            currentPhotoId: photoId,
          }
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(present, past, future)
          current.present = present
          current.editPreviewPath = undefined
          current.editPreviewPhotoId = undefined
          current.editPreviewPending = 0
        }),
      )
    },
    approvePhoto: (photoId) =>
      withUndo(set, "approve-photo", (s) => {
        const photo = s.photos.find((p) => p.id === photoId)
        if (photo) photo.approved = true
      }),
    declinePhoto: (photoId) =>
      withUndo(set, "decline-photo", (s) => {
        s.photos = s.photos.filter((photo) => photo.id !== photoId)
        if (s.currentPhotoId === photoId) s.currentPhotoId = undefined
      }),
  }
}
