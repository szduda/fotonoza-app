import type {
  AppMode,
  AppState,
  BasicEffectsState,
  ColorEffectsState,
  DarktableFxState,
  Photo,
  PhotoExifSummary,
  PhotoFiltersState,
  ShadowsHighlightsState,
  UiLayoutState,
} from "@/types/domain"

export interface AppActions {
  initialize: () => Promise<void>
  /** Regenerate JPEG thumb after load failure (`PhotoThumbnail` onError path). */
  ensurePhotoThumbnail: (photoId: string) => void
  setMode: (mode: AppMode) => void
  importPreviewPhotos: (paths: string[]) => void
  toggleSelectPhoto: (photoId: string) => void
  clearSelectedPhotos: () => void
  openInEditor: (photoId: string) => void
  /** Edit shell bootstrap only (no history); avoids undo loops when `currentPhotoId` is empty. */
  ensureEditPhoto: (photoId: string) => void
  approvePhoto: (photoId: string) => void
  declinePhoto: (photoId: string) => void
  /** 0–5; recorded in undo/history. */
  setPhotoRating: (photoId: string, rating: number) => void
  mergePhotoFromDisk: (photoId: string, partial: Partial<Photo>) => void
  patchBasicEffects: (
    photoId: string,
    effects: Partial<BasicEffectsState>,
    historyLabel: string,
    historyDelta?: number,
  ) => void
  patchShadowsHighlights: (
    photoId: string,
    fx: Partial<ShadowsHighlightsState>,
    historyLabel: string,
    historyDelta?: number,
  ) => void
  patchColorEffects: (
    photoId: string,
    fx: Partial<ColorEffectsState>,
    historyLabel: string,
    historyDelta?: number,
  ) => void
  patchDarktableFx: (photoId: string, fx: Partial<DarktableFxState>) => void
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
  syncEditChrome: (next: EditChromeState) => void
  patchGpuPreviewAssist: (partial: Partial<GpuPreviewAssistState>) => void
  /** View grid hover target for metadata + keyboard ratings (not undo). */
  setViewHoveredPhoto: (photoId: string | undefined) => void
  setPhotoFilter: (partial: Partial<PhotoFiltersState>) => void
  /** In-memory EXIF rows for filter matching (not persisted). */
  mergeExifCache: (partial: Record<string, PhotoExifSummary>) => void
  setCollectionFilter: (collectionFilter: string | undefined) => void
  /** Returns new folder id, or null if max nesting depth blocks creation. */
  addCollectionFolder: (name: string) => string | null
  renameCollectionFolder: (folderId: string, name: string) => void
  /** `null` = Others (clear `collectionId`). */
  assignSelectedPhotosCollection: (folderId: string | null) => void
}

/** Edit chrome (sidebar buttons): zoom bounds & photo presence — not undo history. */
export interface EditChromeState {
  canZoomIn: boolean
  canZoomOut: boolean
  hasWorkPhoto: boolean
}

/** Edit GPU preview overlays (histogram source); not persisted. */
export interface GpuPreviewAssistState {
  focusPeaking: boolean
  highlightClipping: boolean
}

export interface StoreShape {
  present: AppState
  isBooting: boolean
  editChrome: EditChromeState
  gpuPreviewAssist: GpuPreviewAssistState
  /** Populated for filter matching only. */
  exifCache: Record<string, PhotoExifSummary>
  viewHoveredPhotoId?: string
  editPreviewPath?: string
  editPreviewPhotoId?: string
  editPreviewEpoch: number
  editPreviewPending: number
  actions: AppActions
}
