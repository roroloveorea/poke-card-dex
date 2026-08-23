# Catalog MVP verification

## Automated checks

Run from the repository root:

```bash
npm test
npm run typecheck
npm run verify:browser-safety
```

`npm test` covers the provider-neutral catalog adapter and the Home, set-directory, set-detail, search, and exact-printing render seams.

`npm run verify:browser-safety` starts a local provider boundary, creates and starts a real production build, then visits the directory, set, search, and exact-card journeys repeatedly. It proves provider responses are reused inside a controlled refresh window and fetched again after that boundary. The provider asserts that every external request originates on the server with the credential header, while browser responses and built browser artifacts are checked for the credential marker, provider hostname, header name, and provider query syntax.

## Browser acceptance procedure

Until automated browser coverage is added, exercise each supported English journey in a production build:

1. Run `npm run build && npm start`.
2. On Home, use Tab and Enter to submit a name-only, collector-number-only, and combined search such as `charizard 01`.
3. Confirm each result shows language, set, collector number, summary-price state, and an exact-printing link.
4. Browse `/sets`, open a set, apply a whole-set rarity/order control, page forward and backward, filter the visible page by partial name, and reset a zero-result filter.
5. Open a card and confirm each available ungraded quote shows variant, native currency, source, observation time, and stale state. Confirm missing prices say `Price unavailable` and never show zero.
6. Simulate or intercept a provider failure on directory, set, search, and card routes; confirm navigation remains and the retry link preserves the route/query.
7. Repeat the critical journey with a 320 px viewport. Confirm the document has no horizontal overflow and every control and link remains keyboard reachable with a visible focus indicator.

## Current blocker

The Catalog MVP cannot be declared complete. The [Japanese provider decision](../research/0001-japanese-catalog-provider.md) records that no evaluated provider currently meets the required Japanese metadata, native-JPY quote, licensing, and daily-caching criteria. Therefore issues #8–#10 and the Japanese automated end-to-end acceptance in #11 remain blocked. Fixtures must not be used to misrepresent that journey as provider-backed.
