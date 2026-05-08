import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { loadPhotoState } from "@/lib/persistence"
import { useAppStore } from "@/store/appStore"
import type {
  BasicEffectsState,
  ColorEffectsState,
  Photo,
  ShadowsHighlightsState,
} from "@/types/domain"
import {
  defaultBasicEffects,
  defaultColorEffects,
  defaultShadowsHighlights,
} from "@/types/domain"
import { useGradeSliderCommit } from "./useGradeSliderCommit"

type GradeKey = "basicEffects" | "colorEffects" | "shadowsHighlights"

async function loadBasicFromDisk(fileName: string): Promise<BasicEffectsState | null> {
  const disk = await loadPhotoState(fileName)
  const raw = disk?.basicEffects
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (typeof o.exposure !== "number" || typeof o.contrast !== "number") {
    return null
  }
  return raw as BasicEffectsState
}

async function loadColorFromDisk(fileName: string): Promise<ColorEffectsState | null> {
  const disk = await loadPhotoState(fileName)
  const raw = disk?.colorEffects
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (
    typeof o.vibrance !== "number" ||
    typeof o.saturation !== "number" ||
    typeof o.temperature !== "number" ||
    typeof o.tint !== "number"
  ) {
    return null
  }
  return raw as ColorEffectsState
}

async function loadShFromDisk(fileName: string): Promise<ShadowsHighlightsState | null> {
  const disk = await loadPhotoState(fileName)
  const raw = disk?.shadowsHighlights
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (
    typeof o.shadows !== "number" ||
    typeof o.darks !== "number" ||
    typeof o.lights !== "number" ||
    typeof o.highlights !== "number"
  ) {
    return null
  }
  return raw as ShadowsHighlightsState
}

function usePhotoGradeSlidersCore<T>(
  selectedPhoto: Photo,
  opts: {
    partialKey: GradeKey
    defaults: () => T
    loadDiskSlice: (fileName: string) => Promise<T | null>
    patchWithHistory: (
      photoId: string,
      state: T,
      historyLabel: string,
      historyDelta?: number,
    ) => void
  },
): {
  local: T
  defaultValues: T
  startGesture: () => void
  finishCommit: (historyLabel: string, pickAxis: (v: T) => number) => void
  onLive: (patch: Partial<T>) => void
} {
  const { partialKey, defaults, loadDiskSlice, patchWithHistory } = opts
  const historyCursor = useAppStore((s) => s.present.historyCursor)
  const storeGradeStamp = useAppStore((s) => {
    const p = s.present.photos.find((x) => x.id === selectedPhoto.id)
    const slice = p?.[partialKey]
    return slice && typeof slice === "object" ? JSON.stringify(slice) : ""
  })

  const [local, setLocal] = useState<T>(() => ({
    ...defaults(),
    ...(selectedPhoto[partialKey] as object),
  }))
  const localRef = useRef(local)
  localRef.current = local

  const defaultValues = useMemo(() => defaults(), [defaults])

  const buildBaseline = useCallback(
    (photo: Photo | undefined): T => ({
      ...defaults(),
      ...(photo?.[partialKey] as object),
    }),
    [defaults, partialKey],
  )

  const toMergePartial = useCallback(
    (baseline: T): Partial<Photo> => ({ [partialKey]: baseline } as Partial<Photo>),
    [partialKey],
  )

  const { startGesture, finishCommit } = useGradeSliderCommit({
    photoId: selectedPhoto.id,
    localRef,
    buildBaseline,
    toMergePartial,
    patchWithHistory,
  })

  useEffect(() => {
    const photo = useAppStore.getState().present.photos.find((p) => p.id === selectedPhoto.id)
    const slice = photo?.[partialKey] as Partial<T> | undefined
    setLocal({ ...defaults(), ...slice })
  }, [
    selectedPhoto.id,
    selectedPhoto.fileName,
    historyCursor,
    storeGradeStamp,
    partialKey,
    defaults,
  ])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const fromDisk = await loadDiskSlice(selectedPhoto.fileName)
      if (cancelled || !fromDisk) return
      useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, {
        [partialKey]: fromDisk,
      } as Partial<Photo>)
      setLocal({ ...defaults(), ...fromDisk })
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPhoto.id, selectedPhoto.fileName, partialKey, defaults, loadDiskSlice])

  const onLive = useCallback(
    (patch: Partial<T>) => {
      const next = { ...localRef.current, ...patch }
      localRef.current = next
      setLocal(next)
      useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, {
        [partialKey]: next,
      } as Partial<Photo>)
    },
    [selectedPhoto.id, partialKey],
  )

  return { local, defaultValues, startGesture, finishCommit, onLive }
}

export function useBasicGradeSliders(selectedPhoto: Photo) {
  const patchBasicEffects = useAppStore((s) => s.actions.patchBasicEffects)
  return usePhotoGradeSlidersCore<BasicEffectsState>(selectedPhoto, {
    partialKey: "basicEffects",
    defaults: defaultBasicEffects,
    loadDiskSlice: loadBasicFromDisk,
    patchWithHistory: patchBasicEffects,
  })
}

export function useColorGradeSliders(selectedPhoto: Photo) {
  const patchColorEffects = useAppStore((s) => s.actions.patchColorEffects)
  return usePhotoGradeSlidersCore<ColorEffectsState>(selectedPhoto, {
    partialKey: "colorEffects",
    defaults: defaultColorEffects,
    loadDiskSlice: loadColorFromDisk,
    patchWithHistory: patchColorEffects,
  })
}

export function useShadowsGradeSliders(selectedPhoto: Photo) {
  const patchShadowsHighlights = useAppStore((s) => s.actions.patchShadowsHighlights)
  return usePhotoGradeSlidersCore<ShadowsHighlightsState>(selectedPhoto, {
    partialKey: "shadowsHighlights",
    defaults: defaultShadowsHighlights,
    loadDiskSlice: loadShFromDisk,
    patchWithHistory: patchShadowsHighlights,
  })
}
