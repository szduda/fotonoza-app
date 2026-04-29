import { create } from "zustand";
import { loadAppState, saveAppState, savePhotoState } from "../lib/persistence";
import type { AppMode, AppState, HistoryEntry, Photo } from "../types/domain";

interface AppActions {
  initialize: () => Promise<void>;
  setMode: (mode: AppMode) => void;
  importPreviewPhotos: (paths: string[]) => void;
  toggleSelectPhoto: (photoId: string) => void;
  openInEditor: (photoId: string) => void;
  approvePhoto: (photoId: string) => void;
  declinePhoto: (photoId: string) => void;
  addAdjustment: (photoId: string, adjustmentName: string) => void;
  toggleAdjustment: (photoId: string, adjustmentId: string) => void;
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  setLocale: (locale: "en" | "pl") => void;
  setExportField: <K extends keyof AppState["exportSettings"]>(
    key: K,
    value: AppState["exportSettings"][K]
  ) => void;
}

interface StoreShape {
  present: AppState;
  past: AppState[];
  future: AppState[];
  actions: AppActions;
}

const initialState: AppState = {
  mode: "import",
  photos: [],
  history: [],
  historyCursor: 0,
  exportSettings: {
    directory: "",
    format: "jpg",
    quality: 85,
    maxWidth: 4000,
    maxHeight: 4000,
    dontEnlarge: true
  },
  locale: "en"
};

function historyEntry(label: string): HistoryEntry {
  return { id: crypto.randomUUID(), label, at: Date.now() };
}

function pushHistory(state: AppState, label: string): AppState {
  const maxOps = 100;
  const updatedHistory = [...state.history.slice(-(maxOps - 1)), historyEntry(label)];
  return { ...state, history: updatedHistory, historyCursor: updatedHistory.length - 1 };
}

function withUndo(set: (fn: (current: StoreShape) => StoreShape) => void, label: string, mutator: (s: AppState) => AppState): void {
  set((current) => {
    const nextPresent = pushHistory(mutator(current.present), label);
    const trimmedPast = [...current.past, current.present].slice(-100);
    void saveAppState(nextPresent);
    return { ...current, present: nextPresent, past: trimmedPast, future: [] };
  });
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}

function buildPhoto(path: string): Photo {
  return {
    id: crypto.randomUUID(),
    fileName: fileNameFromPath(path),
    sourcePath: path,
    selected: false,
    approved: false,
    adjustments: []
  };
}

export const useAppStore = create<StoreShape>((set, get) => ({
  present: initialState,
  past: [],
  future: [],
  actions: {
    initialize: async () => {
      const loaded = await loadAppState();
      if (!loaded) return;
      set((current) => ({ ...current, present: loaded }));
    },
    setMode: (mode) => withUndo(set, `switch-mode-${mode}`, (s) => ({ ...s, mode })),
    importPreviewPhotos: (paths) =>
      withUndo(set, "import-preview", (s) => ({
        ...s,
        photos: [...s.photos, ...paths.map(buildPhoto)],
        mode: "view"
      })),
    toggleSelectPhoto: (photoId) =>
      withUndo(set, "toggle-select-photo", (s) => ({
        ...s,
        photos: s.photos.map((photo) =>
          photo.id === photoId ? { ...photo, selected: !photo.selected } : photo
        )
      })),
    openInEditor: (photoId) =>
      withUndo(set, "open-edit-mode", (s) => ({
        ...s,
        mode: "edit",
        selectedPhotoId: photoId
      })),
    approvePhoto: (photoId) =>
      withUndo(set, "approve-photo", (s) => ({
        ...s,
        photos: s.photos.map((photo) =>
          photo.id === photoId ? { ...photo, approved: true, workingPath: `working/${photo.fileName}` } : photo
        )
      })),
    declinePhoto: (photoId) =>
      withUndo(set, "decline-photo", (s) => ({
        ...s,
        photos: s.photos.filter((photo) => photo.id !== photoId),
        selectedPhotoId: s.selectedPhotoId === photoId ? undefined : s.selectedPhotoId
      })),
    addAdjustment: (photoId, adjustmentName) =>
      withUndo(set, `add-adjustment-${adjustmentName}`, (s) => {
        const next = {
          ...s,
          photos: s.photos.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  adjustments: [
                    ...photo.adjustments,
                    { id: crypto.randomUUID(), name: adjustmentName, enabled: true, params: {} }
                  ]
                }
              : photo
          )
        };
        const updatedPhoto = next.photos.find((photo) => photo.id === photoId);
        if (updatedPhoto) void savePhotoState(updatedPhoto);
        return next;
      }),
    toggleAdjustment: (photoId, adjustmentId) =>
      withUndo(set, "toggle-adjustment", (s) => {
        const next = {
          ...s,
          photos: s.photos.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  adjustments: photo.adjustments.map((adjustment) =>
                    adjustment.id === adjustmentId
                      ? { ...adjustment, enabled: !adjustment.enabled }
                      : adjustment
                  )
                }
              : photo
          )
        };
        const updatedPhoto = next.photos.find((photo) => photo.id === photoId);
        if (updatedPhoto) void savePhotoState(updatedPhoto);
        return next;
      }),
    undo: () => {
      const { past, present, future } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      const remainingPast = past.slice(0, -1);
      void saveAppState(previous);
      set((current) => ({
        ...current,
        present: previous,
        past: remainingPast,
        future: [present, ...future].slice(0, 100)
      }));
    },
    redo: () => {
      const { past, present, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      void saveAppState(next);
      set((current) => ({
        ...current,
        present: next,
        past: [...past, present].slice(-100),
        future: future.slice(1)
      }));
    },
    jumpToHistory: (index) => {
      const { past, present } = get();
      const timeline = [...past, present];
      if (index < 0 || index >= timeline.length) return;
      const target = timeline[index];
      void saveAppState(target);
      set((current) => ({
        ...current,
        present: target,
        past: timeline.slice(0, index),
        future: timeline.slice(index + 1).reverse().slice(0, 100)
      }));
    },
    setLocale: (locale) => withUndo(set, `set-locale-${locale}`, (s) => ({ ...s, locale })),
    setExportField: (key, value) =>
      withUndo(set, `set-export-${String(key)}`, (s) => ({
        ...s,
        exportSettings: {
          ...s.exportSettings,
          [key]: value
        }
      }))
  }
}));
