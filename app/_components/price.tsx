"use client";

import type { PriceQuote } from "@/src/catalog/catalog";
import { convertCurrency, type DisplayCurrency } from "@/src/currency/exchange-rates";
import { useCurrency } from "./currency";

function formattedAmount(amount: number, currency: DisplayCurrency) {
  return `${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)} ${currency}`;
}

export function Price({ quote }: { quote?: PriceQuote }) {
  const { currency, rates, status, enabled } = useCurrency();
  if (!quote || quote.amount === undefined) return <span>Price unavailable</span>;
  const original = formattedAmount(quote.amount, quote.currency);
  const needsConversion = enabled && currency !== quote.currency;
  const canConvert = needsConversion && status === "ready" && rates;

  if (canConvert) {
    const converted = formattedAmount(convertCurrency(quote.amount, quote.currency, currency, rates), currency);
    return <span className="price-display"><span>{converted}</span><small>Converted from {original} · {rates.source} rate observed <ObservationDate value={rates.observedAt} /></small></span>;
  }

  return <span className="price-display"><span>{original}</span>{needsConversion && status === "stale" && <small>Showing original quote; conversion unavailable because ECB rates are stale.</small>}{needsConversion && status === "unavailable" && <small>Showing original quote; conversion temporarily unavailable.</small>}{needsConversion && status === "loading" && <small>Showing original quote while conversion rates load.</small>}</span>;
}

export function ObservationDate({ value }: { value: string }) {
  const date = new Date(value.replaceAll("/", "-"));
  return <>{Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date)}</>;
}
