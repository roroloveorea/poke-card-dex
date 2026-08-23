import { describe, expect, it, vi } from "vitest";

import {
  CatalogUnavailableError,
  createPokemonTcgCatalog,
} from "./pokemon-tcg-catalog";

describe("Pokémon TCG catalog", () => {
  it("returns a provider-neutral English card printing", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "base1-4",
          name: "Charizard",
          number: "4",
          images: { large: "https://images.pokemontcg.io/base1/4_hires.png" },
          set: { id: "base1", name: "Base", releaseDate: "1999/01/09" },
        },
      }),
    });

    const catalog = createPokemonTcgCatalog({ request, apiKey: "server-secret" });

    await expect(catalog.getCardPrinting("base1-4")).resolves.toMatchObject({
      id: "base1-4",
      language: "en",
      name: "Charizard",
      collectorNumber: "4",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
      set: { id: "base1", language: "en", name: "Base", releaseDate: "1999/01/09" },
      priceQuotes: [],
    });
    expect(request).toHaveBeenCalledWith(
      "https://api.pokemontcg.io/v2/cards/base1-4",
      {
        headers: { "X-Api-Key": "server-secret" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("lists every English set newest first through provider pagination", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "old", name: "Old", releaseDate: "2020/01/01", total: 10 }], count: 1, totalCount: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "new", name: "New", releaseDate: "2024/01/01", total: 20 }], count: 1, totalCount: 2 }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret", pageSize: 1 });

    await expect(catalog.listSets()).resolves.toEqual([
      expect.objectContaining({ id: "new", cardCount: 20, language: "en" }),
      expect.objectContaining({ id: "old", cardCount: 10, language: "en" }),
    ]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("maps optional details and separate ungraded USD variant quotes", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {
      id: "base1-4", name: "Charizard", number: "4", rarity: "Rare Holo", artist: "Mitsuhiro Arita",
      images: { large: "image" }, hp: "120", types: ["Fire"], rules: ["A rule"], supertype: "Pokémon",
      set: { id: "base1", name: "Base", releaseDate: "1999/01/09" },
      tcgplayer: { updatedAt: "2026/08/20", prices: { holofoil: { market: 321.5 }, reverseHolofoil: {} } },
    } }) });

    const card = await createPokemonTcgCatalog({ request, apiKey: "secret" }).getCardPrinting("base1-4");

    expect(card).toMatchObject({ rarity: "Rare Holo", artist: "Mitsuhiro Arita", hp: "120" });
    expect(card.priceQuotes).toEqual([
      { variant: "Holofoil", amount: 321.5, currency: "USD", source: "TCGplayer", observedAt: "2026/08/20", stale: true },
    ]);
    expect(card.summaryPrice?.variant).toBe("Holofoil");
  });

  it("lists and searches all card pages with provider syntax kept in the adapter", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [{ id: "base1-4", name: "Charizard", number: "4", images: {}, set: { id: "base1", name: "Base", releaseDate: "1999/01/09" } }],
      count: 1, totalCount: 1,
    }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.listCardPrintings("base1")).resolves.toHaveLength(1);
    await expect(catalog.searchCardPrintings("  ChAr  ")).resolves.toHaveLength(1);
    expect(request.mock.calls[0][0]).toContain(encodeURIComponent('set.id:"base1"'));
    expect(request.mock.calls[1][0]).toContain(encodeURIComponent('name:"*ChAr*"'));
  });

  it("reports a provider failure as catalog unavailability", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "upstream unavailable" }),
    });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "server-secret" });

    await expect(catalog.getCardPrinting("base1-4")).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it("stops waiting when the provider stalls", async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockReturnValue(new Promise(() => undefined));
    const catalog = createPokemonTcgCatalog({
      request,
      apiKey: "server-secret",
      timeoutMs: 50,
    });

    const result = expect(
      catalog.getCardPrinting("base1-4"),
    ).rejects.toBeInstanceOf(CatalogUnavailableError);
    await vi.advanceTimersByTimeAsync(50);

    await result;
    vi.useRealTimers();
  });

  it("stops waiting when the provider response body stalls", async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: () => new Promise(() => undefined),
    });
    const catalog = createPokemonTcgCatalog({
      request,
      apiKey: "server-secret",
      timeoutMs: 50,
    });

    const result = expect(
      catalog.getCardPrinting("base1-4"),
    ).rejects.toBeInstanceOf(CatalogUnavailableError);
    await vi.advanceTimersByTimeAsync(50);

    await result;
    vi.useRealTimers();
  });
});
