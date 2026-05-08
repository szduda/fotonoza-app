import { canNestUnderParent, parentForNewFolder } from "@/lib/collections"
import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type { CollectionFolder } from "@/types/domain"
import type { AppActions, StoreShape } from "./appStore.types"
import { getTemporalSnapshots, withoutTemporalRecord } from "./history.store"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type GetStore = () => StoreShape

export const createCollectionsActions = (
  set: SetStore,
  get: GetStore,
): Pick<
  AppActions,
  | "setCollectionFilter"
  | "addCollectionFolder"
  | "renameCollectionFolder"
  | "assignSelectedPhotosCollection"
> => ({
  setCollectionFilter: (collectionFilter) => {
    withoutTemporalRecord(() =>
      set(
        produce((current: StoreShape) => {
          current.present.collectionFilter = collectionFilter
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(current.present, past, future)
        }),
      ),
    )
  },

  addCollectionFolder: (name) => {
    const folders = get().present.collectionFolders ?? []
    const parentId = parentForNewFolder(get().present.collectionFilter)
    if (!canNestUnderParent(folders, parentId)) return null
    const id = crypto.randomUUID()
    const folder: CollectionFolder = {
      id,
      parentId,
      name: name.trim() || "Collection",
    }
    withoutTemporalRecord(() =>
      set(
        produce((current: StoreShape) => {
          current.present.collectionFolders = [...(current.present.collectionFolders ?? []), folder]
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(current.present, past, future)
        }),
      ),
    )
    return id
  },

  renameCollectionFolder: (folderId, name) => {
    withoutTemporalRecord(() =>
      set(
        produce((current: StoreShape) => {
          const f = current.present.collectionFolders?.find((x) => x.id === folderId)
          if (!f) return
          const next = name.trim()
          if (next.length > 0) f.name = next
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(current.present, past, future)
        }),
      ),
    )
  },

  assignSelectedPhotosCollection: (folderId) => {
    withoutTemporalRecord(() =>
      set(
        produce((current: StoreShape) => {
          for (const p of current.present.photos) {
            if (!p.selected) continue
            if (folderId === null) delete p.collectionId
            else p.collectionId = folderId
          }
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(current.present, past, future)
        }),
      ),
    )
  },
})
