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

export const saveStoreSnapshot = async (
  present: AppState,
  past: AppState[],
  future: AppState[],
): Promise<void> => {
  const presentDisk = stripPhotoLocalState(present)
  const pastDisk = past.map(stripPhotoLocalState)
  const futureDisk = future.map(stripPhotoLocalState)
  await invoke("save_app_state", {
    snapshot: { ...presentDisk, undoPast: pastDisk, undoFuture: futureDisk },
  })
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
