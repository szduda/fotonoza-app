import { useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactElement } from "react"
import { chrome } from "@/components/layout/chromeTheme"

const STEP_KEYS: Record<string, true> = {
  ArrowLeft: true,
  ArrowRight: true,
  Home: true,
  End: true,
  PageUp: true,
  PageDown: true,
}

export const SliderRow = ({
  label,
  min,
  max,
  step,
  value,
  defaultValue,
  onChange,
  onGestureStart,
  onLiveChange,
  onCommitChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  defaultValue: number
  onChange?: (v: number) => void
  /** Snapshot baseline + pause undo tracking before first live delta (pointer / keyboard). */
  onGestureStart?: () => void
  onLiveChange?: (v: number) => void
  /** Native `change`: pointer release on range → one commit. */
  onCommitChange?: (v: number) => void
}): ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null)
  const commitRef = useRef(onCommitChange)
  commitRef.current = onCommitChange

  const decimals = step < 0.1 ? 2 : 1
  const split = onLiveChange != null && onCommitChange != null
  if (!split && onChange == null) {
    throw new Error("SliderRow: pass `onChange` or both `onLiveChange` and `onCommitChange`")
  }

  useEffect(() => {
    if (!split) return
    const el = inputRef.current
    if (!el) return
    const onNativeChange = (): void => {
      commitRef.current?.(Number(el.value))
    }
    el.addEventListener("change", onNativeChange)
    return () => el.removeEventListener("change", onNativeChange)
  }, [split])

  const handleDblClick = (): void => {
    if (split) {
      onGestureStart?.()
      onLiveChange(defaultValue)
      onCommitChange(defaultValue)
    } else {
      onChange?.(defaultValue)
    }
  }

  const inputHandlers = split
    ? {
        onPointerDownCapture: () => onGestureStart?.(),
        onKeyDownCapture: (e: KeyboardEvent<HTMLInputElement>) => {
          if (STEP_KEYS[e.key]) onGestureStart?.()
        },
        onInput: (e: FormEvent<HTMLInputElement>) => onLiveChange(Number(e.currentTarget.value)),
      }
    : {
        onChange: (e: FormEvent<HTMLInputElement>) => onChange?.(Number(e.currentTarget.value)),
      }

  return (
    <label
      className={`grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] gap-2 text-xs items-center ${chrome.mutedText}`}
      onDoubleClick={handleDblClick}
    >
      <span className="text-[8px] font-medium uppercase text-right">{label}</span>
      <div className="flex min-h-0 min-w-0 w-full items-center">
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          {...inputHandlers}
          className="slider-dark"
        />
      </div>
      <span className="tabular-nums text-[11px] text-neutral-400 text-right">{value.toFixed(decimals)}</span>
    </label>
  )
}
