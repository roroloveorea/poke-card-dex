import Link from "next/link";
import { CatalogImage } from "@/app/_components/catalog-image";
import { EmptyState } from "@/app/_components/empty-state";
import { LanguageBadge } from "@/app/_components/language-badge";
import { Price } from "@/app/_components/price";
import { SearchForm } from "@/app/_components/search-form";
import type { CardPrinting } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import { normalizeSearchQuery } from "@/src/catalog/search-query";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const query = normalizeSearchQuery(Array.isArray(raw) ? raw[0] : raw ?? "");
  let cards: CardPrinting[] = [];

  if (query) {
    try {
      cards = await getCatalog().searchCardPrintings(query);
    } catch {
      return <section className="page-shell"><SearchForm query={query} /><EmptyState role="alert"><h1>Search is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/search?q=${encodeURIComponent(query)}`}>Try again</Link><Link className="text-link" href="/">Back to Home</Link></div></EmptyState></section>;
    }
  }

  return (
    <section className="page-shell">
      <SearchForm query={query} />
      {!query ? <EmptyState>Enter a card name or collector number, or search by set name.</EmptyState> : <>
        <h1>Results for “{query}”</h1>
        <p>{cards.length} {cards.length === 1 ? "printing" : "printings"}</p>
        {cards.length === 0 ? <EmptyState>No card printings found. Try a card name, collector number, or set.</EmptyState> : <ul className="search-results">{cards.map((card) => <li key={card.id}><Link href={`/card-printings/${card.id}`} className="result-tile"><CatalogImage src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} kind="card" /><span><LanguageBadge language={card.language} /><strong>{card.name}</strong><small>{card.set.name} · {card.collectorNumber}</small><Price quote={card.summaryPrice} /></span></Link></li>)}</ul>}
      </>}
    </section>
  );
}
