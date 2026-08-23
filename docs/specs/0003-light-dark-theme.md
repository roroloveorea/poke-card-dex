# PokeCardDex Light and Dark Theme

## Status

Backlog — not scheduled for implementation.

## Product promise

A collector can use PokeCardDex in a crisp light theme or a low-glare dark theme while the interface keeps its recognizable red, blue, black, and Poké Ball-inspired identity.

## Goals

- Provide complete light and dark color themes across every page and reusable component.
- Give the dark theme a grey-blue-black atmosphere rather than a flat or pure-black appearance.
- Retain red and blue as the principal Pokémon-inspired accents in both themes.
- Let the collector switch themes from a control that is easy to find and use on desktop and mobile.
- Respect the device color-scheme preference on a collector's first visit.
- Remember an explicit theme choice across pages and future visits on the same device.
- Keep text, controls, focus indicators, status colors, and card imagery accessible in both themes.

## Visual direction

### Light theme

- Preserve the current bright paper-and-white-surface treatment.
- Continue using near-black for primary text, red for brand and primary emphasis, and blue for links, focus, and secondary emphasis.
- Keep borders and shadows cool and restrained so cards remain the visual focus.

### Dark theme

- Use a very dark grey-blue page background, with subtly lighter blue-grey surfaces and raised cards.
- Avoid pure black for large backgrounds; reserve near-black for strong borders, controls, and the Poké Ball motif where it remains distinguishable.
- Use brighter, dark-theme-safe versions of the existing red and blue accents so they remain vivid and readable.
- Render primary text as a cool off-white and secondary text as a lighter muted blue-grey.
- Keep depth visible through surface contrast, borders, and restrained shadows rather than heavy glow effects.
- Preserve the red, blue, black, and white structure of brand motifs without making card artwork look recolored or dimmed.

Suggested starting tokens, subject to contrast testing:

- Page background: `#0d141c`
- Surface: `#15212d`
- Raised surface: `#1b2a38`
- Primary text: `#eef4fa`
- Muted text: `#a9b8c7`
- Border: `#334657`
- Red accent: `#ff5a5f`
- Blue accent: `#64aee8`

## Theme behavior

- The interface exposes two user-facing choices: Light and Dark.
- On the first visit, with no saved choice, the active theme follows `prefers-color-scheme`.
- Choosing Light or Dark applies immediately without a page reload.
- An explicit choice persists locally and overrides later device-theme changes.
- Navigation does not reset the active theme.
- The correct theme is applied before the page becomes visible, avoiding a flash of the other theme during initial load.
- Browser-native controls and the browser color scheme are told which theme is active.
- The experience remains fully usable when JavaScript or browser storage is unavailable; the device preference is the fallback.

## Theme control

- Place the theme control in the shared site header so it is available throughout the application.
- Give the control an accessible name that communicates both its action and current state.
- Do not rely on a sun or moon icon alone; visible text or an equivalent unambiguous label is required.
- Make the control keyboard operable, visibly focused, and large enough to use comfortably on touch screens.
- Ensure it fits the existing mobile header without causing horizontal page overflow.

## Component coverage

Both themes cover at least:

- Page background, header, navigation, and footer
- Home hero and artwork overlay
- Headings, body copy, muted text, and links
- Buttons and all hover, active, disabled, busy, and focus states
- Search, select, checkbox, and filter controls
- Set, card, result, status, loading, and empty-state surfaces
- Pagination and selected navigation states
- Card detail artwork frame and metadata dividers
- Success, warning, and error treatments
- Design-system swatches and specimens

## Accessibility and quality constraints

- Normal text and interactive labels meet WCAG AA contrast in both themes.
- Large text and non-text UI boundaries meet their applicable WCAG AA contrast requirements.
- Focus indicators remain clearly visible against every surface in both themes.
- Information is never communicated by red or blue color alone.
- Hover, active, selected, disabled, error, and loading states remain distinguishable in both themes.
- Theme changes introduce no horizontal overflow at 320 px and no layout shift beyond the control's own state change.
- Theme transitions, if used, respect `prefers-reduced-motion` and do not animate card artwork.

## Acceptance criteria

- A collector can switch between Light and Dark from every page using the shared header control.
- A first visit follows the collector's device color-scheme preference.
- A collector's explicit selection persists after navigation, refresh, and a new browser session on the same device.
- The saved selection takes precedence over the device preference.
- The initial render does not visibly flash the inactive theme.
- The active theme sets an appropriate browser `color-scheme` value for native controls.
- Every shared component listed in Component coverage has an intentional light and dark treatment.
- Dark mode uses a grey-blue-black foundation while retaining recognizable red and blue Pokémon-inspired accents.
- Card artwork and provider images retain their original colors.
- Automated tests cover initial device preference, switching, and persistence behavior.
- Keyboard and screen-reader checks confirm that the theme control exposes an understandable name and state.
- Contrast checks pass for primary text, muted text, links, controls, focus rings, borders, and status states in both themes.
- Both themes pass responsive checks at 320 px and representative desktop widths.

## Explicit non-goals

- Additional custom themes or user-selected accent colors
- Per-page theme settings
- Synchronizing the theme choice across user accounts or devices
- Recoloring Pokémon card images, set logos, or provider artwork
- Redesigning page structure or navigation as part of the theme work
