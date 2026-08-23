import Link from "next/link";
import { getCatalog } from "@/src/catalog/server-catalog";
import { CardGrid } from "./card-grid";

export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const catalog = getCatalog();
    const [set, cards] = await Promise.all([catalog.getSet(id), catalog.listCardPrintings(id)]);
    return <section className="page-shell"><Link className="text-link" href="/sets">← All sets</Link><p className="eyebrow">English set · {set.releaseDate}</p><h1>{set.name}</h1>{cards.length ? <CardGrid cards={cards} /> : <p className="empty-state">No card printings are available for this set.</p>}</section>;
  } catch { return <section className="error-shell" role="alert"><h1>This set is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/sets/${id}`}>Try again</Link><Link className="text-link" href="/sets">All sets</Link></div></section>; }
}
