import type { Catalog, CardPrinting, CatalogSet, PriceQuote } from "./catalog";

type ProviderSet = { id: string; name: string; releaseDate: string; total?: number; images?: { logo?: string; symbol?: string } };
type ProviderPrice = { market?: number };
type ProviderCard = {
  id: string; name: string; number: string; images?: { large?: string; small?: string }; set: ProviderSet;
  rarity?: string; artist?: string; supertype?: string; hp?: string; types?: string[]; rules?: string[];
  tcgplayer?: { updatedAt?: string; prices?: Record<string, ProviderPrice> };
};
type ProviderResponse = { ok: boolean; json(): Promise<{ data: unknown; count?: number; totalCount?: number }> };
type RequestCatalog = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<ProviderResponse>;

const variantNames: Record<string, string> = {
  normal: "Normal", holofoil: "Holofoil", reverseHolofoil: "Reverse holofoil", "1stEditionHolofoil": "1st Edition holofoil",
};

export class CatalogUnavailableError extends Error {
  constructor() {
    super("The card catalog is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
  }
}

function mapSet(set: ProviderSet): CatalogSet {
  return { id: set.id, language: "en", name: set.name, releaseDate: set.releaseDate, logoUrl: set.images?.logo, symbolUrl: set.images?.symbol, cardCount: set.total };
}

function mapQuotes(card: ProviderCard): PriceQuote[] {
  const observedAt = card.tcgplayer?.updatedAt;
  if (!observedAt) return [];
  return Object.entries(card.tcgplayer?.prices ?? {}).flatMap(([variant, price]) =>
    typeof price.market === "number" && price.market > 0
      ? [{ variant: variantNames[variant] ?? variant, amount: price.market, currency: "USD" as const, source: "TCGplayer", observedAt, stale: Date.now() - new Date(observedAt.replaceAll("/", "-")).getTime() > 86_400_000 }]
      : [],
  );
}

function mapCard(card: ProviderCard): CardPrinting {
  const priceQuotes = mapQuotes(card);
  return {
    id: card.id, language: "en", name: card.name, collectorNumber: card.number,
    imageUrl: card.images?.large ?? card.images?.small, set: mapSet(card.set), rarity: card.rarity,
    artist: card.artist, supertype: card.supertype, hp: card.hp, types: card.types, rules: card.rules,
    priceQuotes, summaryPrice: priceQuotes[0],
  };
}

export function createPokemonTcgCatalog({ request, apiKey, timeoutMs = 8_000, pageSize = 250 }: {
  request: RequestCatalog; apiKey: string; timeoutMs?: number; pageSize?: number;
}): Catalog {
  async function requestData<T>(path: string): Promise<{ data: T; count?: number; totalCount?: number }> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await request(`https://api.pokemontcg.io/v2/${path}`, { headers: { "X-Api-Key": apiKey }, signal: controller.signal });
          if (!response.ok) throw new CatalogUnavailableError();
          return await response.json() as { data: T; count?: number; totalCount?: number };
        })(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => { controller.abort(); reject(new CatalogUnavailableError()); }, timeoutMs);
        }),
      ]);
    } catch {
      throw new CatalogUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function allPages<T>(resource: string, query?: string): Promise<T[]> {
    const items: T[] = [];
    let page = 1;
    do {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) params.set("q", query);
      const response = await requestData<T[]>(`${resource}?${params}`);
      items.push(...response.data);
      if (items.length >= (response.totalCount ?? items.length) || response.count === 0) break;
      page += 1;
    } while (true);
    return items;
  }

  return {
    async listSets() {
      return (await allPages<ProviderSet>("sets")).map(mapSet)
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name));
    },
    async getSet(id) { return mapSet((await requestData<ProviderSet>(`sets/${encodeURIComponent(id)}`)).data); },
    async listCardPrintings(setId) {
      const safeId = setId.replaceAll('"', "");
      return (await allPages<ProviderCard>("cards", `set.id:\"${safeId}\"`)).map(mapCard);
    },
    async searchCardPrintings(query) {
      const normalized = query.trim();
      if (!normalized) return [];
      const safeQuery = normalized.replaceAll('"', "");
      return (await allPages<ProviderCard>("cards", `name:\"*${safeQuery}*\"`)).map(mapCard);
    },
    async getCardPrinting(id) { return mapCard((await requestData<ProviderCard>(`cards/${encodeURIComponent(id)}`)).data); },
  };
}
