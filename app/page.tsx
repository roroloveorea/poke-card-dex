import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
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
      <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow">Collector reference</p>
        <h1>Find the exact printing.</h1>
        <p className="intro">Search exact Pokémon card printings, or browse English and Eastern set catalogs by region and language.</p>
        <SearchForm />
      </div>
      <div className="hero-artwork" aria-hidden="true">
        <Image src="/artwork/catalog-hero-pikachu.webp" alt="" width={1248} height={832} sizes="(max-width: 720px) 100vw, 48vw" priority />
      </div>
      </section>
      <section className="latest-sets"><div className="section-heading"><div><p className="eyebrow">Latest releases</p><h2>New in the catalog</h2></div><Link className="text-link" href="/sets">Browse all sets</Link></div>
      {setsUnavailable ? <EmptyState role="alert">Latest sets are temporarily unavailable. <Link href="/">Try again</Link>.</EmptyState> : latestSets.length === 0 ? <EmptyState>No sets are available right now.</EmptyState> : <SetGrid sets={latestSets} />}
      </section>
      <p className="disclaimer">PokeCardDex is an unofficial collector reference and is not affiliated with Nintendo, Creatures, Game Freak, or The Pokémon Company.</p>
    </div>
  );
}
