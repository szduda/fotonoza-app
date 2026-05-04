import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { HistogramCanvas } from "./HistogramCanvas";
import { chrome } from "./layout/chromeTheme";

export const RightSidebar = () => {
  const { mode, photos, currentPhotoId, locale } = useAppStore(
    (s) => s.present,
  );
  const actions = useAppStore((s) => s.actions);
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId);

  if (mode !== "edit") {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 p-3">
      <h3
        className={`mb-2 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
        {t(locale, (m) => m.labels.histogram)}
      </h3>
      <HistogramCanvas />
      <h3
        className={`mb-2 mt-4 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
        {t(locale, (m) => m.labels.effects)}
      </h3>
      <div className="space-y-2 text-sm">
        <button
          type="button"
          className={`w-full rounded border border-neutral-600/50 px-2 py-1.5 text-left ${chrome.panelBg} ${chrome.mutedText} hover:bg-neutral-400/35`}
          onClick={() =>
            currentPhotoId && actions.addAdjustment(currentPhotoId, "exposure")
          }>
          + Exposure
        </button>
        {selectedPhoto?.adjustments.map((adj) => (
          <label
            key={adj.id}
            className={`flex items-center gap-2 rounded border border-neutral-600/50 px-2 py-1.5 ${chrome.panelBg} ${chrome.mutedText}`}>
            <input
              type="checkbox"
              className="rounded border border-neutral-600/50"
              checked={adj.enabled}
              onChange={() =>
                currentPhotoId &&
                actions.toggleAdjustment(currentPhotoId, adj.id)
              }
            />
            {adj.name}
          </label>
        ))}
      </div>
    </div>
  );
};
