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

  it("uses set id as the final deterministic ordering tie-breaker", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [{ id: "z", name: "Same", releaseDate: "2026/01/01" }, { id: "a", name: "Same", releaseDate: "2026/01/01" }], count: 2, totalCount: 2,
    }) });
    const sets = await createPokemonTcgCatalog({ request, apiKey: "secret" }).listSets();
    expect(sets.map((set) => set.id)).toEqual(["a", "z"]);
  });

  it("falls back to a set-id query when the provider's direct set endpoint fails", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        data: [{ id: "me5", name: "Pitch Black", releaseDate: "2026/07/17", total: 120 }],
        count: 1,
        totalCount: 1,
      }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.getSet("me5")).resolves.toMatchObject({
      id: "me5", name: "Pitch Black", cardCount: 120,
    });
    expect(request.mock.calls[5][0]).toContain(encodeURIComponent('id:"me5"'));
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
      { variant: "Reverse holofoil", amount: undefined, currency: "USD", source: "TCGplayer", observedAt: "2026/08/20", stale: true },
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
    expect(new URL(request.mock.calls[1][0]).searchParams.get("q")).toBe("(name:*ChAr* OR number:ChAr*)");
  });

  it("matches every normalized search term across card name or collector-number prefix", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [
        { id: "match", name: "Charizard ex", number: "01a", images: {}, set: { id: "set-a", name: "Alpha", releaseDate: "2025/01/01" } },
        { id: "wrong-number", name: "Charizard ex", number: "42", images: {}, set: { id: "set-a", name: "Alpha", releaseDate: "2025/01/01" } },
        { id: "wrong-name", name: "Pikachu", number: "01b", images: {}, set: { id: "set-a", name: "Alpha", releaseDate: "2025/01/01" } },
      ],
      count: 3,
      totalCount: 3,
    }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.searchCardPrintings("  CHARIZARD   01  ")).resolves.toEqual([
      expect.objectContaining({ id: "match", collectorNumber: "01a" }),
    ]);
    const providerQuery = new URL(request.mock.calls[0][0]).searchParams.get("q");
    expect(providerQuery).toContain("name:*CHARIZARD*");
    expect(providerQuery).toContain("number:01*");
  });

  it("preserves meaningful letters and punctuation in collector-number-only searches", async () => {
    const card = (id: string, number: string) => ({
      id, name: "Pikachu", number, images: {}, set: { id: "set-a", name: "Alpha", releaseDate: "2025/01/01" },
    });
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [card("match", "TG01-a"), card("not-prefix", "01-TG")], count: 2, totalCount: 2,
    }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.searchCardPrintings("tg01-")).resolves.toEqual([
      expect.objectContaining({ id: "match", collectorNumber: "TG01-a" }),
    ]);
    expect(new URL(request.mock.calls[0][0]).searchParams.get("q")).toContain("number:tg01\\-*");
  });

  it("retries card listings in smaller pages when a large provider page fails", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        data: [{ id: "me3-1", name: "Bulbasaur", number: "1", images: {}, set: { id: "me3", name: "Perfect Order", releaseDate: "2026/03/27" } }],
        count: 1, totalCount: 1,
      }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.listCardPrintings("me3")).resolves.toHaveLength(1);
    expect(request.mock.calls[0][0]).toContain("pageSize=250");
    expect(request.mock.calls[5][0]).toContain("pageSize=50");
  });

  it("returns one bounded card page with reachability metadata", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [{ id: "sv8-13", name: "Pikachu", number: "13", images: {}, set: { id: "sv8", name: "Surging Sparks", releaseDate: "2024/11/08" } }],
      count: 1, totalCount: 252,
    }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.getCardPrintingPage("sv8", 2, 12)).resolves.toMatchObject({
      page: 2, pageSize: 12, totalCount: 252, items: [{ id: "sv8-13" }],
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("page=2");
    expect(request.mock.calls[0][0]).toContain("pageSize=12");
  });

  it("returns every distinct rarity for a set and can page within one rarity", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        data: [{ rarity: "Rare" }, { rarity: "Special Illustration Rare" }, { rarity: "Rare" }], count: 3, totalCount: 3,
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], count: 0, totalCount: 6 }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.listSetRarities("me5")).resolves.toEqual(["Rare", "Special Illustration Rare"]);
    await expect(catalog.getCardPrintingPage("me5", 1, 12, "Special Illustration Rare")).resolves.toMatchObject({ totalCount: 6 });
    expect(new URL(request.mock.calls[1][0]).searchParams.get("q")).toContain('rarity:"Special Illustration Rare"');
  });

  it("orders prices across the complete matching set before pagination with unavailable prices last", async () => {
    const card = (id: string, number: string, amount?: number) => ({
      id, name: id, number, images: {}, set: { id: "me5", name: "Pitch Black", releaseDate: "2026/07/17" },
      tcgplayer: { updatedAt: "2026/08/23", prices: { normal: amount === undefined ? {} : { market: amount } } },
    });
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [card("low", "1", 2), card("missing", "2"), card("high", "3", 20)], count: 3, totalCount: 3,
    }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.getCardPrintingPage("me5", 1, 2, undefined, "price-high")).resolves.toMatchObject({
      items: [{ id: "high" }, { id: "low" }], totalCount: 3, quotedCount: 2,
    });
    await expect(catalog.getCardPrintingPage("me5", 2, 2, undefined, "price-high")).resolves.toMatchObject({
      items: [{ id: "missing" }],
    });
  });

  it("recovers when a repeated provider request succeeds on a later attempt", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {
        id: "me5", name: "Pitch Black", releaseDate: "2026/07/17", total: 120,
      } }) });
    const catalog = createPokemonTcgCatalog({ request, apiKey: "secret" });

    await expect(catalog.getSet("me5")).resolves.toMatchObject({ id: "me5" });
    expect(request).toHaveBeenCalledTimes(2);
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
