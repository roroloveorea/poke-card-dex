import Link from "next/link";
import type { CatalogSet } from "@/src/catalog/catalog";
import { languageName } from "@/src/catalog/language";

export function SetGrid({ sets }: { sets: CatalogSet[] }) {
  return <ul className="set-grid">{sets.map((set) => <li key={set.id}><Link className="set-tile" href={`/sets/${set.id}`}>{(set.logoUrl ?? set.symbolUrl) && <img src={set.logoUrl ?? set.symbolUrl} alt={`${set.name} ${set.logoUrl ? "logo" : "symbol"}`} />}<strong>{set.name}</strong><span>{languageName(set.language)} · {set.releaseDate}</span><span>{set.cardCount === undefined ? "Card count unavailable" : `${set.cardCount} cards`}</span></Link></li>)}</ul>;
}
