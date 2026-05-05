import type { ReactElement, ReactNode } from "react"
import { chrome } from "./chromeTheme"

export const LeftSidebarLayout = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-y-auto ${chrome.panelBg} ${chrome.panelText}`}
    >
      {children}
    </div>
  )
}
