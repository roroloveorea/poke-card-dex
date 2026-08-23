export const displayCurrencies = ["USD", "JPY", "EUR"] as const;
export type DisplayCurrency = (typeof displayCurrencies)[number];

export type ExchangeRateSnapshot = {
  base: "EUR";
  rates: Record<DisplayCurrency, number>;
  observedAt: string;
  publishedAt?: string;
  source: "European Central Bank";
  stale: boolean;
};

const staleAfterMilliseconds = 4 * 24 * 60 * 60 * 1000;

function attributes(value: string) {
  return Object.fromEntries(Array.from(value.matchAll(/([\w:-]+)=["']([^"']+)["']/g), (match) => [match[1], match[2]]));
}

export function parseEcbReferenceRates(xml: string, now = new Date()): ExchangeRateSnapshot {
  const cubeAttributes = Array.from(xml.matchAll(/<Cube\b([^>]*)>/g), (match) => attributes(match[1]));
  const observedAt = cubeAttributes.find((value) => value.time)?.time;
  const providerRates = Object.fromEntries(cubeAttributes.filter((value) => value.currency && value.rate).map((value) => [value.currency, Number(value.rate)]));
  const usd = providerRates.USD;
  const jpy = providerRates.JPY;

  if (!observedAt || !Number.isFinite(usd) || !Number.isFinite(jpy) || usd <= 0 || jpy <= 0) {
    throw new Error("ECB response must include an observation date plus positive USD and JPY rates.");
  }

  const observedTime = new Date(`${observedAt}T00:00:00Z`).getTime();
  if (Number.isNaN(observedTime)) throw new Error("ECB response contains an invalid observation date.");

  return {
    base: "EUR",
    rates: { EUR: 1, USD: usd, JPY: jpy },
    observedAt,
    source: "European Central Bank",
    stale: now.getTime() - observedTime > staleAfterMilliseconds,
  };
}

export function convertCurrency(amount: number, from: DisplayCurrency, to: DisplayCurrency, snapshot: ExchangeRateSnapshot) {
  if (!Number.isFinite(amount)) throw new Error("Currency amount must be finite.");
  return (amount / snapshot.rates[from]) * snapshot.rates[to];
}
