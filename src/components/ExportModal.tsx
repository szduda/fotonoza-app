import type { ReactElement } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const field =
  "mt-1 w-full rounded border border-neutral-600/45 bg-neutral-500/80 px-2 py-1 text-neutral-800 placeholder:text-neutral-600";

export function ExportModal({ open, onClose }: ExportModalProps): ReactElement | null {
  const { exportSettings, locale } = useAppStore((state) => state.present);
  const setExportField = useAppStore((state) => state.actions.setExportField);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div
        className={`w-[560px] rounded-lg border border-neutral-600/50 p-5 shadow-xl ${chrome.panelBg} ${chrome.panelText}`}
      >
        <h2 className={`mb-4 text-lg font-medium ${chrome.panelText}`}>{t(locale, (m) => m.exportModal.title)}</h2>
        <div className={`grid grid-cols-2 gap-3 text-sm ${chrome.mutedText}`}>
          <label className="col-span-2">
            {t(locale, (m) => m.exportModal.directory)}
            <input
              value={exportSettings.directory}
              onChange={(e) => setExportField("directory", e.target.value)}
              className={field}
            />
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
        <div className="mt-4 flex justify-end">
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
