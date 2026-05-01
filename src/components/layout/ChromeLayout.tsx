import type { ReactElement, ReactNode } from "react";
import { chrome } from "./chromeTheme";
import { ChromeEdgePanel } from "./ChromeEdgePanel";
import { ChromeLayoutControllerProvider } from "./chromeLayoutController";

export function ChromeLayout({
  topBar,
  leftSidebar,
  workingArea,
  rightSidebar,
  timeline
}: {
  topBar: ReactNode;
  leftSidebar: ReactNode;
  workingArea: ReactNode;
  rightSidebar: ReactNode;
  timeline: ReactNode;
}): ReactElement {
  return (
    <ChromeLayoutControllerProvider>
      <div
        dir="ltr"
        className={`flex h-screen w-screen flex-col overflow-hidden ${chrome.appBg} ${chrome.appText}`}
      >
        <ChromeEdgePanel panel="topBar">{topBar}</ChromeEdgePanel>

        <div className="flex min-h-0 min-w-0 flex-1">
          <ChromeEdgePanel panel="leftSidebar">{leftSidebar}</ChromeEdgePanel>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{workingArea}</div>

          <ChromeEdgePanel panel="rightSidebar">{rightSidebar}</ChromeEdgePanel>
        </div>

        <ChromeEdgePanel panel="timeline">{timeline}</ChromeEdgePanel>
      </div>
    </ChromeLayoutControllerProvider>
  );
}
