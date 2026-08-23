import type { Catalog, CardPrinting, CatalogSet, PriceQuote } from "./catalog";
import { normalizeSearchQuery } from "./search-query";

type RareBitResponse = { ok: boolean; json(): Promise<unknown> };
type RareBitRequest = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<RareBitResponse>;
type Pagination = { limit: number; offset: number; total: number; hasMore: boolean };
type ListResponse<T> = { data: T[]; pagination?: Pagination };
type RareBitSet = {
  code: string;
  name: string;
  releaseDate?: string;
  cardCount?: number;
  totalCards?: number;
  imageUrl?: string;
  printRegion: string;
};
type RareBitCard = {
  id: string;
  name: string;
  number: string;
  printedNumber?: string;
  rarity?: string;
  gameCode: string;
  availableLanguages?: string[];
  set: { code: string; name: string; logoUrl?: string; printRegion: string };
  artist?: { name?: string } | string;
  supertype?: string;
  hp?: string | number;
  types?: string[];
  attributes?: {
    rules?: string[];
    abilities?: { name: string; text: string }[];
    attacks?: { name: string; text?: string; damage?: string; cost?: string[] }[];
    weaknesses?: { type: string; value: string }[];
    resistances?: { type: string; value: string }[];
    retreatCost?: string[];
  };
};
type RareBitImage = {
  id: string;
  imageUrl?: string;
  images?: { face: string; size: string; locale?: string; url: string }[];
};
type RareBitPrice = {
  source: string;
  variant: string;
  language?: string;
  price?: number;
  currency: string;
  condition?: string | null;
  printing?: string | null;
  grading?: unknown | null;
  capturedAt: string;
};
type RareBitCurrentPrices = { sources?: RareBitPrice[] };
type PriceOrder = "price-high" | "price-low";

export type CatalogWithSetPages = Catalog & {
  listSetRarities(setId: string): Promise<string[]>;
  getCardPrintingPage(setId: string, page: number, pageSize?: number, rarity?: string, priceOrder?: PriceOrder): Promise<{
    items: CardPrinting[];
    page: number;
    pageSize: number;
    totalCount: number;
    quotedCount?: number;
  }>;
};

const CARD_PREFIX = "rb-card-";
const SET_PREFIX = "rb-set-";
const DAY_MS = 86_400_000;

export class RareBitUnavailableError extends Error {
  constructor() {
    super("The Japanese card catalog is temporarily unavailable.");
    this.name = "RareBitUnavailableError";
  }
}

function providerCardId(id: string) {
  if (!id.startsWith(CARD_PREFIX) || id.length === CARD_PREFIX.length) throw new RareBitUnavailableError();
  return id.slice(CARD_PREFIX.length);
}

function providerSetCode(id: string) {
  if (!id.startsWith(SET_PREFIX) || id.length === SET_PREFIX.length) throw new RareBitUnavailableError();
  return id.slice(SET_PREFIX.length);
}

function dateOnly(value?: string) {
  return value?.slice(0, 10) ?? "";
}

function mapSet(set: RareBitSet): CatalogSet {
  return {
    id: `${SET_PREFIX}${set.code}`,
    language: "ja",
    name: set.name,
    releaseDate: dateOnly(set.releaseDate),
    logoUrl: set.imageUrl,
    cardCount: set.cardCount ?? set.totalCards,
  };
}

function titleCase(value: string) {
  return value.toLocaleLowerCase().split("_").map((part) => part ? `${part[0].toLocaleUpperCase()}${part.slice(1)}` : part).join(" ");
}

function mapYuYuTeiQuotes(prices: RareBitCurrentPrices): PriceQuote[] {
  return (prices.sources ?? [])
    .filter((quote) => quote.source === "YUYUTEI" && quote.language === "ja" && quote.currency === "JPY" && quote.grading == null)
    .map((quote) => ({
      variant: [quote.printing, quote.condition, quote.variant].filter((part): part is string => Boolean(part)).map(titleCase).join(" · "),
      amount: typeof quote.price === "number" && quote.price > 0 ? quote.price : undefined,
      currency: "JPY" as const,
      source: "YuYuTei via RareBit",
      observedAt: quote.capturedAt,
      stale: Date.now() - new Date(quote.capturedAt).getTime() > DAY_MS,
    }));
}

function imageForCard(image?: RareBitImage) {
  return image?.images?.find((candidate) => candidate.locale === "ja" && candidate.face === "FRONT" && candidate.size === "LARGE")?.url
    ?? image?.images?.find((candidate) => candidate.locale === "ja" && candidate.face === "FRONT")?.url
    ?? image?.imageUrl;
}

function mapCard(card: RareBitCard, set: CatalogSet, image?: RareBitImage, priceQuotes: PriceQuote[] = []): CardPrinting {
  return {
    id: `${CARD_PREFIX}${card.id}`,
    language: "ja",
    name: card.name,
    collectorNumber: card.printedNumber ?? card.number,
    imageUrl: imageForCard(image),
    set,
    rarity: card.rarity,
    artist: typeof card.artist === "string" ? card.artist : card.artist?.name,
    supertype: card.supertype,
    hp: card.hp === undefined ? undefined : String(card.hp),
    types: card.types,
    rules: card.attributes?.rules,
    abilities: card.attributes?.abilities,
    attacks: card.attributes?.attacks,
    weaknesses: card.attributes?.weaknesses,
    resistances: card.attributes?.resistances,
    retreatCost: card.attributes?.retreatCost,
    priceQuotes,
    summaryPrice: priceQuotes.find((quote) => quote.amount !== undefined),
  };
}

export function createRareBitCatalog({ request, apiKey, timeoutMs = 8_000, baseUrl = "https://api.rarebit.app/api" }: {
  request: RareBitRequest;
  apiKey: string;
  timeoutMs?: number;
  baseUrl?: string;
}): CatalogWithSetPages {
  const providerBaseUrl = baseUrl.replace(/\/+$/, "");

  async function requestJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await request(`${providerBaseUrl}/v1/public/${path}`, {
            headers: { "X-API-Key": apiKey, "x-lang": "ja" },
            signal: controller.signal,
          });
          if (!response.ok) throw new RareBitUnavailableError();
          return await response.json() as T;
        })(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            reject(new RareBitUnavailableError());
          }, timeoutMs);
        }),
      ]);
    } catch {
      throw new RareBitUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getSetByCode(code: string) {
    const response = await requestJson<RareBitSet | { data: RareBitSet }>(`catalog/sets/${encodeURIComponent(code)}`);
    return mapSet("data" in response ? response.data : response);
  }

  async function getImages(ids: string[]) {
    if (ids.length === 0) return new Map<string, RareBitImage>();
    const batches = Array.from({ length: Math.ceil(ids.length / 20) }, (_, index) => ids.slice(index * 20, index * 20 + 20));
    const responses = await Promise.all(batches.map((batch) => {
      const params = new URLSearchParams({ kind: "card", ids: batch.join(",") });
      return requestJson<{ data: RareBitImage[] }>(`catalog/images?${params}`);
    }));
    return new Map(responses.flatMap((response) => response.data).map((item) => [item.id, item]));
  }

  async function enrichCards(cards: RareBitCard[]) {
    const pokemonCards = cards.filter((card) => card.gameCode === "pokemon_tcg" && card.availableLanguages?.includes("ja"));
    const setCodes = [...new Set(pokemonCards.map((card) => card.set.code))];
    const [images, sets] = await Promise.all([
      getImages(pokemonCards.map((card) => card.id)),
      Promise.all(setCodes.map(async (code) => [code, await getSetByCode(code)] as const)),
    ]);
    const setsByCode = new Map(sets);
    return pokemonCards.map((card) => mapCard(card, setsByCode.get(card.set.code) ?? mapSet({ ...card.set }), images.get(card.id)));
  }

  async function listCards(params: URLSearchParams) {
    params.set("printedIn", "ja");
    params.set("region", "EAST");
    params.set("fallback", "ja,en");
    const response = await requestJson<ListResponse<RareBitCard>>(`catalog/cards?${params}`);
    return { cards: await enrichCards(response.data), pagination: response.pagination };
  }

  async function everyCardInSet(setCode: string, rarity?: string) {
    const cards: CardPrinting[] = [];
    let offset = 0;
    do {
      const params = new URLSearchParams({ setCode, limit: "100", offset: String(offset) });
      if (rarity) params.set("rarity", rarity);
      const page = await listCards(params);
      cards.push(...page.cards);
      if (!page.pagination?.hasMore) break;
      offset += page.pagination.limit;
    } while (true);
    return cards;
  }

  function sortByPrice(cards: CardPrinting[], order: PriceOrder) {
    return cards.sort((a, b) => {
      if (!a.summaryPrice && b.summaryPrice) return 1;
      if (a.summaryPrice && !b.summaryPrice) return -1;
      const difference = (a.summaryPrice?.amount ?? 0) - (b.summaryPrice?.amount ?? 0);
      return difference ? (order === "price-high" ? -difference : difference) : a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
    });
  }

  return {
    // RareBit's EAST set list also contains Chinese and Korean exclusives. Until
    // the API exposes set-level printed-language evidence, do not mislabel it.
    async listSets() {
      return [];
    },
    async getSet(id) {
      return getSetByCode(providerSetCode(id));
    },
    async listSetRarities(setId) {
      const cards = await everyCardInSet(providerSetCode(setId));
      return [...new Set(cards.flatMap((card) => card.rarity ? [card.rarity] : []))].sort();
    },
    async getCardPrintingPage(setId, page, pageSize = 12, rarity, priceOrder) {
      const safePage = Math.max(1, Math.trunc(page) || 1);
      const safePageSize = Math.min(50, Math.max(1, Math.trunc(pageSize) || 12));
      const cards = await everyCardInSet(providerSetCode(setId), rarity);
      if (priceOrder) sortByPrice(cards, priceOrder);
      const start = (safePage - 1) * safePageSize;
      return { items: cards.slice(start, start + safePageSize), page: safePage, pageSize: safePageSize, totalCount: cards.length, quotedCount: cards.filter((card) => card.summaryPrice).length };
    },
    async listCardPrintings(setId) {
      return everyCardInSet(providerSetCode(setId));
    },
    async searchCardPrintings(query) {
      const normalized = normalizeSearchQuery(query);
      if (!normalized) return [];
      return (await listCards(new URLSearchParams({ q: normalized, limit: "20", offset: "0" }))).cards;
    },
    async getCardPrinting(id) {
      const providerId = providerCardId(id);
      const [cardResponse, images, prices] = await Promise.all([
        requestJson<RareBitCard | { data: RareBitCard }>(`catalog/cards/${encodeURIComponent(providerId)}`),
        getImages([providerId]),
        requestJson<RareBitCurrentPrices>(`prices/CARD/${encodeURIComponent(providerId)}/current`),
      ]);
      const card = "data" in cardResponse ? cardResponse.data : cardResponse;
      if (card.gameCode !== "pokemon_tcg" || !card.availableLanguages?.includes("ja")) throw new RareBitUnavailableError();
      const set = await getSetByCode(card.set.code);
      const quotes = mapYuYuTeiQuotes(prices);
      return mapCard(card, set, images.get(providerId), quotes);
    },
  };
}
