import type { ReactNode } from "react"
import { chrome } from "./chromeTheme"
import type { AppMode } from "@/types/domain"

export const TimelineLayout = ({ children, mode }: { children: ReactNode; mode: AppMode }) => {
  if (mode !== "edit") {
    return null
  }
  return (
    <div
      className={`flex min-h-0 h-full w-full flex-col overflow-hidden ${chrome.panelBg} ${chrome.panelText}`}
    >
      {children}
    </div>
  )
}
