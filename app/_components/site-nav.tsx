"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", active: (path: string) => path === "/" },
  { href: "/sets", label: "Catalogs", active: (path: string) => path.startsWith("/sets") },
  { href: "/design-system", label: "Design system", active: (path: string) => path === "/design-system" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={link.active(pathname) ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link className="header-search" href="/search" aria-label="Search card printings" aria-current={pathname === "/search" ? "page" : undefined}>Search</Link>
    </>
  );
}
