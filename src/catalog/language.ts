import type { Language } from "./catalog";

export function languageName(language: Language) {
  if (language === "ja") return "Japanese";
  if (language === "ko") return "Korean";
  if (language === "zh-cn") return "Simplified Chinese";
  if (language === "zh-tw") return "Traditional Chinese";
  return "English";
}
