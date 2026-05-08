import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import { HistogramCanvas } from "@/components/panels/HistogramCanvas"
import { chrome } from "@/components/layout/chromeTheme"
import { BasicEffects } from "@/components/BasicEffects"
import { ColorEffects } from "@/components/ColorEffects"
import { ShadowsHighlightsPanel } from "@/components/ShadowsHighlightsPanel"
import { DarktableFxPanel } from "@/components/DarktableFxPanel"

export const RightSidebar = () => {
  const { mode, photos, currentPhotoId, locale } = useAppStore((s) => s.present)
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId)

  if (mode !== "edit") {
    return null
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 overflow-x-hidden p-2.5">
      <HistogramCanvas />
      {selectedPhoto ? (
        <>
          <BasicEffects selectedPhoto={selectedPhoto} />
          <ColorEffects selectedPhoto={selectedPhoto} />
          <ShadowsHighlightsPanel selectedPhoto={selectedPhoto} />
          <DarktableFxPanel selectedPhoto={selectedPhoto} />
        </>
      ) : (
        <p className={`mt-4 text-xs ${chrome.mutedText}`}>{t(locale, (m) => m.labels.noPhotos)}</p>
      )}
    </div>
  )
}
