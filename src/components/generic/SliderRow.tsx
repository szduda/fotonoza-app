import type { ReactElement } from "react"
import { chrome } from "@/components/layout/chromeTheme"

export const SliderRow = ({
  label,
  min,
  max,
  step,
  value,
  defaultValue,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  defaultValue: number
  onChange: (v: number) => void
}): ReactElement => {
  const decimals = step < 0.1 ? 2 : 1
  return (
    <label
      className={`grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] gap-2 text-xs items-center ${chrome.mutedText}`}
      onDoubleClick={() => onChange(defaultValue)}
    >
      <span className="text-[8px] font-medium uppercase text-right">{label}</span>
      <div className="flex min-h-0 min-w-0 w-full items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-dark"
        />
      </div>
      <span className="tabular-nums text-[11px] text-neutral-400 text-right">{value.toFixed(decimals)}</span>
    </label>
  )
}
