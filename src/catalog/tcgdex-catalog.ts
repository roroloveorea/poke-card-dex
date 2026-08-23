import type { CardPrinting, CatalogSet, Language, PriceQuote } from "./catalog";
import type { CatalogWithSetPages } from "./rarebit-catalog";
import { normalizeSearchQuery } from "./search-query";

export type EasternLanguage = Extract<Language, "ja" | "ko" | "zh-cn" | "zh-tw">;
type PriceOrder = "price-high" | "price-low";

type TcgDexResponse = { ok: boolean; json(): Promise<unknown> };
type TcgDexRequest = (url: string, init: { signal: AbortSignal }) => Promise<TcgDexResponse>;
type SetSummary = { id: string; name: string; logo?: string; symbol?: string; cardCount: { total: number; official: number } };
type SetDetail = SetSummary & { releaseDate?: string; cards?: CardSummary[] };
type CardSummary = { id: string; localId: string; name: string; image?: string };
type CardDetail = CardSummary & {
  category?: string;
  illustrator?: string;
  hp?: number | string;
  types?: string[];
  set: SetSummary;
  abilities?: { name: string; effect: string }[];
  attacks?: { name: string; effect?: string; damage?: number | string; cost?: string[] }[];
  weaknesses?: { type: string; value?: string }[];
  resistances?: { type: string; value?: string }[];
  retreat?: number;
  variants?: { holo?: boolean; normal?: boolean; reverse?: boolean };
  pricing?: {
    cardmarket?: {
      updated?: string;
      unit?: string;
      avg?: number | null;
      "avg-holo"?: number | null;
    } | null;
  };
};

const REQUEST_TIMEOUT_MS = 8_000;
const DAY_MS = 86_400_000;

export class TcgDexUnavailableError extends Error {
  constructor() {
    super("The Eastern card catalog is temporarily unavailable.");
    this.name = "TcgDexUnavailableError";
  }
}

function setPrefix(language: EasternLanguage) {
  return `tdx-${language}-set-`;
}

function cardPrefix(language: EasternLanguage) {
  return `tdx-${language}-card-`;
}

function providerId(id: string, prefix: string) {
  if (!id.startsWith(prefix) || id.length === prefix.length) throw new TcgDexUnavailableError();
  return id.slice(prefix.length);
}

function mapSet(set: SetSummary | SetDetail, language: EasternLanguage): CatalogSet {
  return {
    id: `${setPrefix(language)}${set.id}`,
    language,
    name: set.name,
    releaseDate: "releaseDate" in set ? set.releaseDate ?? "" : "",
    logoUrl: set.logo,
    symbolUrl: set.symbol,
    cardCount: set.cardCount.total,
  };
}

function cardImageUrl(image: string | undefined, quality: "low" | "high") {
  if (!image) return undefined;
  if (/\/(?:low|high)\.(?:webp|png|jpe?g)$/i.test(image)) return image;
  return `${image.replace(/\/+$/, "")}/${quality}.webp`;
}

function mapCardmarketQuotes(card: CardDetail): PriceQuote[] {
  const market = card.pricing?.cardmarket;
  if (!market || market.unit !== "EUR" || !market.updated) return [];
  const stale = Date.now() - new Date(market.updated).getTime() > DAY_MS;
  return [
    { variant: "Normal · Average", amount: market.avg },
    { variant: "Holo · Average", amount: market["avg-holo"] },
  ].flatMap(({ variant, amount }) => typeof amount === "number" && amount > 0 ? [{
    variant,
    amount,
    currency: "EUR" as const,
    source: "Cardmarket via TCGdex",
    observedAt: market.updated as string,
    stale,
  }] : []);
}

function mapCardSummary(card: CardSummary, set: CatalogSet, language: EasternLanguage): CardPrinting {
  return {
    id: `${cardPrefix(language)}${card.id}`,
    language,
    name: card.name,
    collectorNumber: card.localId,
    imageUrl: cardImageUrl(card.image, "low"),
    set,
    priceQuotes: [],
  };
}

function mapCardDetail(card: CardDetail, set: CatalogSet, language: EasternLanguage, imageQuality: "low" | "high" = "high"): CardPrinting {
  const priceQuotes = mapCardmarketQuotes(card);
  return {
    ...mapCardSummary(card, set, language),
    imageUrl: cardImageUrl(card.image, imageQuality),
    artist: card.illustrator,
    supertype: card.category,
    hp: card.hp === undefined ? undefined : String(card.hp),
    types: card.types,
    abilities: card.abilities?.map((ability) => ({ name: ability.name, text: ability.effect })),
    attacks: card.attacks?.map((attack) => ({
      name: attack.name,
      text: attack.effect,
      damage: attack.damage === undefined ? undefined : String(attack.damage),
      cost: attack.cost,
    })),
    weaknesses: card.weaknesses?.map((weakness) => ({ type: weakness.type, value: weakness.value ?? "" })),
    resistances: card.resistances?.map((resistance) => ({ type: resistance.type, value: resistance.value ?? "" })),
    retreatCost: card.retreat === undefined ? undefined : Array.from({ length: card.retreat }, () => "Colorless"),
    priceQuotes,
    summaryPrice: priceQuotes[0],
  };
}

export function createTcgdexCatalog({ language, request, baseUrl = "https://api.tcgdex.net/v2", timeoutMs = REQUEST_TIMEOUT_MS }: {
  language: EasternLanguage;
  request: TcgDexRequest;
  baseUrl?: string;
  timeoutMs?: number;
}): CatalogWithSetPages {
  const providerBaseUrl = `${baseUrl.replace(/\/+$/, "")}/${language}`;

  async function requestJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await request(`${providerBaseUrl}/${path}`, { signal: controller.signal });
          if (!response.ok) throw new TcgDexUnavailableError();
          return await response.json() as T;
        })(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            reject(new TcgDexUnavailableError());
          }, timeoutMs);
        }),
      ]);
    } catch {
      throw new TcgDexUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getSetDetail(id: string) {
    return requestJson<SetDetail>(`sets/${encodeURIComponent(providerId(id, setPrefix(language)))}`);
  }

  return {
    async listSets() {
      return (await requestJson<SetSummary[]>("sets")).toReversed().map((set) => mapSet(set, language));
    },
    async getSet(id) {
      return mapSet(await getSetDetail(id), language);
    },
    async listSetRarities() {
      return [];
    },
    async getCardPrintingPage(setId, page, pageSize = 12, _rarity?: string, _priceOrder?: PriceOrder) {
      const safePage = Math.max(1, Math.trunc(page) || 1);
      const safePageSize = Math.min(50, Math.max(1, Math.trunc(pageSize) || 12));
      const setDetail = await getSetDetail(setId);
      const set = mapSet(setDetail, language);
      const start = (safePage - 1) * safePageSize;
      const cardSummaries = setDetail.cards ?? [];
      const visibleSummaries = cardSummaries.slice(start, start + safePageSize);
      const items = await Promise.all(visibleSummaries.map(async (summary) => {
        try {
          return mapCardDetail(await requestJson<CardDetail>(`cards/${encodeURIComponent(summary.id)}`), set, language, "low");
        } catch {
          return mapCardSummary(summary, set, language);
        }
      }));
      return { items, page: safePage, pageSize: safePageSize, totalCount: cardSummaries.length, quotedCount: items.filter((card) => card.summaryPrice).length };
    },
    async listCardPrintings(setId) {
      const setDetail = await getSetDetail(setId);
      const set = mapSet(setDetail, language);
      return (setDetail.cards ?? []).map((card) => mapCardSummary(card, set, language));
    },
    async searchCardPrintings(query) {
      const normalized = normalizeSearchQuery(query);
      if (!normalized) return [];
      const params = new URLSearchParams({ name: normalized });
      const cards = await requestJson<CardSummary[]>(`cards?${params}`);
      return Promise.all(cards.map(async (card) => {
        const detail = await requestJson<CardDetail>(`cards/${encodeURIComponent(card.id)}`);
        const setDetail = await requestJson<SetDetail>(`sets/${encodeURIComponent(detail.set.id)}`);
        return mapCardDetail(detail, mapSet(setDetail, language), language);
      }));
    },
    async getCardPrinting(id) {
      const detail = await requestJson<CardDetail>(`cards/${encodeURIComponent(providerId(id, cardPrefix(language)))}`);
      const setDetail = await requestJson<SetDetail>(`sets/${encodeURIComponent(detail.set.id)}`);
      return mapCardDetail(detail, mapSet(setDetail, language), language);
    },
  };
}
