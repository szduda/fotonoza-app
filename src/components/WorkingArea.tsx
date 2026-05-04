import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type WheelEvent as ReactWheelEvent
} from "react";
import { localImageSrc } from "../lib/localImageSrc";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";
import { PhotoThumbnail } from "./PhotoThumbnail";

const VIEW_GRID_COLS_DEFAULT = 4;
const VIEW_GRID_COLS_MIN = 1;
const VIEW_GRID_COLS_MAX = 8;
const EDIT_ZOOM_MIN = 0.5;
const EDIT_ZOOM_MAX = 4;
const EDIT_ZOOM_STEP = 1.1;
const EDIT_PAN_EPSILON_PX = 2;

type Size = { width: number; height: number };
type Pan = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fitContainSize(viewport: Size, image: Size, zoom: number): Size {
  if (viewport.width <= 0 || viewport.height <= 0 || image.width <= 0 || image.height <= 0) {
    return { width: 0, height: 0 };
  }
  const fit = Math.min(viewport.width / image.width, viewport.height / image.height);
  const scale = fit * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

function clampPan(next: Pan, rendered: Size, viewport: Size): Pan {
  // Allow panning for both cases:
  // - image larger than viewport (classic pan inside overflow)
  // - image smaller than viewport (move freely until image edge hits viewport edge)
  // Small epsilon avoids premature "collision" feel from subpixel rounding.
  const maxX = Math.abs(rendered.width - viewport.width) / 2 + EDIT_PAN_EPSILON_PX;
  const maxY = Math.abs(rendered.height - viewport.height) / 2 + EDIT_PAN_EPSILON_PX;
  return {
    x: clamp(next.x, -maxX, maxX),
    y: clamp(next.y, -maxY, maxY)
  };
}

function isPhotoEqual(a: { id: string; sourcePath: string } | undefined, b: { id: string; sourcePath: string } | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.sourcePath === b.sourcePath;
}

function MinusIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WorkingArea(): ReactElement {
  const { mode, photos, locale, currentPhotoId } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const [viewGridCols, setViewGridCols] = useState(VIEW_GRID_COLS_DEFAULT);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [viewGridHeight, setViewGridHeight] = useState(0);
  const [imageNatural, setImageNatural] = useState<Size>({ width: 0, height: 0 });
  const [imageFailed, setImageFailed] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewGridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const previousWorkedPhotoRef = useRef<{ id: string; sourcePath: string } | undefined>(undefined);
  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === currentPhotoId),
    [photos, currentPhotoId]
  );
  const editImageSrc = selectedPhoto ? localImageSrc(selectedPhoto.sourcePath) : "";
  const rendered = useMemo(
    () => fitContainSize(viewport, imageNatural, zoom),
    [viewport, imageNatural, zoom]
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || mode !== "edit") return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(node);
    return () => obs.disconnect();
  }, [mode]);

  useEffect(() => {
    const node = viewGridRef.current;
    if (!node || mode !== "view") return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setViewGridHeight(rect.height);
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(node);
    return () => obs.disconnect();
  }, [mode, viewGridCols]);

  const fitToView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const currentWorked = selectedPhoto
      ? { id: selectedPhoto.id, sourcePath: selectedPhoto.sourcePath }
      : undefined;
    if (!isPhotoEqual(previousWorkedPhotoRef.current, currentWorked)) {
      fitToView();
      setImageNatural({ width: 0, height: 0 });
      setImageFailed(false);
      previousWorkedPhotoRef.current = currentWorked;
    }
  }, [selectedPhoto]);

  useEffect(() => {
    setPan((prev) => clampPan(prev, rendered, viewport));
  }, [rendered, viewport]);

  useEffect(() => {
    if (mode !== "edit") return;
    if (currentPhotoId) return;
    if (photos.length === 0) return;
    actions.openInEditor(photos[0].id);
  }, [mode, currentPhotoId, photos, actions]);

  const onEditWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return;
    e.preventDefault();
    const currentZoom = zoom;
    const nextZoom =
      e.deltaY > 0
        ? clamp(currentZoom / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX)
        : clamp(currentZoom * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX);

    if (nextZoom === currentZoom) return;

    const currentRendered = fitContainSize(viewport, imageNatural, currentZoom);
    const nextRendered = fitContainSize(viewport, imageNatural, nextZoom);
    if (
      currentRendered.width <= 0 ||
      currentRendered.height <= 0 ||
      nextRendered.width <= 0 ||
      nextRendered.height <= 0
    ) {
      setZoom(nextZoom);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const cursorFromCenterX = e.clientX - rect.left - rect.width / 2;
    const cursorFromCenterY = e.clientY - rect.top - rect.height / 2;

    // Keep the image point under the cursor anchored while zooming.
    const nextPan = {
      x:
        cursorFromCenterX -
        ((cursorFromCenterX - pan.x) / currentRendered.width) * nextRendered.width,
      y:
        cursorFromCenterY -
        ((cursorFromCenterY - pan.y) / currentRendered.height) * nextRendered.height
    };

    setZoom(nextZoom);
    setPan(clampPan(nextPan, nextRendered, viewport));
  };

  const onEditPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !selectedPhoto || rendered.width <= 0 || rendered.height <= 0) return;
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onEditPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    dragRef.current = { ...drag, lastX: e.clientX, lastY: e.clientY };
    setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, rendered, viewport));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  if (mode === "import") {
    return (
      <section className="grid flex-1 place-items-center">
        <div className={`text-center text-sm ${chrome.mutedText}`}>
          {t(locale, (m) => m.actions.importFromDevice)}
        </div>
      </section>
    );
  }

  if (mode === "view") {
    const iconBtn = `flex h-7 w-7 items-center justify-center rounded border border-neutral-600/50 ${chrome.panelBg} ${chrome.panelText} transition-colors enabled:hover:bg-neutral-400/35 disabled:cursor-not-allowed disabled:opacity-35`;
    // Keep each card below the working area height even with 1-column layout.
    const maxThumbSidePx = Math.max(96, Math.floor(viewGridHeight - 76));

    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <div
          ref={viewGridRef}
          className="grid min-h-0 flex-1 auto-rows-auto content-start items-start gap-3 overflow-auto p-4"
          style={{ gridTemplateColumns: `repeat(${viewGridCols}, minmax(0, 1fr))` }}
        >
          {photos.length === 0 && <p className={chrome.mutedText}>{t(locale, (m) => m.labels.noPhotos)}</p>}
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className={`border hover:border-neutral-400/70 flex w-full max-w-full flex-col self-start rounded p-2 text-left text-xs transition-colors ${photo.selected
                ? `bg-neutral-500/40 border-neutral-500/50 ${chrome.panelText}`
                : `bg-neutral-700/20 border-neutral-600/20 ${chrome.mutedText}`
                }`}
              onClick={() => actions.toggleSelectPhoto(photo.id)}
              onDoubleClick={() => actions.openInEditor(photo.id)}
            >
              <div
                className={`mx-auto flex aspect-photo min-w-0 items-center justify-center overflow-hidden rounded ${chrome.panelBg}`}
                style={{ width: `min(100%, ${maxThumbSidePx}px)` }}
              >
                <PhotoThumbnail
                  sourcePath={photo.sourcePath}
                  alt={photo.fileName}
                  fit="contain"
                />
              </div>
              <div className={`mt-2 truncate ${chrome.panelText}`}>{photo.fileName}</div>
              <div className="mt-1 flex gap-1">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${photo.approved
                    ? `${chrome.panelBg} ${chrome.mutedText}`
                    : "bg-neutral-500/20 text-neutral-400"
                    }`}
                >
                  {photo.approved ? "approved" : "pending"}
                </span>
              </div>
            </button>
          ))}
        </div>
        <footer
          className={`flex h-8 w-full shrink-0 items-center justify-center gap-2 border-t border-neutral-600/50 ${chrome.panelBg}`}
        >
          <button
            type="button"
            className={iconBtn}
            aria-label="Zoom in"
            disabled={viewGridCols <= VIEW_GRID_COLS_MIN}
            onClick={() => setViewGridCols((c) => Math.max(VIEW_GRID_COLS_MIN, c - 1))}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            className={iconBtn}
            aria-label="Zoom out"
            disabled={viewGridCols >= VIEW_GRID_COLS_MAX}
            onClick={() => setViewGridCols((c) => Math.min(VIEW_GRID_COLS_MAX, c + 1))}

          >
            <MinusIcon />
          </button>
        </footer>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className={`min-h-0 flex-1 ${chrome.borderB}`}>
        <div
          ref={viewportRef}
          className={`relative h-full w-full overflow-hidden rounded border border-neutral-600/45 bg-neutral-950/70 ${isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          onWheel={onEditWheel}
          onPointerDown={onEditPointerDown}
          onPointerMove={onEditPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {!selectedPhoto && (
            <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
              {t(locale, (m) => m.labels.noPhotos)}
            </div>
          )}
          {selectedPhoto && (!editImageSrc || imageFailed) && (
            <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
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
                setImageNatural({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              onError={() => setImageFailed(true)}
              className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
              style={{
                width: rendered.width,
                height: rendered.height,
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`
              }}
            />
          )}
        </div>
      </div>
      <footer
        className={`flex h-8 w-full shrink-0 items-center justify-center gap-2 border-t border-neutral-600/50 ${chrome.panelBg}`}
      >
        <button
          type="button"
          className={`rounded border border-neutral-600/50 px-2.5 py-1 text-xs transition-colors ${chrome.panelBg} ${chrome.panelText} enabled:hover:bg-neutral-400/35 disabled:cursor-not-allowed disabled:opacity-35`}
          onClick={fitToView}
          disabled={!selectedPhoto}
        >
          Fit To View
        </button>
      </footer>
    </section>
  );
}
