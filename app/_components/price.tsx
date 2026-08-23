import type { PriceQuote } from "@/src/catalog/catalog";

export function Price({ quote }: { quote?: PriceQuote }) {
  if (!quote || quote.amount === undefined) return <span>Price unavailable</span>;
  return <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(quote.amount)} {quote.currency}</span>;
}

export function ObservationDate({ value }: { value: string }) {
  const date = new Date(value.replaceAll("/", "-"));
  return <>{Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date)}</>;
}
