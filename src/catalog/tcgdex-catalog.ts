import type { CardPrinting, CatalogSet, Language } from "./catalog";
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
};

const REQUEST_TIMEOUT_MS = 8_000;

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

function mapCardSummary(card: CardSummary, set: CatalogSet, language: EasternLanguage): CardPrinting {
  return {
    id: `${cardPrefix(language)}${card.id}`,
    language,
    name: card.name,
    collectorNumber: card.localId,
    imageUrl: card.image,
    set,
    priceQuotes: [],
  };
}

function mapCardDetail(card: CardDetail, set: CatalogSet, language: EasternLanguage): CardPrinting {
  return {
    ...mapCardSummary(card, set, language),
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
      const cards = (setDetail.cards ?? []).map((card) => mapCardSummary(card, set, language));
      const start = (safePage - 1) * safePageSize;
      return { items: cards.slice(start, start + safePageSize), page: safePage, pageSize: safePageSize, totalCount: cards.length, quotedCount: 0 };
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
