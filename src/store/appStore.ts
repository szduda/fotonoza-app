import { create } from "zustand";
import { loadAppState, saveStoreSnapshot, savePhotoState } from "../lib/persistence";
import type { AppMode, AppState, HistoryEntry, Photo, UiLayoutState } from "../types/domain";
import { defaultUiLayout } from "../types/domain";

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
  patchLayout: (partial: Partial<UiLayoutState>) => void;
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
  locale: "en",
  layout: { ...defaultUiLayout }
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
    const layout = current.present.layout ?? defaultUiLayout;
    const nextPresent = pushHistory({ ...mutator(current.present), layout }, label);
    const trimmedPast = [...current.past, current.present].slice(-100);
    void saveStoreSnapshot(nextPresent, trimmedPast, []);
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
      const rawLayout = loaded.present.layout as unknown as Record<string, unknown> | undefined;
      const mergedLayout: UiLayoutState = { ...defaultUiLayout, ...(loaded.present.layout ?? {}) };
      if (rawLayout && typeof rawLayout.leftSidebarCollapsed !== "boolean") {
        if (typeof rawLayout.leftSidebarVisible === "boolean") {
          mergedLayout.leftSidebarCollapsed = !rawLayout.leftSidebarVisible;
        }
        if (typeof rawLayout.rightSidebarVisible === "boolean") {
          mergedLayout.rightSidebarCollapsed = !rawLayout.rightSidebarVisible;
        }
        if (typeof rawLayout.timelineVisible === "boolean") {
          mergedLayout.timelineCollapsed = !rawLayout.timelineVisible;
        }
        if (typeof rawLayout.topBarVisible === "boolean") {
          mergedLayout.topBarCollapsed = !rawLayout.topBarVisible;
        }
      }
      let present = { ...loaded.present, layout: mergedLayout };
      if (loaded.past.length === 0 && present.history.length > 0) {
        present = { ...present, history: [], historyCursor: 0 };
      }
      set((current) => ({
        ...current,
        present,
        past: loaded.past,
        future: loaded.future
      }));
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
      const layout = present.layout ?? defaultUiLayout;
      const previous = { ...past[past.length - 1], layout };
      const remainingPast = past.slice(0, -1);
      void saveStoreSnapshot(previous, remainingPast, [present, ...future].slice(0, 100));
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
      const layout = present.layout ?? defaultUiLayout;
      const next = { ...future[0], layout };
      void saveStoreSnapshot(next, [...past, present].slice(-100), future.slice(1));
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
      const { history } = present;
      if (index < 0 || index >= history.length) return;
      const targetIdx = index + 1;
      if (targetIdx >= timeline.length) return;
      const layout = present.layout ?? defaultUiLayout;
      const target = { ...timeline[targetIdx], layout };
      const newPast = timeline.slice(0, targetIdx);
      const newFuture = timeline.slice(targetIdx + 1).slice(0, 100);
      void saveStoreSnapshot(target, newPast, newFuture);
      set((current) => ({
        ...current,
        present: target,
        past: newPast,
        future: newFuture
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
      })),
    patchLayout: (partial) => {
      set((current) => {
        const layout = { ...(current.present.layout ?? defaultUiLayout), ...partial };
        const present = { ...current.present, layout };
        void saveStoreSnapshot(present, current.past, current.future);
        return { ...current, present };
      });
    }
  }
}));
