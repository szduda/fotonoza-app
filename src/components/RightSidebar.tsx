import { useEffect, useState, type ReactElement } from "react";
import { getPhotoHistogram } from "../lib/persistence";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { HistogramCanvas } from "./HistogramCanvas";
import { chrome } from "./layout/chromeTheme";
import type { HistogramData } from "../types/domain";

const histCache = new Map<string, HistogramData>();
const histPending = new Map<string, Promise<HistogramData>>();

function cachedHistogram(path: string): Promise<HistogramData> {
  const ready = histCache.get(path);
  if (ready) return Promise.resolve(ready);
  const pending = histPending.get(path);
  if (pending) return pending;

  const req = getPhotoHistogram(path).then((data) => {
    histCache.set(path, data);
    if (histCache.size > 60) {
      const oldest = histCache.keys().next().value;
      if (oldest) histCache.delete(oldest);
    }
    histPending.delete(path);
    return data;
  });
  histPending.set(path, req);
  return req;
}

export function RightSidebar(): ReactElement {
  const { mode, photos, currentPhotoId, locale } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId);
  const [histogram, setHistogram] = useState<HistogramData | undefined>(undefined);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !selectedPhoto?.sourcePath) {
      setHistogram(undefined);
      setHistLoading(false);
      return;
    }
    const cached = histCache.get(selectedPhoto.sourcePath);
    if (cached) {
      setHistogram(cached);
      setHistLoading(false);
      return;
    }
    let active = true;
    setHistogram(undefined);
    setHistLoading(true);
    void cachedHistogram(selectedPhoto.sourcePath)
      .then((data) => {
        if (!active) return;
        setHistogram(data);
        setHistLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Histogram unavailable", err);
        setHistogram(undefined);
        setHistLoading(false);
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
          <HistogramCanvas data={histogram} loading={histLoading} />
          <h3 className={`mb-2 mt-4 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
            {t(locale, (m) => m.labels.effects)}
          </h3>
          <div className="space-y-2 text-sm">
            <button
              type="button"
              className={`w-full rounded border border-neutral-600/45 px-2 py-1.5 text-left ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/35`}
              onClick={() => currentPhotoId && actions.addAdjustment(currentPhotoId, "exposure")}
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
                  onChange={() => currentPhotoId && actions.toggleAdjustment(currentPhotoId, adj.id)}
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
