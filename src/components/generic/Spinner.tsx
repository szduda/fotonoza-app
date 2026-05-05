import type { ReactElement } from "react"

type SpinnerProps = {
  className?: string
  sizeClassName?: string
}

export const Spinner = ({
  className = "pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center",
  sizeClassName = "h-4 w-4",
}: SpinnerProps): ReactElement => {
  return (
    <div className={className} aria-hidden>
      <span
        className={`${sizeClassName} animate-spin rounded-full border-2 border-white/70 border-t-transparent`}
      />
    </div>
  )
}
