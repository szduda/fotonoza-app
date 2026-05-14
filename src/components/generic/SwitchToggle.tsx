import clsx from "clsx"
import type { ButtonHTMLAttributes, ReactElement } from "react"

const sizes = {
  md: {
    track: "h-5 w-10",
    thumb: "h-4 w-4",
    thumbOn: "translate-x-5",
    thumbOff: "translate-x-0.5",
  },
  sm: {
    track: "h-4 w-8",
    thumb: "h-3 w-3",
    thumbOn: "translate-x-[1.125rem]",
    thumbOff: "translate-x-0.5",
  },
} as const

export type SwitchToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "onClick"> & {
  enabled: boolean
  onChange: (enabled: boolean) => void
  size?: keyof typeof sizes
}

export const SwitchToggle = ({
  enabled,
  onChange,
  className,
  disabled,
  size = "md",
  ...rest
}: SwitchToggleProps): ReactElement => {
  const s = sizes[size]
  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      title={enabled ? "Disable" : "Enable"}
      onClick={() => onChange(!enabled)}
      className={clsx(
        "shrink-0 rounded-full border transition",
        s.track,
        enabled
          ? "border-neutral-500/80 bg-neutral-500/80"
          : "border-neutral-600/60 bg-neutral-700/40",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <span
        className={clsx(
          "block rounded-full bg-white/90 transition-transform",
          s.thumb,
          enabled ? s.thumbOn : s.thumbOff,
        )}
      />
    </button>
  )
}
