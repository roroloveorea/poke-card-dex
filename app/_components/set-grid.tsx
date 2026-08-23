import Link from "next/link";
import type { CatalogSet } from "@/src/catalog/catalog";

export function SetGrid({ sets }: { sets: CatalogSet[] }) {
  return <ul className="set-grid">{sets.map((set) => <li key={set.id}><Link className="set-tile" href={`/sets/${set.id}`}>{(set.logoUrl ?? set.symbolUrl) && <img src={set.logoUrl ?? set.symbolUrl} alt={`${set.name} ${set.logoUrl ? "logo" : "symbol"}`} />}<strong>{set.name}</strong><span>{set.releaseDate}</span>{set.cardCount !== undefined && <span>{set.cardCount} cards</span>}</Link></li>)}</ul>;
}
