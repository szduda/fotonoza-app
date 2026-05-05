import type { ReactElement } from "react"

export const DoneIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }): ReactElement => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
