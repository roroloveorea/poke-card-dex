# Multi-Source Price Panel

## Status

Backlog — not scheduled for implementation.

## Parent epic

[`0005-multi-provider-on-demand-pricing-epic.md`](0005-multi-provider-on-demand-pricing-epic.md)

## Depends on

- [`0007-multi-provider-price-quote-module.md`](0007-multi-provider-price-quote-module.md)
- [`0008-on-demand-card-price-refresh.md`](0008-on-demand-card-price-refresh.md)

## Product promise

A collector can understand and compare available prices for one exact card printing without mistaking different variants, conditions, currencies, or quote kinds for equivalent values.

## Pricing-area states

- **Refreshing with cached quotes:** keep cached values visible and identify that fresher sources are being checked.
- **Refreshing without cached quotes:** show a compact progress state without blocking card details.
- **Fresh results:** announce the update without moving keyboard focus.
- **Partial results:** show successful quotes and a restrained notice that some sources were unavailable.
- **Stale fallback:** show the last permitted observations with their dates and a stale label.
- **No coverage:** explain that no approved provider matched this exact printing.
- **Temporary failure:** preserve a retry control with bounded behavior.

## Information hierarchy

Group quotes first by variant or finish, then distinguish condition and quote kind. Each displayed quote includes:

- Native amount and currency
- Optional converted display amount without replacing the original
- Marketplace or price source
- Data provider when different
- Market estimate, listing, or completed-sale label
- Condition and grading state when applicable
- Observation time and freshness
- Permitted attribution or destination link

The interface must not present one unexplained “best price” across unlike quotes. If a summary is later introduced, its deterministic eligibility and selection rule must be visible and tested.

## Interaction and accessibility

- Price updates use an appropriately polite live region.
- Loading does not repeatedly announce every provider transition.
- Provider errors do not steal focus or hide successful results.
- Source names and states use text, not logos or color alone.
- Links clearly identify that they open an external marketplace when applicable.
- The panel remains usable at 320 px without horizontal scrolling; wide comparisons stack instead of forcing a table.
- Reduced-motion preferences disable nonessential refresh animation.

## Acceptance criteria

- Opening an exact card printing shows a clear refresh state while preserving all non-price content.
- Cached quotes remain readable during refresh and are replaced only by a coherent completed result.
- Quotes for different variants, conditions, quote kinds, or native currencies are visually separated.
- Every quote exposes source, provider when different, native currency, observation time, and freshness.
- Partial provider failure does not hide successful quotes.
- No-coverage, stale-fallback, rate-limited, and temporary-failure states have distinct, understandable copy.
- Screen readers receive one concise status update when refreshed results settle.
- Keyboard focus remains stable when results update.
- Currency conversion preserves the original quote and provenance.
- Responsive and accessibility tests cover loading, success, partial, stale, unavailable, and retry states.

## Explicit non-goals

- Hiding provider identity behind a proprietary PokeCardDex score
- Ranking marketplaces by sponsorship or affiliate relationship without disclosure
- Combining raw listing prices with completed sales into one average
- Showing graded and ungraded prices in the same unlabeled group
- Automatically navigating a visitor to a marketplace
