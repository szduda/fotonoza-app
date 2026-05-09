import { saveStoreSnapshot } from "@/lib/persistence"
import { produce } from "immer"
import type {
  AppActions,
  EditChromeState,
  GpuPreviewAssistState,
  StoreShape,
} from "./appStore.types"
import { getTemporalSnapshots, withUndo, withoutTemporalRecord } from "./history.store"
import { defaultUiLayout, type AppMode } from "@/types/domain"

type SetStore = (fn: (current: StoreShape) => StoreShape) => void

export const createUiActions = (
  set: SetStore,
): Pick<
  AppActions,
  | "setMode"
  | "setLocale"
  | "setTogglePanelExpanded"
  | "patchLayout"
  | "syncEditChrome"
  | "setViewHoveredPhoto"
  | "patchGpuPreviewAssist"
> => {
  return {
    setMode: (mode: AppMode) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            const present = { ...current.present, mode }
            const { past, future } = getTemporalSnapshots()
            void saveStoreSnapshot(present, past, future)
            current.present = present
            if (mode !== "view") current.viewHoveredPhotoId = undefined
          }),
        ),
      )
    },
    setLocale: (locale) =>
      withUndo(set, `set-locale-${locale}`, (s) => {
        s.locale = locale
      }),
    setTogglePanelExpanded: (id, expanded) => {
      withoutTemporalRecord(() =>
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
        ),
      )
    },
    patchLayout: (partial) => {
      withoutTemporalRecord(() =>
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
        ),
      )
    },
    syncEditChrome: (next: EditChromeState) => {
      withoutTemporalRecord(() =>
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
        ),
      )
    },
    setViewHoveredPhoto: (photoId) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            current.viewHoveredPhotoId = photoId
          }),
        ),
      )
    },
    patchGpuPreviewAssist: (partial: Partial<GpuPreviewAssistState>) => {
      withoutTemporalRecord(() =>
        set(
          produce((current: StoreShape) => {
            Object.assign(current.gpuPreviewAssist, partial)
          }),
        ),
      )
    },
  }
}
