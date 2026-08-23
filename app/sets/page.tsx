import Link from "next/link";
import { getCatalog } from "@/src/catalog/server-catalog";
import { SetGrid } from "@/app/_components/set-grid";

export default async function SetsPage() {
  let sets;
  try { sets = await getCatalog().listSets(); } catch {
    return <section className="error-shell" role="alert"><p className="eyebrow">Provider unavailable</p><h1>The set directory is temporarily unavailable.</h1><div className="actions"><Link className="button" href="/sets">Try again</Link><Link className="text-link" href="/">Back to Home</Link></div></section>;
  }
  return <section className="page-shell"><p className="eyebrow">English catalog</p><h1>Browse every set.</h1><p className="intro">Newest releases appear first.</p>{sets.length === 0 ? <p className="empty-state">There are no English sets available right now.</p> : <SetGrid sets={sets} />}</section>;
}
