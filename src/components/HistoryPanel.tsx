import type { ReactElement } from "react";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";

export function HistoryPanel(): ReactElement {
  const { history, locale, historyCursor } = useAppStore((state) => state.present);
  const jumpToHistory = useAppStore((state) => state.actions.jumpToHistory);

  return (
    <aside className="flex h-full min-h-0 max-h-full flex-col">
      <h3 className={`mb-2 shrink-0 px-1 text-[10px] font-medium uppercase tracking-wide ${chrome.faintText}`}>
        {t(locale, (m) => m.labels.history)}
      </h3>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-0.5">
        {history.map((entry, idx) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => jumpToHistory(idx)}
            className={`w-full rounded border px-2 py-1 text-left text-[11px] leading-snug transition-colors ${
              idx === historyCursor
                ? `border-neutral-500/70 ${chrome.panelBg} ${chrome.panelText} ring-1 ring-neutral-500/40`
                : `border-neutral-700/60 bg-neutral-950/80 ${chrome.panelText} hover:border-neutral-500/50 hover:bg-neutral-900`
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
