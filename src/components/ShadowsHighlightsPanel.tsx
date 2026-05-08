import { useCallback, useEffect, useRef, useState, type ReactElement } from "react"
import { loadPhotoState } from "@/lib/persistence"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import type { Photo, ShadowsHighlightsState } from "@/types/domain"
import { defaultShadowsHighlights } from "@/types/domain"
import { ToggledPanel } from "./generic/ToggledPanel"
import { SliderRow } from "./generic/SliderRow"

const PERSIST_MS = 280

const isSh = (v: unknown): v is ShadowsHighlightsState => {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shadows === "number" &&
    typeof o.darks === "number" &&
    typeof o.lights === "number" &&
    typeof o.highlights === "number"
  )
}

export const ShadowsHighlightsPanel = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const defaults = defaultShadowsHighlights()
  const [local, setLocal] = useState<ShadowsHighlightsState>(() => ({
    ...defaults,
    ...selectedPhoto.shadowsHighlights,
  }))
  const localRef = useRef(local)
  localRef.current = local
  const persistTimer = useRef(0)

  useEffect(() => {
    setLocal({ ...defaultShadowsHighlights(), ...selectedPhoto.shadowsHighlights })
    let cancelled = false
    void (async () => {
      const disk = await loadPhotoState(selectedPhoto.fileName)
      if (cancelled || !disk) return
      const raw = disk.shadowsHighlights
      if (!isSh(raw)) return
      useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, { shadowsHighlights: raw })
      setLocal({ ...defaultShadowsHighlights(), ...raw })
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPhoto.id, selectedPhoto.fileName])

  const schedulePersist = useCallback(() => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      useAppStore.getState().actions.patchShadowsHighlights(selectedPhoto.id, localRef.current)
    }, PERSIST_MS)
  }, [selectedPhoto.id])

  const onSlider = (patch: Partial<ShadowsHighlightsState>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch }
      localRef.current = next
      return next
    })
    useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, {
      shadowsHighlights: localRef.current,
    })
    schedulePersist()
  }

  return (
    <ToggledPanel id="shadows-highlights" label={t(locale, (m) => m.labels.shadowsHighlights)}>
      <div className="space-y-1 px-1 pb-2 pt-3">
        <SliderRow
          label="Shadows"
          min={-1}
          max={1}
          step={0.01}
          value={local.shadows}
          defaultValue={defaults.shadows}
          onChange={(v) => onSlider({ shadows: v })}
        />
        <SliderRow
          label="Darks"
          min={-1}
          max={1}
          step={0.01}
          value={local.darks}
          defaultValue={defaults.darks}
          onChange={(v) => onSlider({ darks: v })}
        />
        <SliderRow
          label="Lights"
          min={-1}
          max={1}
          step={0.01}
          value={local.lights}
          defaultValue={defaults.lights}
          onChange={(v) => onSlider({ lights: v })}
        />
        <SliderRow
          label="Highlights"
          min={-1}
          max={1}
          step={0.01}
          value={local.highlights}
          defaultValue={defaults.highlights}
          onChange={(v) => onSlider({ highlights: v })}
        />
      </div>
    </ToggledPanel>
  )
}
