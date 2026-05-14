export const chrome = {
  appBg: "bg-black",
  appText: "text-neutral-400",
  panelBg: "bg-neutral-900",
  panelText: "text-neutral-400/95",
  mutedText: "text-neutral-600/95",
  faintText: "text-neutral-700",
  borderB: "border-b border-neutral-600/50",
  borderR: "border-r border-neutral-600/50",
  borderL: "border-l border-neutral-600/50",
  borderT: "border-t border-neutral-600/50",
  workingBg: "bg-neutral-800",
} as const

/** Closed control shell for panel/modal fields (no top margin). */
export const chromeFieldBase = `w-full rounded border border-neutral-600/50 bg-black/5 px-3 py-1.5 text-sm outline-none transition-colors hover:border-neutral-500/70 focus:border-yellow-400/30 placeholder:text-neutral-600/90 ${chrome.panelText}`
