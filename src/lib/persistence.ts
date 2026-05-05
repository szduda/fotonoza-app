import { invoke } from "@tauri-apps/api/core"
import type {
  AppState,
  ExportJobStatus,
  ExportSettings,
  ExportTaskPhoto,
  HistogramData,
  Photo,
} from "@/types/domain"

export type LoadedStore = {
  present: AppState
  past: AppState[]
  future: AppState[]
}

type DiskRoot = AppState & { undoPast?: AppState[]; undoFuture?: AppState[] }

const stripPhotoLocalState = (state: AppState): AppState => ({
  ...state,
  photos: state.photos.map((photo) => ({
    ...photo,
    basicEffects: undefined,
  })),
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

export const getPhotoHistogram = async (photoPath: string): Promise<HistogramData> => {
  return invoke<HistogramData>("get_photo_histogram", { photoPath })
}

export const getDefaultExportDirectory = async (collectionName: string): Promise<string> => {
  return invoke<string>("get_default_export_directory", { collectionName })
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
