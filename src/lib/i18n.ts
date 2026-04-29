import en from "../locales/en.json";
import pl from "../locales/pl.json";
import type { TranslationSchema } from "../types/domain";

type Locale = "en" | "pl";

const messages: Record<Locale, TranslationSchema> = {
  en,
  pl
};

export function t(locale: Locale, key: (data: TranslationSchema) => string): string {
  return key(messages[locale]);
}
