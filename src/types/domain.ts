export type AppMode = "import" | "view" | "edit";

export type ExportFormat = "jpg" | "png";

export interface PhotoAdjustment {
  id: string;
  name: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

export interface Photo {
  id: string;
  fileName: string;
  sourcePath: string;
  workingPath?: string;
  selected: boolean;
  approved: boolean;
  adjustments: PhotoAdjustment[];
}

export interface ExportSettings {
  directory: string;
  format: ExportFormat;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  dontEnlarge: boolean;
}

export interface HistoryEntry {
  id: string;
  at: number;
  label: string;
}

export interface AppState {
  mode: AppMode;
  photos: Photo[];
  selectedPhotoId?: string;
  history: HistoryEntry[];
  historyCursor: number;
  exportSettings: ExportSettings;
  locale: "en" | "pl";
}

export interface TranslationSchema {
  appTitle: string;
  mode: {
    import: string;
    view: string;
    edit: string;
  };
  actions: {
    importFromDevice: string;
    approve: string;
    decline: string;
    export: string;
    undo: string;
    redo: string;
    close: string;
  };
  labels: {
    selectedCount: string;
    histogram: string;
    effects: string;
    filmstrip: string;
    history: string;
    noPhotos: string;
  };
  exportModal: {
    title: string;
    directory: string;
    format: string;
    quality: string;
    maxWidth: string;
    maxHeight: string;
    dontEnlarge: string;
  };
}
