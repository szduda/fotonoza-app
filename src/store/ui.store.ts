import { saveStoreSnapshot } from "../lib/persistence"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo } from "./history.store"
import { defaultUiLayout, type AppMode } from "../types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export function createUiActions(
  set: SetStore,
): Pick<AppActions, "setMode" | "setLocale" | "setTogglePanelExpanded" | "patchLayout"> {
  return {
    setMode: (mode: AppMode) => {
      set((current) => {
        const present = { ...current.present, mode }
        void saveStoreSnapshot(present, current.past, current.future)
        return { ...current, present }
      })
    },
    setLocale: (locale) => withUndo(set, `set-locale-${locale}`, (s) => ({ ...s, locale })),
    setTogglePanelExpanded: (id, expanded) => {
      set((current) => {
        const nextExpanded = {
          ...current.present.togglePanelExpanded,
          [id]: expanded,
        }
        const present = {
          ...current.present,
          togglePanelExpanded: nextExpanded,
        }
        void saveStoreSnapshot(present, current.past, current.future)
        return { ...current, present }
      })
    },
    patchLayout: (partial) => {
      set((current) => {
        const layout = {
          ...(current.present.layout ?? defaultUiLayout),
          ...partial,
        }
        const present = { ...current.present, layout }
        void saveStoreSnapshot(present, current.past, current.future)
        return { ...current, present }
      })
    },
  }
}
