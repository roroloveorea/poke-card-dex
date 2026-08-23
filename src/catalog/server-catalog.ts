import "server-only";

import { createPokemonTcgCatalog } from "./pokemon-tcg-catalog";

export function getCatalog() {
  return createPokemonTcgCatalog({
    request: (url, init) => fetch(url, { ...init, next: { revalidate: 86_400 } }),
    apiKey: process.env.POKEMON_TCG_API_KEY ?? "",
  });
}
