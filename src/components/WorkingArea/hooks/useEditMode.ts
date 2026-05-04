import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
  type WheelEvent as ReactWheelEvent
} from "react";
import { localImageSrc } from "../../../lib/localImageSrc";
import { useAppStore } from "../../../store/appStore";
import { EDIT_ZOOM_MAX, EDIT_ZOOM_MIN, EDIT_ZOOM_STEP } from "../constants";
import { clamp, clampPan, fitContainSize, isPhotoEqual, type Pan, type Size } from "../geometry";
import type { Photo } from "../../../types/domain";

export type EditModeModel = {
  selectedPhoto: Photo | undefined;
  editImageSrc: string;
  imageFailed: boolean;
  setImageNatural: Dispatch<SetStateAction<Size>>;
  setImageFailed: Dispatch<SetStateAction<boolean>>;
  viewportRef: RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  rendered: Size;
  pan: Pan;
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onEditWheel: (e: ReactWheelEvent<HTMLDivElement>) => void;
  onEditPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onEditPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  endDrag: (e: ReactPointerEvent<HTMLDivElement>) => void;
  fitToView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
};

export function useEditMode(): EditModeModel {
  const { mode, photos, currentPhotoId } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [imageNatural, setImageNatural] = useState<Size>({ width: 0, height: 0 });
  const [imageFailed, setImageFailed] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
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

  const canZoomIn = useMemo(() => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return false;
    const next = clamp(zoom * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX);
    return next > zoom + 1e-9;
  }, [zoom, selectedPhoto, editImageSrc, imageFailed]);

  const canZoomOut = useMemo(() => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return false;
    const next = clamp(zoom / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX);
    return next < zoom - 1e-9;
  }, [zoom, selectedPhoto, editImageSrc, imageFailed]);

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

  const fitToView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const centerView = () => {
    setPan({ x: 0, y: 0 });
  };

  const applyZoomAtCenter = (nextZoom: number) => {
    if (!selectedPhoto || !editImageSrc || imageFailed) return;
    const currentZoom = zoom;
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

    const cursorFromCenterX = 0;
    const cursorFromCenterY = 0;
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

  const zoomIn = () => {
    if (!canZoomIn) return;
    applyZoomAtCenter(clamp(zoom * EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX));
  };

  const zoomOut = () => {
    if (!canZoomOut) return;
    applyZoomAtCenter(clamp(zoom / EDIT_ZOOM_STEP, EDIT_ZOOM_MIN, EDIT_ZOOM_MAX));
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

  return {
    selectedPhoto,
    editImageSrc,
    imageFailed,
    setImageNatural,
    setImageFailed,
    viewportRef,
    isDragging,
    rendered,
    pan,
    zoom,
    canZoomIn,
    canZoomOut,
    onEditWheel,
    onEditPointerDown,
    onEditPointerMove,
    endDrag,
    fitToView,
    zoomIn,
    zoomOut,
    centerView
  };
}
