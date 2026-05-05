import { loadAppState } from "../lib/persistence"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo } from "./history.store"
import { defaultUiLayout, type AppState, type Photo } from "../types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path
}

function buildPhoto(path: string): Photo {
  return {
    id: crypto.randomUUID(),
    fileName: fileNameFromPath(path),
    sourcePath: path,
    selected: false,
    approved: false,
    adjustments: [],
  }
}

function normalizePresent(present: AppState): AppState {
  const panelState = (present as Partial<AppState>).togglePanelExpanded
  return {
    ...present,
    layout: { ...defaultUiLayout, ...(present.layout ?? {}) },
    togglePanelExpanded:
      panelState && typeof panelState === "object" && !Array.isArray(panelState) ? panelState : {},
  }
}

export function createIoActions(
  set: SetStore,
): Pick<AppActions, "initialize" | "importPreviewPhotos" | "setExportField"> {
  return {
    initialize: async () => {
      const loaded = await loadAppState()
      if (!loaded) return
      let present = normalizePresent(loaded.present)
      if (loaded.past.length === 0 && present.history.length > 0) {
        present = { ...present, history: [], historyCursor: 0 }
      }
      set((current) => ({
        ...current,
        present,
        past: loaded.past,
        future: loaded.future,
        editPreviewPath: undefined,
        editPreviewPhotoId: undefined,
        editPreviewEpoch: 0,
        editPreviewPending: 0,
      }))
    },
    importPreviewPhotos: (paths) =>
      withUndo(set, "import-preview", (s) => ({
        ...s,
        photos: [...s.photos, ...paths.map(buildPhoto)],
        mode: "view",
      })),
    setExportField: (key, value) =>
      withUndo(set, `set-export-${String(key)}`, (s) => ({
        ...s,
        exportSettings: {
          ...s.exportSettings,
          [key]: value,
        },
      })),
  }
}
