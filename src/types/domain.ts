export type AppMode = "import" | "view" | "edit"

export type ExportFormat = "jpg" | "png"

export interface PhotoAdjustment {
  id: string
  name: string
  enabled: boolean
  params: Record<string, number | string | boolean>
}

/** Software preview / persisted basic grade (EV, contrast, saturation). */
export interface BasicEffectsState {
  exposure: number
  contrast: number
  saturation: number
}

export const defaultBasicEffects = (): BasicEffectsState => ({
  exposure: 0,
  contrast: 1,
  saturation: 1,
})

export interface Photo {
  id: string
  fileName: string
  sourcePath: string
  selected: boolean
  approved: boolean
  adjustments: PhotoAdjustment[]
  basicEffects?: BasicEffectsState
}

export interface ExportSettings {
  directory: string
  format: ExportFormat
  quality: number
  maxWidth: number
  maxHeight: number
  dontEnlarge: boolean
}

export interface ExportTaskPhoto {
  sourcePath: string
  fileName: string
}

export interface ExportJobStatus {
  jobId: string
  total: number
  completed: number
  failed: number
  running: boolean
  finished: boolean
  outputDir: string
  lastError?: string
}

export interface HistogramData {
  red: number[]
  green: number[]
  blue: number[]
  luma: number[]
}

export interface HistoryEntry {
  id: string
  at: number
  label: string
}

/** Width/height of each chrome section when collapsed (strip stays visible). */
export const CHROME_STRIP_PX = 5

export interface UiLayoutState {
  leftSidebarWidthPx: number
  rightSidebarWidthPx: number
  timelineHeightPx: number
  topBarHeightPx: number
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  timelineCollapsed: boolean
  topBarCollapsed: boolean
}

export const defaultUiLayout: UiLayoutState = {
  leftSidebarWidthPx: 300,
  rightSidebarWidthPx: 300,
  timelineHeightPx: 200,
  topBarHeightPx: 100,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  timelineCollapsed: false,
  topBarCollapsed: false,
}

export interface AppState {
  mode: AppMode
  photos: Photo[]
  currentPhotoId?: string
  history: HistoryEntry[]
  historyCursor: number
  togglePanelExpanded: Record<string, boolean>
  exportSettings: ExportSettings
  locale: "en" | "pl"
  layout: UiLayoutState
}

export interface TranslationSchema {
  appTitle: string
  mode: {
    import: string
    view: string
    edit: string
  }
  actions: {
    importFromDevice: string
    approve: string
    decline: string
    export: string
    undo: string
    redo: string
    close: string
  }
  labels: {
    selectedCount: string
    histogram: string
    effects: string
    basicEffects: string
    filmstrip: string
    history: string
    noPhotos: string
  }
  exportModal: {
    title: string
    directory: string
    format: string
    quality: string
    maxWidth: string
    maxHeight: string
    dontEnlarge: string
  }
}
