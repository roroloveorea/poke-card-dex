import "server-only";

import { createCompositeCatalog } from "./composite-catalog";
import { createPokemonTcgCatalog } from "./pokemon-tcg-catalog";
import { createRareBitCatalog } from "./rarebit-catalog";
import { createTcgdexCatalog, type EasternLanguage } from "./tcgdex-catalog";

const DAILY_REFRESH_SECONDS = 86_400;

function catalogRefreshSeconds() {
  const configured = Number.parseInt(process.env.CATALOG_REFRESH_SECONDS ?? "", 10);
  return configured > 0 ? configured : DAILY_REFRESH_SECONDS;
}

export function getCatalog() {
  const revalidate = catalogRefreshSeconds();
  const request = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => fetch(url, { ...init, cache: "force-cache", next: { revalidate } });
  const primary = createPokemonTcgCatalog({
    request,
    apiKey: process.env.POKEMON_TCG_API_KEY ?? "",
    baseUrl: process.env.POKEMON_TCG_API_BASE_URL,
  });
  const rareBitKey = process.env.RAREBIT_API_KEY?.trim();
  if (!rareBitKey) return primary;
  return createCompositeCatalog(primary, createRareBitCatalog({
    request,
    apiKey: rareBitKey,
    baseUrl: process.env.RAREBIT_API_BASE_URL,
  }));
}

export function getEasternCatalog(language: EasternLanguage) {
  const revalidate = catalogRefreshSeconds();
  return createTcgdexCatalog({
    language,
    request: (url, init) => fetch(url, { ...init, cache: "force-cache", next: { revalidate } }),
    baseUrl: process.env.TCGDEX_API_BASE_URL,
  });
}
