import type { ReactElement } from "react";
import { useMemo } from "react";
import { useAppStore } from "../store/appStore";
import { chrome } from "./layout/chromeTheme";

export function SelectedCount(): ReactElement {
  const photos = useAppStore((s) => s.present.photos);
  const clearSelectedPhotos = useAppStore((s) => s.actions.clearSelectedPhotos);
  const selected = useMemo(() => photos.filter((photo) => photo.selected).length, [photos]);
  const total = photos.length;

  return (
    <div className={`uppercase whitespace-nowrap text-sm font-semibold flex items-baseline gap-1 ${chrome.panelText}`}>
      <span>{selected}</span>
      <span className="text-[10px] opacity-50">of</span>
      <span className="opacity-50">{total}</span>
      <span className="text-[10px] opacity-50">selected</span>
      {selected > 0 && (
        <button
          type="button"
          className="ml-1 text-[10px] opacity-50 transition-opacity hover:opacity-80"
          onClick={clearSelectedPhotos}
          aria-label="Deselect all photos"
          title="Deselect all photos"
        >
          X
        </button>
      )}
    </div>
  );
}
