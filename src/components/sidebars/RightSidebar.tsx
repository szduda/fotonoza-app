import { useAppStore } from "../../store/appStore";
import { t } from "../../lib/i18n";
import { HistogramCanvas } from "../panels/HistogramCanvas";
import { chrome } from "../layout/chromeTheme";
import { BasicEffects } from "../BasicEffects";

export const RightSidebar = () => {
  const { mode, photos, currentPhotoId, locale } = useAppStore((s) => s.present);
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId);

  if (mode !== "edit") {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 p-3">
      <h3 className={`mb-2 text-xs font-medium uppercase tracking-wide ${chrome.faintText}`}>
        {t(locale, (m) => m.labels.histogram)}
      </h3>
      <HistogramCanvas />
      {selectedPhoto ? (
        <BasicEffects selectedPhoto={selectedPhoto} />
      ) : (
        <p className={`mt-4 text-xs ${chrome.mutedText}`}>{t(locale, (m) => m.labels.noPhotos)}</p>
      )}
    </div>
  );
};
