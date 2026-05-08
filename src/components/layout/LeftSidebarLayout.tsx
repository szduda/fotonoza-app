import type { ReactElement, ReactNode } from "react"
import { chrome } from "./chromeTheme"

export const LeftSidebarLayout = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <div className={`flex w-full min-w-0 flex-col ${chrome.panelBg} ${chrome.panelText}`}>
      {children}
    </div>
  )
}
