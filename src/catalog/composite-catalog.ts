import type { Catalog } from "./catalog";
import type { CatalogWithSetPages } from "./rarebit-catalog";
import { rankAndDeduplicateSearchResults } from "./search-query";

const RAREBIT_CARD_PREFIX = "rb-card-";
const RAREBIT_SET_PREFIX = "rb-set-";

async function mergeAvailable<T extends { id: string; language?: string }>(calls: [Promise<T[]>, Promise<T[]>]) {
  const results = await Promise.allSettled(calls);
  const available = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const firstRejection = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (results.every((result) => result.status === "rejected")) throw firstRejection?.reason;
  return [...new Map(available.map((item) => [`${item.language ?? ""}:${item.id}`, item])).values()];
}

export function createCompositeCatalog(primary: Catalog, japanese: CatalogWithSetPages): CatalogWithSetPages {
  const setCatalog = (id: string) => id.startsWith(RAREBIT_SET_PREFIX) ? japanese : primary;
  const cardCatalog = (id: string) => id.startsWith(RAREBIT_CARD_PREFIX) ? japanese : primary;

  return {
    listSets() {
      return primary.listSets();
    },
    getSet(id) {
      return setCatalog(id).getSet(id);
    },
    listSetRarities(id) {
      return (setCatalog(id) as CatalogWithSetPages).listSetRarities(id);
    },
    getCardPrintingPage(id, page, pageSize, rarity, priceOrder) {
      return (setCatalog(id) as CatalogWithSetPages).getCardPrintingPage(id, page, pageSize, rarity, priceOrder);
    },
    listCardPrintings(id) {
      return setCatalog(id).listCardPrintings(id);
    },
    async searchCardPrintings(query) {
      return rankAndDeduplicateSearchResults(
        await mergeAvailable([primary.searchCardPrintings(query), japanese.searchCardPrintings(query)]),
        query,
        { filter: false },
      );
    },
    getCardPrinting(id) {
      return cardCatalog(id).getCardPrinting(id);
    },
  };
}
