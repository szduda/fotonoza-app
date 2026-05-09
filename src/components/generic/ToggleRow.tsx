import type { ReactElement, ReactNode } from "react"
import { chrome } from "@/components/layout/chromeTheme"

type ToggleRowProps = {
  label: ReactNode
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

export const ToggleRow = ({ label, enabled, onChange, className }: ToggleRowProps): ReactElement => {
  return (
    <div className={`flex items-center justify-between gap-2 text-xs ${chrome.panelText} ${className}`}>
      <span className="text-[8.5px] font-medium uppercase flex-1">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`h-5 w-10 rounded-full border transition ${
          enabled
            ? "border-neutral-500/80 bg-neutral-500/80"
            : "border-neutral-600/60 bg-neutral-700/40"
        }`}
        title={enabled ? "Disable" : "Enable"}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white/90 transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-right tabular-nums text-[10px] text-neutral-400">{enabled ? "ON" : "OFF"}</span>
    </div>
  )
}
