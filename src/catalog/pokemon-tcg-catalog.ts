import type { Catalog, CardPrinting } from "./catalog";

type ProviderCard = {
  id: string;
  name: string;
  number: string;
  images: { large: string };
  set: { id: string; name: string; releaseDate: string };
};

type ProviderResponse = {
  ok: boolean;
  json(): Promise<{ data: ProviderCard }>;
};

type RequestCard = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<ProviderResponse>;

export class CatalogUnavailableError extends Error {
  constructor() {
    super("The card catalog is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
  }
}

export function createPokemonTcgCatalog({
  request,
  apiKey,
  timeoutMs = 8_000,
}: {
  request: RequestCard;
  apiKey: string;
  timeoutMs?: number;
}): Catalog {
  return {
    async getCardPrinting(id: string): Promise<CardPrinting> {
      const controller = new AbortController();
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            const response = await request(
              `https://api.pokemontcg.io/v2/cards/${id}`,
              {
                headers: { "X-Api-Key": apiKey },
                signal: controller.signal,
              },
            );
            if (!response.ok) throw new CatalogUnavailableError();

            const { data } = await response.json();
            return {
              id: data.id,
              language: "en" as const,
              name: data.name,
              collectorNumber: data.number,
              imageUrl: data.images.large,
              set: data.set,
            };
          })(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              controller.abort();
              reject(new CatalogUnavailableError());
            }, timeoutMs);
          }),
        ]);
      } catch {
        throw new CatalogUnavailableError();
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
