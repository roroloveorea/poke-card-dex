import { parseEcbReferenceRates } from "@/src/currency/exchange-rates";

const ecbDailyRatesUrl = process.env.ECB_EXCHANGE_RATES_URL ?? "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export async function GET() {
  try {
    const response = await fetch(ecbDailyRatesUrl, { next: { revalidate: 86_400 } });
    if (!response.ok) throw new Error(`ECB responded with ${response.status}.`);
    const snapshot = parseEcbReferenceRates(await response.text());
    const publicationHeader = response.headers.get("last-modified");
    const publicationTime = publicationHeader ? new Date(publicationHeader) : undefined;
    const publishedAt = publicationTime && !Number.isNaN(publicationTime.getTime()) ? publicationTime.toISOString() : undefined;
    return Response.json({ ...snapshot, ...(publishedAt ? { publishedAt } : {}) });
  } catch {
    return Response.json({ error: "Exchange rates are temporarily unavailable." }, { status: 503 });
  }
}
