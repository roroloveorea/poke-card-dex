import type { PriceQuote } from "@/src/catalog/catalog";

export function Price({ quote }: { quote?: PriceQuote }) {
  if (!quote) return <span>Price unavailable</span>;
  return <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(quote.amount)}</span>;
}
