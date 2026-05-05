import { saveStoreSnapshot } from "../lib/persistence"
import type { AppState, HistoryEntry } from "../types/domain"
import { defaultUiLayout } from "../types/domain"
import type { AppActions, StoreShape } from "./appStore.types"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type GetStore = () => StoreShape

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

export function withUndo(set: SetStore, label: string, mutator: (s: AppState) => AppState): void {
  set((current) => {
    const layout = current.present.layout ?? defaultUiLayout
    const nextPresent = pushHistory({ ...mutator(current.present), layout }, label)
    const trimmedPast = [...current.past, current.present].slice(-100)
    void saveStoreSnapshot(nextPresent, trimmedPast, [])
    return { ...current, present: nextPresent, past: trimmedPast, future: [] }
  })
}

export function createHistoryActions(
  set: SetStore,
  get: GetStore,
): Pick<AppActions, "undo" | "redo" | "jumpToHistory"> {
  return {
    undo: () => {
      const { past, present, future } = get()
      if (past.length === 0) return
      const layout = present.layout ?? defaultUiLayout
      const previous = {
        ...past[past.length - 1],
        layout,
        history: present.history,
        historyCursor: Math.max(0, present.historyCursor - 1),
        togglePanelExpanded: present.togglePanelExpanded,
      }
      const remainingPast = past.slice(0, -1)
      void saveStoreSnapshot(previous, remainingPast, [present, ...future].slice(0, 100))
      set((current) => ({
        ...current,
        present: previous,
        past: remainingPast,
        future: [present, ...future].slice(0, 100),
        editPreviewPath: undefined,
        editPreviewPhotoId: undefined,
        editPreviewPending: 0,
      }))
    },
    redo: () => {
      const { past, present, future } = get()
      if (future.length === 0) return
      const layout = present.layout ?? defaultUiLayout
      const next = {
        ...future[0],
        layout,
        history: present.history,
        historyCursor: Math.min(present.history.length - 1, present.historyCursor + 1),
        togglePanelExpanded: present.togglePanelExpanded,
      }
      void saveStoreSnapshot(next, [...past, present].slice(-100), future.slice(1))
      set((current) => ({
        ...current,
        present: next,
        past: [...past, present].slice(-100),
        future: future.slice(1),
        editPreviewPath: undefined,
        editPreviewPhotoId: undefined,
        editPreviewPending: 0,
      }))
    },
    jumpToHistory: (index) => {
      const { past, present, future } = get()
      const timeline = [...past, present, ...future]
      const { history } = present
      if (index < 0 || index >= history.length) return
      const targetIdx = index + 1
      if (targetIdx >= timeline.length) return
      const layout = present.layout ?? defaultUiLayout
      const target = {
        ...timeline[targetIdx],
        layout,
        history: present.history,
        historyCursor: index,
        togglePanelExpanded: present.togglePanelExpanded,
      }
      const newPast = timeline.slice(0, targetIdx)
      const newFuture = timeline.slice(targetIdx + 1).slice(0, 100)
      void saveStoreSnapshot(target, newPast, newFuture)
      set((current) => ({
        ...current,
        present: target,
        past: newPast,
        future: newFuture,
        editPreviewPath: undefined,
        editPreviewPhotoId: undefined,
        editPreviewPending: 0,
      }))
    },
  }
}
