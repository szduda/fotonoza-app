import type { ReactElement, ReactNode } from "react";
import { chrome } from "./chromeTheme";

export function TopBarLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className={`flex min-h-0 w-full shrink-0 items-center ${chrome.panelBg} ${chrome.panelText}`}>
      {children}
    </div>
  );
}
