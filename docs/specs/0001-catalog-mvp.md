# PokeCardDex Catalog MVP

## Status

Draft for product review.

## Product promise

A collector can discover the latest English or Japanese Pokémon sets, open one, and scroll through its card printings with useful rarity and price context before inspecting an exact printing.

## Goals

- Browse English and Japanese sets as distinct, language-specific releases.
- Feature the latest available sets directly on Home rather than making collectors start in a directory.
- Browse every available card printing in a set.
- Show indicative prices in the set grid so collectors do not need to open every printing.
- Let collectors browse a set in rarity-first order by default or reorder it by price.
- Search for a card printing by name.
- Identify an exact printing by set and collector number.
- Display ungraded prices by variant rather than presenting one ambiguous card value.
- Display English-market quotes in USD and Japanese-market quotes in JPY.
- Show the source and observation time beside every price quote.
- Work well on mobile and desktop.
- Avoid requiring accounts or a database for the first release.

## Delivery strategy

Development starts with an end-to-end English catalog slice because the identified Pokémon TCG API provides strong English metadata, images, search, and marketplace price fields.

Japanese catalog metadata and legitimate JPY pricing require a separate provider research spike. Japanese support remains part of the MVP acceptance criteria; completing the English slice alone does not complete the MVP.

## User journeys

### Browse by set

1. The collector opens Home and sees the latest available sets.
2. They choose an English or Japanese release.
3. They scroll through the set's card-printing grid with prices visible on each card.
4. They keep the default rarity-first order, narrow the grid to one or more rarities, or reorder it by indicative price.
5. They open an exact card printing when they want its full details and variant price quotes.

### Search by card name

1. The collector enters a partial or complete card name.
2. They see matching printings, each identified by set and collector number.
3. They open the intended printing.
4. They inspect details and available variant price quotes.

## Pages

### Home

- Product purpose and unofficial-project disclosure
- Prominent card search
- A visually prominent latest-sets section populated from the provider
- English and Japanese releases visibly distinguished
- Set name, release date, artwork or logo, and card count when available
- A route from every featured set to its card-printing grid
- Loading, empty, and retryable provider-error states
- A secondary route to browse the complete set directory

### Set directory

- Language filter
- Deterministic newest-first ordering
- Set name, release date, logo or symbol, and card count when available
- Loading, empty, and provider-error states

### Set detail

- Set identity and release metadata
- Responsive card-printing grid
- Case-insensitive partial-name filtering
- An indicative price summary on every card tile, using the native currency and a clearly identified ungraded variant
- `Price unavailable` on tiles without a quote; missing prices never display as zero
- Default rarity-first ordering, with a deterministic fallback for missing or equal rarity
- Controls to include or exclude available rarities without losing the collector's place unnecessarily
- Price ordering from highest to lowest or lowest to highest; unavailable prices always follow quoted prices
- Price source and observation time available in the set-page context without opening every card
- Stable links to exact card printings
- Resettable zero-results state

### Card-printing detail

- Card image and accessible alternative text
- Name, language, set, collector number, rarity, and artist when available
- Relevant gameplay fields only when present
- Separate price quote for every supported ungraded variant
- Native currency, price source, and human-readable observation time
- Explicit unavailable and stale-price states
- Indicative-price disclaimer

## Price rules

- Prices refresh no more than once per day for the MVP.
- A cached quote may be served between refreshes.
- Missing prices display `Price unavailable`, never zero.
- Quotes from different currencies are not compared or combined.
- PokeCardDex does not claim that a quote is a guaranteed sale value.
- The external provider is never called directly from the visitor's browser.
- A card tile's summary price uses one deterministic supported ungraded variant selected by the provider adapter; it never combines variants.
- Reordering by price compares only quotes in the set's native market currency.

## Data-source requirements

A provider must have legitimate access terms and supply enough information to map responses into the domain terms in `CONTEXT.md`.

For each card printing, the application needs:

- Stable provider identifier
- Language
- Set identity
- Collector number
- Name and image URL
- Optional rarity, artist, and gameplay fields
- Supported ungraded variants
- Price amount, native currency, source, and observation time when available

The application must isolate provider-specific response shapes behind a provider interface so English and Japanese integrations do not leak into page components.

## Technical constraints

- Fetch catalog and price data on the server.
- Cache external responses to protect provider limits and improve page speed.
- Keep provider credentials server-only.
- Do not add a database merely to render the initial catalog.
- Preserve a path to durable price history and user collections later.
- Treat provider timeouts, missing fields, missing images, and missing prices as expected states.

## Acceptance criteria

- A visitor can reach any available set from the set directory.
- Home displays the latest available sets in deterministic newest-first order and links each one to its set page.
- English and Japanese releases are visibly distinguished and never silently merged.
- A set page renders every available card printing, with pagination permitted.
- Name filtering is case-insensitive and produces a clear empty state.
- Every visible card tile includes its rarity when available and an indicative native-currency price or `Price unavailable`.
- A set initially renders in deterministic rarity-first order.
- A visitor can narrow a set by its available rarities and reset that selection.
- A visitor can order quoted card printings by price in either direction; unavailable prices remain after quoted prices.
- A visitor can scroll through card printings and compare their summary prices without opening each detail page.
- Every card link resolves to an exact set-and-collector-number printing.
- Card pages omit unavailable optional fields instead of rendering blank labels.
- Each displayed price is attached to a variant, native currency, source, and observation time.
- Missing prices never appear as zero.
- Repeat visits use cached data until the daily refresh boundary.
- Provider failure retains navigation and presents a retryable error state.
- Pages have no horizontal overflow at 320 px and remain usable by keyboard.
- No API key or provider credential is present in browser-delivered code.
- Both English and Japanese catalog journeys pass before the MVP is declared complete.

## Explicit non-goals

- User accounts
- Collection and wishlist tracking
- Historical price charts
- Price alerts
- Graded-card prices
- Currency conversion
- Multiple competing price sources for one market
- Card scanning
- Buying, selling, or marketplace checkout
- Languages or regional releases other than English and Japanese

## Open research item

Identify and validate a legitimate Japanese card-metadata and JPY-price provider. Confirm coverage, identifiers, variants, rate limits, caching rights, display attribution, and commercial-use restrictions before implementation depends on it.
