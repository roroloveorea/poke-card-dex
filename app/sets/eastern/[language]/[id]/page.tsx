import Link from "next/link";
import { notFound } from "next/navigation";
import { EasternCardGrid } from "@/app/_components/eastern-card-grid";
import { automaticEnglishSetName } from "@/src/catalog/eastern-set-english-names";
import { easternCatalogName, easternLanguages, languageFromCatalogId, type EasternCatalogSlug } from "@/src/catalog/eastern-languages";
import { languageName } from "@/src/catalog/language";
import { getEasternCatalog } from "@/src/catalog/server-catalog";
import { EmptyState } from "@/app/_components/empty-state";

export default async function EasternSetPage({ params, searchParams }: { params: Promise<{ language: string; id: string }>; searchParams: Promise<{ page?: string | string[] }> }) {
  const { language: slug, id } = await params;
  const allowed = easternLanguages(slug);
  const cardLanguage = languageFromCatalogId(id);
  if (!cardLanguage || !allowed.includes(cardLanguage)) notFound();
  const rawPage = (await searchParams).page;
  const page = Math.max(1, Number.parseInt(Array.isArray(rawPage) ? rawPage[0] : rawPage ?? "1", 10) || 1);
  const catalogName = easternCatalogName(slug as EasternCatalogSlug);
  try {
    const catalog = getEasternCatalog(cardLanguage);
    const [set, cardPage] = await Promise.all([catalog.getSet(id), catalog.getCardPrintingPage(id, page, 24)]);
    const englishName = automaticEnglishSetName(set);
    const totalPages = Math.max(1, Math.ceil(cardPage.totalCount / cardPage.pageSize));
    return <section className="page-shell"><Link className="text-link" href={`/sets/eastern/${slug}`}>← {catalogName} sets</Link><p className="eyebrow">{languageName(set.language)} set · {set.releaseDate}</p><h1>{set.name}</h1>{englishName && <p className="intro">English (automatic): {englishName}</p>}<p className="page-status">Page {cardPage.page} of {totalPages} · {cardPage.totalCount} card printings</p>{cardPage.items.length ? <><EasternCardGrid cards={cardPage.items} catalogSlug={slug} /><nav className="pagination" aria-label="Card pages">{page > 1 && <Link className="text-link" href={`/sets/eastern/${slug}/${id}?page=${page - 1}`}>← Previous</Link>}{page < totalPages && <Link className="button" href={`/sets/eastern/${slug}/${id}?page=${page + 1}`}>Next →</Link>}</nav></> : <EmptyState>No card printings are available for this set.</EmptyState>}</section>;
  } catch {
    return <section className="error-shell" role="alert"><h1>This Eastern set is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/sets/eastern/${slug}/${id}`}>Try again</Link><Link className="text-link" href={`/sets/eastern/${slug}`}>All {catalogName} sets</Link></div></section>;
  }
}
