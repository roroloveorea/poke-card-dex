# Multi-Provider On-Demand Pricing Epic

## Status

Backlog — not scheduled for implementation.

## Product promise

When a collector opens an exact card printing, PokeCardDex checks multiple approved pricing providers and presents the freshest trustworthy quotes available without hiding where, when, or for which variant each price was observed.

## User requirement

- Opening an exact card-printing page automatically starts a server-side price refresh for that printing.
- The pricing area communicates that providers are being checked and updates as results become available.
- Existing cached quotes remain visible while fresher quotes are requested.
- One provider's failure does not suppress valid quotes from other providers.
- Every displayed quote identifies its marketplace or price source, native currency, variant or finish, condition when supplied, and observation time.

## Product interpretation of “search online”

PokeCardDex will query approved provider interfaces and marketplace data feeds. It will not run unrestricted search-engine queries, scrape arbitrary webpages, or ask the visitor's browser to contact marketplaces directly. This keeps card matching deterministic, credentials server-only, provider terms reviewable, and prices attributable.

## Delivery tickets

1. [`0006-price-provider-research-and-approval.md`](0006-price-provider-research-and-approval.md) — select legitimate providers and document coverage, terms, identifiers, and operating limits.
2. [`0007-multi-provider-price-quote-module.md`](0007-multi-provider-price-quote-module.md) — establish one deep pricing module with provider adapters behind an internal seam.
3. [`0008-on-demand-card-price-refresh.md`](0008-on-demand-card-price-refresh.md) — start bounded, cached provider lookup when an exact card page is opened.
4. [`0009-multi-source-price-panel.md`](0009-multi-source-price-panel.md) — present loading, partial, fresh, stale, unavailable, and comparison states accessibly.

## Cross-ticket rules

- A card must be matched by exact printing identity, not name alone.
- Ambiguous provider matches are rejected rather than displayed under the wrong card.
- Native provider quotes are preserved; display-currency conversion is a separate presentation step.
- Prices remain indicative and never imply guaranteed sale value, availability, or executable purchase price.
- Provider credentials, provider-specific query syntax, and raw responses remain server-only.
- Each provider has independent timeout, rate-limit, cache, and failure handling.
- Requests for the same printing are deduplicated so concurrent visitors do not create a provider-request storm.
- Provider terms, attribution, caching permissions, and purchase-link rules take precedence over desired product behavior.

## Epic acceptance criteria

- At least two independently useful price-provider adapters are enabled for one supported English card-printing journey.
- Opening an exact card page starts a bounded server-side refresh unless a sufficiently fresh cached result already exists.
- The visitor sees cached quotes immediately when available and sees refreshed results without reloading the page.
- A slow or failed provider cannot delay the page indefinitely or erase successful results from another provider.
- Every quote has exact-printing provenance, native currency, source, variant, observation time, and freshness state.
- No quote obtained from an ambiguous or low-confidence card match is displayed.
- No provider secret or direct provider request is exposed in browser-delivered code.
- Automated tests cover mixed provider success, timeout, rate limiting, malformed data, duplicate quotes, ambiguous identity, stale cache, and total failure.

## Explicit non-goals

- Arbitrary web search or general-purpose web scraping
- Real-time guarantees or continuous background monitoring
- Automated buying, checkout, bidding, or seller contact
- Combining unlike variants, conditions, graded cards, or currencies into one misleading average
- Presenting listing prices as completed-sale values unless a provider explicitly identifies them as such
