export type Language = "en" | "ja" | "ko" | "zh-cn" | "zh-tw";

export type CatalogSet = {
  id: string;
  language: Language;
  name: string;
  releaseDate: string;
  logoUrl?: string;
  symbolUrl?: string;
  cardCount?: number;
};

export type PriceQuote = {
  variant: string;
  amount?: number;
  currency: "USD" | "JPY" | "EUR";
  source: string;
  observedAt: string;
  stale: boolean;
};

export type CardPrinting = {
  id: string;
  language: Language;
  name: string;
  collectorNumber: string;
  imageUrl?: string;
  set: CatalogSet;
  rarity?: string;
  artist?: string;
  supertype?: string;
  hp?: string;
  types?: string[];
  rules?: string[];
  abilities?: { name: string; text: string }[];
  attacks?: { name: string; text?: string; damage?: string; cost?: string[] }[];
  weaknesses?: { type: string; value: string }[];
  resistances?: { type: string; value: string }[];
  retreatCost?: string[];
  priceQuotes: PriceQuote[];
  summaryPrice?: PriceQuote;
};

export type CardPrintingPage = {
  items: CardPrinting[];
  page: number;
  pageSize: number;
  totalCount: number;
  quotedCount?: number;
};

export type PriceOrder = "price-high" | "price-low";

export interface Catalog {
  listSets(): Promise<CatalogSet[]>;
  getSet(id: string): Promise<CatalogSet>;
  listSetRarities(setId: string): Promise<string[]>;
  getCardPrintingPage(setId: string, page: number, pageSize?: number, rarity?: string, priceOrder?: PriceOrder): Promise<CardPrintingPage>;
  listCardPrintings(setId: string): Promise<CardPrinting[]>;
  searchCardPrintings(query: string): Promise<CardPrinting[]>;
  getCardPrinting(id: string): Promise<CardPrinting>;
}
