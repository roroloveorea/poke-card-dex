import Link from "next/link";
import { notFound } from "next/navigation";
import { easternLanguages, languageFromCatalogId } from "@/src/catalog/eastern-languages";
import { languageName } from "@/src/catalog/language";
import { getEasternCatalog } from "@/src/catalog/server-catalog";

export default async function EasternCardPage({ params }: { params: Promise<{ language: string; id: string }> }) {
  const { language: slug, id } = await params;
  const language = languageFromCatalogId(id);
  if (!language || !easternLanguages(slug).includes(language)) notFound();
  try {
    const card = await getEasternCatalog(language).getCardPrinting(id);
    return <article className="card-shell">{card.imageUrl && <div className="card-artwork"><img src={card.imageUrl} alt={`${card.name} from ${card.set.name}, card ${card.collectorNumber}`} /></div>}<div className="card-copy"><Link className="text-link" href={`/sets/eastern/${slug}/${card.set.id}`}>← {card.set.name}</Link><p className="eyebrow">{languageName(card.language)}</p><h1>{card.name}</h1><p className="printing-id">{card.set.name} · {card.collectorNumber}</p><dl>{card.artist && <div><dt>Artist</dt><dd>{card.artist}</dd></div>}{card.supertype && <div><dt>Card type</dt><dd>{card.supertype}</dd></div>}{card.hp && <div><dt>HP</dt><dd>{card.hp}</dd></div>}{card.types?.length ? <div><dt>Type</dt><dd>{card.types.join(", ")}</dd></div> : null}</dl>{card.abilities?.length ? <section><h2>Abilities</h2>{card.abilities.map((ability) => <div key={ability.name}><h3>{ability.name}</h3><p>{ability.text}</p></div>)}</section> : null}{card.attacks?.length ? <section><h2>Attacks</h2>{card.attacks.map((attack) => <div key={attack.name}><h3>{attack.name}{attack.damage ? ` · ${attack.damage}` : ""}</h3>{attack.text && <p>{attack.text}</p>}</div>)}</section> : null}<section className="prices"><h2>Ungraded prices</h2><p>Price unavailable</p><p className="disclaimer">RareBit pricing is added only when an exact provider match is available.</p></section></div></article>;
  } catch {
    return <section className="error-shell" role="alert"><h1>This card is temporarily unavailable.</h1><Link className="button" href={`/card-printings/eastern/${slug}/${id}`}>Try again</Link></section>;
  }
}
