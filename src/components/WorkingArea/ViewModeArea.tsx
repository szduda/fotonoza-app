import type { ReactElement } from "react";
import { t } from "../../lib/i18n";
import { useAppStore } from "../../store/appStore";
import { chrome } from "../layout/chromeTheme";
import { PhotoThumbnail } from "../PhotoThumbnail";
import { GridCols } from "./components/GridCols";
import type { ViewGridMeasure } from "./hooks/useViewGridLayout";
import { useGridCols } from "./hooks/useGridCols";

export function ViewModeArea({
  viewGridHeight,
  viewGridRef,
}: ViewGridMeasure): ReactElement {
  const { photos, locale } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const { viewGridCols } = useGridCols();

  const maxThumbSidePx = Math.max(96, Math.floor(viewGridHeight - 76));

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={viewGridRef}
        className="grid min-h-0 flex-1 auto-rows-auto content-start items-start gap-3 overflow-auto p-4"
        style={{
          gridTemplateColumns: `repeat(${viewGridCols}, minmax(0, 1fr))`,
        }}>
        {photos.length === 0 && (
          <p className={chrome.mutedText}>
            {t(locale, (m) => m.labels.noPhotos)}
          </p>
        )}
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className={`border hover:border-neutral-400/70 flex w-full max-w-full flex-col self-start rounded p-2 text-left text-xs transition-colors ${
              photo.selected
                ? `bg-neutral-500/40 border-neutral-500/50 ${chrome.panelText}`
                : `bg-neutral-700/20 border-neutral-600/20 ${chrome.mutedText}`
            }`}
            onClick={() => actions.toggleSelectPhoto(photo.id)}
            onDoubleClick={() => actions.openInEditor(photo.id)}>
            <div
              className={`mx-auto min-h-0 min-w-0 overflow-hidden rounded ${chrome.panelBg}`}
              style={{
                width: `min(100%, ${maxThumbSidePx}px)`,
                aspectRatio: "3/2",
              }}>
              <PhotoThumbnail
                sourcePath={photo.sourcePath}
                alt={photo.fileName}
                fit="contain"
              />
            </div>

            <div className={`mt-2 truncate ${chrome.panelText}`}>
              {photo.fileName}
            </div>

            <div className="mt-1 flex gap-1">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                  photo.approved
                    ? `${chrome.panelBg} ${chrome.mutedText}`
                    : "bg-neutral-500/20 text-neutral-400"
                }`}>
                {photo.approved ? "approved" : "pending"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <GridCols />
    </section>
  );
}
