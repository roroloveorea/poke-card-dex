import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PokeBall } from "@/app/_components/poke-ball";
import { SiteNav } from "@/app/_components/site-nav";
import { CurrencyProvider, CurrencySelector } from "@/app/_components/currency";

import "./globals.css";

export const metadata: Metadata = {
  title: "PokeCardDex",
  description: "Identify exact Pokémon card printings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CurrencyProvider>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="PokeCardDex home">
              <PokeBall variant="poke" size="badge" />
              <span>PokeCard<span className="brand-accent">Dex</span></span>
            </Link>
            <SiteNav />
            <CurrencySelector />
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div><strong>PokeCardDex</strong><span>Discover every set. Find the exact printing.</span></div>
          <nav aria-label="Footer navigation"><Link href="/sets">Catalogs</Link><Link href="/design-system">Design system</Link></nav>
        </footer>
        </CurrencyProvider>
      </body>
    </html>
  );
}
