import type { EasternLanguage } from "./tcgdex-catalog";

export type EasternCatalogSlug = "japanese" | "korean" | "chinese";

export function easternLanguages(slug: string): EasternLanguage[] {
  if (slug === "japanese") return ["ja"];
  if (slug === "korean") return ["ko"];
  if (slug === "chinese") return ["zh-cn", "zh-tw"];
  return [];
}

export function easternCatalogName(slug: EasternCatalogSlug) {
  if (slug === "japanese") return "Japanese";
  if (slug === "korean") return "Korean";
  return "Chinese";
}

export function languageFromCatalogId(id: string): EasternLanguage | undefined {
  return (["zh-cn", "zh-tw", "ja", "ko"] as const).find((language) => id.startsWith(`tdx-${language}-`));
}
