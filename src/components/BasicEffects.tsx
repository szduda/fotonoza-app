import { useCallback, useEffect, useRef, useState, type ReactElement } from "react"
import { loadPhotoState } from "@/lib/persistence"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { BasicEffectsState, Photo } from "@/types/domain"
import { defaultBasicEffects } from "@/types/domain"
import { chrome } from "./layout/chromeTheme"
import { ToggledPanel } from "./generic/ToggledPanel"

const PERSIST_MS = 280

const isBasicFx = (v: unknown): v is BasicEffectsState => {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return (
    typeof o.exposure === "number" &&
    typeof o.contrast === "number" &&
    typeof o.saturation === "number"
  )
}

const SliderRow = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}): ReactElement => {
  const decimals = step < 0.1 ? 2 : 1
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
  )
}

export const BasicEffects = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const [local, setLocal] = useState<BasicEffectsState>(() => ({
    ...defaultBasicEffects(),
    ...selectedPhoto.basicEffects,
  }))
  const localRef = useRef(local)
  localRef.current = local

  const persistTimer = useRef(0)

  useEffect(() => {
    setLocal({ ...defaultBasicEffects(), ...selectedPhoto.basicEffects })
    let cancelled = false
    void (async () => {
      const disk = await loadPhotoState(selectedPhoto.fileName)
      if (cancelled || !disk) return
      const raw = disk.basicEffects
      if (isBasicFx(raw)) {
        useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, { basicEffects: raw })
        setLocal({ ...defaultBasicEffects(), ...raw })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPhoto.id, selectedPhoto.fileName])

  const schedulePersist = useCallback(() => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      useAppStore.getState().actions.patchBasicEffects(selectedPhoto.id, localRef.current)
    }, PERSIST_MS)
  }, [selectedPhoto.id])

  const onSlider = (patch: Partial<BasicEffectsState>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch }
      localRef.current = next
      useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, {
        basicEffects: next,
      })
      return next
    })
    schedulePersist()
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(persistTimer.current)
    }
  }, [selectedPhoto.id])

  return (
    <ToggledPanel
      id="basic-effects"
      label={t(locale, (m) => m.labels.basicEffects)}
      height={220}
      defaultOpen
    >
      <div className="space-y-3 px-1 pb-2 pt-1">
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
          step={0.01}
          value={local.contrast}
          onChange={(v) => onSlider({ contrast: v })}
        />
        <SliderRow
          label="Saturation"
          min={0}
          max={2}
          step={0.01}
          value={local.saturation}
          onChange={(v) => onSlider({ saturation: v })}
        />
      </div>
    </ToggledPanel>
  )
}
