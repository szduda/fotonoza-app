import { useEffect, useSyncExternalStore, useState } from "react"
import { loadCachedHistogram, peekHistogramCache } from "@/lib/histogramCache"
import {
  clearLiveHistogram,
  getLiveHistogramSnapshot,
  subscribeLiveHistogram,
} from "@/lib/liveHistogram"
import { useAppStore } from "@/store/appStore"
import type { HistogramData } from "@/types/domain"
import { defaultBasicEffects, defaultDarktableFx, defaultShadowsHighlights } from "@/types/domain"

export const useHistogramForEdit = (): {
  data: HistogramData | undefined
  loading: boolean
} => {
  const { mode, photos, currentPhotoId } = useAppStore((s) => s.present)
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId)
  const live = useSyncExternalStore(subscribeLiveHistogram, getLiveHistogramSnapshot, () => undefined)
  const [histogram, setHistogram] = useState<HistogramData | undefined>(undefined)
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (mode !== "edit" || !selectedPhoto?.sourcePath) {
      setHistogram(undefined)
      setHistLoading(false)
      return
    }
    if (live?.photoId === selectedPhoto.id) {
      setHistogram(live.data)
      setHistLoading(false)
      return
    }
    const basic = { ...defaultBasicEffects(), ...selectedPhoto.basicEffects }
    const sh = { ...defaultShadowsHighlights(), ...selectedPhoto.shadowsHighlights }
    const dt = { ...defaultDarktableFx(), ...selectedPhoto.darktableFx }
    const key = {
      path: selectedPhoto.sourcePath,
      exposureEv: basic.exposure,
      contrast: basic.contrast,
      contrastBalance: basic.contrastBalance,
      clarity: basic.clarity,
      vibrance: basic.vibrance,
      saturation: basic.saturation,
      shadows: sh.shadows,
      darks: sh.darks,
      lights: sh.lights,
      highlights: sh.highlights,
      filmicRgb: dt.filmicRgb,
      profiledDenoise: dt.profiledDenoise,
    }
    const cached = peekHistogramCache(key)
    if (cached) {
      setHistogram(cached)
      setHistLoading(false)
      return
    }
    let active = true
    setHistogram(undefined)
    setHistLoading(true)
    void loadCachedHistogram(key)
      .then((data) => {
        if (!active) return
        setHistogram(data)
        setHistLoading(false)
      })
      .catch((err) => {
        if (!active) return
        console.warn("Histogram unavailable", err)
        setHistogram(undefined)
        setHistLoading(false)
      })
    return () => {
      active = false
    }
  }, [
    mode,
    live,
    selectedPhoto?.id,
    selectedPhoto?.sourcePath,
    selectedPhoto?.basicEffects,
    selectedPhoto?.shadowsHighlights,
    selectedPhoto?.darktableFx,
  ])

  useEffect(() => {
    if (!selectedPhoto?.id) {
      clearLiveHistogram()
      return
    }
    return () => {
      clearLiveHistogram(selectedPhoto.id)
    }
  }, [selectedPhoto?.id])

  return { data: histogram, loading: histLoading }
}
