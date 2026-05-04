import type { ReactElement } from "react";
import { t } from "../../lib/i18n";
import { useAppStore } from "../../store/appStore";
import { chrome } from "../layout/chromeTheme";
import type { EditModeModel } from "./hooks/useEditMode";

export function EditModeArea(props: EditModeModel): ReactElement {
  const { locale } = useAppStore((s) => s.present);
  const {
    selectedPhoto,
    editImageSrc,
    imageFailed,
    setImageNatural,
    setImageFailed,
    viewportRef,
    isDragging,
    rendered,
    pan,
    onEditWheel,
    onEditPointerDown,
    onEditPointerMove,
    endDrag,
  } = props;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={onEditWheel}
        onPointerDown={onEditPointerDown}
        onPointerMove={onEditPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {!selectedPhoto && (
          <div
            className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}
          >
            {t(locale, (m) => m.labels.noPhotos)}
          </div>
        )}
        {selectedPhoto && (!editImageSrc || imageFailed) && (
          <div
            className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}
          >
            {selectedPhoto.fileName}
          </div>
        )}
        {selectedPhoto && editImageSrc && !imageFailed && (
          <img
            src={editImageSrc}
            alt={selectedPhoto.fileName}
            draggable={false}
            onLoad={(event) => {
              const img = event.currentTarget;
              setImageNatural({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }}
            onError={() => setImageFailed(true)}
            className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
            style={{
              width: rendered.width,
              height: rendered.height,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
          />
        )}
      </div>
    </section>
  );
}
