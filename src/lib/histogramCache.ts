import type { HistogramData } from "@/types/domain"
import { getPhotoHistogram } from "./persistence"

const histCache = new Map<string, HistogramData>()
const histPending = new Map<string, Promise<HistogramData>>()

export const peekHistogramCache = (path: string): HistogramData | undefined => {
  return histCache.get(path)
}

export const loadCachedHistogram = (path: string): Promise<HistogramData> => {
  const ready = histCache.get(path)
  if (ready) return Promise.resolve(ready)
  const pending = histPending.get(path)
  if (pending) return pending

  const req = getPhotoHistogram(path).then((data) => {
    histCache.set(path, data)
    if (histCache.size > 60) {
      const oldest = histCache.keys().next().value
      if (oldest) histCache.delete(oldest)
    }
    histPending.delete(path)
    return data
  })
  histPending.set(path, req)
  return req
}
