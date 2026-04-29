import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";

export function HistoryPanel(): JSX.Element {
  const { history, locale, historyCursor } = useAppStore((state) => state.present);
  const jumpToHistory = useAppStore((state) => state.actions.jumpToHistory);

  return (
    <aside className="w-72 border-l border-zinc-800 bg-zinc-900 p-3">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {t(locale, (m) => m.labels.history)}
      </h3>
      <div className="space-y-1 overflow-auto pr-1">
        {history.map((entry, idx) => (
          <button
            key={entry.id}
            onClick={() => jumpToHistory(idx)}
            className={`w-full rounded px-2 py-1 text-left text-xs ${
              idx === historyCursor ? "bg-sky-700 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
