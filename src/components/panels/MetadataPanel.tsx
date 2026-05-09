import { useMemo, type ReactElement } from "react"
import { usePhotoExif } from "@/hooks/usePhotoExif"
import { t } from "@/lib/i18n"
import { chrome } from "@/components/layout/chromeTheme"
import { RatingStars } from "@/components/generic/RatingStars"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { useAppStore } from "@/store/appStore"
import type { Photo } from "@/types/domain"

const joinClean = (a?: string, b?: string): string | undefined => {
  const out = [a?.trim(), b?.trim()].filter((x) => x && x.length > 0).join(" ")
  return out.length > 0 ? out : undefined
}

const MetaRow = ({ label, value }: { label: string; value?: string }): ReactElement => (
  <div className="px-2 py-1 gap-1 flex items-baseline justify-between">
    <dt className={`text-[8px] font-medium uppercase text-right ${chrome.faintText}`}>{label}</dt>
    <dd
      className={`text-[11px] text-right ${chrome.panelText} ${value ? "opacity-100" : "opacity-20 !text-[8px]"}`}
      style={{ lineHeight: "14px" }}
    >
      {value ?? "N/D"}
    </dd>
  </div>
)

export const MetadataPanel = (): ReactElement => {
  const { mode, photos, currentPhotoId, locale } = useAppStore((s) => s.present)
  const viewHoveredPhotoId = useAppStore((s) => s.viewHoveredPhotoId)
  const setPhotoRating = useAppStore((s) => s.actions.setPhotoRating)

  const metaPhoto: Photo | undefined = useMemo(() => {
    if (mode === "edit") return photos.find((p) => p.id === currentPhotoId)
    const hovered = viewHoveredPhotoId ? photos.find((p) => p.id === viewHoveredPhotoId) : undefined
    if (hovered) return hovered
    return photos.find((p) => p.selected)
  }, [mode, photos, currentPhotoId, viewHoveredPhotoId])

  const exif = usePhotoExif(metaPhoto?.sourcePath)
  const rating = metaPhoto ? Math.min(5, Math.max(0, metaPhoto.rating ?? 0)) : 0

  const cameraLine = joinClean(exif?.cameraMake, exif?.cameraModel)
  const lensLine = joinClean(exif?.lensMake, exif?.lensModel)

  return (
    <ToggledPanel
      id="metadata"
      label={t(locale, (m) => m.labels.metadata)}
      defaultOpen
     featurePanel
    >
      {!metaPhoto ? (
        <p className={`px-2 py-2 text-[11px] ${chrome.mutedText}`}>
          {t(locale, (m) => m.labels.metadataPickPhoto)}
        </p>
      ) : (
        <dl className="py-1">
          <MetaRow label={t(locale, (m) => m.labels.fileName)} value={metaPhoto.fileName} />
          <MetaRow label={t(locale, (m) => m.labels.dateTaken)} value={exif?.dateTimeOriginal} />

          <div className="w-full border-b border-dotted border-neutral-700/30 my-1" />

          <MetaRow label={t(locale, (m) => m.labels.camera)} value={cameraLine} />
          <MetaRow label={t(locale, (m) => m.labels.lens)} value={lensLine} />
          <MetaRow label={t(locale, (m) => m.labels.exposure)} value={exif?.exposureSummary} />

          <div className="w-full border-b border-dotted border-neutral-700/30 my-1" />

          <RatingStars rating={rating} onPick={(n) => setPhotoRating(metaPhoto.id, n)} />
        </dl>
      )}
    </ToggledPanel>
  )
}
