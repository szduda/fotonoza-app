import clsx from "clsx"
import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { chrome } from "@/components/layout/chromeTheme"

/** Visual styles; extend with new keys as needed. */
export const buttonVariants = {
  outlined: clsx(
    chrome.panelBg,
    chrome.panelText,
    "border border-neutral-600/50",
    "enabled:hover:bg-neutral-400/35",
  ),
  subtle: clsx(
    chrome.panelBg,
    chrome.mutedText,
    "border border-transparent",
    "enabled:hover:bg-neutral-400/10",
    "disabled:opacity-50 disabled:text-neutral-600",
  ),
  text: clsx(
    chrome.panelBg,
    chrome.panelText,
    "border border-transparent",
    "enabled:hover:text-neutral-300",
  ),
  subtleText: clsx(
    chrome.panelBg,
    chrome.mutedText,
    "border border-transparent",
    "enabled:hover:text-neutral-500",
  ),
} as const

/** Text / default padding; pair with `iconOnly` for square icon hits. */
export const buttonSizes = {
  xs: "text-[11px] px-2 py-0.5 min-h-[26px] gap-1",
  sm: "text-xs px-2 py-1 min-h-7 gap-1",
  md: "text-sm px-2 min-h-8 gap-1.5",
  lg: "text-base px-3 py-2 min-h-10 gap-2",
  xl: "text-lg px-4 py-2.5 min-h-11 gap-2",
} as const

export const buttonIconOnlySizes = {
  xs: "h-6 w-6 min-h-6 min-w-6 shrink-0 p-0",
  sm: "h-7 w-7 min-h-7 min-w-7 shrink-0 p-0",
  md: "h-8 w-8 min-h-8 min-w-8 shrink-0 p-0",
  lg: "h-10 w-10 min-h-10 min-w-10 shrink-0 p-0",
  xl: "h-11 w-11 min-h-11 min-w-11 shrink-0 p-0",
} as const

const base =
  "inline-flex items-center justify-center rounded font-medium transition-colors duration-150 ease-out cursor-pointer disabled:text-inherit disabled:pointer-events-none"

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  /** Square hit target; omits text padding. */
  iconOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outlined", size = "md", iconOnly = false, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        base,
        buttonVariants[variant],
        iconOnly ? buttonIconOnlySizes[size] : buttonSizes[size],
        className,
      )}
      {...rest}
    />
  )
})
