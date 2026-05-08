import { useCallback, useEffect, useRef, useState, type ReactElement } from "react"
import { loadPhotoState, renderDarktableFxPreview } from "@/lib/persistence"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import type { DarktableFxState, Photo } from "@/types/domain"
import { defaultDarktableFx } from "@/types/domain"
import { chrome } from "./layout/chromeTheme"
import { ToggledPanel } from "./generic/ToggledPanel"

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
    <div className="space-y-3">
      <ToggledPanel id="filmic-rgb" label={t(locale, (m) => m.labels.filmicRgb)}>
        <div className="px-1 pb-2 pt-1">
          <ToggleRow
            label={t(locale, (m) => m.labels.filmicRgb)}
            enabled={local.filmicRgb}
            onChange={(enabled) => onPatch({ filmicRgb: enabled })}
          />
        </div>
      </ToggledPanel>

      <ToggledPanel id="denoise-profiled" label={t(locale, (m) => m.labels.denoiseProfiled)}>
        <div className="px-1 pb-2 pt-1">
          <ToggleRow
            label={t(locale, (m) => m.labels.denoiseProfiled)}
            enabled={local.profiledDenoise}
            onChange={(enabled) => onPatch({ profiledDenoise: enabled })}
          />
        </div>
      </ToggledPanel>
    </div>
  )
}

const ToggleRow = ({
  label,
  enabled,
  onChange,
}: {
  label: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}): ReactElement => {
  return (
    <div className={`grid grid-cols-[5rem_minmax(0,1fr)_2.75rem] items-center gap-2 text-xs ${chrome.mutedText}`}>
      <span className="text-[8px] font-medium uppercase">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`h-5 w-10 rounded-full border transition ${
          enabled
            ? "border-neutral-500/80 bg-neutral-500/80"
            : "border-neutral-600/60 bg-neutral-700/40"
        }`}
        title={enabled ? "Disable" : "Enable"}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white/90 transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-right tabular-nums text-[10px] text-neutral-400">{enabled ? "ON" : "OFF"}</span>
    </div>
  )
}
