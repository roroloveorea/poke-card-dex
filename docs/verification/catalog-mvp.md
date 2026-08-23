# Catalog MVP verification

## Automated checks

Run from the repository root:

```bash
npm test
npm run test:e2e
npm run typecheck
npm run verify:browser-safety
```

`npm test` covers the provider-neutral catalog adapter and the Home, set-directory, set-detail, search, and exact-printing render seams.

`npm run test:e2e` builds and starts the application against isolated local provider boundaries, then runs Chromium journeys for combined-field matching, deduplication, deterministic ranking, Japanese JPY summaries, exact-printing links, refresh/back/forward state, empty/no-result/provider-timeout/retry states, credential isolation, keyboard use, display-currency persistence, and responsive overflow. Provider fixtures prove the public contract; they do not represent production provider approval or live coverage.

## Pokémon-themed UI verification

The browser suite covers Home, set directory, set detail, search results, and exact-printing detail at 320 px, 768 px, and 1280 px. It asserts:

- no horizontal overflow at each viewport;
- keyboard entry through the skip link and a visible 3 px focus outline;
- primary/footer navigation and single-page-heading semantics;
- WCAG AA body-text contrast;
- reduced-motion suppression for opt-in Poké Ball animation;
- persisted USD, JPY, and EUR selection without changing card-result order;
- provider-error, empty, no-result, artwork-fallback, and loading-state behavior through unit and browser seams.

Intentional Chromium visual baselines live beside [`e2e/theme-ui.spec.ts`](../../e2e/theme-ui.spec.ts) in `e2e/theme-ui.spec.ts-snapshots/`. Update them only after reviewing desktop Home, set directory, set detail, search result, printing detail, and mobile Home renders.

The bundled Home hero has fixed intrinsic dimensions and responsive `sizes`; runtime provider images reserve card/set aspect ratios and replace missing or failed images with a text-labelled themed fallback. See [artwork sources](../artwork-sources.md).

## Display-currency verification

Prices remain provider-native domain data. The shared display component may convert USD, JPY, or EUR for presentation, but sorting continues to use the original quotes. The server reads the ECB daily reference-rate XML, caches the request for one day, and exposes only the normalized EUR-base snapshot to the browser. Rates older than four days are considered stale; stale, malformed, or unavailable rates leave the original quote visible with an explanation.

The selector stores the preference locally and in a same-site cookie. Converted values always show the original amount/currency plus the European Central Bank source and observation date. ECB reference rates are informational rather than transaction rates.

`npm run verify:browser-safety` starts a local provider boundary, creates and starts a real production build, then visits the directory, set, search, and exact-card journeys repeatedly. It proves provider responses are reused inside a controlled refresh window and fetched again after that boundary. The provider asserts that every external request originates on the server with the credential header, while browser responses and built browser artifacts are checked for the credential marker, provider hostname, header name, and provider query syntax.

## Supplemental browser acceptance procedure

For exploratory verification beyond the automated browser suite:

1. Run `npm run build && npm start`.
2. On Home, use Tab and Enter to submit a name-only, collector-number-only, and combined search such as `charizard 01`.
3. Confirm each result shows language, set, collector number, summary-price state, and an exact-printing link.
4. Browse `/sets`, open a set, apply a whole-set rarity/order control, page forward and backward, filter the visible page by partial name, and reset a zero-result filter.
5. Open a card and confirm each available ungraded quote shows variant, native currency, source, observation time, and stale state. Confirm missing prices say `Price unavailable` and never show zero.
6. Simulate or intercept a provider failure on directory, set, search, and card routes; confirm navigation remains and the retry link preserves the route/query.
7. Repeat the critical journey with a 320 px viewport. Confirm the document has no horizontal overflow and every control and link remains keyboard reachable with a visible focus indicator.

## Production Japanese-provider constraint

The combined Japanese search implementation is available only when a RareBit key is configured. It paginates provider results, keeps Japanese identity distinct, and maps eligible ungraded YuYuTei quotes to JPY summaries. The [Japanese provider decision](../research/0001-japanese-catalog-provider.md) still requires plan-specific production display/cache rights and a Japanese-only set-directory guarantee before production enablement. Automated fixtures validate behavior but must not be presented as evidence of those external rights or live catalog completeness.
