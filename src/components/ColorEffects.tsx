import type { ReactElement } from "react"
import { useColorGradeSliders } from "@/hooks/usePhotoGradeSliders"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { Photo } from "@/types/domain"
import { SliderRow } from "./generic/SliderRow"
import { ToggledPanel } from "./generic/ToggledPanel"

export const ColorEffects = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const { local, defaultValues, startGesture, finishCommit, onLive } =
    useColorGradeSliders(selectedPhoto)

  return (
    <ToggledPanel id="color-effects" label={t(locale, (m) => m.labels.colorEffects)}>
      <div className="space-y-1 px-1 py-2">
        <SliderRow
          label="Temperature"
          min={-1}
          max={1}
          step={0.01}
          value={local.temperature}
          defaultValue={defaultValues.temperature}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ temperature: v })}
          onCommitChange={() =>
            finishCommit("color-effects-temperature", (s) => s.temperature)
          }
        />
        <SliderRow
          label="Tint"
          min={-1}
          max={1}
          step={0.01}
          value={local.tint}
          defaultValue={defaultValues.tint}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ tint: v })}
          onCommitChange={() => finishCommit("color-effects-tint", (s) => s.tint)}
        />
        <SliderRow
          label="Vibrance"
          min={-1}
          max={1}
          step={0.01}
          value={local.vibrance}
          defaultValue={defaultValues.vibrance}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ vibrance: v })}
          onCommitChange={() => finishCommit("color-effects-vibrance", (s) => s.vibrance)}
        />
        <SliderRow
          label="Saturation"
          min={0}
          max={2}
          step={0.01}
          value={local.saturation}
          defaultValue={defaultValues.saturation}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ saturation: v })}
          onCommitChange={() => finishCommit("color-effects-saturation", (s) => s.saturation)}
        />
      </div>
    </ToggledPanel>
  )
}
