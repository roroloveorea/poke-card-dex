import type { Catalog, CardPrinting, CatalogSet, PriceOrder, PriceQuote } from "./catalog";
import { rankAndDeduplicateSearchResults, searchQueryTerms } from "./search-query";

type ProviderSet = { id: string; name: string; releaseDate: string; total?: number; images?: { logo?: string; symbol?: string } };
type ProviderPrice = { market?: number };
type ProviderAbility = { name: string; text: string };
type ProviderAttack = { name: string; text?: string; damage?: string; cost?: string[] };
type ProviderTypeValue = { type: string; value: string };
type ProviderCard = {
  id: string; name: string; number: string; images?: { large?: string; small?: string }; set: ProviderSet;
  rarity?: string; artist?: string; supertype?: string; hp?: string; types?: string[]; rules?: string[];
  abilities?: ProviderAbility[]; attacks?: ProviderAttack[]; weaknesses?: ProviderTypeValue[];
  resistances?: ProviderTypeValue[]; retreatCost?: string[];
  tcgplayer?: { updatedAt?: string; prices?: Record<string, ProviderPrice> };
};
type ProviderResponse = { ok: boolean; json(): Promise<{ data: unknown; count?: number; totalCount?: number }> };
type RequestCatalog = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<ProviderResponse>;

const variantNames: Record<string, string> = {
  normal: "Normal", holofoil: "Holofoil", reverseHolofoil: "Reverse holofoil", "1stEditionHolofoil": "1st Edition holofoil",
};
const summaryVariantPriority = ["normal", "holofoil", "reverseHolofoil", "1stEditionHolofoil"];

function escapeLuceneQueryTerm(term: string) {
  return term.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, "\\$&");
}

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
  return Object.entries(card.tcgplayer?.prices ?? {}).map(([variant, price]) => ({
    variant: variantNames[variant] ?? variant,
    amount: typeof price.market === "number" && price.market > 0 ? price.market : undefined,
    currency: "USD" as const, source: "TCGplayer", observedAt,
    stale: Date.now() - new Date(observedAt.replaceAll("/", "-")).getTime() > 86_400_000,
  }));
}

function mapCard(card: ProviderCard): CardPrinting {
  const priceQuotes = mapQuotes(card);
  return {
    id: card.id, language: "en", name: card.name, collectorNumber: card.number,
    imageUrl: card.images?.large ?? card.images?.small, set: mapSet(card.set), rarity: card.rarity,
    artist: card.artist, supertype: card.supertype, hp: card.hp, types: card.types, rules: card.rules,
    abilities: card.abilities, attacks: card.attacks, weaknesses: card.weaknesses,
    resistances: card.resistances, retreatCost: card.retreatCost, priceQuotes,
    summaryPrice: summaryVariantPriority.map((variant) => {
      const name = variantNames[variant] ?? variant;
      return priceQuotes.find((quote) => quote.variant === name && quote.amount !== undefined);
    }).find(Boolean) ?? priceQuotes.find((quote) => quote.amount !== undefined),
  };
}

export function createPokemonTcgCatalog({ request, apiKey, timeoutMs = 8_000, pageSize = 250, baseUrl = "https://api.pokemontcg.io/v2" }: {
  request: RequestCatalog; apiKey: string; timeoutMs?: number; pageSize?: number; baseUrl?: string;
}): Catalog {
  const providerBaseUrl = baseUrl.replace(/\/+$/, "");
  async function requestData<T>(path: string): Promise<{ data: T; count?: number; totalCount?: number }> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          for (let attempt = 1; attempt <= 5; attempt += 1) {
            const response = await request(`${providerBaseUrl}/${path}`, { headers: { "X-Api-Key": apiKey }, signal: controller.signal });
            if (response.ok) return await response.json() as { data: T; count?: number; totalCount?: number };
            if (attempt === 5) throw new CatalogUnavailableError();
          }
          throw new CatalogUnavailableError();
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

  async function allPages<T>(resource: string, query?: string, requestedPageSize = pageSize): Promise<T[]> {
    const items: T[] = [];
    let page = 1;
    do {
      const params = new URLSearchParams({ page: String(page), pageSize: String(requestedPageSize) });
      if (query) params.set("q", query);
      const response = await requestData<T[]>(`${resource}?${params}`);
      items.push(...response.data);
      if (items.length >= (response.totalCount ?? items.length) || response.count === 0) break;
      page += 1;
    } while (true);
    return items;
  }

  async function resilientCardPages(query: string): Promise<CardPrinting[]> {
    const pageSizes = [...new Set([pageSize, 50, 25, 10].map((size) => Math.min(pageSize, size)))];
    for (const candidatePageSize of pageSizes) {
      try {
        return (await allPages<ProviderCard>("cards", query, candidatePageSize)).map(mapCard);
      } catch {
        if (candidatePageSize === pageSizes.at(-1)) throw new CatalogUnavailableError();
      }
    }
    throw new CatalogUnavailableError();
  }

  async function priceSortedCardPage(query: string, page: number, requestedPageSize: number, order: PriceOrder) {
    const cards = await resilientCardPages(query);
    const totalCount = cards.length;
    cards.sort((a, b) => {
      if (!a.summaryPrice && b.summaryPrice) return 1;
      if (a.summaryPrice && !b.summaryPrice) return -1;
      const difference = (a.summaryPrice?.amount ?? 0) - (b.summaryPrice?.amount ?? 0);
      if (difference) return order === "price-high" ? -difference : difference;
      return a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
    });
    const start = (page - 1) * requestedPageSize;
    return {
      items: cards.slice(start, start + requestedPageSize), page, pageSize: requestedPageSize, totalCount,
      quotedCount: cards.filter((card) => card.summaryPrice).length,
    };
  }

  return {
    async listSets() {
      return (await allPages<ProviderSet>("sets")).map(mapSet)
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    },
    async getSet(id) {
      try {
        return mapSet((await requestData<ProviderSet>(`sets/${encodeURIComponent(id)}`)).data);
      } catch {
        const safeId = id.replaceAll('"', "");
        const [set] = await allPages<ProviderSet>("sets", `id:\"${safeId}\"`);
        if (!set) throw new CatalogUnavailableError();
        return mapSet(set);
      }
    },
    async listSetRarities(setId) {
      const safeId = setId.replaceAll('"', "");
      const params = new URLSearchParams({ page: "1", pageSize: "250", q: `set.id:\"${safeId}\"`, select: "rarity" });
      const response = await requestData<Array<Pick<ProviderCard, "rarity">>>(`cards?${params}`);
      return [...new Set(response.data.flatMap((card) => card.rarity ? [card.rarity] : []))].sort();
    },
    async getCardPrintingPage(setId, page, requestedPageSize = 12, rarity, priceOrder) {
      const safeId = setId.replaceAll('"', "");
      const safeRarity = rarity?.replaceAll('"', "");
      const safePage = Math.max(1, Math.trunc(page) || 1);
      const safePageSize = Math.min(50, Math.max(1, Math.trunc(requestedPageSize) || 12));
      const cardQuery = `set.id:\"${safeId}\"${safeRarity ? ` rarity:\"${safeRarity}\"` : ""}`;
      if (priceOrder) return priceSortedCardPage(cardQuery, safePage, safePageSize, priceOrder);
      const params = new URLSearchParams({
        page: String(safePage),
        pageSize: String(safePageSize),
        q: cardQuery,
      });
      const response = await requestData<ProviderCard[]>(`cards?${params}`);
      return {
        items: response.data.map(mapCard),
        page: safePage,
        pageSize: safePageSize,
        totalCount: response.totalCount ?? response.data.length,
      };
    },
    async listCardPrintings(setId) {
      const safeId = setId.replaceAll('"', "");
      const query = `set.id:\"${safeId}\"`;
      return resilientCardPages(query);
    },
    async searchCardPrintings(query) {
      const terms = searchQueryTerms(query);
      if (terms.length === 0) return [];
      const providerQuery = terms.map((term) => {
        const safeTerm = escapeLuceneQueryTerm(term);
        return `(name:*${safeTerm}* OR number:${safeTerm}* OR set.name:*${safeTerm}*)`;
      }).join(" AND ");
      const cards = await resilientCardPages(providerQuery);
      return rankAndDeduplicateSearchResults(cards, query);
    },
    async getCardPrinting(id) { return mapCard((await requestData<ProviderCard>(`cards/${encodeURIComponent(id)}`)).data); },
  };
}
