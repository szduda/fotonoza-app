import type { ReactElement, ReactNode } from "react"
import { chrome } from "./chromeTheme"

export const LeftSidebarLayout = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <div className={`flex w-full min-h-full h-auto min-w-0 flex-col ${chrome.panelBg} ${chrome.panelText}`}>
      {children}
    </div>
  )
}
