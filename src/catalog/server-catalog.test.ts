import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./pokemon-tcg-catalog", () => ({ createPokemonTcgCatalog: vi.fn((options) => options) }));
vi.mock("./rarebit-catalog", () => ({ createRareBitCatalog: vi.fn((options) => options) }));
vi.mock("./composite-catalog", () => ({ createCompositeCatalog: vi.fn((primary, japanese) => ({ primary, japanese })) }));

import { getCatalog } from "./server-catalog";

describe("server catalog boundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.POKEMON_TCG_API_KEY = "browser-must-not-see-this";
    delete process.env.CATALOG_REFRESH_SECONDS;
    delete process.env.POKEMON_TCG_API_BASE_URL;
    delete process.env.RAREBIT_API_KEY;
    delete process.env.RAREBIT_API_BASE_URL;
  });

  it("configures provider responses for one-day reuse and keeps the key in server request headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const catalog = getCatalog() as unknown as { request: typeof fetch; apiKey: string };
    await catalog.request("https://provider.test", { headers: { "X-Api-Key": catalog.apiKey }, signal: new AbortController().signal });
    expect(fetchMock).toHaveBeenCalledWith("https://provider.test", expect.objectContaining({
      headers: { "X-Api-Key": "browser-must-not-see-this" }, cache: "force-cache", next: { revalidate: 86_400 },
    }));
  });

  it("adds RareBit only when its server key is configured", async () => {
    process.env.RAREBIT_API_KEY = "rarebit-browser-must-not-see-this";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const catalog = getCatalog() as unknown as {
      japanese: { request: typeof fetch; apiKey: string; baseUrl?: string };
    };

    await catalog.japanese.request("https://rarebit.test", {
      headers: { "X-API-Key": catalog.japanese.apiKey, "x-lang": "ja" },
      signal: new AbortController().signal,
    });

    expect(catalog.japanese.apiKey).toBe("rarebit-browser-must-not-see-this");
    expect(fetchMock).toHaveBeenCalledWith("https://rarebit.test", expect.objectContaining({
      headers: { "X-API-Key": "rarebit-browser-must-not-see-this", "x-lang": "ja" },
      cache: "force-cache",
      next: { revalidate: 86_400 },
    }));
  });
});
