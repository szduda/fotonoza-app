import type { ReactElement, ReactNode } from "react"
import { chrome } from "./chromeTheme"

export const TimelineLayout = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <div
      className={`flex min-h-0 h-full w-full flex-col overflow-hidden ${chrome.panelBg} ${chrome.panelText}`}
    >
      {children}
    </div>
  )
}
