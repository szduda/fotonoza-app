import type { ReactElement, ReactNode } from "react";
import { chrome } from "./chromeTheme";

export function TimelineLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className={`flex min-h-0 w-full flex-col overflow-x-auto overflow-y-hidden ${chrome.panelBg} ${chrome.panelText}`}
    >
      {children}
    </div>
  );
}
