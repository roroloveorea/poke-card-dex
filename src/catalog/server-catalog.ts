import "server-only";

import { createPokemonTcgCatalog } from "./pokemon-tcg-catalog";

export function getCatalog() {
  return createPokemonTcgCatalog({
    request: fetch,
    apiKey: process.env.POKEMON_TCG_API_KEY ?? "",
  });
}
