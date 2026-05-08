import { useEffect, useRef, type ReactElement } from "react"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import { chrome } from "@/components/layout/chromeTheme"
import { ToggledPanel } from "@/components/generic/ToggledPanel"

export const HistoryPanel = (): ReactElement => {
  const { history, locale, historyCursor } = useAppStore((state) => state.present)
  const jumpToHistory = useAppStore((state) => state.actions.jumpToHistory)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(history.length)

  useEffect(() => {
    const prevLen = prevLenRef.current
    const appended = history.length > prevLen
    if (appended && historyCursor === history.length - 1 && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
    prevLenRef.current = history.length
  }, [history.length, historyCursor])

  return (
    <ToggledPanel
      id="history"
      label={t(locale, (m) => m.labels.history)}
      height="200px"
      contentRef={contentRef}
      className="border-b border-neutral-600/50"
    >
      {history.map((entry, idx) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => jumpToHistory(idx)}
          className={`flex w-full items-center px-2 py-1 text-left text-[11px] transition-colors duration-150 ease-out ${
            idx === historyCursor
              ? `${chrome.panelBg} ${chrome.panelText} bg-neutral-950/80 font-bold`
              : idx > historyCursor
                ? `${chrome.faintText} opacity-70 hover:bg-neutral-800/70 cursor-pointer`
                : `${chrome.panelText} hover:bg-neutral-800/90 cursor-pointer`
          }`}
        >
          {entry.label}
        </button>
      ))}
    </ToggledPanel>
  )
}
