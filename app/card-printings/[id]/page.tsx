import Link from "next/link";

import { getCatalog } from "@/src/catalog/server-catalog";

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
      <div className="card-artwork">
        <img
          src={cardPrinting.imageUrl}
          alt={`${cardPrinting.name} from ${cardPrinting.set.name}, card ${cardPrinting.collectorNumber}`}
        />
      </div>
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
        </dl>
      </div>
    </article>
  );
}
