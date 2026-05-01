import type { ReactElement, ReactNode } from "react";
import { chrome } from "./chromeTheme";

export function WorkingAreaLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${chrome.workingBg} ${chrome.appText}`}
    >
      {children}
    </div>
  );
}
