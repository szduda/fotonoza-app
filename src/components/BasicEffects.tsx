import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { loadPhotoState, renderBasicEffectsPreview } from "../lib/persistence";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import type { BasicEffectsState, Photo } from "../types/domain";
import { defaultBasicEffects } from "../types/domain";
import { chrome } from "./layout/chromeTheme";
import { ToggledPanel } from "./generic/ToggledPanel";

const PREVIEW_MS = 90;
const PERSIST_MS = 280;

function isBasicFx(v: unknown): v is BasicEffectsState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.exposure === "number" &&
    typeof o.contrast === "number" &&
    typeof o.saturation === "number"
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}): ReactElement {
  const decimals = step < 0.1 ? 2 : 1;
  return (
    <label className={`flex flex-col gap-1 text-xs ${chrome.mutedText}`}>
      <span className="flex justify-between font-medium text-[11px] uppercase tracking-wide">
        <span>{label}</span>
        <span className="tabular-nums text-neutral-400">{value.toFixed(decimals)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-neutral-400"
      />
    </label>
  );
}

export function BasicEffects({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement {
  const { locale } = useAppStore((s) => s.present);
  const [local, setLocal] = useState<BasicEffectsState>(() => ({
    ...defaultBasicEffects(),
    ...selectedPhoto.basicEffects,
  }));
  const localRef = useRef(local);
  localRef.current = local;

  const previewTargetRef = useRef({ id: selectedPhoto.id, path: selectedPhoto.sourcePath });
  previewTargetRef.current = { id: selectedPhoto.id, path: selectedPhoto.sourcePath };

  const previewTimer = useRef(0);
  const persistTimer = useRef(0);

  useEffect(() => {
    setLocal({ ...defaultBasicEffects(), ...selectedPhoto.basicEffects });
    let cancelled = false;
    void (async () => {
      const disk = await loadPhotoState(selectedPhoto.fileName);
      if (cancelled || !disk) return;
      const raw = disk.basicEffects;
      if (isBasicFx(raw)) {
        useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, { basicEffects: raw });
        setLocal({ ...defaultBasicEffects(), ...raw });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPhoto.id, selectedPhoto.fileName]);

  const runPreview = useCallback(async () => {
    const target = previewTargetRef.current;
    const L = localRef.current;
    const { adjustEditPreviewPending, setEditPreview } = useAppStore.getState().actions;
    adjustEditPreviewPending(1);
    try {
      const path = await renderBasicEffectsPreview(
        target.path,
        L.exposure,
        L.contrast,
        L.saturation,
      );
      if (previewTargetRef.current.id !== target.id) return;
      setEditPreview(target.id, path);
    } catch {
      /* optional */
    } finally {
      adjustEditPreviewPending(-1);
    }
  }, []);

  const schedulePreview = useCallback(() => {
    window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      void runPreview();
    }, PREVIEW_MS);
  }, [runPreview]);

  const schedulePersist = useCallback(() => {
    window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      useAppStore.getState().actions.patchBasicEffects(selectedPhoto.id, localRef.current);
    }, PERSIST_MS);
  }, [selectedPhoto.id]);

  const onSlider = (patch: Partial<BasicEffectsState>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      localRef.current = next;
      return next;
    });
    schedulePreview();
    schedulePersist();
  };

  useEffect(() => {
    void runPreview();
    return () => {
      window.clearTimeout(previewTimer.current);
      window.clearTimeout(persistTimer.current);
    };
  }, [selectedPhoto.id, selectedPhoto.sourcePath, runPreview]);

  return (
    <ToggledPanel
      id="basic-effects"
      label={t(locale, (m) => m.labels.basicEffects)}
      height={220}
      defaultOpen
    >
      <div className="space-y-3 px-1 pb-2 pt-1">
          {/* Live preview uses a fast RGB path in the app. Sidecar JSON is saved under your home in{" "}
          <code className="text-neutral-500">{FOTONOZA_IMPORT_DIR_NAME}</code> as a dotfile named
          after the photo file. Use <code className="text-neutral-500">run_darktable_operation</code>{" "}
          with an XMP when you wire a full raw pipeline. */}
        <SliderRow
          label="Exposure (EV)"
          min={-3}
          max={3}
          step={0.05}
          value={local.exposure}
          onChange={(v) => onSlider({ exposure: v })}
        />
        <SliderRow
          label="Contrast"
          min={0.5}
          max={1.5}
          step={0.02}
          value={local.contrast}
          onChange={(v) => onSlider({ contrast: v })}
        />
        <SliderRow
          label="Saturation"
          min={0}
          max={1.5}
          step={0.02}
          value={local.saturation}
          onChange={(v) => onSlider({ saturation: v })}
        />
      </div>
    </ToggledPanel>
  );
}
