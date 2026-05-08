import type { ChangeEvent, ReactElement } from "react"
import { t } from "@/lib/i18n"
import { chrome } from "@/components/layout/chromeTheme"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { useExifPrefetchForFilters } from "@/hooks/useExifPrefetchForFilters"
import { useAppStore } from "@/store/appStore"

const inputCls = `w-full rounded border border-neutral-600/50 bg-neutral-900/40 px-2 py-1 text-[11px] outline-none focus:border-neutral-500 ${chrome.panelText}`

const FilterField = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}): ReactElement => (
  <label className="flex flex-col gap-0.5 px-2 py-1">
    <span className={`text-[8px] font-medium uppercase ${chrome.faintText}`}>{label}</span>
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
    <ToggledPanel id="filter" label={t(locale, (m) => m.labels.filter)} className="border-b border-neutral-600/50">
      <div className="flex flex-col pb-2">
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

        <label className="flex flex-col gap-0.5 px-2 py-1">
          <span className={`text-[8px] font-medium uppercase ${chrome.faintText}`}>
            {t(locale, (m) => m.labels.filterRatingMin)}
          </span>
          <select
            value={photoFilters.ratingAtLeast}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPhotoFilter({ ratingAtLeast: Number(e.target.value) })
            }
            className={inputCls}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0
                  ? t(locale, (m) => m.labels.filterRatingAny)
                  : `${n}+`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </ToggledPanel>
  )
}
