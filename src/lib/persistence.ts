import { invoke } from "@tauri-apps/api/core";
import type { AppState, Photo } from "../types/domain";

interface PersistableState extends AppState {}

export async function saveAppState(state: PersistableState): Promise<void> {
  await invoke("save_app_state", { state });
}

export async function loadAppState(): Promise<PersistableState | null> {
  return invoke<PersistableState | null>("load_app_state");
}

export async function savePhotoState(photo: Photo): Promise<void> {
  await invoke("save_photo_state", { photo });
}

export async function runDarktableOperation(photoPath: string, xmpPath: string): Promise<void> {
  await invoke("run_darktable_operation", { photoPath, xmpPath });
}
