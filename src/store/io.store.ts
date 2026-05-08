import { ensureThumbnailBatchResolved } from "@/lib/thumbnailJobs"
import {
  ensureLibrarySources,
  loadAppState,
  repairThumbnail,
  saveStoreSnapshot,
} from "@/lib/persistence"
import { produce } from "immer"
import type { AppActions, StoreShape } from "./appStore.types"
import { getTemporalSnapshots, withUndo, withoutTemporalRecord } from "./history.store"
import { defaultPhotoFilters, defaultUiLayout, type AppState, type Photo } from "@/types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type SetTemporalSnapshots = (past: AppState[], future: AppState[]) => void
type GetStore = () => StoreShape

const fileNameFromPath = (path: string): string => {
  return path.split(/[\\/]/).at(-1) ?? path
}

const buildPhoto = (path: string): Photo => {
  return {
    id: crypto.randomUUID(),
    fileName: fileNameFromPath(path),
    sourcePath: path,
    thumbnailPath: undefined,
    selected: false,
    approved: false,
    rating: 0,
    adjustments: [],
  }
}

const mapSourceToLibrary = (
  photos: Photo[],
  entries: Array<{ sourcePath: string; libraryPath: string }>,
): Photo[] => {
  const bySource = new Map(entries.map((entry) => [entry.sourcePath, entry.libraryPath]))
  return photos.map((photo) => ({
    ...photo,
    sourcePath: bySource.get(photo.sourcePath) ?? photo.sourcePath,
  }))
}

const mapStateToLibrary = (
  state: AppState,
  entries: Array<{ sourcePath: string; libraryPath: string }>,
): AppState => ({
  ...state,
  photos: mapSourceToLibrary(state.photos, entries),
})

const normalizePresent = (present: AppState): AppState => {
  const panelState = (present as Partial<AppState>).togglePanelExpanded
  return {
    ...present,
    photos: present.photos.map((photo) => ({
      ...photo,
      rating: photo.rating ?? 0,
      thumbnailPath: photo.thumbnailPath?.endsWith(".thumb") ? undefined : photo.thumbnailPath,
    })),
    layout: { ...defaultUiLayout, ...(present.layout ?? {}) },
    photoFilters: { ...defaultPhotoFilters(), ...(present.photoFilters ?? {}) },
    togglePanelExpanded:
      panelState && typeof panelState === "object" && !Array.isArray(panelState) ? panelState : {},
  }
}

const patchThumbnailEntries = (
  set: SetStore,
  entries: Array<{ sourcePath: string; thumbnailPath: string }>,
) => {
  const pathBySource = new Map(entries.map((entry) => [entry.sourcePath, entry.thumbnailPath]))
  withoutTemporalRecord(() =>
    set(
      produce((current: StoreShape) => {
        for (const photo of current.present.photos) {
          const thumbnailPath = pathBySource.get(photo.sourcePath)
          if (thumbnailPath) photo.thumbnailPath = thumbnailPath
        }
      }),
    ),
  )
}

export const createIoActions = (
  set: SetStore,
  setTemporalSnapshots: SetTemporalSnapshots,
  get: GetStore,
): Pick<
  AppActions,
  "initialize" | "importPreviewPhotos" | "setExportField" | "ensurePhotoThumbnail"
> => {
  return {
    initialize: async () => {
      const loaded = await loadAppState()
      if (!loaded) return
      let present = normalizePresent(loaded.present)
      const allSourcePaths = [
        ...present.photos.map((photo) => photo.sourcePath),
        ...loaded.past.flatMap((state) => state.photos.map((photo) => photo.sourcePath)),
        ...loaded.future.flatMap((state) => state.photos.map((photo) => photo.sourcePath)),
      ]
      const library = await ensureLibrarySources(allSourcePaths)
      present = mapStateToLibrary(present, library)
      const past = loaded.past.map((state) => mapStateToLibrary(normalizePresent(state), library))
      const future = loaded.future.map((state) => mapStateToLibrary(normalizePresent(state), library))
      if (loaded.past.length === 0 && present.history.length > 0) {
        present = { ...present, history: [], historyCursor: 0 }
      }
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            current.present = present
            setTemporalSnapshots(past, future)
            current.present.historyCursor = loaded.past.length
            current.editPreviewPath = undefined
            current.editPreviewPhotoId = undefined
            current.editPreviewEpoch = 0
            current.editPreviewPending = 0
          }),
        ),
      )

      const presentSources = present.photos.map((photo) => photo.sourcePath)
      void ensureThumbnailBatchResolved(presentSources).then((entries) => patchThumbnailEntries(set, entries))
    },

    importPreviewPhotos: (paths) => {
      void ensureLibrarySources(paths).then((libraryEntries) => {
        const libraryPaths = libraryEntries.map((entry) => entry.libraryPath)
        withUndo(set, "import-preview", (s) => {
          s.photos.push(...libraryPaths.map(buildPhoto))
          s.mode = "view"
        })

        void ensureThumbnailBatchResolved(libraryPaths).then((entries) => patchThumbnailEntries(set, entries))
      })
    },

    setExportField: (key, value) =>
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            const exportSettings = { ...current.present.exportSettings, [key]: value }
            const present = { ...current.present, exportSettings }
            const { past, future } = getTemporalSnapshots()
            void saveStoreSnapshot(present, past, future)
            current.present = present
          }),
        ),
      ),

    ensurePhotoThumbnail: (photoId) => {
      const photo = get().present.photos.find((p) => p.id === photoId)
      if (!photo) return

      void repairThumbnail(photo.sourcePath).then((thumbPath) => {
        if (!thumbPath) return
        withoutTemporalRecord(() =>
          set(
            produce((current: StoreShape) => {
              const p = current.present.photos.find((item) => item.id === photoId)
              if (!p) return
              p.thumbnailPath = thumbPath
              p.thumbnailNonce = (p.thumbnailNonce ?? 0) + 1
            }),
          ),
        )
      })
    },
  }
}
