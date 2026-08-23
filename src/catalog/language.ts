import type { Language } from "./catalog";

export function languageName(language: Language) {
  return language === "ja" ? "Japanese" : "English";
}
