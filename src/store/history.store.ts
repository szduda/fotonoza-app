import { saveStoreSnapshot } from "../lib/persistence"
import { produce } from "immer"
import type { AppState, HistoryEntry } from "../types/domain"
import { defaultUiLayout } from "../types/domain"
import type { AppActions, StoreShape } from "./appStore.types"
import { useAppStore } from "./appStore"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type GetStore = () => StoreShape

type GetTemporalSnapshots = () => { past: AppState[]; future: AppState[] }

export const getTemporalSnapshots: GetTemporalSnapshots = () => {
  const temporal = useAppStore.temporal.getState()
  return {
    past: temporal.pastStates as AppState[],
    future: temporal.futureStates as AppState[],
  }
}

function historyEntry(label: string): HistoryEntry {
  return { id: crypto.randomUUID(), label, at: Date.now() }
}

function pushHistory(state: AppState, label: string): AppState {
  const maxOps = 100
  const rollbackSafe = state.history.slice(0, Math.max(0, state.historyCursor + 1))
  const updatedHistory = [...rollbackSafe.slice(-(maxOps - 1)), historyEntry(label)]
  return {
    ...state,
    history: updatedHistory,
    historyCursor: updatedHistory.length - 1,
  }
}

export function withUndo(
  set: SetStore,
  label: string,
  mutator: (s: AppState) => void,
): void {
  set(
    produce((current: StoreShape) => {
    const layout = current.present.layout ?? defaultUiLayout
    const nextBase = produce(current.present, mutator)
    const nextPresent = pushHistory({ ...nextBase, layout }, label)
    const { past, future } = getTemporalSnapshots()
    void saveStoreSnapshot(nextPresent, past, future)
    current.present = nextPresent
  }),
  )
}

export function createHistoryActions(
  set: SetStore,
  get: GetStore,
): Pick<AppActions, "undo" | "redo" | "jumpToHistory"> {
  return {
    undo: () => {
      const { present } = get()
      const temporal = useAppStore.temporal.getState()
      if (temporal.pastStates.length === 0) return
      temporal.undo()
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      set(
        produce((current: StoreShape) => {
          current.present.history = present.history
          current.present.historyCursor = Math.max(0, present.historyCursor - 1)
          current.present.togglePanelExpanded = present.togglePanelExpanded
          current.present.layout = current.present.layout ?? defaultUiLayout
          current.editPreviewPath = undefined
          current.editPreviewPhotoId = undefined
          current.editPreviewPending = 0
        }),
      )
    },
    redo: () => {
      const { present } = get()
      const temporal = useAppStore.temporal.getState()
      if (temporal.futureStates.length === 0) return
      temporal.redo()
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      set(
        produce((current: StoreShape) => {
          current.present.history = present.history
          current.present.historyCursor = Math.min(
            present.history.length - 1,
            present.historyCursor + 1,
          )
          current.present.togglePanelExpanded = present.togglePanelExpanded
          current.present.layout = current.present.layout ?? defaultUiLayout
          current.editPreviewPath = undefined
          current.editPreviewPhotoId = undefined
          current.editPreviewPending = 0
        }),
      )
    },
    jumpToHistory: (index) => {
      const { present } = get()
      const { history } = present
      if (index < 0 || index >= history.length) return
      const temporal = useAppStore.temporal.getState()
      const currentIdx = present.historyCursor
      const steps = Math.abs(index - currentIdx)
      if (steps === 0) return
      if (index < currentIdx) temporal.undo(steps)
      else temporal.redo(steps)
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      set(
        produce((current: StoreShape) => {
          current.present.history = present.history
          current.present.historyCursor = index
          current.present.togglePanelExpanded = present.togglePanelExpanded
          current.present.layout = current.present.layout ?? defaultUiLayout
          current.editPreviewPath = undefined
          current.editPreviewPhotoId = undefined
          current.editPreviewPending = 0
        }),
      )
    },
  }
}
