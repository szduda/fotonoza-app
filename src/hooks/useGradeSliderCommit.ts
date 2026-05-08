import { useCallback, useEffect, useRef, type MutableRefObject } from "react"
import type { Photo } from "@/types/domain"
import { useAppStore } from "@/store/appStore"

/** One undo/history step on commit; live store merges while temporal is paused during drag. */
export function useGradeSliderCommit<T>({
  photoId,
  localRef,
  buildBaseline,
  toMergePartial,
  patchWithHistory,
}: {
  photoId: string
  localRef: MutableRefObject<T>
  buildBaseline: (photo: Photo | undefined) => T
  toMergePartial: (baseline: T) => Partial<Photo>
  patchWithHistory: (photoId: string, state: T, historyLabel: string, historyDelta?: number) => void
}): {
  startGesture: () => void
  finishCommit: (historyLabel: string, pickAxis: (v: T) => number) => void
} {
  const actions = useAppStore((s) => s.actions)
  const gestureActive = useRef(false)
  const baselineRef = useRef<T | null>(null)

  const startGesture = useCallback(() => {
    if (gestureActive.current) return
    gestureActive.current = true
    const photo = useAppStore.getState().present.photos.find((p) => p.id === photoId)
    baselineRef.current = structuredClone(buildBaseline(photo))
    useAppStore.temporal.getState().pause()
  }, [photoId, buildBaseline])

  const finishCommit = useCallback(
    (historyLabel: string, pickAxis: (v: T) => number) => {
      if (!gestureActive.current || baselineRef.current === null) return
      const before = baselineRef.current
      const after = localRef.current
      const historyDelta = pickAxis(after) - pickAxis(before)
      gestureActive.current = false
      actions.mergePhotoFromDisk(photoId, toMergePartial(before))
      useAppStore.temporal.getState().resume()
      patchWithHistory(photoId, after, historyLabel, historyDelta)
    },
    [actions, photoId, toMergePartial, patchWithHistory],
  )

  useEffect(() => {
    return () => {
      if (gestureActive.current) useAppStore.temporal.getState().resume()
    }
  }, [])

  return { startGesture, finishCommit }
}
