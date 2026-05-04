import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useState, type ReactElement } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";
import { getDefaultExportDirectory } from "../lib/persistence";
import { useExportMonitor } from "../hooks/useExportMonitor";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const field =
  "mt-1 w-full rounded border border-neutral-600/45 bg-neutral-500/80 px-2 py-1 text-neutral-800 placeholder:text-neutral-600";

export function ExportModal({ open, onClose }: ExportModalProps): ReactElement | null {
  const { exportSettings, locale, photos } = useAppStore((state) => state.present);
  const setExportField = useAppStore((state) => state.actions.setExportField);
  const { start } = useExportMonitor();
  const selectedPhotos = photos.filter((photo) => photo.selected);
  const [collectionName, setCollectionName] = useState(defaultCollectionName);
  const [editingCollection, setEditingCollection] = useState(false);
  const [directoryAuto, setDirectoryAuto] = useState(true);

  useEffect(() => {
    if (!open || !directoryAuto) return;
    void getDefaultExportDirectory(collectionName).then((defaultDir) => {
      setExportField("directory", defaultDir);
    });
  }, [open, setExportField, collectionName, directoryAuto]);

  const onPickDirectory = async () => {
    const picked = await openDialog({
      directory: true,
      multiple: false,
      defaultPath: exportSettings.directory || undefined
    });
    if (typeof picked === "string" && picked.length > 0) {
      setDirectoryAuto(false);
      setExportField("directory", picked);
    }
  };

  const onStartExport = async () => {
    if (selectedPhotos.length === 0) return;
    await start(
      selectedPhotos.map((photo) => ({ sourcePath: photo.sourcePath, fileName: photo.fileName })),
      exportSettings
    );
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div
        className={`w-[560px] rounded-lg border border-neutral-600/50 p-5 shadow-xl ${chrome.panelBg} ${chrome.panelText}`}
      >
        <h2 className={`mb-4 text-lg font-medium ${chrome.panelText}`}>{t(locale, (m) => m.exportModal.title)}</h2>
        <div className={`grid grid-cols-2 gap-3 text-sm ${chrome.mutedText}`}>
          <label className="col-span-2">
            Collection
            <div className="mt-1">
              {editingCollection ? (
                <input
                  autoFocus
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  onBlur={() => setEditingCollection(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditingCollection(false);
                    }
                  }}
                  className={field}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingCollection(true)}
                  className={`rounded border border-neutral-600/45 px-2 py-1 text-left text-sm ${chrome.panelBg} ${chrome.panelText} hover:bg-neutral-400/40`}
                >
                  {collectionName}
                </button>
              )}
            </div>
          </label>
          <label className="col-span-2">
            {t(locale, (m) => m.exportModal.directory)}
            <div className="mt-1 flex items-center gap-2">
              <input
                value={exportSettings.directory}
                onChange={(e) => {
                  setDirectoryAuto(false);
                  setExportField("directory", e.target.value);
                }}
                className={field}
              />
              <button
                type="button"
                className={`rounded border border-neutral-600/50 px-2 py-1 text-xs ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/40 hover:text-neutral-800`}
                onClick={() => void onPickDirectory()}
              >
                ...
              </button>
            </div>
          </label>
          <label>
            {t(locale, (m) => m.exportModal.format)}
            <select
              value={exportSettings.format}
              onChange={(e) => setExportField("format", e.target.value as "jpg" | "png")}
              className={field}
            >
              <option value="jpg">jpg</option>
              <option value="png">png</option>
            </select>
          </label>
          <label>
            {t(locale, (m) => m.exportModal.quality)} {exportSettings.quality}%
            <input
              type="range"
              min={30}
              max={100}
              value={exportSettings.quality}
              onChange={(e) => setExportField("quality", Number(e.target.value))}
              className="mt-1 w-full accent-neutral-600"
            />
          </label>
          <label>
            {t(locale, (m) => m.exportModal.maxWidth)}
            <input
              type="number"
              value={exportSettings.maxWidth}
              onChange={(e) => setExportField("maxWidth", Number(e.target.value))}
              className={field}
            />
          </label>
          <label>
            {t(locale, (m) => m.exportModal.maxHeight)}
            <input
              type="number"
              value={exportSettings.maxHeight}
              onChange={(e) => setExportField("maxHeight", Number(e.target.value))}
              className={field}
            />
          </label>
          <label className="col-span-2 flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              className="rounded border border-neutral-600/45 accent-neutral-600"
              checked={exportSettings.dontEnlarge}
              onChange={(e) => setExportField("dontEnlarge", e.target.checked)}
            />
            {t(locale, (m) => m.exportModal.dontEnlarge)}
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={`rounded border border-neutral-600/50 px-3 py-1.5 text-sm ${chrome.panelBg} ${chrome.panelText} hover:bg-neutral-400/40 disabled:opacity-40`}
            onClick={() => void onStartExport()}
            disabled={selectedPhotos.length === 0}
          >
            Export {selectedPhotos.length} photos
          </button>
          <button
            type="button"
            className={`rounded border border-neutral-600/50 px-3 py-1.5 text-sm ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/40 hover:text-neutral-800`}
            onClick={onClose}
          >
            {t(locale, (m) => m.actions.close)}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultCollectionName(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${mins}`;
}
