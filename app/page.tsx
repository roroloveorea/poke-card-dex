import Link from "next/link";

export default function HomePage() {
  return (
    <section className="home-shell">
      <p className="eyebrow">Collector reference</p>
      <h1>Find the exact printing.</h1>
      <p className="intro">
        Identify a Pokémon card by its set and collector number.
      </p>
      <Link className="button" href="/card-printings/base1-4">
        View the English catalog tracer
      </Link>
    </section>
  );
}
