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
      className={`grid grid-cols-[5rem_minmax(0,1fr)_2rem] gap-2 text-xs items-center ${chrome.mutedText}`}
      onDoubleClick={() => onChange(defaultValue)}
    >
      <span className="text-[8px] font-medium uppercase">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 cursor-pointer accent-neutral-400 min-w-0 w-full"
      />
      <span className="tabular-nums text-[11px] text-neutral-400 text-right">{value.toFixed(decimals)}</span>
    </label>
  )
}
