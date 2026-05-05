import type { ReactElement } from "react"

/** Base chevron points right; parent applies rotation for collapse direction. */
export const CollapseChevronIcon = ({ className }: { className: string }): ReactElement => {
  return (
    <svg
      className={`size-3.5 shrink-0 transition-transform duration-150 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <polyline
        points="7 5 13 10 7 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
