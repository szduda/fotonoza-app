import type { ReactElement, ReactNode, RefObject } from "react"
import { useAppStore } from "@/store/appStore"
import { chrome } from "@/components/layout/chromeTheme"

type ToggledPanelProps = {
  id: string
  label: ReactNode
  children: ReactNode
  height?: number | string
  defaultOpen?: boolean
  contentRef?: RefObject<HTMLDivElement | null>
  className?: string
  contentPadding?: string
  toggleClassName?: string
}

export const ToggledPanel = ({
  id,
  label,
  children,
  height = "auto",
  defaultOpen = false,
  contentRef,
  className,
  contentPadding = "px-2",
  toggleClassName,
}: ToggledPanelProps): ReactElement => {
  const expandedState = useAppStore((s) => s.present.togglePanelExpanded)
  const setTogglePanelExpanded = useAppStore((s) => s.actions.setTogglePanelExpanded)
  const expanded = expandedState[id] ?? defaultOpen

  return (
    <div
      className={`relative flex shrink-0 flex-col overflow-hidden    ${className}`}
      style={
        expanded ? { height, minHeight: height, maxHeight: height } : { height: "min-content" }
      }
    >
      <button
        className={`bg-neutral-900 hover:text-neutral-500 text-left relative shrink-0 cursor-pointer px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide border-y ${expanded ? "border-neutral-600/20" : "border-b-neutral-600/10 border-t-transparent"} ${chrome.mutedText} ${toggleClassName}`}
        onClick={() => setTogglePanelExpanded(id, !expanded)}
      >
        {label}
        <div className="absolute right-0 top-0 bottom-0 flex h-full w-6 items-center justify-center text-[15px]">
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div
          ref={contentRef}
          className={`bg-neutral-600/10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${contentPadding}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
