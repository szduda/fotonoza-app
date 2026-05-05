import { invoke } from "@tauri-apps/api/core";
import type { AppState, ExportJobStatus, ExportSettings, ExportTaskPhoto, HistogramData, Photo } from "../types/domain";

export type LoadedStore = {
  present: AppState;
  past: AppState[];
  future: AppState[];
};

type DiskRoot = AppState & { undoPast?: AppState[]; undoFuture?: AppState[] };

export async function saveStoreSnapshot(
  present: AppState,
  past: AppState[],
  future: AppState[]
): Promise<void> {
  await invoke("save_app_state", {
    snapshot: { ...present, undoPast: past, undoFuture: future }
  });
}

export async function loadAppState(): Promise<LoadedStore | null> {
  const raw = await invoke<DiskRoot | null>("load_app_state");
  if (!raw) return null;
  const { undoPast = [], undoFuture = [], ...present } = raw;
  return { present, past: undoPast, future: undoFuture };
}

export async function savePhotoState(photo: Photo): Promise<void> {
  await invoke("save_photo_state", { photo });
}

export async function loadPhotoState(fileName: string): Promise<Record<string, unknown> | null> {
  const raw = await invoke<string | null>("load_photo_state", { fileName });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Software RGB preview (fast for sliders). Full raw pipeline via darktable-cli is separate. */
export async function renderBasicEffectsPreview(
  sourcePath: string,
  exposureEv: number,
  contrast: number,
  saturation: number
): Promise<string> {
  return invoke<string>("render_basic_effects_preview", {
    sourcePath,
    exposureEv,
    contrast,
    saturation
  });
}

export async function runDarktableOperation(
  photoPath: string,
  xmpPath: string,
  outputPath: string
): Promise<void> {
  await invoke("run_darktable_operation", { photoPath, xmpPath, outputPath });
}

export async function getPhotoHistogram(photoPath: string): Promise<HistogramData> {
  return invoke<HistogramData>("get_photo_histogram", { photoPath });
}

export async function getDefaultExportDirectory(collectionName: string): Promise<string> {
  return invoke<string>("get_default_export_directory", { collectionName });
}

export async function startExportJob(
  photos: ExportTaskPhoto[],
  settings: ExportSettings
): Promise<string> {
  return invoke<string>("start_export_job", { photos, settings });
}

export async function getExportJobStatus(jobId: string): Promise<ExportJobStatus | null> {
  return invoke<ExportJobStatus | null>("get_export_job_status", { jobId });
}
