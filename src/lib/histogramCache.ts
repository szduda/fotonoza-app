import type { HistogramData } from "@/types/domain"
import { getPhotoHistogram } from "./persistence"

const histCache = new Map<string, HistogramData>()
const histPending = new Map<string, Promise<HistogramData>>()

export type HistogramKey = {
  path: string
  exposureEv: number
  contrast: number
  contrastBalance: number
  clarity: number
  vibrance: number
  saturation: number
  shadows: number
  darks: number
  lights: number
  highlights: number
  filmicRgb: boolean
  profiledDenoise: boolean
}

const toCacheKey = (key: HistogramKey): string => {
  return [
    key.path,
    key.exposureEv,
    key.contrast,
    key.contrastBalance,
    key.clarity,
    key.vibrance,
    key.saturation,
    key.shadows,
    key.darks,
    key.lights,
    key.highlights,
    key.filmicRgb ? 1 : 0,
    key.profiledDenoise ? 1 : 0,
  ].join("|")
}

export const peekHistogramCache = (key: HistogramKey): HistogramData | undefined => {
  return histCache.get(toCacheKey(key))
}

export const loadCachedHistogram = (key: HistogramKey): Promise<HistogramData> => {
  const cacheKey = toCacheKey(key)
  const ready = histCache.get(cacheKey)
  if (ready) return Promise.resolve(ready)
  const pending = histPending.get(cacheKey)
  if (pending) return pending

  const req = getPhotoHistogram(
    key.path,
    {
      exposure: key.exposureEv,
      contrast: key.contrast,
      contrastBalance: key.contrastBalance,
      clarity: key.clarity,
      vibrance: key.vibrance,
      saturation: key.saturation,
    },
    {
      shadows: key.shadows,
      darks: key.darks,
      lights: key.lights,
      highlights: key.highlights,
    },
    {
      filmicRgb: key.filmicRgb,
      profiledDenoise: key.profiledDenoise,
    },
  ).then((data) => {
    histCache.set(cacheKey, data)
    if (histCache.size > 60) {
      const oldest = histCache.keys().next().value
      if (oldest) histCache.delete(oldest)
    }
    histPending.delete(cacheKey)
    return data
  })
  histPending.set(cacheKey, req)
  return req
}
