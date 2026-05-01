import { useEffect, useState, type ReactElement } from "react";
import { getPhotoHistogram } from "../lib/persistence";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { HistogramCanvas } from "./HistogramCanvas";
import { chrome } from "./layout/chromeTheme";
import type { HistogramData } from "../types/domain";

export function RightSidebar(): ReactElement {
  const { mode, photos, selectedPhotoId, locale } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId);
  const [histogram, setHistogram] = useState<HistogramData | undefined>(undefined);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !selectedPhoto?.sourcePath) {
      setHistogram(undefined);
      setHistLoading(false);
      setHistError(null);
      return;
    }
    let active = true;
    setHistLoading(true);
    setHistError(null);
    void getPhotoHistogram(selectedPhoto.sourcePath)
      .then((data) => {
        if (!active) return;
        setHistogram(data);
        setHistLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setHistogram(undefined);
        setHistLoading(false);
        setHistError(err instanceof Error ? err.message : "Histogram unavailable");
      });
    return () => {
      active = false;
    };
  }, [mode, selectedPhoto?.id, selectedPhoto?.sourcePath]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0">
      {mode === "edit" && (
        <div className={`p-3 ${chrome.borderB}`}>
          <h3 className={`mb-2 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
            {t(locale, (m) => m.labels.histogram)}
          </h3>
          <HistogramCanvas data={histogram} loading={histLoading} error={histError} />
          <h3 className={`mb-2 mt-4 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
            {t(locale, (m) => m.labels.effects)}
          </h3>
          <div className="space-y-2 text-sm">
            <button
              type="button"
              className={`w-full rounded border border-neutral-600/45 px-2 py-1.5 text-left ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/35`}
              onClick={() => selectedPhotoId && actions.addAdjustment(selectedPhotoId, "exposure")}
            >
              + Exposure
            </button>
            {selectedPhoto?.adjustments.map((adj) => (
              <label
                key={adj.id}
                className={`flex items-center gap-2 rounded border border-neutral-600/45 px-2 py-1.5 ${chrome.panelBg} ${chrome.mutedText}`}
              >
                <input
                  type="checkbox"
                  className="rounded border border-neutral-600/45"
                  checked={adj.enabled}
                  onChange={() => selectedPhotoId && actions.toggleAdjustment(selectedPhotoId, adj.id)}
                />
                {adj.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
