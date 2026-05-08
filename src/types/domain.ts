export type AppMode = "import" | "view" | "edit"

export type ExportFormat = "jpg" | "png"

export interface PhotoAdjustment {
  id: string
  name: string
  enabled: boolean
  params: Record<string, number | string | boolean>
}

/** Software preview / persisted basic tonal grade (EV, contrast, clarity). */
export interface BasicEffectsState {
  exposure: number
  contrast: number
  contrastBalance: number
  clarity: number
}

export const defaultBasicEffects = (): BasicEffectsState => ({
  exposure: 0,
  contrast: 1,
  contrastBalance: 0,
  clarity: 0,
})

/** Color grading: saturation family + white balance style axes (−1…1). */
export interface ColorEffectsState {
  vibrance: number
  saturation: number
  /** Cool (−1) → warm (+1). */
  temperature: number
  /** Green (−1) → magenta (+1). */
  tint: number
}

export const defaultColorEffects = (): ColorEffectsState => ({
  vibrance: 0,
  saturation: 1,
  temperature: 0,
  tint: 0,
})

export interface ShadowsHighlightsState {
  shadows: number
  darks: number
  lights: number
  highlights: number
}

export const defaultShadowsHighlights = (): ShadowsHighlightsState => ({
  shadows: 0,
  darks: 0,
  lights: 0,
  highlights: 0,
})

export interface DarktableFxState {
  filmicRgb: boolean
  profiledDenoise: boolean
}

export const defaultDarktableFx = (): DarktableFxState => ({
  filmicRgb: false,
  profiledDenoise: false,
})

export interface Photo {
  id: string
  fileName: string
  sourcePath: string
  thumbnailPath?: string
  /** Bumps img URL after regenerate; stripped when persisting. */
  thumbnailNonce?: number
  selected: boolean
  approved: boolean
  adjustments: PhotoAdjustment[]
  basicEffects?: BasicEffectsState
  colorEffects?: ColorEffectsState
  shadowsHighlights?: ShadowsHighlightsState
  darktableFx?: DarktableFxState
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
  basicEffects?: BasicEffectsState
  colorEffects?: ColorEffectsState
  shadowsHighlights?: ShadowsHighlightsState
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
  /** Slider / numeric ops: change from state-before-gesture to committed state. */
  delta?: number
}

/** Width/height of each chrome section when collapsed (strip stays visible). */
export const CHROME_STRIP_PX = 5

export interface UiLayoutState {
  leftSidebarWidthPx: number
  rightSidebarWidthPx: number
  timelineHeightPx: number
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  timelineCollapsed: boolean
  topBarCollapsed: boolean
}

export const defaultUiLayout: UiLayoutState = {
  leftSidebarWidthPx: 300,
  rightSidebarWidthPx: 300,
  timelineHeightPx: 200,
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

/** Stored `HistoryEntry.label` values — keep in sync with `withUndo` / effect commits. */
export type HistoryStoredLabel =
  | "toggle-select-photo"
  | "clear-selected-photos"
  | "open-in-editor"
  | "approve-photo"
  | "decline-photo"
  | "import-preview"
  | "set-locale-en"
  | "set-locale-pl"
  | "basic-effects-exposure"
  | "basic-effects-contrast"
  | "basic-effects-contrast-balance"
  | "basic-effects-clarity"
  | "basic-effects-vibrance"
  | "basic-effects-saturation"
  | "color-effects-vibrance"
  | "color-effects-saturation"
  | "color-effects-temperature"
  | "color-effects-tint"
  | "shadows-highlights-shadows"
  | "shadows-highlights-darks"
  | "shadows-highlights-lights"
  | "shadows-highlights-highlights"

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
  /** Display strings for timeline entries (`HistoryEntry.label`). */
  historyOps: { [K in HistoryStoredLabel]: string }
  labels: {
    selectedCount: string
    histogram: string
    effects: string
    basicEffects: string
    colorEffects: string
    shadowsHighlights: string
    filmicRgb: string
    denoiseProfiled: string
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
