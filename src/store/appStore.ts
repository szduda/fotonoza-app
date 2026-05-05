import { create } from "zustand"
import type { AppState } from "../types/domain"
import { defaultUiLayout } from "../types/domain"
import type { StoreShape } from "./appStore.types"
import { createHistoryActions } from "./history.store"
import { createUiActions } from "./ui.store"
import { createIoActions } from "./io.store"
import { createLibraryActions } from "./library.store"
import { createEffectsActions } from "./effects.store"

const initialState: AppState = {
  mode: "import",
  photos: [],
  history: [],
  historyCursor: 0,
  togglePanelExpanded: {},
  exportSettings: {
    directory: "",
    format: "jpg",
    quality: 85,
    maxWidth: 4000,
    maxHeight: 4000,
    dontEnlarge: true,
  },
  locale: "en",
  layout: { ...defaultUiLayout },
}

export const useAppStore = create<StoreShape>((set, get) => ({
  present: initialState,
  past: [],
  future: [],
  editPreviewPath: undefined,
  editPreviewPhotoId: undefined,
  editPreviewEpoch: 0,
  editPreviewPending: 0,
  actions: {
    ...createIoActions(set),
    ...createLibraryActions(set),
    ...createEffectsActions(set),
    ...createHistoryActions(set, get),
    ...createUiActions(set),
  },
}))

export type { AppActions, StoreShape } from "./appStore.types"
