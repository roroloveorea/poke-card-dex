import { describe, expect, it } from "vitest";

import type { CardPrinting } from "./catalog";
import { cardMatchesSearch, rankAndDeduplicateSearchResults } from "./search-query";

function card(id: string, overrides: Partial<CardPrinting> = {}): CardPrinting {
  return {
    id,
    language: "en",
    name: "Charizard ex",
    collectorNumber: "01",
    set: { id: `set-${id}`, language: "en", name: "Team Rocket", releaseDate: "2025-01-01" },
    priceQuotes: [],
    ...overrides,
  };
}

describe("public catalog search contract", () => {
  it("requires every term to match the same printing across name, number, or set name in any order", () => {
    const printing = card("match");
    expect(cardMatchesSearch(printing, "charizard 01 rocket")).toBe(true);
    expect(cardMatchesSearch(printing, "ROCKET charizard 01")).toBe(true);
    expect(cardMatchesSearch(printing, "charizard 99 rocket")).toBe(false);
  });

  it("deduplicates by language and stable id without merging languages", () => {
    const english = card("shared");
    const japanese = card("shared", { language: "ja", set: { ...english.set, language: "ja" } });
    expect(rankAndDeduplicateSearchResults([english, english, japanese], "charizard")).toEqual([english, japanese]);
  });

  it("ranks exact fields, newest releases, collector numbers, and stable ids deterministically", () => {
    const partial = card("partial", { name: "Charizard ex", collectorNumber: "10" });
    const oldExact = card("old-exact", { name: "Charizard", collectorNumber: "12", set: { ...partial.set, releaseDate: "2023-01-01" } });
    const numberTwo = card("number-two", { name: "Charizard", collectorNumber: "2" });
    const numberTenB = card("b", { name: "Charizard", collectorNumber: "10" });
    const numberTenA = card("a", { name: "Charizard", collectorNumber: "10" });

    expect(rankAndDeduplicateSearchResults([partial, numberTenB, oldExact, numberTwo, numberTenA], "charizard").map(({ id }) => id)).toEqual([
      "number-two",
      "a",
      "b",
      "old-exact",
      "partial",
    ]);
  });
});
