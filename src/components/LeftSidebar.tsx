import type { ReactElement } from "react";
import { useMemo } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";
import { HistoryPanel } from "./HistoryPanel";

export function LeftSidebar(): ReactElement {
  const { photos, locale } = useAppStore((s) => s.present);
  const selectedCount = useMemo(() => photos.filter((p) => p.selected).length, [photos]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className={`shrink-0 px-3 py-2.5 text-xs ${chrome.borderB} ${chrome.mutedText}`}>
        <span className={chrome.faintText}>{t(locale, (m) => m.labels.selectedCount)}</span>
        <span className={`ml-2 font-mono ${chrome.panelText}`}>{selectedCount}</span>
      </div>
      <div className="flex min-h-0 max-h-[min(40vh,15rem)] shrink-0 flex-col border-b border-neutral-600/50">
        <HistoryPanel />
      </div>
    </div>
  );
}
