import type { CSSProperties } from "react";
import { PokeBall } from "@/app/_components/poke-ball";

const colors = [
  ["Ink", "#101418", "var(--color-ink)"],
  ["Paper", "#f6f8fb", "var(--color-paper)"],
  ["Poké red", "#d62828", "var(--color-red)"],
  ["League blue", "#1769aa", "var(--color-blue)"],
  ["Success", "#237a46", "var(--color-success)"],
  ["Warning", "#9a6700", "var(--color-warning)"],
  ["Error", "#b42318", "var(--color-error)"],
];

export default function DesignSystemPage() {
  return (
    <section className="page-shell design-system">
      <p className="eyebrow">Reference page</p>
      <h1>Trainer UI kit.</h1>
      <p className="intro">Reusable color, type, spacing, shape, elevation, focus, and motion tokens for a crisp collector experience.</p>

      <section aria-labelledby="palette-heading"><h2 id="palette-heading">Core palette</h2><ul className="swatch-grid">{colors.map(([name, value, token]) => <li key={name} style={{ "--swatch": value } as CSSProperties}><span aria-hidden="true" /><strong>{name}</strong><code>{token}</code></li>)}</ul><p className="token-note">Status uses an icon, label, or message as well as color.</p></section>

      <section aria-labelledby="type-heading"><h2 id="type-heading">Typography</h2><div className="specimen"><p className="display-sample">Display / 800</p><p className="heading-sample">Heading / 800</p><p>Body / 400 — built for dense card identities and relaxed reading.</p><p className="eyebrow">Label / 800</p></div></section>

      <section aria-labelledby="controls-heading"><h2 id="controls-heading">Controls and states</h2><div className="component-row"><button className="button">Primary action</button><button className="button button-secondary">Secondary</button><button className="button" disabled>Disabled</button><a className="text-link" href="#controls-heading">Text link</a></div><div className="status-grid"><p className="status-card status-success"><strong>✓ Success</strong><span>Catalog synced.</span></p><p className="status-card status-warning"><strong>! Warning</strong><span>Quote may be stale.</span></p><p className="status-card status-error"><strong>× Error</strong><span>Provider unavailable.</span></p></div></section>

      <section aria-labelledby="motifs-heading"><h2 id="motifs-heading">Ball motifs</h2><p>One component scales from inline icons to decorative loading accents. Text always carries meaning alongside the motif.</p><div className="component-row ball-showcase"><PokeBall variant="poke" label="Poké Ball motif" size="badge" motion /><PokeBall variant="great" label="Great Ball motif" size="badge" /><PokeBall variant="ultra" label="Ultra Ball motif" size="badge" /><PokeBall variant="master" label="Master Ball motif" size="badge" /></div></section>

      <section aria-labelledby="tokens-heading"><h2 id="tokens-heading">Token scale</h2><dl className="token-list"><div><dt>Spacing</dt><dd>4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px</dd></div><div><dt>Radii</dt><dd>8 · 12 · 18 px · pill</dd></div><div><dt>Borders</dt><dd>1 px subtle · 2 px strong</dd></div><div><dt>Shadows</dt><dd>small · card · floating</dd></div><div><dt>Focus</dt><dd>3 px blue ring with 3 px offset</dd></div><div><dt>Motion</dt><dd>120 ms quick · 220 ms standard; disabled with reduced motion</dd></div></dl></section>
    </section>
  );
}
