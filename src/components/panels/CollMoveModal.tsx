import type { ReactElement, RefObject } from "react"
import { Button } from "@/components/generic/Button"
import { chrome } from "@/components/layout/chromeTheme"

export const CollMoveModal = ({
  modalRef,
  pos,
  askText,
  yesLabel,
  noLabel,
  onYes,
  onNo,
}: {
  modalRef: RefObject<HTMLDivElement | null>
  pos: { top: number; left: number } | null
  askText: string
  yesLabel: string
  noLabel: string
  onYes: () => void
  onNo: () => void
}): ReactElement | null => {
  if (!pos) return null
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className={`fixed z-[100] w-[min(280px,calc(100vw-16px))] rounded border border-neutral-600/60 bg-neutral-900/98 p-3 shadow-xl backdrop-blur-sm ${chrome.panelText}`}
      style={{ top: pos.top, left: pos.left }}
    >
      <p className="mb-3 text-[11px] leading-snug">{askText}</p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outlined"
          size="xs"
          className="border-neutral-500 bg-neutral-800/50 font-normal normal-case"
          onClick={onYes}
        >
          {yesLabel}
        </Button>
        <Button variant="outlined" size="xs" className="font-normal normal-case" onClick={onNo}>
          {noLabel}
        </Button>
      </div>
    </div>
  )
}
