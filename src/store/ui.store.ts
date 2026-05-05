import { saveStoreSnapshot } from "../lib/persistence"
import { produce } from "immer"
import type { AppActions, StoreShape } from "./appStore.types"
import { withUndo } from "./history.store"
import { defaultUiLayout, type AppMode } from "../types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export function createUiActions(
  set: SetStore,
): Pick<AppActions, "setMode" | "setLocale" | "setTogglePanelExpanded" | "patchLayout"> {
  return {
    setMode: (mode: AppMode) => {
      set(
        produce((current: StoreShape) => {
        const present = { ...current.present, mode }
        void saveStoreSnapshot(present, current.past, current.future)
        current.present = present
      }),
      )
    },
    setLocale: (locale) =>
      withUndo(set, `set-locale-${locale}`, (s) => {
        s.locale = locale
      }),
    setTogglePanelExpanded: (id, expanded) => {
      set(
        produce((current: StoreShape) => {
        const nextExpanded = {
          ...current.present.togglePanelExpanded,
          [id]: expanded,
        }
        const present = {
          ...current.present,
          togglePanelExpanded: nextExpanded,
        }
        void saveStoreSnapshot(present, current.past, current.future)
        current.present = present
      }),
      )
    },
    patchLayout: (partial) => {
      set(
        produce((current: StoreShape) => {
        const layout = {
          ...(current.present.layout ?? defaultUiLayout),
          ...partial,
        }
        const present = { ...current.present, layout }
        void saveStoreSnapshot(present, current.past, current.future)
        current.present = present
      }),
      )
    },
  }
}
