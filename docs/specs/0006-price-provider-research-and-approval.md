# Price Provider Research and Approval

## Status

Backlog — not scheduled for implementation.

## Parent epic

[`0005-multi-provider-on-demand-pricing-epic.md`](0005-multi-provider-on-demand-pricing-epic.md)

## Outcome

Select at least one additional legitimate English-market pricing provider to complement the Pokémon TCG API's embedded TCGplayer quotes, with enough documented information to implement exact-printing lookup safely.

## Research scope

Evaluate candidate providers for:

- English set and card-printing coverage, especially newly released sets
- Stable identifiers or sufficient fields to match set, collector number, language, variant, and condition
- Market-price, listing-price, and completed-sale semantics
- Native currencies and supported regions
- Observation timestamps and update cadence
- Authentication, quotas, latency, uptime, and pagination
- Commercial-use, caching, storage, attribution, deep-linking, and image terms
- Sandbox or test access
- Cost at expected card-detail traffic levels
- A documented escalation path for missing or incorrect mappings

## Required deliverable

Record a comparison table and a decision for each candidate: adopt, trial, defer, or reject. For every adopted or trial provider, document:

- Authoritative documentation and terms links
- The exact-printing identity fields used for matching
- Supported quote kinds, variants, conditions, and currencies
- Required attribution and marketplace-link behavior
- Rate limits, timeout budget, caching allowance, and retention limit
- Credential requirements and rotation process
- Known coverage gaps and failure behavior
- Estimated cost under low, expected, and burst traffic

## Acceptance criteria

- At least three plausible providers are evaluated using current primary documentation and direct sample responses.
- At least one provider in addition to the existing Pokémon TCG API/TCGplayer path is approved for a bounded implementation trial.
- Exact-printing matching is demonstrated on common, promotional, secret-numbered, and newly released cards.
- False-match risks are documented for set aliases, collector-number suffixes, regional releases, variants, and language.
- Provider terms explicitly permit the intended server-side requests, caching duration, attribution, and displayed fields.
- Rate limits and expected cost support automatic lookup on card-page entry, or the ticket records a required product adjustment.
- No implementation ticket is considered ready until its chosen provider's matching and usage constraints are recorded.

## Explicit non-goals

- Implementing a provider adapter
- Scraping providers whose terms or technical controls do not permit it
- Selecting a provider based only on advertised card count
- Assuming that a listed asking price represents a completed sale or fair market value
