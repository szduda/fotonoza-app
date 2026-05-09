import type { ReactElement } from "react"
import { useShadowsGradeSliders } from "@/hooks/usePhotoGradeSliders"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import type { Photo } from "@/types/domain"
import { ToggledPanel } from "./generic/ToggledPanel"
import { SliderRow } from "./generic/SliderRow"

export const ShadowsHighlightsPanel = ({
  selectedPhoto,
}: {
  selectedPhoto: Photo
}): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const { local, defaultValues, startGesture, finishCommit, onLive } =
    useShadowsGradeSliders(selectedPhoto)

  return (
    <ToggledPanel id="shadows-highlights" label={t(locale, (m) => m.labels.shadowsHighlights)}>
      <div className="space-y-1 px-1 py-2">
        <SliderRow
          label="Shadows"
          min={-1}
          max={1}
          step={0.01}
          value={local.shadows}
          defaultValue={defaultValues.shadows}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ shadows: v })}
          onCommitChange={() => finishCommit("shadows-highlights-shadows", (s) => s.shadows)}
        />
        <SliderRow
          label="Darks"
          min={-1}
          max={1}
          step={0.01}
          value={local.darks}
          defaultValue={defaultValues.darks}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ darks: v })}
          onCommitChange={() => finishCommit("shadows-highlights-darks", (s) => s.darks)}
        />
        <SliderRow
          label="Lights"
          min={-1}
          max={1}
          step={0.01}
          value={local.lights}
          defaultValue={defaultValues.lights}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ lights: v })}
          onCommitChange={() => finishCommit("shadows-highlights-lights", (s) => s.lights)}
        />
        <SliderRow
          label="Highlights"
          min={-1}
          max={1}
          step={0.01}
          value={local.highlights}
          defaultValue={defaultValues.highlights}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ highlights: v })}
          onCommitChange={() => finishCommit("shadows-highlights-highlights", (s) => s.highlights)}
        />
      </div>
    </ToggledPanel>
  )
}
