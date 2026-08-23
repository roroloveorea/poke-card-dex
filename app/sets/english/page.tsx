import Link from "next/link";
import { getCatalog } from "@/src/catalog/server-catalog";
import { SetGrid } from "@/app/_components/set-grid";
import { EmptyState } from "@/app/_components/empty-state";

export default async function EnglishSetsPage() {
  try {
    const sets = await getCatalog().listSets();
    return <section className="page-shell"><Link className="text-link" href="/sets">← Catalogs</Link><p className="eyebrow">English catalog</p><h1>Browse English sets.</h1><p className="intro">Newest releases appear first.</p>{sets.length === 0 ? <EmptyState>There are no English sets available right now.</EmptyState> : <SetGrid sets={sets} />}</section>;
  } catch {
    return <section className="error-shell" role="alert"><p className="eyebrow">Provider unavailable</p><h1>The English set directory is temporarily unavailable.</h1><div className="actions"><Link className="button" href="/sets/english">Try again</Link><Link className="text-link" href="/sets">Catalogs</Link></div></section>;
  }
}
