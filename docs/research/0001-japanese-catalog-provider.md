# Japanese catalog and JPY-price provider decision

## Decision

**Status: proof of concept added on 2026-08-24; production approval remains blocked.** RareBit now provides enough documented API structure to test Japanese card identity and YuYuTei JPY quote mapping. Production use and a complete Japanese set directory remain blocked until plan-specific display/cache rights are confirmed and the API can distinguish Japanese sets from the broader `EAST` region.

This is a product and licensing blocker, not an adapter limitation. PokeCardDex must not scrape an official or marketplace website, relabel live asking prices as market quotes, infer Japanese printings from English releases, or ship a Japanese tracer backed only by fixtures.

## Required capability

An approvable provider or provider combination must supply:

- legitimate API or licensed-feed access for commercial and non-commercial deployments;
- every supported Japanese set and card printing with stable set/card identifiers, collector number, Japanese identity, image rights, and ungraded variants;
- native JPY quotes attached to an exact ungraded variant, a named price source, and an observation timestamp;
- an explicit missing-price state rather than a zero value;
- documented rate limits, permission to cache catalog and quote responses for one day, credential-handling rules, and display attribution requirements.

## Sources evaluated

| Source | Access and terms | Catalog and identifiers | JPY price evidence | Result |
| --- | --- | --- | --- | --- |
| [TCGdex REST API](https://tcgdex.dev/rest) and [card database](https://github.com/tcgdex/cards-database) | Public HTTPS GET API. The database repository carries an [MIT license](https://github.com/tcgdex/cards-database/blob/master/LICENSE), but no reviewed API terms state a service-level rate limit, one-day response caching right, or required display attribution. Pokémon artwork remains third-party IP. | The schema includes `ja`, stable set/card IDs, images, collector-local IDs, rarity, and ungraded variant flags. This is the strongest metadata candidate. | The documented [Card response](https://tcgdex.dev/rest/card) has identity and variant flags but no native-JPY quote, source, or observation timestamp. Third-party marketplace IDs are not quotes. | **Reject as the complete provider.** Retain as a metadata candidate only after legal/operational terms are confirmed and a compliant JPY-price source is contracted. |
| [Pokémon TCG API](https://docs.pokemontcg.io/) | Public API with optional server-side key. Existing integration provides one-day Next.js caching. | Its published data repository is under [`cards/en`](https://github.com/PokemonTCG/pokemon-tcg-data), and non-English cards remain an [open enhancement request](https://github.com/PokemonTCG/pokemon-tcg-api/issues/78). It cannot identify the Japanese release checklist. | Existing TCGplayer data is USD and English-market oriented, not Japanese native-market JPY. | **Reject for Japanese scope.** Continue using it only for the English catalog. |
| [Rakuten Ichiba Item Search API](https://webservice.rakuten.co.jp/index.php/documentation/ichiba-item-search) | Registered app ID and access key are required. The [terms](https://webservice.rakuten.co.jp/guide/rule) require Rakuten links/branding where applicable, restrict monetization outside Rakuten Affiliate, and restrict copying, altering, and broadly shared storage of returned information. No reviewed rule grants the required one-day public cache. | Returns merchant listing/item codes and keyword results, not an authoritative Japanese set checklist, exact card-printing identifiers, or normalized ungraded variants. Results exclude auctions and C2C inventory. | Returns current JPY asking prices for listings. Those are not a variant-specific market quote, do not provide a quote observation timestamp, and cannot reliably distinguish card condition, language, lot, or sealed product. | **Reject.** Asking-price search cannot be represented as the MVP's `PriceQuote`. |
| [eBay Browse API](https://developer.ebay.com/develop/api/buy/browse_api) | OAuth application token and eBay API license/Buy experience obligations apply. | Returns purchasable listing IDs and seller-authored aspects, not a complete Japanese card catalog or stable set/collector-number printing model. | Listing prices can carry currency but are current asks, not a native-Japanese variant market quote with a validated observation policy. | **Reject.** It is a listing/buying integration, not the required catalog-and-price provider. |
| Official Japanese Pokémon Card Game card search | No documented public API or feed license was found. General website access does not grant bulk extraction, redistribution, image use, or commercial caching rights. | The human-facing database may be authoritative, but automated coverage and identifier stability cannot be depended on without an agreement. | No provider API for ungraded JPY market quotes, source attribution, or observation timestamps was found. | **Reject unless The Pokémon Company grants written API/feed and image rights.** Scraping is out of scope. |
| [RareBit Public API](https://rarebit.app/en/docs) | Paid API keys support `catalog:read` and `prices:read` scopes and must remain server-side. Reviewed public terms do not explicitly grant this project's one-day cache/display policy, so production enablement still needs plan-specific confirmation. | Stable card UUIDs, `printedIn=ja`, Japanese localization, images, and card metadata support a Japanese card tracer. Set-level `EAST` includes Japanese plus Korean and Chinese exclusives, so it is not sufficient for a Japanese-only directory. | Current price series include source, language, currency, condition, printing, grading, and timestamp. The adapter accepts only `YUYUTEI`, `ja`, `JPY`, and ungraded observations. | **Accept for a key-gated proof of concept.** Do not enable in production or claim complete Japanese set coverage until the remaining rights and set-language gaps close. |

## Validated missing-price and freshness behavior

RareBit's documented current-price series can map to `PriceQuote { variant, amount, currency: "JPY", source, observedAt, stale }`. The proof-of-concept adapter applies these constraints:

- an absent Japanese quote maps to `priceQuotes: []` and displays `Price unavailable`, never `¥0`;
- staleness is calculated from RareBit's `capturedAt` timestamp using the configured one-day refresh boundary;
- a marketplace listing's creation/update time must not be substituted for a market-quote observation time;
- production daily caching cannot be approved until the provider explicitly permits it and documents any faster deletion/update obligations.

## Integration constraints for reopening Japanese delivery

Before implementation resumes, record written evidence for all of the following:

1. approved commercial-use and image/display rights;
2. complete Japanese set/card coverage and stable exact-printing identifiers;
3. exact mapping of ungraded variants and native JPY quote methodology;
4. source attribution text and quote observation timestamp semantics;
5. missing/withdrawn quote behavior;
6. request quotas and explicit permission for a 24-hour cache;
7. server-only credentials and key-rotation requirements.

Once approved, the provider adapter must map into the existing `Catalog` interface. Page components must branch only on provider-neutral `language`, `currency`, printing identity, and price state.

## Delivery impact

- #7 is complete through its allowed “MVP blocked” outcome.
- #8 and #9 cannot be implemented without a provider-backed Japanese printing and set catalog.
- #10 cannot return Japanese results until #8 and #9 exist; English search remains available.
- #11 cannot truthfully pass its two-language end-to-end acceptance criteria. English verification can continue, but the Catalog MVP must not be declared complete.
