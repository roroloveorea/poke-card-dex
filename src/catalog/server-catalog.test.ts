import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./pokemon-tcg-catalog", () => ({ createPokemonTcgCatalog: vi.fn((options) => options) }));

import { getCatalog } from "./server-catalog";

describe("server catalog boundary", () => {
  beforeEach(() => { vi.restoreAllMocks(); process.env.POKEMON_TCG_API_KEY = "browser-must-not-see-this"; });

  it("configures provider responses for one-day reuse and keeps the key in server request headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const catalog = getCatalog() as unknown as { request: typeof fetch; apiKey: string };
    await catalog.request("https://provider.test", { headers: { "X-Api-Key": catalog.apiKey }, signal: new AbortController().signal });
    expect(fetchMock).toHaveBeenCalledWith("https://provider.test", expect.objectContaining({
      headers: { "X-Api-Key": "browser-must-not-see-this" }, next: { revalidate: 86_400 },
    }));
  });
});
