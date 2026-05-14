import clsx from "clsx"
import type { ReactElement, ReactNode } from "react"
import { chrome } from "@/components/layout/chromeTheme"
import { SwitchToggle } from "./SwitchToggle"

type ToggleRowProps = {
  label: ReactNode
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

export const ToggleRow = ({ label, enabled, onChange, className }: ToggleRowProps): ReactElement => {
  return (
    <div className={clsx("flex items-center justify-between gap-2 text-xs", chrome.panelText, className)}>
      <span className="flex-1 text-[8.5px] font-medium uppercase">{label}</span>
      <SwitchToggle enabled={enabled} onChange={onChange} />
      <span className="text-right tabular-nums text-[10px] text-neutral-400">{enabled ? "ON" : "OFF"}</span>
    </div>
  )
}
