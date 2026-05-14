import { invoke } from "@tauri-apps/api/core"
import type {
  AppState,
  BasicEffectsState,
  ColorEffectsState,
  DarktableFxState,
  ExportJobStatus,
  ExportSettings,
  ExportTaskPhoto,
  HistogramData,
  Photo,
  PhotoExifSummary,
  ShadowsHighlightsState,
} from "@/types/domain"

export type LoadedStore = {
  present: AppState
  past: AppState[]
  future: AppState[]
}

type DiskRoot = AppState & { undoPast?: AppState[]; undoFuture?: AppState[] }
export type ThumbPathEntry = { sourcePath: string; thumbnailPath: string }
export type LibraryPathEntry = { sourcePath: string; libraryPath: string }

const stripPhotoLocalState = (state: AppState): AppState => ({
  ...state,
  photos: state.photos.map((photo) => {
    const { thumbnailNonce: _discard, ...rest } = photo
    return {
      ...rest,
      basicEffects: undefined,
      colorEffects: undefined,
      shadowsHighlights: undefined,
      darktableFx: undefined,
    }
  }),
})

const SNAP_DEBOUNCE_MS = 320

type SnapPending = { present: AppState; past: AppState[]; future: AppState[] }

/**
 * Deep snapshot for async debounced save. Call sites often pass `{ ...draftPresent, … }` — the root is
 * plain but nested values can still be Immer proxies; `structuredClone` then throws and aborts the store
 * update. JSON round-trip reads proxies while the producer still runs.
 */
const toPersistableAppState = (s: AppState): AppState => JSON.parse(JSON.stringify(s)) as AppState

let snapPending: SnapPending | null = null
let snapDebounceTimer: ReturnType<typeof setTimeout> | null = null
let snapSaving = false

const runSaveAppState = async (p: SnapPending): Promise<void> => {
  const presentDisk = stripPhotoLocalState(p.present)
  const pastDisk = p.past.map(stripPhotoLocalState)
  const futureDisk = p.future.map(stripPhotoLocalState)
  await invoke("save_app_state", {
    snapshot: { ...presentDisk, undoPast: pastDisk, undoFuture: futureDisk },
  })
}

const scheduleSnapFlush = (): void => {
  if (snapDebounceTimer != null) clearTimeout(snapDebounceTimer)
  snapDebounceTimer = setTimeout(() => {
    snapDebounceTimer = null
    void flushSnapOnce()
  }, SNAP_DEBOUNCE_MS)
}

const flushSnapOnce = async (): Promise<void> => {
  if (snapSaving || snapPending === null) return
  const payload = snapPending
  snapPending = null
  snapSaving = true
  try {
    await runSaveAppState(payload)
  } finally {
    snapSaving = false
    if (snapPending !== null) scheduleSnapFlush()
  }
}

/** Persists app + undo stacks; debounced so typing and sliders do not invoke disk/IPC every tick. */
export const saveStoreSnapshot = (present: AppState, past: AppState[], future: AppState[]): void => {
  snapPending = {
    present: toPersistableAppState(present),
    past: past.map(toPersistableAppState),
    future: future.map(toPersistableAppState),
  }
  if (snapSaving) return
  scheduleSnapFlush()
}

/** Run pending debounced save(s) until idle (e.g. before window close). */
export const flushStoreSnapshot = async (): Promise<void> => {
  if (snapDebounceTimer != null) {
    clearTimeout(snapDebounceTimer)
    snapDebounceTimer = null
  }
  for (let i = 0; i < 24 && (snapPending !== null || snapSaving); i++) {
    if (snapSaving) {
      await new Promise<void>((r) => setTimeout(r, 40))
      continue
    }
    if (snapPending !== null) {
      const payload = snapPending
      snapPending = null
      snapSaving = true
      try {
        await runSaveAppState(payload)
      } finally {
        snapSaving = false
      }
    }
  }
  if (snapPending !== null && !snapSaving) scheduleSnapFlush()
}

export const loadAppState = async (): Promise<LoadedStore | null> => {
  const raw = await invoke<DiskRoot | null>("load_app_state")
  if (!raw) return null
  const { undoPast = [], undoFuture = [], ...present } = raw
  return { present, past: undoPast, future: undoFuture }
}

export const savePhotoState = async (photo: Photo): Promise<void> => {
  await invoke("save_photo_state", { photo })
}

export const loadPhotoState = async (fileName: string): Promise<Record<string, unknown> | null> => {
  const raw = await invoke<string | null>("load_photo_state", { fileName })
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Software RGB preview (fast for sliders). Full raw pipeline via darktable-cli is separate. */
export const renderBasicEffectsPreview = async (
  sourcePath: string,
  exposureEv: number,
  contrast: number,
  saturation: number,
): Promise<string> => {
  return invoke<string>("render_basic_effects_preview", {
    sourcePath,
    exposureEv,
    contrast,
    saturation,
  })
}

export const runDarktableOperation = async (
  photoPath: string,
  xmpPath: string,
  outputPath: string,
): Promise<void> => {
  await invoke("run_darktable_operation", { photoPath, xmpPath, outputPath })
}

export const renderDarktableFxPreview = async (
  sourcePath: string,
  filmicRgb: boolean,
  profiledDenoise: boolean,
): Promise<string> => {
  return invoke<string>("render_darktable_fx_preview", {
    sourcePath,
    filmicRgb,
    profiledDenoise,
  })
}

export const getPhotoHistogram = async (
  photoPath: string,
  basicEffects: BasicEffectsState,
  colorEffects: ColorEffectsState,
  shadowsHighlights: ShadowsHighlightsState,
  darktableFx: DarktableFxState,
): Promise<HistogramData> => {
  return invoke<HistogramData>("get_photo_histogram", {
    photoPath,
    exposureEv: basicEffects.exposure,
    contrast: basicEffects.contrast,
    contrastBalance: basicEffects.contrastBalance,
    clarity: basicEffects.clarity,
    vibrance: colorEffects.vibrance,
    saturation: colorEffects.saturation,
    temperature: colorEffects.temperature,
    tint: colorEffects.tint,
    shadows: shadowsHighlights.shadows,
    darks: shadowsHighlights.darks,
    lights: shadowsHighlights.lights,
    highlights: shadowsHighlights.highlights,
    filmicRgb: darktableFx.filmicRgb,
    profiledDenoise: darktableFx.profiledDenoise,
  })
}

export const getDefaultExportDirectory = async (collectionName: string): Promise<string> => {
  return invoke<string>("get_default_export_directory", { collectionName })
}

export const ensureThumbnails = async (sourcePaths: string[]): Promise<void> => {
  if (sourcePaths.length === 0) return
  await invoke("ensure_thumbnails", { sourcePaths })
}

export const ensureLibrarySources = async (sourcePaths: string[]): Promise<LibraryPathEntry[]> => {
  if (sourcePaths.length === 0) return []
  return invoke<LibraryPathEntry[]>("ensure_library_sources", { sourcePaths })
}

export const resolveThumbnailPaths = async (sourcePaths: string[]): Promise<ThumbPathEntry[]> => {
  if (sourcePaths.length === 0) return []
  return invoke<ThumbPathEntry[]>("resolve_thumbnail_paths", { sourcePaths })
}

/** Regenerate one JPEG thumb on disk from source (blocking worker). Used after img load failure. */
export const repairThumbnail = async (sourcePath: string): Promise<string | null> => {
  return invoke<string | null>("repair_thumbnail", { sourcePath })
}

export const startExportJob = async (
  photos: ExportTaskPhoto[],
  settings: ExportSettings,
): Promise<string> => {
  return invoke<string>("start_export_job", { photos, settings })
}

export const getExportJobStatus = async (jobId: string): Promise<ExportJobStatus | null> => {
  return invoke<ExportJobStatus | null>("get_export_job_status", { jobId })
}

export const getPhotoExif = async (sourcePath: string): Promise<PhotoExifSummary> => {
  return invoke<PhotoExifSummary>("get_photo_exif", { sourcePath })
}
