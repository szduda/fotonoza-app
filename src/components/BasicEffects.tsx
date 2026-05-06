import { useCallback, useEffect, useRef, useState, type ReactElement } from "react"
import { loadPhotoState } from "@/lib/persistence"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { BasicEffectsState, Photo } from "@/types/domain"
import { defaultBasicEffects } from "@/types/domain"
import { ToggledPanel } from "./generic/ToggledPanel"
import { SliderRow } from "./generic/SliderRow"

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

export const BasicEffects = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const defaults = defaultBasicEffects()
  const [local, setLocal] = useState<BasicEffectsState>(() => ({
    ...defaults,
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
      defaultOpen
    >
      <div className="space-y-3 px-1 pb-2 pt-1">
        <SliderRow
          label="Exposure (EV)"
          min={-3}
          max={3}
          step={0.05}
          value={local.exposure}
          defaultValue={defaults.exposure}
          onChange={(v) => onSlider({ exposure: v })}
        />
        <SliderRow
          label="Contrast"
          min={0.5}
          max={1.5}
          step={0.01}
          value={local.contrast}
          defaultValue={defaults.contrast}
          onChange={(v) => onSlider({ contrast: v })}
        />
        <SliderRow
          label="Contrast Balance"
          min={-1}
          max={1}
          step={0.01}
          value={local.contrastBalance}
          defaultValue={defaults.contrastBalance}
          onChange={(v) => onSlider({ contrastBalance: v })}
        />
        <SliderRow
          label="Clarity"
          min={-1}
          max={1}
          step={0.01}
          value={local.clarity}
          defaultValue={defaults.clarity}
          onChange={(v) => onSlider({ clarity: v })}
        />
        <SliderRow
          label="Vibrance"
          min={-1}
          max={1}
          step={0.01}
          value={local.vibrance}
          defaultValue={defaults.vibrance}
          onChange={(v) => onSlider({ vibrance: v })}
        />
        <SliderRow
          label="Saturation"
          min={0}
          max={2}
          step={0.01}
          value={local.saturation}
          defaultValue={defaults.saturation}
          onChange={(v) => onSlider({ saturation: v })}
        />
      </div>
    </ToggledPanel>
  )
}
