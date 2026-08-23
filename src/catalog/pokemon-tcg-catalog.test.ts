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

    await expect(catalog.getCardPrinting("base1-4")).resolves.toEqual({
      id: "base1-4",
      language: "en",
      name: "Charizard",
      collectorNumber: "4",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
      set: { id: "base1", name: "Base", releaseDate: "1999/01/09" },
    });
    expect(request).toHaveBeenCalledWith(
      "https://api.pokemontcg.io/v2/cards/base1-4",
      {
        headers: { "X-Api-Key": "server-secret" },
        signal: expect.any(AbortSignal),
      },
    );
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
