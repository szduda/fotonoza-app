import { create } from "zustand"
import { temporal } from "zundo"
import type { AppState } from "@/types/domain"
import { defaultPhotoFilters, defaultUiLayout } from "@/types/domain"
import type { StoreShape } from "./appStore.types"
import { createHistoryActions } from "./history.store"
import { createUiActions } from "./ui.store"
import { createIoActions } from "./io.store"
import { createLibraryActions } from "./library.store"
import { createEffectsActions } from "./effects.store"
import { createFilterActions } from "./filter.store"
import { createCollectionsActions } from "./collections.store"

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
  photoFilters: defaultPhotoFilters(),
  collectionFolders: [],
}

/** zundo merges partialized snapshots onto the root store; nest `present` so undo restores photos/history. */
type TemporalPresentSlice = Pick<StoreShape, "present">

const clonePresentForStack = (slice: TemporalPresentSlice): TemporalPresentSlice => ({
  present: structuredClone(slice.present),
})

const wrapTemporalSnapshots = (states: AppState[]): TemporalPresentSlice[] =>
  states.map((p) => ({ present: structuredClone(p) }))

const setTemporalSnapshots = (past: AppState[], future: AppState[]) => {
  useAppStore.temporal.setState({
    pastStates: wrapTemporalSnapshots(past),
    futureStates: wrapTemporalSnapshots(future),
  })
}

export const useAppStore = create<StoreShape>()(
  temporal(
    (set, get) => ({
      present: initialState,
      isBooting: true,
      editChrome: {
        canZoomIn: false,
        canZoomOut: false,
        hasWorkPhoto: false,
      },
      exifCache: {},
      viewHoveredPhotoId: undefined,
      editPreviewPath: undefined,
      editPreviewPhotoId: undefined,
      editPreviewEpoch: 0,
      editPreviewPending: 0,
      actions: {
        ...createIoActions(set, setTemporalSnapshots, get),
        ...createLibraryActions(set),
        ...createEffectsActions(set),
        ...createHistoryActions(set, get),
        ...createUiActions(set),
        ...createFilterActions(set),
        ...createCollectionsActions(set, get),
      },
    }),
    {
      partialize: (state): TemporalPresentSlice => ({ present: state.present }),
      limit: 30,
      handleSet: (impl) => {
        type StackPush = (
          pastState: unknown,
          replace: unknown,
          currentState: unknown,
          deltaState: unknown,
        ) => void
        const push = impl as unknown as StackPush
        return (pastState, replace, currentState, deltaState) => {
          const slice = (deltaState ?? pastState) as TemporalPresentSlice | undefined
          const frozen =
            slice &&
            typeof slice === "object" &&
            "present" in slice &&
            slice.present &&
            typeof slice.present === "object"
              ? clonePresentForStack(slice as TemporalPresentSlice)
              : slice
          push(pastState, replace, currentState, frozen)
        }
      },
    },
  ),
)

export type { AppActions, StoreShape } from "./appStore.types"
