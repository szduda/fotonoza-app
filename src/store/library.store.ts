import { saveStoreSnapshot } from "../lib/persistence"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo } from "./history.store"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export function createLibraryActions(
  set: SetStore,
): Pick<
  AppActions,
  "toggleSelectPhoto" | "clearSelectedPhotos" | "openInEditor" | "approvePhoto" | "declinePhoto"
> {
  return {
    toggleSelectPhoto: (photoId) =>
      withUndo(set, "toggle-select-photo", (s) => ({
        ...s,
        photos: s.photos.map((photo) =>
          photo.id === photoId ? { ...photo, selected: !photo.selected } : photo,
        ),
      })),
    clearSelectedPhotos: () =>
      withUndo(set, "clear-selected-photos", (s) => ({
        ...s,
        photos: s.photos.map((photo) => (photo.selected ? { ...photo, selected: false } : photo)),
      })),
    openInEditor: (photoId) => {
      set((current) => {
        const present = {
          ...current.present,
          mode: "edit" as const,
          currentPhotoId: photoId,
        }
        void saveStoreSnapshot(present, current.past, current.future)
        return {
          ...current,
          present,
          editPreviewPath: undefined,
          editPreviewPhotoId: undefined,
          editPreviewPending: 0,
        }
      })
    },
    approvePhoto: (photoId) =>
      withUndo(set, "approve-photo", (s) => ({
        ...s,
        photos: s.photos.map((photo) =>
          photo.id === photoId ? { ...photo, approved: true } : photo,
        ),
      })),
    declinePhoto: (photoId) =>
      withUndo(set, "decline-photo", (s) => ({
        ...s,
        photos: s.photos.filter((photo) => photo.id !== photoId),
        currentPhotoId: s.currentPhotoId === photoId ? undefined : s.currentPhotoId,
      })),
  }
}
