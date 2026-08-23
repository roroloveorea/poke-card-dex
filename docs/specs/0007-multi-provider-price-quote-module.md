# Multi-Provider Price Quote Module

## Status

Backlog — not scheduled for implementation.

## Parent epic

[`0005-multi-provider-on-demand-pricing-epic.md`](0005-multi-provider-on-demand-pricing-epic.md)

## Depends on

[`0006-price-provider-research-and-approval.md`](0006-price-provider-research-and-approval.md)

## Outcome

Create one deep pricing module whose small interface returns normalized results for an exact card printing while hiding provider fan-out, credentials, timeouts, identity mapping, deduplication, and response normalization.

## Module design

The external interface should remain conceptually small:

```ts
getLatestQuotes(cardIdentity): Promise<PriceLookupResult>
```

Callers provide provider-neutral exact-printing identity and receive normalized quotes plus provider-level freshness and failure metadata. Page modules do not select providers, build provider queries, interpret raw responses, or merge quote arrays.

Each true external pricing provider is implemented as an adapter at an internal seam. Production uses HTTP adapters; tests use mock adapters. Provider-specific fields and failure modes do not become part of the external interface.

## Exact-printing identity

The provider-neutral request contains enough information to disambiguate:

- Language and market region
- Canonical set identity and provider aliases when known
- Collector number, including prefixes, suffixes, and printed denominator when available
- Card name as a supporting signal, never the sole identity
- Variant or finish when the request targets one
- Known external identifiers stored from catalog ingestion

The module returns no quote for an ambiguous mapping. Match decisions are observable in structured diagnostics without exposing provider internals to the browser.

## Normalized quote requirements

Every usable quote represents one comparable offer or market observation and records:

- Card-printing identity
- Variant or finish
- Grading state and condition when supplied
- Amount and native currency
- Quote kind, such as market estimate, listing, or completed sale
- Marketplace or price source
- Data provider when different from the marketplace
- Provider observation time and application fetch time
- Attribution or destination URL when permitted and required
- Freshness state

The domain must distinguish marketplace or price source from the data provider instead of overloading one `source` string.

## Aggregation rules

- Preserve individual quotes; do not average unlike sources, variants, conditions, quote kinds, or currencies.
- Deduplicate the same underlying marketplace observation when it arrives through more than one data provider.
- Return partial success when at least one provider yields a valid quote.
- Isolate timeouts, rate limits, authentication errors, malformed responses, and missing mappings per provider.
- Reject non-positive amounts, unsupported currencies, impossible timestamps, and incomplete provenance.
- Apply deterministic ordering independent of provider response timing.

## Acceptance criteria

- At least two production adapters satisfy the internal provider seam.
- Page modules use only the provider-neutral pricing interface.
- Adding a third adapter does not require changes to card-detail page logic.
- Exact-printing ambiguity produces a safe no-quote result with structured diagnostics.
- One adapter can time out or fail while another returns usable quotes.
- Duplicate marketplace observations are collapsed without losing provenance.
- Tests exercise the pricing module through its external interface using mock adapters.
- Tests cover exact matches, ambiguous matches, variant separation, condition separation, partial success, total failure, malformed data, and deterministic ordering.
- Provider credentials and raw responses never cross into browser-delivered code.

## Explicit non-goals

- Rendering the pricing panel
- Scheduling refreshes or defining browser interaction
- Currency conversion
- Persisting historical price series
- Defining provider-specific behavior in page modules
