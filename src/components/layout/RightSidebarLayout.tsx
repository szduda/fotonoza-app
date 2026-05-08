import type { ReactElement, ReactNode } from "react"
import { chrome } from "./chromeTheme"
import type { AppMode } from "@/types/domain"

export const RightSidebarLayout = ({
  children,
  mode,
}: {
  children: ReactNode
  mode: AppMode
}): ReactElement | null => {
  if (mode !== "edit") {
    return null
  }
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-y-auto ${chrome.panelBg} ${chrome.panelText}`}
    >
      {children}
    </div>
  )
}
