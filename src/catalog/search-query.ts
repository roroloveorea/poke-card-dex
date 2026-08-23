export function normalizeSearchQuery(query: string) {
  return query.trim().split(/\s+/).filter(Boolean).join(" ");
}

export function searchQueryTerms(query: string) {
  const normalized = normalizeSearchQuery(query);
  return normalized ? normalized.split(" ") : [];
}
