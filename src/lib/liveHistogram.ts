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

// const HIST_TARGET_SAMPLES = 65_536
const HIST_TARGET_SAMPLES = 4096
const HIST_SMOOTH_BLEND = 0.7

export type HistogramBufferRef = { current: Uint8Array | null }

const smoothBins = (bins: number[]): number[] => {
  const n = bins.length
  if (n < 3) return bins
  const out = new Array<number>(n)
  out[0] = bins[0]
  out[n - 1] = bins[n - 1]

  for (let i = 1; i < n - 1; i += 1) {
    // Small 3-tap gaussian-ish kernel: [1, 2, 1] / 4.
    const blurred = (bins[i - 1] + 2 * bins[i] + bins[i + 1]) * 0.25
    out[i] = bins[i] * (1 - HIST_SMOOTH_BLEND) + blurred * HIST_SMOOTH_BLEND
  }

  return out
}

/** Reads the current WebGL framebuffer, builds RGB/luma histograms, and publishes to live subscribers. */
export const publishHistogramFromFrame = (
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  photoId: string,
  histBufferRef: HistogramBufferRef,
): void => {
  const pixelCount = Math.max(1, width * height)
  const stride = Math.max(1, Math.floor(Math.sqrt(pixelCount / HIST_TARGET_SAMPLES)))
  const neededSize = width * height * 4
  const packed =
    histBufferRef.current && histBufferRef.current.length === neededSize
      ? histBufferRef.current
      : new Uint8Array(neededSize)
  histBufferRef.current = packed
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, packed)

  const red = new Array<number>(256).fill(0)
  const green = new Array<number>(256).fill(0)
  const blue = new Array<number>(256).fill(0)
  const luma = new Array<number>(256).fill(0)
  const rowStride = width * 4

  for (let y = 0; y < height; y += stride) {
    const rowOffset = y * rowStride
    for (let x = 0; x < width; x += stride) {
      const idx = rowOffset + x * 4
      const r = packed[idx]
      const g = packed[idx + 1]
      const b = packed[idx + 2]
      red[r] += 1
      green[g] += 1
      blue[b] += 1
      const yVal = Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b))
      luma[yVal] += 1
    }
  }

  publishLiveHistogram(photoId, {
    red: smoothBins(red),
    green: smoothBins(green),
    blue: smoothBins(blue),
    luma: smoothBins(luma),
  })
}
