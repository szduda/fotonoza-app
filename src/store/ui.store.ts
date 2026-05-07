import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type { AppActions, EditChromeState, StoreShape } from "./appStore.types"
import { getTemporalSnapshots, withUndo } from "./history.store"
import { defaultUiLayout, type AppMode } from "@/types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export const createUiActions = (
  set: SetStore,
): Pick<AppActions, "setMode" | "setLocale" | "setTogglePanelExpanded" | "patchLayout" | "syncEditChrome"> => {
  return {
    setMode: (mode: AppMode) => {
      set(
        produce((current: StoreShape) => {
          const present = { ...current.present, mode }
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(present, past, future)
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
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(present, past, future)
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
          const { past, future } = getTemporalSnapshots()
          void saveStoreSnapshot(present, past, future)
          current.present = present
        }),
      )
    },
    syncEditChrome: (next: EditChromeState) => {
      set(
        produce((current: StoreShape) => {
          const cur = current.editChrome
          if (
            cur.canZoomIn === next.canZoomIn &&
            cur.canZoomOut === next.canZoomOut &&
            cur.hasWorkPhoto === next.hasWorkPhoto
          ) {
            return
          }
          current.editChrome = next
        }),
      )
    },
  }
}
