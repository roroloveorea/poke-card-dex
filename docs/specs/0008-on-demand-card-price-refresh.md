# On-Demand Card Price Refresh

## Status

Backlog — not scheduled for implementation.

## Parent epic

[`0005-multi-provider-on-demand-pricing-epic.md`](0005-multi-provider-on-demand-pricing-epic.md)

## Depends on

- [`0006-price-provider-research-and-approval.md`](0006-price-provider-research-and-approval.md)
- [`0007-multi-provider-price-quote-module.md`](0007-multi-provider-price-quote-module.md)

## Product behavior

When a collector opens an exact card-printing page, the pricing area automatically requests the freshest permitted multi-provider result for that card. Card identity and non-price details remain usable while pricing refreshes.

## Refresh lifecycle

1. Render the exact card identity and any valid cached quotes.
2. If the cached result is within the configured freshness window, use it without contacting providers.
3. Otherwise start one server-side lookup for the exact printing.
4. Deduplicate concurrent lookups for the same printing and lookup policy.
5. Enforce per-provider and whole-request deadlines.
6. Publish successful normalized results to the pricing area as one coherent update.
7. Cache results only for durations permitted by each provider.
8. Retain stale cached quotes with a clear label when refresh fails and policy permits stale display.

## Operational constraints

- The browser calls only a PokeCardDex server interface; it never contacts providers directly.
- Automatic lookup is bounded by provider quotas, cost controls, circuit breakers, and concurrency limits.
- Cache keys include exact card identity and any dimensions that change quote meaning.
- Negative results use a shorter cache window than successful results so new-release pricing can appear promptly.
- Provider rate limiting produces a retry-after state rather than immediate repeated requests.
- Refreshing the browser cannot bypass deduplication or provider quotas.
- Automated clients and prefetching must not accidentally trigger expensive lookups at uncontrolled scale.
- Lookup logs exclude credentials and minimize retention of visitor-identifying data.

## Acceptance criteria

- Opening an exact card page starts a refresh automatically only when its cached result is not sufficiently fresh.
- Valid cached quotes render without waiting for provider responses.
- Concurrent visits to the same exact printing share one in-flight lookup.
- The whole refresh has a deterministic deadline and cannot block card details indefinitely.
- Partial provider success produces usable results and records which providers failed.
- Total failure preserves permitted stale quotes or shows a retryable unavailable state.
- Rate-limited and circuit-open states do not create rapid retry loops.
- Provider requests originate only from the server and contain no user-supplied raw provider query.
- Tests use fake time and mock adapters to cover fresh cache, stale cache, cold lookup, deduplication, timeout, partial success, total failure, and rate limiting.
- Metrics expose lookup volume, cache-hit ratio, latency, provider success rate, rate limiting, ambiguous mappings, and quote freshness without recording secrets.

## Explicit non-goals

- Continuous refresh while the page remains open
- Refreshing every card in a set when a set page is viewed
- Circumventing provider quotas through client-side calls
- Claiming that a recently fetched quote is a guaranteed real-time transaction price
