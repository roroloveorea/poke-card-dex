import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createRareBitCatalog } from "./rarebit-catalog";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

describe("RareBit Japanese catalog adapter", () => {
  it("searches only Japanese Pokemon cards and maps stable provider-neutral ids", async () => {
    const request = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/catalog/cards")) {
        expect(parsed.searchParams.get("printedIn")).toBe("ja");
        expect(parsed.searchParams.get("q")).toBe("ピカチュウ");
        return jsonResponse({
          data: [
            { id: "card-uuid", name: "ピカチュウex", number: "025", printedNumber: "025/198", rarity: "Double Rare", gameCode: "pokemon_tcg", availableLanguages: ["ja"], set: { code: "sv3", name: "レイジングサーフ", printRegion: "EAST" } },
            { id: "other-game", name: "ピカチュウ", number: "1", gameCode: "other", availableLanguages: ["ja"], set: { code: "x", name: "Other", printRegion: "EAST" } },
          ],
          pagination: { limit: 20, offset: 0, total: 2, hasMore: false },
        });
      }
      if (parsed.pathname.endsWith("/catalog/images")) {
        return jsonResponse({ data: [{ id: "card-uuid", kind: "card", imageUrl: "https://media.test/card.webp", images: [] }] });
      }
      if (parsed.pathname.endsWith("/catalog/sets/sv3")) {
        return jsonResponse({ code: "sv3", name: "レイジングサーフ", releaseDate: "2023-09-22T00:00:00.000Z", cardCount: 99, printRegion: "EAST" });
      }
      if (parsed.pathname.endsWith("/prices/CARD/card-uuid/current")) {
        return jsonResponse({ sources: [] });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const cards = await createRareBitCatalog({ request, apiKey: "rb-secret" }).searchCardPrintings("ピカチュウ");

    expect(cards).toEqual([expect.objectContaining({
      id: "rb-card-card-uuid",
      language: "ja",
      name: "ピカチュウex",
      collectorNumber: "025/198",
      imageUrl: "https://media.test/card.webp",
      set: expect.objectContaining({ id: "rb-set-sv3", language: "ja", releaseDate: "2023-09-22" }),
    })]);
  });

  it("paginates every term, matches one printing across name, number, and set, then deduplicates and ranks deterministically", async () => {
    const card = (id: string, name: string, number: string, setCode: string, setName: string) => ({
      id, name, number, gameCode: "pokemon_tcg", availableLanguages: ["ja"],
      set: { code: setCode, name: setName, printRegion: "EAST" },
    });
    const candidates = [
      card("partial-new-10", "リザードンex", "010/100", "new", "ロケット団の栄光"),
      card("exact-name", "リザードン", "099/100", "old", "ロケット団の栄光"),
      card("partial-new-2-z", "リザードンV", "002/100", "new", "ロケット団の栄光"),
      card("partial-new-2-a", "リザードンVSTAR", "002/100", "new", "ロケット団の栄光"),
      card("wrong-set", "リザードン", "001/100", "scarlet", "スカーレット"),
    ];
    const request = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/catalog/cards")) {
        expect(parsed.searchParams.get("printedIn")).toBe("ja");
        const query = parsed.searchParams.get("q");
        const offset = Number(parsed.searchParams.get("offset"));
        if (query === "リザードン") {
          return offset === 0
            ? jsonResponse({ data: [candidates[0], candidates[1], candidates[4]], pagination: { limit: 3, offset: 0, total: 6, hasMore: true } })
            : jsonResponse({ data: [candidates[2], candidates[3], candidates[0]], pagination: { limit: 3, offset: 3, total: 6, hasMore: false } });
        }
        if (query === "ロケット") {
          return jsonResponse({ data: [candidates[3], candidates[2], candidates[1], candidates[0]], pagination: { limit: 100, offset: 0, total: 4, hasMore: false } });
        }
        if (query === "0") {
          return jsonResponse({ data: candidates, pagination: { limit: 100, offset: 0, total: candidates.length, hasMore: false } });
        }
      }
      if (parsed.pathname.endsWith("/catalog/images")) return jsonResponse({ data: [] });
      if (parsed.pathname.endsWith("/catalog/sets/new")) return jsonResponse({ code: "new", name: "ロケット団の栄光", releaseDate: "2026-04-01", printRegion: "EAST" });
      if (parsed.pathname.endsWith("/catalog/sets/old")) return jsonResponse({ code: "old", name: "ロケット団の栄光", releaseDate: "2024-01-01", printRegion: "EAST" });
      if (parsed.pathname.endsWith("/catalog/sets/scarlet")) return jsonResponse({ code: "scarlet", name: "スカーレット", releaseDate: "2026-05-01", printRegion: "EAST" });
      if (parsed.pathname.includes("/prices/CARD/")) return jsonResponse({ sources: [] });
      throw new Error(`Unexpected URL: ${url}`);
    });

    const results = await createRareBitCatalog({ request, apiKey: "rb-secret" }).searchCardPrintings("  リザードン   0  ロケット  ");

    expect(results.map((result) => result.id)).toEqual([
      "rb-card-exact-name",
      "rb-card-partial-new-2-a",
      "rb-card-partial-new-2-z",
      "rb-card-partial-new-10",
    ]);
    const searchCalls = request.mock.calls.map(([url]) => new URL(url)).filter((url) => url.pathname.endsWith("/catalog/cards"));
    expect(searchCalls.map((url) => [url.searchParams.get("q"), url.searchParams.get("offset")])).toEqual([
      ["リザードン", "0"], ["0", "0"], ["ロケット", "0"], ["リザードン", "3"],
    ]);
    expect(request.mock.calls.filter(([url]) => new URL(url).pathname.includes("/prices/CARD/"))).toHaveLength(4);
  });

  it("attaches eligible YuYuTei JPY summaries without losing results when one price request fails", async () => {
    const card = (id: string, number: string) => ({
      id, name: "ピカチュウ", number, gameCode: "pokemon_tcg", availableLanguages: ["ja"],
      set: { code: "sv", name: "未来", printRegion: "EAST" },
    });
    const request = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith("/catalog/cards")) return jsonResponse({ data: [card("priced", "001"), card("unpriced", "002")], pagination: { limit: 100, offset: 0, total: 2, hasMore: false } });
      if (parsed.pathname.endsWith("/catalog/images")) return jsonResponse({ data: [] });
      if (parsed.pathname.endsWith("/catalog/sets/sv")) return jsonResponse({ code: "sv", name: "未来", releaseDate: "2025-01-01", printRegion: "EAST" });
      if (parsed.pathname.endsWith("/prices/CARD/priced/current")) return jsonResponse({ data: { sources: [
        { source: "YUYUTEI", variant: "LOWEST", language: "ja", price: 880, currency: "JPY", condition: "NEAR_MINT", printing: "NORMAL", grading: null, capturedAt: new Date().toISOString() },
        { source: "YUYUTEI", variant: "GRADED", language: "ja", price: 5000, currency: "JPY", grading: { score: 10 }, capturedAt: new Date().toISOString() },
      ] } });
      if (parsed.pathname.endsWith("/prices/CARD/unpriced/current")) throw new Error("price provider unavailable");
      throw new Error(`Unexpected URL: ${url}`);
    });

    const results = await createRareBitCatalog({ request, apiKey: "rb-secret" }).searchCardPrintings("ピカチュウ");

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: "rb-card-priced", summaryPrice: { amount: 880, currency: "JPY", source: "YuYuTei via RareBit" } });
    expect(results[0].priceQuotes).toHaveLength(1);
    expect(results[1]).toMatchObject({ id: "rb-card-unpriced", priceQuotes: [] });
    expect(results[1].summaryPrice).toBeUndefined();
  });

  it("maps only ungraded Japanese YuYuTei quotes in JPY on exact card lookup", async () => {
    const request = vi.fn(async (url: string, init: { headers: Record<string, string> }) => {
      expect(init.headers).toEqual({ "X-API-Key": "rb-secret", "x-lang": "ja" });
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("/catalog/cards/card-uuid")) {
        return jsonResponse({ id: "card-uuid", name: "リザードン", number: "006", printedNumber: "006/165", rarity: "Rare", gameCode: "pokemon_tcg", availableLanguages: ["ja"], set: { code: "sv2a", name: "ポケモンカード151", printRegion: "EAST" }, artist: { name: "Mitsuhiro Arita" }, supertype: "Pokémon", hp: "120", types: ["Fire"] });
      }
      if (pathname.endsWith("/catalog/sets/sv2a")) {
        return jsonResponse({ code: "sv2a", name: "ポケモンカード151", releaseDate: "2023-06-16T00:00:00.000Z", cardCount: 210, printRegion: "EAST" });
      }
      if (pathname.endsWith("/catalog/images")) {
        return jsonResponse({ data: [{ id: "card-uuid", kind: "card", imageUrl: "card.webp", images: [] }] });
      }
      if (pathname.endsWith("/prices/CARD/card-uuid/current")) {
        return jsonResponse({ itemKind: "CARD", itemId: "card-uuid", sources: [
          { source: "YUYUTEI", variant: "LOWEST_NEAR_MINT", language: "ja", price: 1280, currency: "JPY", condition: "NEAR_MINT", printing: "NORMAL", grading: null, capturedAt: new Date().toISOString() },
          { source: "CARDMARKET", variant: "LOWEST", language: "ja", price: 8, currency: "EUR", grading: null, capturedAt: new Date().toISOString() },
          { source: "YUYUTEI", variant: "MEDIAN_GRADED", language: "ja", price: 9000, currency: "JPY", grading: { company: "PSA", score: 10 }, capturedAt: new Date().toISOString() },
          { source: "YUYUTEI", variant: "LOWEST", language: "en", price: 500, currency: "JPY", grading: null, capturedAt: new Date().toISOString() },
        ] });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const card = await createRareBitCatalog({ request, apiKey: "rb-secret" }).getCardPrinting("rb-card-card-uuid");

    expect(card).toEqual(expect.objectContaining({
      language: "ja",
      artist: "Mitsuhiro Arita",
      priceQuotes: [expect.objectContaining({ amount: 1280, currency: "JPY", source: "YuYuTei via RareBit" })],
      summaryPrice: expect.objectContaining({ amount: 1280, currency: "JPY" }),
    }));
  });

  it("does not expose EAST sets as Japanese in the directory", async () => {
    const request = vi.fn();
    expect(await createRareBitCatalog({ request, apiKey: "rb-secret" }).listSets()).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });
});
