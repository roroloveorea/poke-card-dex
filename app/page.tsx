import Link from "next/link";
import { SearchForm } from "@/app/_components/search-form";
import { getCatalog } from "@/src/catalog/server-catalog";
import type { CatalogSet } from "@/src/catalog/catalog";
import { SetGrid } from "@/app/_components/set-grid";

export default async function HomePage() {
  let latestSets: CatalogSet[] = [];
  let setsUnavailable = false;
  try { latestSets = (await getCatalog().listSets()).slice(0, 4); } catch { setsUnavailable = true; }
  return (
    <div className="home-shell">
      <section>
      <p className="eyebrow">Collector reference</p>
      <h1>Find the exact printing.</h1>
      <p className="intro">Search English Pokémon card printings by name and collector number, or browse the complete set catalog.</p>
      <SearchForm />
      </section>
      <section className="latest-sets"><div className="section-heading"><div><p className="eyebrow">Latest releases</p><h2>New in the catalog</h2></div><Link className="text-link" href="/sets">Browse all sets</Link></div>
      {setsUnavailable ? <div className="empty-state" role="alert">Latest sets are temporarily unavailable. <Link href="/">Try again</Link>.</div> : latestSets.length === 0 ? <p className="empty-state">No English sets are available right now.</p> : <SetGrid sets={latestSets} />}
      </section>
      <p className="disclaimer">PokeCardDex is an unofficial collector reference and is not affiliated with Nintendo, Creatures, Game Freak, or The Pokémon Company.</p>
    </div>
  );
}
