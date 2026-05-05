import type { ReactElement, ReactNode, RefObject } from "react"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"

type ToggledPanelProps = {
  id: string
  label: ReactNode
  children: ReactNode
  height: number | string
  defaultOpen?: boolean
  contentRef?: RefObject<HTMLDivElement | null>
  className?: string
}

export const ToggledPanel = ({
  id,
  label,
  children,
  height,
  defaultOpen = false,
  contentRef,
  className,
}: ToggledPanelProps): ReactElement => {
  const expandedState = useAppStore((s) => s.present.togglePanelExpanded)
  const setTogglePanelExpanded = useAppStore((s) => s.actions.setTogglePanelExpanded)
  const expanded = expandedState[id] ?? defaultOpen

  return (
    <div
      className={`relative flex shrink-0 flex-col overflow-hidden ${className}`}
      style={
        expanded ? { height, minHeight: height, maxHeight: height } : { height: "min-content" }
      }
    >
      <button
        className={`hover:text-neutral-500 text-left relative shrink-0 cursor-pointer px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${chrome.faintText}`}
        onClick={() => setTogglePanelExpanded(id, !expanded)}
      >
        {label}
        <div className=" absolute right-0 top-0 bottom-0 flex h-full w-4 items-center justify-center text-[15px]">
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      )}
    </div>
  )
}
