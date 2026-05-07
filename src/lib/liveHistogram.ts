import type { HistogramData } from "@/types/domain"

type Snapshot = {
  photoId: string
  data: HistogramData
  updatedAt: number
}

let liveSnapshot: Snapshot | undefined
const listeners = new Set<() => void>()

export const publishLiveHistogram = (photoId: string, data: HistogramData): void => {
  liveSnapshot = { photoId, data, updatedAt: Date.now() }
  listeners.forEach((listener) => listener())
}

export const clearLiveHistogram = (photoId?: string): void => {
  if (!liveSnapshot) return
  if (photoId && liveSnapshot.photoId !== photoId) return
  liveSnapshot = undefined
  listeners.forEach((listener) => listener())
}

export const subscribeLiveHistogram = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getLiveHistogramSnapshot = (): Snapshot | undefined => {
  return liveSnapshot
}

export const hasLiveHistogramSubscribers = (): boolean => {
  return listeners.size > 0
}
