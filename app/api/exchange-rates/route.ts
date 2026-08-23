import { parseEcbReferenceRates } from "@/src/currency/exchange-rates";

const ecbDailyRatesUrl = process.env.ECB_EXCHANGE_RATES_URL ?? "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export async function GET() {
  try {
    const response = await fetch(ecbDailyRatesUrl, { next: { revalidate: 86_400 } });
    if (!response.ok) throw new Error(`ECB responded with ${response.status}.`);
    return Response.json(parseEcbReferenceRates(await response.text()));
  } catch {
    return Response.json({ error: "Exchange rates are temporarily unavailable." }, { status: 503 });
  }
}
