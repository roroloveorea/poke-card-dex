# PokeCardDex Catalog Search

## Status

Draft for product review.

## Product promise

A collector can enter whatever identifying detail they remember—a card name, collector number, or set name—and reach the intended card printing without knowing the catalog's exact wording.

## Goals

- Search card-printing names using case-insensitive term matching.
- Search set names using case-insensitive term matching and return the card printings in matching sets.
- Search collector numbers, including numbers with a printed suffix such as `TG01` or `123a`.
- Combine terms across fields so a query such as `charizard 01` can match card name plus collector number.
- Make every result identifiable by card name, language, set, collector number, image when available, and summary price when available.
- Keep English and Japanese card printings visibly distinct.
- Lead every result to a stable exact-printing page.
- Work well on mobile and desktop without exposing provider credentials to the browser.

## Search interpretation

- Leading and trailing whitespace is ignored.
- Name and set-name matching is case-insensitive.
- A query is split into whitespace-separated terms after normalization.
- Each term may match anywhere in the card-printing name or set name, or match the start of the collector number. Matching is case-insensitive.
- All query terms must match somewhere across the same card printing's combined identity; terms do not need to match the same field or appear in field order.
- For example, `charizard` matches every available Charizard printing, `charizard 01` matches Charizard printings whose collector number begins with `01`, and `charizard rocket` matches Charizard printings from a set whose name contains `rocket`.
- Collector-number matching preserves meaningful letters and punctuation, so terms such as `TG01` and `123a` remain searchable.
- One query is evaluated across card-printing name, collector number, and set name; the collector does not choose a search mode.
- A card printing that matches more than one field appears only once.
- Results are deterministic. Results with more exact term matches precede partial matches; otherwise results use newest set release first, then collector number.
- The MVP does not interpret price, rarity, artist, gameplay text, spelling corrections, or fuzzy similarity as search fields.

## User journey

1. The collector enters a card name, collector number, or set-name keyword in the prominent search bar.
2. They submit the query and see matching card printings.
3. They distinguish results by language, set, collector number, image, and available summary price.
4. They open the intended exact card printing.
5. They can edit or clear the query without navigating back to Home.

## Search experience

- The search bar is available from Home and remains available on the results page.
- Submitting only whitespace does not contact the provider and instead prompts for a card name, collector number, or set name.
- The submitted query is represented in the URL so results are linkable and browser navigation behaves predictably.
- The results heading repeats the normalized query and exposes the result count when known.
- A no-results state explains the supported fields and keeps the search bar ready for another query.
- Provider timeout or failure retains navigation, preserves the query, and offers a retry action.
- Results may be paginated or progressively loaded when providers impose result limits, but every available match must remain reachable.

## Result content

Each result includes:

- Card-printing name
- Language
- Set name
- Collector number
- Card image and accessible alternative text when available
- One deterministic ungraded summary price in native currency, or `Price unavailable`
- A stable link to the exact card printing

## Data and technical constraints

- Search executes on the server through the provider-neutral catalog interface.
- Provider query syntax and response shapes do not leak into page components or browser-delivered code.
- Provider credentials remain server-only.
- Search inputs are encoded safely before becoming provider queries.
- Provider result limits, pagination, timeouts, malformed fields, missing images, and missing prices are expected states.
- Search responses follow the catalog's daily caching policy where provider terms permit it.
- English and Japanese provider capabilities may differ, but the public search behavior remains consistent.

## Acceptance criteria

- A case-insensitive partial card-name term returns every available card printing satisfying the complete query.
- A case-insensitive partial set-name term returns card printings from matching sets when every other query term also matches that printing.
- A collector-number term returns matching card printings across sets and supported languages.
- Terms can match across fields; `charizard 01` returns Charizard printings whose collector number begins with `01`.
- Every query term must match the same card printing, preventing results that satisfy only part of the query.
- One query searches all three fields without a mode selector.
- Duplicate card printings are removed when multiple fields match.
- Results with more exact term matches precede partial matches deterministically.
- Every result displays card name, language, set, collector number, and an available summary price or `Price unavailable`.
- Selecting a result opens the exact card-printing page.
- Empty, no-results, provider-error, and retry states preserve usable navigation and search controls.
- The query is represented in the URL and works with refresh, browser back, and browser forward.
- Search is keyboard usable and has no horizontal overflow at 320 px.
- No provider credential or provider-specific query is exposed in browser-delivered code.

## Explicit non-goals

- Fuzzy spelling correction or semantic search
- Autocomplete or search suggestions
- Searching by price, rarity, artist, Pokémon type, attacks, abilities, or rules text
- Combining English and Japanese releases into one card printing
- User-specific recent searches or saved searches
