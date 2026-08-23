import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "PokeCardDex",
  description: "Identify exact Pokémon card printings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            PokeCardDex
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
