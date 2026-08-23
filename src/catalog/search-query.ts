import type { CardPrinting } from "./catalog";

export function normalizeSearchQuery(query: string) {
  return query.trim().split(/\s+/).filter(Boolean).join(" ");
}

export function searchQueryTerms(query: string) {
  const normalized = normalizeSearchQuery(query);
  return normalized ? normalized.split(" ") : [];
}

function normalizedFields(card: CardPrinting) {
  return {
    name: card.name.toLocaleLowerCase(),
    collectorNumber: card.collectorNumber.toLocaleLowerCase(),
    setName: card.set.name.toLocaleLowerCase(),
  };
}

export function cardMatchesSearch(card: CardPrinting, query: string) {
  const fields = normalizedFields(card);
  return searchQueryTerms(query).map((term) => term.toLocaleLowerCase()).every((term) =>
    fields.name.includes(term)
      || fields.collectorNumber.startsWith(term)
      || fields.setName.includes(term),
  );
}

function exactTermCount(card: CardPrinting, terms: string[]) {
  const fields = normalizedFields(card);
  return terms.reduce((count, term) => count + Number(
    fields.name === term || fields.collectorNumber === term || fields.setName === term,
  ), 0);
}

export function rankAndDeduplicateSearchResults(cards: CardPrinting[], query: string, { filter = true }: { filter?: boolean } = {}) {
  const terms = searchQueryTerms(query).map((term) => term.toLocaleLowerCase());
  const unique = new Map<string, CardPrinting>();
  for (const card of cards) {
    const key = `${card.language}:${card.id}`;
    if (!unique.has(key)) unique.set(key, card);
  }

  const candidates = filter ? [...unique.values()].filter((card) => cardMatchesSearch(card, query)) : [...unique.values()];
  return candidates.sort((a, b) => {
    const exactDifference = exactTermCount(b, terms) - exactTermCount(a, terms);
    if (exactDifference) return exactDifference;
    const releaseDifference = b.set.releaseDate.replaceAll("/", "-").localeCompare(a.set.releaseDate.replaceAll("/", "-"));
    if (releaseDifference) return releaseDifference;
    const collectorDifference = a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true, sensitivity: "base" });
    if (collectorDifference) return collectorDifference;
    const languageDifference = a.language.localeCompare(b.language);
    return languageDifference || a.id.localeCompare(b.id);
  });
}
