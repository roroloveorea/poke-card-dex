import type { Language } from "@/src/catalog/catalog";
import { languageName } from "@/src/catalog/language";
import { PokeBall, type PokeBallVariant } from "./poke-ball";

const motifByLanguage: Record<Language, PokeBallVariant> = {
  en: "great",
  ja: "poke",
  ko: "ultra",
  "zh-cn": "master",
  "zh-tw": "master",
};

export function LanguageBadge({ language }: { language: Language }) {
  return <span className="language-badge" data-language={language}><PokeBall variant={motifByLanguage[language]} size="icon" /><span>{languageName(language)}</span></span>;
}
