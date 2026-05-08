import type { ReactElement } from "react"
import { useBasicGradeSliders } from "@/hooks/usePhotoGradeSliders"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { Photo } from "@/types/domain"
import { ToggledPanel } from "./generic/ToggledPanel"
import { SliderRow } from "./generic/SliderRow"

export const BasicEffects = ({ selectedPhoto }: { selectedPhoto: Photo }): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const { local, defaultValues, startGesture, finishCommit, onLive } =
    useBasicGradeSliders(selectedPhoto)

  return (
    <ToggledPanel id="basic-effects" label={t(locale, (m) => m.labels.basicEffects)} defaultOpen>
      <div className="space-y-1 px-1 pb-2 pt-3">
        <SliderRow
          label="Exposure"
          min={-3}
          max={3}
          step={0.05}
          value={local.exposure}
          defaultValue={defaultValues.exposure}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ exposure: v })}
          onCommitChange={() => finishCommit("basic-effects-exposure", (s) => s.exposure)}
        />
        <SliderRow
          label="Contrast"
          min={0.5}
          max={1.5}
          step={0.01}
          value={local.contrast}
          defaultValue={defaultValues.contrast}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ contrast: v })}
          onCommitChange={() => finishCommit("basic-effects-contrast", (s) => s.contrast)}
        />
        <SliderRow
          label="Contrast Balance"
          min={-1}
          max={1}
          step={0.01}
          value={local.contrastBalance}
          defaultValue={defaultValues.contrastBalance}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ contrastBalance: v })}
          onCommitChange={() =>
            finishCommit("basic-effects-contrast-balance", (s) => s.contrastBalance)
          }
        />
        <SliderRow
          label="Clarity"
          min={-1}
          max={1}
          step={0.01}
          value={local.clarity}
          defaultValue={defaultValues.clarity}
          onGestureStart={startGesture}
          onLiveChange={(v) => onLive({ clarity: v })}
          onCommitChange={() => finishCommit("basic-effects-clarity", (s) => s.clarity)}
        />
      </div>
    </ToggledPanel>
  )
}
