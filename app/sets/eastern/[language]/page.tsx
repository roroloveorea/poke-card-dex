import Link from "next/link";
import { notFound } from "next/navigation";
import { SetGrid } from "@/app/_components/set-grid";
import { easternCatalogName, easternLanguages, type EasternCatalogSlug } from "@/src/catalog/eastern-languages";
import { getEasternCatalog } from "@/src/catalog/server-catalog";

export default async function EasternLanguageSetsPage({ params }: { params: Promise<{ language: string }> }) {
  const { language: slug } = await params;
  const languages = easternLanguages(slug);
  if (languages.length === 0) notFound();
  const catalogName = easternCatalogName(slug as EasternCatalogSlug);
  try {
    const groups = await Promise.all(languages.map(async (language) => ({ language, sets: await getEasternCatalog(language).listSets() })));
    return <section className="page-shell"><Link className="text-link" href="/sets/eastern">← Eastern languages</Link><p className="eyebrow">Eastern catalog</p><h1>{catalogName} sets.</h1><p className="intro">Select a set to browse its language-specific card checklist.</p>{groups.map((group) => <section key={group.language}><SetGrid sets={group.sets} hrefForSet={(set) => `/sets/eastern/${slug}/${set.id}`} /></section>)}</section>;
  } catch {
    return <section className="error-shell" role="alert"><h1>The {catalogName.toLocaleLowerCase()} catalog is temporarily unavailable.</h1><div className="actions"><Link className="button" href={`/sets/eastern/${slug}`}>Try again</Link><Link className="text-link" href="/sets/eastern">Eastern languages</Link></div></section>;
  }
}
