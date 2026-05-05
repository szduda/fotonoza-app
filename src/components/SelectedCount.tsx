import type { ReactElement } from "react";
import { useMemo } from "react";
import { useAppStore } from "../store/appStore";
import { chrome } from "./layout/chromeTheme";
import { Button } from "./generic/Button";

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
        <Button
          variant="subtle"
          size="xs"
          className="ml-1 min-h-0 border-0 bg-transparent px-1 py-0 text-[10px] font-normal opacity-50 enabled:hover:bg-transparent enabled:hover:opacity-80"
          onClick={clearSelectedPhotos}
          aria-label="Deselect all photos"
          title="Deselect all photos"
        >
          X
        </Button>
      )}
    </div>
  );
}
