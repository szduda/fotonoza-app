import type { ReactElement } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";
import { PhotoThumbnail } from "./PhotoThumbnail";

export function Timeline(): ReactElement {
  const { mode, photos, selectedPhotoId, locale } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);

  if (mode === "edit") {
    return (
      <div className="flex h-full min-h-0 flex-col px-3 pb-2 pt-1">
        <p className={`mb-1.5 shrink-0 text-[10px] font-medium uppercase tracking-wide ${chrome.faintText}`}>
          {t(locale, (m) => m.labels.filmstrip)}
        </p>
        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden pb-1">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className={`w-24 shrink-0 rounded border p-1 text-left text-xs transition-colors ${
                photo.id === selectedPhotoId
                  ? `border border-neutral-600/45 ${chrome.panelBg} ${chrome.panelText} ring-1 ring-neutral-600/40`
                  : `border border-neutral-600/45 bg-neutral-500/50 ${chrome.mutedText} hover:bg-neutral-400/35`
              }`}
              onClick={() => actions.openInEditor(photo.id)}
            >
              <div className={`mb-1 h-10 w-full min-w-0 overflow-hidden rounded ${chrome.panelBg}`}>
                <PhotoThumbnail sourcePath={photo.sourcePath} alt={photo.fileName} className="!rounded" />
              </div>
              <span className="block truncate">{photo.fileName}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full items-center px-3 text-xs ${chrome.faintText}`}>Timeline</div>
  );
}
