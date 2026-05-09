import { useCallback, useEffect, useRef, useState, type ReactElement } from "react"
import { loadPhotoState, renderDarktableFxPreview } from "@/lib/persistence"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import type { DarktableFxState, Photo } from "@/types/domain"
import { defaultDarktableFx } from "@/types/domain"
import { ToggledPanel } from "./generic/ToggledPanel"
import { ToggleRow } from "./generic/ToggleRow"

const isDarktableFx = (v: unknown): v is DarktableFxState => {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return typeof o.filmicRgb === "boolean" && typeof o.profiledDenoise === "boolean"
}

export const DarktableFxPanel = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const [local, setLocal] = useState<DarktableFxState>(() => ({
    ...defaultDarktableFx(),
    ...selectedPhoto.darktableFx,
  }))
  const requestRef = useRef(0)

  useEffect(() => {
    setLocal({ ...defaultDarktableFx(), ...selectedPhoto.darktableFx })
    let cancelled = false
    void (async () => {
      const disk = await loadPhotoState(selectedPhoto.fileName)
      if (cancelled || !disk) return
      const raw = disk.darktableFx
      if (!isDarktableFx(raw)) return
      useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, { darktableFx: raw })
      setLocal({ ...defaultDarktableFx(), ...raw })
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPhoto.id, selectedPhoto.fileName])

  const runBackgroundPreview = useCallback(async (next: DarktableFxState) => {
    const request = requestRef.current + 1
    requestRef.current = request
    const { adjustEditPreviewPending, setEditPreview } = useAppStore.getState().actions
    adjustEditPreviewPending(1)
    try {
      const path = await renderDarktableFxPreview(
        selectedPhoto.sourcePath,
        next.filmicRgb,
        next.profiledDenoise,
      )
      if (requestRef.current !== request) return
      setEditPreview(selectedPhoto.id, path)
    } catch {
      // Keep GPU live preview if darktable effect preview fails.
    } finally {
      adjustEditPreviewPending(-1)
    }
  }, [selectedPhoto.id, selectedPhoto.sourcePath])

  const onPatch = (patch: Partial<DarktableFxState>) => {
    let next!: DarktableFxState
    setLocal((prev) => {
      next = { ...prev, ...patch }
      return next
    })
    useAppStore.getState().actions.mergePhotoFromDisk(selectedPhoto.id, { darktableFx: next })
    void useAppStore.getState().actions.patchDarktableFx(selectedPhoto.id, next)
    void runBackgroundPreview(next)
  }

  return (
    <div>
      <ToggledPanel id="filmic-rgb" label={t(locale, (m) => m.labels.filmicRgb)}>
          <ToggleRow
            label={t(locale, (m) => m.labels.filmicRgb)}
            enabled={local.filmicRgb}
            onChange={(enabled) => onPatch({ filmicRgb: enabled })}
            className="pl-2 py-1"
          />
      </ToggledPanel>

      <ToggledPanel id="denoise-profiled" label={t(locale, (m) => m.labels.denoiseProfiled)}>
          <ToggleRow
            label={t(locale, (m) => m.labels.denoiseProfiled)}
            enabled={local.profiledDenoise}
            onChange={(enabled) => onPatch({ profiledDenoise: enabled })}
            className="pl-2 py-1"
          />
      </ToggledPanel>
    </div>
  )
}
