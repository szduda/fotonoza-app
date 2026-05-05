import type { AppMode, AppState, BasicEffectsState, Photo, UiLayoutState } from "@/types/domain"

export interface AppActions {
  initialize: () => Promise<void>
  setMode: (mode: AppMode) => void
  importPreviewPhotos: (paths: string[]) => void
  toggleSelectPhoto: (photoId: string) => void
  clearSelectedPhotos: () => void
  openInEditor: (photoId: string) => void
  approvePhoto: (photoId: string) => void
  declinePhoto: (photoId: string) => void
  mergePhotoFromDisk: (photoId: string, partial: Partial<Photo>) => void
  patchBasicEffects: (photoId: string, effects: Partial<BasicEffectsState>) => void
  setEditPreview: (photoId: string | undefined, path: string | undefined) => void
  adjustEditPreviewPending: (delta: number) => void
  undo: () => void
  redo: () => void
  jumpToHistory: (index: number) => void
  setLocale: (locale: "en" | "pl") => void
  setExportField: <K extends keyof AppState["exportSettings"]>(
    key: K,
    value: AppState["exportSettings"][K],
  ) => void
  setTogglePanelExpanded: (id: string, expanded: boolean) => void
  patchLayout: (partial: Partial<UiLayoutState>) => void
}

export interface StoreShape {
  present: AppState
  editPreviewPath?: string
  editPreviewPhotoId?: string
  editPreviewEpoch: number
  editPreviewPending: number
  actions: AppActions
}
