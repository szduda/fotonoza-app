import type { ReactElement } from "react"

export const RedoIcon = ({ className = "h-4 w-4" }: { className?: string }): ReactElement => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{ transform: "translateY(-2px)" }}
    >
      <path d="m15 7 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 11h-7a6 6 0 1 0 0 12h1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
