import { describe, expect, it, vi } from "vitest";

import { createCompositeCatalog } from "./composite-catalog";
import type { CatalogWithSetPages } from "./rarebit-catalog";

function catalog(overrides: Partial<CatalogWithSetPages>): CatalogWithSetPages {
  return {
    listSets: vi.fn(async () => []),
    getSet: vi.fn(),
    listSetRarities: vi.fn(async () => []),
    getCardPrintingPage: vi.fn(),
    listCardPrintings: vi.fn(async () => []),
    searchCardPrintings: vi.fn(async () => []),
    getCardPrinting: vi.fn(),
    ...overrides,
  } as CatalogWithSetPages;
}

describe("composite catalog", () => {
  it("merges English and Japanese searches and routes RareBit ids", async () => {
    const englishCard = { id: "base1-4", language: "en" as const, name: "Charizard", collectorNumber: "4", set: { id: "base1", language: "en" as const, name: "Base", releaseDate: "1999-01-09" }, priceQuotes: [] };
    const japaneseCard = { ...englishCard, id: "rb-card-uuid", language: "ja" as const, name: "リザードン", set: { ...englishCard.set, id: "rb-set-sv2a", language: "ja" as const, name: "ポケモンカード151" } };
    const primary = catalog({ searchCardPrintings: vi.fn(async () => [englishCard]) });
    const japanese = catalog({ searchCardPrintings: vi.fn(async () => [japaneseCard]), getCardPrinting: vi.fn(async () => japaneseCard) });
    const combined = createCompositeCatalog(primary, japanese);

    expect(await combined.searchCardPrintings("charizard")).toEqual([englishCard, japaneseCard]);
    expect(await combined.getCardPrinting("rb-card-uuid")).toBe(japaneseCard);
    expect(japanese.getCardPrinting).toHaveBeenCalledWith("rb-card-uuid");
    expect(primary.getCardPrinting).not.toHaveBeenCalled();
  });

  it("keeps working when one search provider is unavailable", async () => {
    const englishCard = { id: "base1-4", language: "en" as const, name: "Charizard", collectorNumber: "4", set: { id: "base1", language: "en" as const, name: "Base", releaseDate: "1999-01-09" }, priceQuotes: [] };
    const combined = createCompositeCatalog(
      catalog({ searchCardPrintings: vi.fn(async () => [englishCard]) }),
      catalog({ searchCardPrintings: vi.fn(async () => { throw new Error("RareBit down"); }) }),
    );
    expect(await combined.searchCardPrintings("charizard")).toEqual([englishCard]);
  });
});
