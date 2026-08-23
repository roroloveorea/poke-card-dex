"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CardPrinting } from "@/src/catalog/catalog";
import { Price } from "@/app/_components/price";

export function CardGrid({ cards }: { cards: CardPrinting[] }) {
  const [name, setName] = useState("");
  const visible = useMemo(() => cards.filter((card) => card.name.toLocaleLowerCase().includes(name.trim().toLocaleLowerCase())), [cards, name]);
  const reset = () => setName("");
  return <><p className="filter-note">Name filtering applies to this page.</p><div className="catalog-controls page-controls"><label>Filter this page by card name<input value={name} onChange={(event) => setName(event.target.value)} /></label></div>{visible.length === 0 ? <div className="empty-state"><p>No card printings match that name.</p><button className="button" onClick={reset}>Reset filter</button></div> : <ul className="card-grid">{visible.map((card) => <li key={card.id}><Link href={`/card-printings/${card.id}`} aria-label={`${card.name}, card ${card.collectorNumber}`} className="card-tile">{card.imageUrl ? <img src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} /> : <div className="image-placeholder">Image unavailable</div>}<strong>{card.name}</strong><span>{card.collectorNumber}{card.rarity ? ` · ${card.rarity}` : ""}</span><Price quote={card.summaryPrice} />{card.summaryPrice && <small>{card.summaryPrice.variant} · {card.summaryPrice.source} · {card.summaryPrice.observedAt}{card.summaryPrice.stale ? " · stale" : ""}</small>}</Link></li>)}</ul>}</>;
}
