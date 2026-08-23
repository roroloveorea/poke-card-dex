import Link from "next/link";
import type { CatalogSet } from "@/src/catalog/catalog";
import { automaticEnglishSetName } from "@/src/catalog/eastern-set-english-names";
import { LanguageBadge } from "./language-badge";
import { CatalogImage } from "./catalog-image";

export function SetGrid({ sets, hrefForSet = (set) => `/sets/${set.id}` }: { sets: CatalogSet[]; hrefForSet?: (set: CatalogSet) => string }) {
  return <ul className="set-grid">{sets.map((set) => {
    const englishName = automaticEnglishSetName(set);
    return <li key={set.id}><Link className="set-tile" href={hrefForSet(set)}><CatalogImage src={set.logoUrl ?? set.symbolUrl} alt={`${set.name} ${set.logoUrl ? "logo" : "symbol"}`} kind="set" /><LanguageBadge language={set.language} /><strong>{set.name}</strong>{englishName && <span>English (automatic): {englishName}</span>}<span>{set.releaseDate || "Release date unavailable"}</span><span>{set.cardCount === undefined ? "Card count unavailable" : `${set.cardCount} cards`}</span></Link></li>;
  })}</ul>;
}
