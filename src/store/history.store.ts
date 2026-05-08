import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type { AppState, HistoryEntry } from "@/types/domain"
import { defaultUiLayout } from "@/types/domain"
import type { AppActions, StoreShape } from "./appStore.types"
import { useAppStore } from "./appStore"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void
type GetStore = () => StoreShape

type GetTemporalSnapshots = () => { past: AppState[]; future: AppState[] }

/** Updates that must not consume undo steps — keeps zundo depth aligned with `present.history`. */
export function withoutTemporalRecord(run: () => void): void {
  const temporal = useAppStore.temporal.getState()
  const active = temporal.isTracking
  if (active) temporal.pause()
  try {
    run()
  } finally {
    if (active) temporal.resume()
  }
}

/** Disk + old sessions used bare `AppState`; zundo now stores `{ present: AppState }`. */
function unwrapTemporalPresent(entry: unknown): AppState {
  if (
    entry &&
    typeof entry === "object" &&
    "present" in entry &&
    (entry as { present: unknown }).present &&
    typeof (entry as { present: unknown }).present === "object"
  ) {
    return (entry as { present: AppState }).present
  }
  return entry as AppState
}

export const getTemporalSnapshots: GetTemporalSnapshots = () => {
  const temporal = useAppStore.temporal.getState()
  return {
    past: temporal.pastStates.map(unwrapTemporalPresent),
    future: temporal.futureStates.map(unwrapTemporalPresent),
  }
}

const historyEntry = (label: string, delta?: number): HistoryEntry => {
  const entry: HistoryEntry = { id: crypto.randomUUID(), label, at: Date.now() }
  if (delta !== undefined && Number.isFinite(delta)) entry.delta = delta
  return entry
}

const pushHistory = (state: AppState, label: string, delta?: number): AppState => {
  const maxOps = 30
  const rollbackSafe = state.history.slice(0, Math.max(0, state.historyCursor + 1))
  const updatedHistory = [...rollbackSafe.slice(-(maxOps - 1)), historyEntry(label, delta)]
  return {
    ...state,
    history: updatedHistory,
    historyCursor: updatedHistory.length - 1,
  }
}

/**
 * zundo's undo/redo concat uses `partialize(get())` without cloning — the tip entry aliases live
 * `present`. Replace that slot with a deep snapshot taken before the temporal transition.
 */
function sealTemporalBranchTip(
  stack: "pastStates" | "futureStates",
  steps: number,
  tipPresent: AppState,
): void {
  useAppStore.temporal.setState((t) => {
    const arr = [...t[stack]]
    const i = arr.length - steps
    if (i >= 0 && i < arr.length) {
      arr[i] = { present: tipPresent }
    }
    return { ...t, [stack]: arr }
  })
}

export const withUndo = (
  set: SetStore,
  label: string,
  mutator: (s: AppState) => void,
  patchStore?: (draft: StoreShape) => void,
  historyDelta?: number,
): void => {
  set(
    produce((current: StoreShape) => {
      const layout = current.present.layout ?? defaultUiLayout
      const nextBase = produce(current.present, mutator)
      const nextPresent = pushHistory({ ...nextBase, layout }, label, historyDelta)
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      current.present = nextPresent
      patchStore?.(current)
    }),
  )
}

export const createHistoryActions = (
  set: SetStore,
  get: GetStore,
): Pick<AppActions, "undo" | "redo" | "jumpToHistory"> => {
  return {
    undo: () => {
      const { present } = get()
      const temporal = useAppStore.temporal.getState()
      if (temporal.pastStates.length === 0) return
      const leavingPresent = structuredClone(present)
      temporal.undo()
      sealTemporalBranchTip("futureStates", 1, leavingPresent)
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      withoutTemporalRecord(() =>
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
        ),
      )
    },
    redo: () => {
      const { present } = get()
      const temporal = useAppStore.temporal.getState()
      if (temporal.futureStates.length === 0) return
      const leavingPresent = structuredClone(present)
      temporal.redo()
      sealTemporalBranchTip("pastStates", 1, leavingPresent)
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      withoutTemporalRecord(() =>
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
        ),
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
      const leavingPresent = structuredClone(get().present)
      if (index < currentIdx) {
        temporal.undo(steps)
        sealTemporalBranchTip("futureStates", steps, leavingPresent)
      } else {
        temporal.redo(steps)
        sealTemporalBranchTip("pastStates", steps, leavingPresent)
      }
      const nextPresent = get().present
      const { past, future } = getTemporalSnapshots()
      void saveStoreSnapshot(nextPresent, past, future)
      withoutTemporalRecord(() =>
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
        ),
      )
    },
  }
}
