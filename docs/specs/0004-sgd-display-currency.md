# PokeCardDex SGD Display Currency

## Status

Backlog — not scheduled for implementation.

## Product promise

A collector in Singapore can view card-price estimates in Singapore dollars while still seeing the original market quote and its source.

## Goals

- Add Singapore dollars (`SGD`) to the existing display-currency selector.
- Convert supported USD, JPY, and EUR market quotes to SGD using the same reference-rate pipeline as the existing display currencies.
- Preserve the original quoted amount, currency, market source, and observation time alongside every conversion.
- Remember SGD as a display preference across pages and future visits on the same device.
- Keep conversion failures honest and non-blocking by falling back to the original quote.

## Currency and formatting rules

- SGD is a display currency, not a claim that the underlying card was quoted or can be purchased in Singapore dollars.
- Format converted values with `Intl.NumberFormat` using the `SGD` currency code and a Singapore-appropriate locale.
- Display the explicit `SGD` code with the formatted amount so the `$` symbol cannot be confused with USD.
- Use the latest permitted SGD reference rate from the configured exchange-rate source and show its source and observation date.
- Apply the same rounding policy used for the other display currencies; do not round intermediate conversion values before formatting.
- Never overwrite or mutate the provider's original price quote.
- Do not convert an unavailable price or display it as zero.
- When a rate is loading, missing, invalid, or stale beyond the application's accepted boundary, show the original quote and explain that conversion is unavailable.

## User journey

1. The collector opens the shared display-currency selector.
2. They choose `SGD`.
3. Visible price quotes update to Singapore dollars without a page reload.
4. Each converted price identifies its original amount and the reference-rate provenance.
5. The selection remains active after navigation, refresh, and a later browser session on the same device.

## Data and technical constraints

- Extend the shared display-currency type and runtime validation to include `SGD`.
- Request and validate a positive finite SGD rate in the server-side exchange-rate response.
- Keep exchange-rate fetching and normalization on the server; the browser receives no provider credentials.
- Preserve EUR as the current reference-rate base unless the exchange-rate integration changes independently.
- Include SGD when checking whether a cached exchange-rate snapshot is structurally valid.
- Preserve existing USD, JPY, and EUR behavior.
- Treat an unsupported or corrupted saved currency value as invalid and fall back to the existing default.

## Acceptance criteria

- `SGD` appears as an option in the display-currency selector on desktop and mobile.
- Selecting SGD immediately converts every available USD, JPY, or EUR display price to SGD without reloading the page.
- SGD amounts are visibly labeled `SGD` and use appropriate currency formatting.
- Every converted amount retains the original amount and currency, rate source, and rate observation date in its supporting text.
- The SGD selection persists after navigation, refresh, and a new browser session on the same device.
- A valid SGD selection restored from storage is accepted by runtime validation.
- Missing, malformed, or stale SGD rate data leaves the original market quote visible and presents the existing conversion-unavailable explanation.
- Price-unavailable states remain `Price unavailable` and are never converted to zero.
- Automated tests cover rate parsing, USD-to-SGD conversion, EUR-to-SGD conversion, selector persistence, formatting, and unavailable-rate fallback.
- Existing USD, JPY, and EUR conversion tests continue to pass.
- The selector and converted-price supporting text cause no horizontal overflow at 320 px.

## Explicit non-goals

- Sourcing native Singapore marketplace prices
- Currency conversion for buying, selling, checkout, accounting, or tax purposes
- Historical SGD exchange-rate charts
- User-entered or manually overridden exchange rates
- Automatically selecting SGD from IP geolocation
