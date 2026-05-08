import en from "@/locales/en.json"
import pl from "@/locales/pl.json"
import type { HistoryEntry, HistoryStoredLabel, TranslationSchema } from "@/types/domain"

type Locale = "en" | "pl"

const messages: Record<Locale, TranslationSchema> = {
  en,
  pl,
}

export const t = (locale: Locale, key: (data: TranslationSchema) => string): string => {
  return key(messages[locale])
}

/** Resolve persisted history entry label (`HistoryEntry.label`) for display. */
export const historyOpLabel = (locale: Locale, storedLabel: string): string => {
  const ops = messages[locale].historyOps
  if (storedLabel in ops) return ops[storedLabel as HistoryStoredLabel]
  return storedLabel
}

/** Trim trailing zeros after fixed decimal formatting. */
const trimFixedZeros = (s: string): string => s.replace(/\.?0+$/, "")

/** Signed delta for history list (e.g. `+0.2`, `-1`). */
export const formatHistoryDelta = (delta: number): string => {
  if (!Number.isFinite(delta)) return ""
  const r = Math.round(delta * 1e6) / 1e6
  if (Object.is(r, -0) || r === 0) return "0"
  const mag = Math.abs(r)
  const body = trimFixedZeros(mag.toFixed(4))
  return r > 0 ? `+${body}` : `-${body}`
}

export const historyEntryDisplay = (locale: Locale, entry: HistoryEntry): string => {
  const base = historyOpLabel(locale, entry.label)
  if (entry.delta === undefined || !Number.isFinite(entry.delta)) return base
  if (Math.abs(entry.delta) < 1e-9) return base
  return `${base} ${formatHistoryDelta(entry.delta)}`
}
