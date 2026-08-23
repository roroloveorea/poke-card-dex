"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Price } from "@/app/_components/price";
import type { CardPrinting } from "@/src/catalog/catalog";
import { EmptyState } from "./empty-state";
import { LanguageBadge } from "./language-badge";
import { CatalogImage } from "./catalog-image";

export function EasternCardGrid({ cards, catalogSlug }: { cards: CardPrinting[]; catalogSlug: string }) {
  const [name, setName] = useState("");
  const visible = useMemo(() => cards.filter((card) => card.name.toLocaleLowerCase().includes(name.trim().toLocaleLowerCase())), [cards, name]);
  return <><div className="catalog-controls page-controls"><label>Filter this page by card name<input value={name} onChange={(event) => setName(event.target.value)} /></label></div>{visible.length === 0 ? <EmptyState><p>No card printings match that name.</p><button className="button" onClick={() => setName("")}>Reset filter</button></EmptyState> : <ul className="card-grid">{visible.map((card) => <li key={card.id}><Link href={`/card-printings/eastern/${catalogSlug}/${card.id}`} aria-label={`${card.name}, card ${card.collectorNumber}`} className="card-tile"><CatalogImage src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} kind="card" /><LanguageBadge language={card.language} /><strong>{card.name}</strong><span>{card.collectorNumber}{card.rarity ? ` · ${card.rarity}` : ""}</span><Price quote={card.summaryPrice} /></Link></li>)}</ul>}</>;
}
