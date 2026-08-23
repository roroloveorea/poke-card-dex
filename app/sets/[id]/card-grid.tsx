"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CardPrinting } from "@/src/catalog/catalog";
import { Price } from "@/app/_components/price";

const rarityWeight: Record<string, number> = { "Rare Secret": 0, "Rare Holo": 1, Rare: 2, Uncommon: 3, Common: 4 };
type SortOrder = "rarity" | "high" | "low";

export function CardGrid({ cards }: { cards: CardPrinting[] }) {
  const [name, setName] = useState("");
  const [raritiesSelected, setRaritiesSelected] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<SortOrder>("rarity");
  const rarities = [...new Set(cards.flatMap((card) => card.rarity ? [card.rarity] : []))].sort();
  const visible = useMemo(() => cards.filter((card) => card.name.toLocaleLowerCase().includes(name.trim().toLocaleLowerCase()) && (raritiesSelected.size === 0 || (card.rarity && raritiesSelected.has(card.rarity)))).sort((a, b) => {
    if (order === "high" || order === "low") {
      if (!a.summaryPrice && b.summaryPrice) return 1;
      if (a.summaryPrice && !b.summaryPrice) return -1;
      const difference = (a.summaryPrice?.amount ?? 0) - (b.summaryPrice?.amount ?? 0);
      if (difference) return order === "high" ? -difference : difference;
    }
    return (rarityWeight[a.rarity ?? ""] ?? 99) - (rarityWeight[b.rarity ?? ""] ?? 99) || a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
  }), [cards, name, raritiesSelected, order]);
  const reset = () => { setName(""); setRaritiesSelected(new Set()); };
  const toggleRarity = (value: string) => setRaritiesSelected((current) => { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); return next; });
  return <><div className="catalog-controls"><label>Filter by card name<input value={name} onChange={(event) => setName(event.target.value)} /></label><fieldset><legend>Rarities</legend>{rarities.map((value) => <label key={value}><input type="checkbox" checked={raritiesSelected.has(value)} onChange={() => toggleRarity(value)} /> {value}</label>)}</fieldset><label>Order<select value={order} onChange={(event) => setOrder(event.target.value as SortOrder)}><option value="rarity">Rarity first</option><option value="high">Price high to low</option><option value="low">Price low to high</option></select></label></div>{visible.length === 0 ? <div className="empty-state"><p>No card printings match those filters.</p><button className="button" onClick={reset}>Reset filters</button></div> : <ul className="card-grid">{visible.map((card) => <li key={card.id}><Link href={`/card-printings/${card.id}`} aria-label={`${card.name}, card ${card.collectorNumber}`} className="card-tile">{card.imageUrl ? <img src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} /> : <div className="image-placeholder">Image unavailable</div>}<strong>{card.name}</strong><span>{card.collectorNumber}{card.rarity ? ` · ${card.rarity}` : ""}</span><Price quote={card.summaryPrice} />{card.summaryPrice && <small>{card.summaryPrice.variant} · {card.summaryPrice.source} · {card.summaryPrice.observedAt}{card.summaryPrice.stale ? " · stale" : ""}</small>}</Link></li>)}</ul>}</>;
}
