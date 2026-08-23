export type Language = "en" | "ja";

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
  currency: "USD" | "JPY";
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

export interface Catalog {
  listSets(): Promise<CatalogSet[]>;
  getSet(id: string): Promise<CatalogSet>;
  listCardPrintings(setId: string): Promise<CardPrinting[]>;
  searchCardPrintings(query: string): Promise<CardPrinting[]>;
  getCardPrinting(id: string): Promise<CardPrinting>;
}
