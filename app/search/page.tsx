import Link from "next/link";
import { SearchForm } from "@/app/_components/search-form";
import { Price } from "@/app/_components/price";
import { getCatalog } from "@/src/catalog/server-catalog";
import type { CardPrinting } from "@/src/catalog/catalog";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  let cards: CardPrinting[] = [];
  if (query) {
    try { cards = await getCatalog().searchCardPrintings(query); } catch { return <section className="page-shell"><SearchForm query={query} /><div className="empty-state" role="alert"><h1>Search is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/search?q=${encodeURIComponent(query)}`}>Try again</Link><Link className="text-link" href="/">Back to Home</Link></div></div></section>; }
  }
  return <section className="page-shell"><SearchForm query={query} />{!query ? <p className="empty-state">Enter a card name to search the English catalog.</p> : <><h1>Results for “{query}”</h1><p>{cards.length} {cards.length === 1 ? "printing" : "printings"}</p>{cards.length === 0 ? <p className="empty-state">No card printings found. Try a partial or complete card name.</p> : <ul className="search-results">{cards.map((card) => <li key={card.id}><Link href={`/card-printings/${card.id}`} className="result-tile">{card.imageUrl && <img src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} />}<span><strong>{card.name}</strong><small>English · {card.set.name} · {card.collectorNumber}</small><Price quote={card.summaryPrice} /></span></Link></li>)}</ul>}</>}</section>;
}
