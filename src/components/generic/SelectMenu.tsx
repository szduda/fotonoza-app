import clsx from "clsx"
import { useEffect, useId, useRef, useState, type ReactElement } from "react"
import { chrome, chromeFieldBase } from "@/components/layout/chromeTheme"

export interface SelectOpt {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  options: readonly SelectOpt[]
  onChange: (value: string) => void
  /** Narrow trigger (smaller text/padding) for tight layouts. */
  compact?: boolean
  className?: string
}

const listBox =
  "absolute left-0 right-0 z-[70] mt-1 max-h-60 overflow-auto rounded border border-neutral-600/50 bg-neutral-800 py-1 shadow-lg"

const optionRow = (selected: boolean): string =>
  clsx(
    chrome.panelText,
    "w-full px-3 py-1.5 text-left text-sm outline-none transition-colors duration-150",
    "hover:bg-neutral-500/15 focus-visible:bg-neutral-500/15",
    selected && "bg-yellow-400/10",
  )

export const SelectMenu = ({
  value,
  options,
  onChange,
  compact = false,
  className,
}: SelectMenuProps): ReactElement => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const current = options.find((o) => o.value === value) ?? options[0]

  const pick = (next: string): void => {
    setOpen(false)
    onChange(next)
  }

  useEffect(() => {
    setOpen(false)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={clsx("relative mt-1", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        className={clsx(
          chromeFieldBase,
          "flex cursor-pointer items-center justify-between gap-1.5 text-left",
          compact && "px-2 py-1 text-xs",
          open && "border-yellow-400/30",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0 truncate">{current?.label ?? value}</span>
        <Chevron
          className={clsx(
            "shrink-0 opacity-70 transition-transform",
            compact ? "h-3 w-3" : "h-4 w-4",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul id={listId} role="listbox" className={listBox}>
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={optionRow(opt.value === value)}
                onMouseDown={(e) => {
                  if (e.button !== 0) return
                  e.preventDefault()
                  pick(opt.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    pick(opt.value)
                  }
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

const Chevron = ({ className }: { className?: string }): ReactElement => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path d="M6 8l4 4 4-4z" />
  </svg>
)
