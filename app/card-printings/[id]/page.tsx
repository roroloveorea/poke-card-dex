import Link from "next/link";

import { getCatalog } from "@/src/catalog/server-catalog";
import { ObservationDate, Price } from "@/app/_components/price";

export default async function CardPrintingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cardPrinting;
  try {
    cardPrinting = await getCatalog().getCardPrinting(id);
  } catch {
    return (
      <section className="error-shell" role="alert">
        <p className="eyebrow">Provider unavailable</p>
        <h1>The catalog took too long to respond.</h1>
        <p className="intro">Your place is safe. Try loading this card again.</p>
        <div className="actions">
          <Link className="button" href={`/card-printings/${id}`}>
            Try again
          </Link>
          <Link className="text-link" href="/">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="card-shell">
      {cardPrinting.imageUrl && <div className="card-artwork">
        <img
          src={cardPrinting.imageUrl}
          alt={`${cardPrinting.name} from ${cardPrinting.set.name}, card ${cardPrinting.collectorNumber}`}
        />
      </div>}
      <div className="card-copy">
        <p className="eyebrow">English</p>
        <h1>{cardPrinting.name}</h1>
        <p className="printing-id">
          {cardPrinting.set.name} · {cardPrinting.collectorNumber}
        </p>
        <dl>
          <div>
            <dt>Released</dt>
            <dd>{cardPrinting.set.releaseDate}</dd>
          </div>
          {cardPrinting.rarity && <div><dt>Rarity</dt><dd>{cardPrinting.rarity}</dd></div>}
          {cardPrinting.artist && <div><dt>Artist</dt><dd>{cardPrinting.artist}</dd></div>}
          {cardPrinting.hp && <div><dt>HP</dt><dd>{cardPrinting.hp}</dd></div>}
          {cardPrinting.types?.length ? <div><dt>Type</dt><dd>{cardPrinting.types.join(", ")}</dd></div> : null}
        </dl>
        {cardPrinting.rules?.length ? <section><h2>Card rules</h2>{cardPrinting.rules.map((rule) => <p key={rule}>{rule}</p>)}</section> : null}
        {cardPrinting.abilities?.length ? <section><h2>Abilities</h2>{cardPrinting.abilities.map((ability) => <div key={ability.name}><h3>{ability.name}</h3><p>{ability.text}</p></div>)}</section> : null}
        {cardPrinting.attacks?.length ? <section><h2>Attacks</h2>{cardPrinting.attacks.map((attack) => <div key={attack.name}><h3>{attack.name}{attack.damage ? ` · ${attack.damage}` : ""}</h3>{attack.cost?.length ? <p>Cost: {attack.cost.join(", ")}</p> : null}{attack.text && <p>{attack.text}</p>}</div>)}</section> : null}
        {cardPrinting.weaknesses?.length ? <p><strong>Weakness:</strong> {cardPrinting.weaknesses.map((item) => `${item.type} ${item.value}`).join(", ")}</p> : null}
        {cardPrinting.resistances?.length ? <p><strong>Resistance:</strong> {cardPrinting.resistances.map((item) => `${item.type} ${item.value}`).join(", ")}</p> : null}
        {cardPrinting.retreatCost?.length ? <p><strong>Retreat cost:</strong> {cardPrinting.retreatCost.join(", ")}</p> : null}
        <section className="prices" aria-labelledby="prices-heading">
          <h2 id="prices-heading">Ungraded prices</h2>
          {cardPrinting.priceQuotes.length === 0 ? <p>Price unavailable</p> : <ul>{cardPrinting.priceQuotes.map((quote) => <li key={quote.variant}><strong>{quote.variant}</strong><Price quote={quote} /><small>{quote.source} · observed <ObservationDate value={quote.observedAt} />{quote.stale ? " · Stale quote" : ""}</small></li>)}</ul>}
          <p className="disclaimer">Prices are indicative market quotes, not guaranteed sale values.</p>
        </section>
      </div>
    </article>
  );
}
