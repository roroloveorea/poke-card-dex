import Link from "next/link";
import { cookies } from "next/headers";
import { getCatalog } from "@/src/catalog/server-catalog";
import { CardGrid } from "./card-grid";
import type { PriceOrder } from "@/src/catalog/catalog";
import { SetControls } from "./set-controls";
import { languageName } from "@/src/catalog/language";
import { EmptyState } from "@/app/_components/empty-state";

export default async function SetPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[]; rarity?: string | string[]; order?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const rawPage = query.page;
  const page = Math.max(1, Number.parseInt(Array.isArray(rawPage) ? rawPage[0] : rawPage ?? "1", 10) || 1);
  const rawRarity = query.rarity;
  const rarity = (Array.isArray(rawRarity) ? rawRarity[0] : rawRarity ?? "").trim();
  const rawOrder = query.order;
  const queryOrder = Array.isArray(rawOrder) ? rawOrder[0] : rawOrder;
  const savedOrder = (await cookies()).get("catalog-order")?.value;
  const requestedOrder = queryOrder ?? savedOrder ?? "collector";
  const order: PriceOrder | undefined = requestedOrder === "price-high" || requestedOrder === "price-low" ? requestedOrder : undefined;
  try {
    const catalog = getCatalog();
    const [set, rarities, cardPage] = await Promise.all([catalog.getSet(id), catalog.listSetRarities(id), catalog.getCardPrintingPage(id, page, 12, rarity || undefined, order)]);
    const totalPages = Math.max(1, Math.ceil(cardPage.totalCount / cardPage.pageSize));
    const rarityParam = rarity ? `&rarity=${encodeURIComponent(rarity)}` : "";
    const orderParam = order ? `&order=${order}` : "";
    const pageHref = (targetPage: number) => `/sets/${id}?page=${targetPage}${rarityParam}${orderParam}`;
    return <section className="page-shell"><Link className="text-link" href="/sets">← All sets</Link><p className="eyebrow">{languageName(set.language)} set · {set.releaseDate}</p><h1>{set.name}</h1><SetControls action={`/sets/${id}`} rarities={rarities} rarity={rarity} order={requestedOrder} />{order && cardPage.quotedCount === 0 && <EmptyState role="status">The provider has no market prices for this set yet, so price ordering cannot change the results.</EmptyState>}<p className="page-status">Page {cardPage.page} of {totalPages} · {cardPage.totalCount} card printings{rarity ? ` · ${rarity}` : ""}</p>{cardPage.items.length ? <><CardGrid cards={cardPage.items} /><nav className="pagination" aria-label="Card pages">{cardPage.page > 1 && <Link className="text-link" href={pageHref(cardPage.page - 1)}>← Previous</Link>}<div className="page-numbers">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => pageNumber === cardPage.page ? <span className="current-page" aria-current="page" key={pageNumber}>{pageNumber}</span> : <Link key={pageNumber} href={pageHref(pageNumber)}>{pageNumber}</Link>)}</div>{cardPage.page < totalPages && <Link className="button" href={pageHref(cardPage.page + 1)}>Next →</Link>}</nav></> : <EmptyState>No card printings are available for these filters.</EmptyState>}</section>;
  } catch { return <section className="error-shell" role="alert"><h1>This set is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/sets/${id}${page > 1 ? `?page=${page}` : ""}`}>Try again</Link><Link className="text-link" href="/sets">All sets</Link></div></section>; }
}
