export type CardPrinting = {
  id: string;
  language: "en" | "ja";
  name: string;
  collectorNumber: string;
  imageUrl: string;
  set: {
    id: string;
    name: string;
    releaseDate: string;
  };
};

export interface Catalog {
  getCardPrinting(id: string): Promise<CardPrinting>;
}
