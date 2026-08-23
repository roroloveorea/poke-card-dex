import Link from "next/link";
import { PokeBall } from "@/app/_components/poke-ball";
export default async function SetsPage() {
  return <section className="page-shell"><p className="eyebrow">Set catalog</p><h1>Choose a catalog.</h1><p className="intro">Start with the English catalog or explore Eastern releases by language.</p><ul className="set-grid"><li><Link className="set-tile" href="/sets/english"><PokeBall variant="great" size="badge" /><strong>English</strong><span>Western releases</span><span>Browse sets →</span></Link></li><li><Link className="set-tile" href="/sets/eastern"><PokeBall variant="poke" size="badge" /><strong>Eastern</strong><span>Japanese, Korean, and Chinese</span><span>Choose a language →</span></Link></li></ul></section>;
}
