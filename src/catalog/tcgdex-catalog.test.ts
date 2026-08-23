import { describe, expect, it, vi } from "vitest";

import { createTcgdexCatalog } from "./tcgdex-catalog";

function response(body: unknown) {
  return { ok: true, json: async () => body };
}

describe("TCGdex Eastern catalog adapter", () => {
  it("maps a Japanese set directory with namespaced ids", async () => {
    const request = vi.fn(async (url: string) => {
      expect(url).toBe("https://api.tcgdex.net/v2/ja/sets");
      return response([
        { id: "old", name: "古いセット", cardCount: { total: 10, official: 10 } },
        { id: "new", name: "新しいセット", logo: "logo", cardCount: { total: 20, official: 18 } },
      ]);
    });

    const sets = await createTcgdexCatalog({ language: "ja", request }).listSets();

    expect(sets).toEqual([
      { id: "tdx-ja-set-new", language: "ja", name: "新しいセット", releaseDate: "", logoUrl: "logo", symbolUrl: undefined, cardCount: 20 },
      { id: "tdx-ja-set-old", language: "ja", name: "古いセット", releaseDate: "", logoUrl: undefined, symbolUrl: undefined, cardCount: 10 },
    ]);
  });

  it("enriches the visible cards in a Korean set with images and Cardmarket prices", async () => {
    const request = vi.fn(async (url: string) => {
      if (url.endsWith("/sets/SV5M")) return response({
        id: "SV5M",
        name: "사이버저지",
        releaseDate: "2024-01-26",
        cardCount: { total: 71, official: 71 },
        cards: [{ id: "SV5M-001", localId: "001", name: "도토링", image: "https://assets.test/001" }],
      });
      if (url.endsWith("/cards/SV5M-001")) return response({
        id: "SV5M-001", localId: "001", name: "도토링", image: "https://assets.test/001",
        set: { id: "SV5M", name: "사이버저지", cardCount: { total: 71, official: 71 } },
        pricing: { cardmarket: { updated: "2026-08-24T00:00:00.000Z", unit: "EUR", avg: 0.05, "avg-holo": null } },
      });
      throw new Error(`Unexpected URL: ${url}`);
    });

    const page = await createTcgdexCatalog({ language: "ko", request }).getCardPrintingPage("tdx-ko-set-SV5M", 1, 12);

    expect(page).toEqual({
      items: [expect.objectContaining({
        id: "tdx-ko-card-SV5M-001", language: "ko", name: "도토링", collectorNumber: "001",
        imageUrl: "https://assets.test/001/low.webp",
        priceQuotes: [expect.objectContaining({ variant: "Normal · Average", amount: 0.05, currency: "EUR", source: "Cardmarket via TCGdex" })],
        summaryPrice: expect.objectContaining({ amount: 0.05, currency: "EUR" }),
      })],
      page: 1,
      pageSize: 12,
      totalCount: 1,
      quotedCount: 1,
    });
  });

  it("maps an exact Traditional Chinese card and gameplay details", async () => {
    const request = vi.fn(async (url: string) => {
      if (url.endsWith("/cards/SC2D-001")) return response({
        id: "SC2D-001", localId: "001", name: "木木梟", image: "card-image", category: "Pokemon", hp: 60,
        illustrator: "Artist", types: ["Grass"], set: { id: "SC2D", name: "無極力量", cardCount: { total: 157, official: 157 } },
        abilities: [{ name: "特性", effect: "效果", type: "Ability" }],
        attacks: [{ name: "攻擊", effect: "說明", damage: 20, cost: ["Grass"] }],
        weaknesses: [{ type: "Fire", value: "×2" }], retreat: 1,
      });
      if (url.endsWith("/sets/SC2D")) return response({ id: "SC2D", name: "無極力量", releaseDate: "2020-06-19", cardCount: { total: 157, official: 157 }, cards: [] });
      throw new Error(`Unexpected URL: ${url}`);
    });

    const card = await createTcgdexCatalog({ language: "zh-tw", request }).getCardPrinting("tdx-zh-tw-card-SC2D-001");

    expect(card).toEqual(expect.objectContaining({
      language: "zh-tw", name: "木木梟", supertype: "Pokemon", hp: "60", artist: "Artist",
      imageUrl: "card-image/high.webp",
      abilities: [{ name: "特性", text: "效果" }],
      attacks: [{ name: "攻擊", text: "說明", damage: "20", cost: ["Grass"] }],
      retreatCost: ["Colorless"], priceQuotes: [],
      set: expect.objectContaining({ id: "tdx-zh-tw-set-SC2D", releaseDate: "2020-06-19" }),
    }));
  });

  it("keeps a card usable when TCGdex has neither artwork nor market pricing", async () => {
    const request = vi.fn(async (url: string) => {
      if (url.endsWith("/sets/M5")) return response({
        id: "M5", name: "アビスアイ", cardCount: { total: 1, official: 1 },
        cards: [{ id: "M5-001", localId: "001", name: "トロピウス" }],
      });
      if (url.endsWith("/cards/M5-001")) return response({
        id: "M5-001", localId: "001", name: "トロピウス",
        set: { id: "M5", name: "アビスアイ", cardCount: { total: 1, official: 1 } },
      });
      throw new Error(`Unexpected URL: ${url}`);
    });

    const page = await createTcgdexCatalog({ language: "ja", request }).getCardPrintingPage("tdx-ja-set-M5", 1, 24);

    expect(page.items[0]).toEqual(expect.objectContaining({ imageUrl: undefined, priceQuotes: [], summaryPrice: undefined }));
    expect(page.quotedCount).toBe(0);
  });
});
