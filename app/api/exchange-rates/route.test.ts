import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const xml = `<Envelope><Cube><Cube time="2026-08-24"><Cube currency="USD" rate="1.2"/><Cube currency="JPY" rate="180"/></Cube></Cube></Envelope>`;

describe("display exchange-rate endpoint", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns only the supported ECB reference rates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(xml, { headers: { "Last-Modified": "Mon, 24 Aug 2026 14:00:00 GMT" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ base: "EUR", rates: { EUR: 1, USD: 1.2, JPY: 180 }, publishedAt: "2026-08-24T14:00:00.000Z", source: "European Central Bank" });
    expect(fetchMock).toHaveBeenCalledWith("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", expect.objectContaining({ next: { revalidate: 86400 } }));
  });

  it("returns an explicit unavailable response when the source fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Exchange rates are temporarily unavailable." });
  });
});
