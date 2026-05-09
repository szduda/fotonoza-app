import type { ChangeEvent, ReactElement } from "react"
import { t } from "@/lib/i18n"
import { chrome } from "@/components/layout/chromeTheme"
import { RatingStars } from "@/components/generic/RatingStars"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { useExifPrefetchForFilters } from "@/hooks/useExifPrefetchForFilters"
import { useAppStore } from "@/store/appStore"

const inputCls = `w-full rounded border border-neutral-600/50  px-2 py-2 h-6 text-[11px] outline-none focus-within:border-neutral-500/90 ${chrome.panelText}`

const FilterField = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}): ReactElement => (
  <label className="flex flex gap-0.5 px-2 py-1 items-center">
    <span
      className={`text-[8px] w-20 font-medium uppercase ${value ? "text-yellow-500/70" : chrome.mutedText}`}
    >
      {label}
    </span>
    <input
      type="search"
      autoComplete="off"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={inputCls}
    />
  </label>
)

export const FilterPanel = (): ReactElement => {
  const { locale, photoFilters } = useAppStore((s) => s.present)
  const setPhotoFilter = useAppStore((s) => s.actions.setPhotoFilter)

  useExifPrefetchForFilters()

  return (
    <ToggledPanel id="filter" label={t(locale, (m) => m.labels.filter)}>
      <div className="flex flex-col py-2">
        <FilterField
          label={t(locale, (m) => m.labels.filterFileName)}
          value={photoFilters.fileName}
          onChange={(fileName) => setPhotoFilter({ fileName })}
        />
        <FilterField
          label={t(locale, (m) => m.labels.filterDateTaken)}
          value={photoFilters.dateTaken}
          onChange={(dateTaken) => setPhotoFilter({ dateTaken })}
        />
        <FilterField
          label={t(locale, (m) => m.labels.filterExposure)}
          value={photoFilters.exposure}
          onChange={(exposure) => setPhotoFilter({ exposure })}
        />
        <FilterField
          label={t(locale, (m) => m.labels.filterCamera)}
          value={photoFilters.camera}
          onChange={(camera) => setPhotoFilter({ camera })}
        />
        <FilterField
          label={t(locale, (m) => m.labels.filterLens)}
          value={photoFilters.lens}
          onChange={(lens) => setPhotoFilter({ lens })}
        />

        <label className="flex flex-row items-center gap-0.5 px-2">
          <span
            className={`w-20 shrink-0 text-[8px] font-medium uppercase ${photoFilters.ratingAtLeast ? "text-yellow-500/70" : chrome.mutedText}`}
          >
            {t(locale, (m) => m.labels.filterRatingMin)}
          </span>
          <div className="min-w-0 flex-1 pr-6 opacity-50">
            <RatingStars
              rating={photoFilters.ratingAtLeast}
              onPick={(stars) =>
                setPhotoFilter({
                  ratingAtLeast: stars === photoFilters.ratingAtLeast && stars > 0 ? 0 : stars,
                })
              }
            />
          </div>
        </label>
      </div>
    </ToggledPanel>
  )
}
