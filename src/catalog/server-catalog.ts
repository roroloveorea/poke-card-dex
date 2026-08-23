import "server-only";

import { createPokemonTcgCatalog } from "./pokemon-tcg-catalog";

const DAILY_REFRESH_SECONDS = 86_400;

function catalogRefreshSeconds() {
  const configured = Number.parseInt(process.env.CATALOG_REFRESH_SECONDS ?? "", 10);
  return configured > 0 ? configured : DAILY_REFRESH_SECONDS;
}

export function getCatalog() {
  const revalidate = catalogRefreshSeconds();
  return createPokemonTcgCatalog({
    request: (url, init) => fetch(url, { ...init, cache: "force-cache", next: { revalidate } }),
    apiKey: process.env.POKEMON_TCG_API_KEY ?? "",
    baseUrl: process.env.POKEMON_TCG_API_BASE_URL,
  });
}
