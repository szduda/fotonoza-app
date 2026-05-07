import {
  ensureLibrarySources,
  ensureThumbnails,
  loadAppState,
  resolveThumbnailPaths,
} from "@/lib/persistence"
import { produce } from "immer"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo } from "./history.store"
import { defaultUiLayout, type AppState, type Photo } from "@/types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type SetTemporalSnapshots = (past: AppState[], future: AppState[]) => void

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
      thumbnailPath: photo.thumbnailPath?.endsWith(".thumb") ? undefined : photo.thumbnailPath,
    })),
    layout: { ...defaultUiLayout, ...(present.layout ?? {}) },
    togglePanelExpanded:
      panelState && typeof panelState === "object" && !Array.isArray(panelState) ? panelState : {},
  }
}

export const createIoActions = (
  set: SetStore,
  setTemporalSnapshots: SetTemporalSnapshots,
): Pick<AppActions, "initialize" | "importPreviewPhotos" | "setExportField"> => {
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
      const past = loaded.past.map((state) => mapStateToLibrary(state, library))
      const future = loaded.future.map((state) => mapStateToLibrary(state, library))
      void ensureThumbnails(present.photos.map((photo) => photo.sourcePath))
      if (loaded.past.length === 0 && present.history.length > 0) {
        present = { ...present, history: [], historyCursor: 0 }
      }
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
      )
      void resolveThumbnailPaths(present.photos.map((photo) => photo.sourcePath)).then((entries) => {
        const pathBySource = new Map(entries.map((entry) => [entry.sourcePath, entry.thumbnailPath]))
        set(
          produce((current: StoreShape) => {
            for (const photo of current.present.photos) {
              const thumbnailPath = pathBySource.get(photo.sourcePath)
              if (thumbnailPath) photo.thumbnailPath = thumbnailPath
            }
          }),
        )
      })
    },
    importPreviewPhotos: (paths) => {
      void ensureLibrarySources(paths).then((libraryEntries) => {
        const libraryPaths = libraryEntries.map((entry) => entry.libraryPath)
        withUndo(set, "import-preview", (s) => {
          s.photos.push(...libraryPaths.map(buildPhoto))
          s.mode = "view"
        })
        void ensureThumbnails(libraryPaths)
        void resolveThumbnailPaths(libraryPaths).then((entries) => {
          const pathBySource = new Map(entries.map((entry) => [entry.sourcePath, entry.thumbnailPath]))
          set(
            produce((current: StoreShape) => {
              for (const photo of current.present.photos) {
                const thumbnailPath = pathBySource.get(photo.sourcePath)
                if (thumbnailPath) photo.thumbnailPath = thumbnailPath
              }
            }),
          )
        })
      })
    },
    setExportField: (key, value) =>
      withUndo(set, `set-export-${String(key)}`, (s) => {
        s.exportSettings[key] = value
      }),
  }
}
