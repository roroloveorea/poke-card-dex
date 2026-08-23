import { describe, expect, it, vi } from "vitest";

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
