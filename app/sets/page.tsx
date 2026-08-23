import Link from "next/link";
export default async function SetsPage() {
  return <section className="page-shell"><p className="eyebrow">Set catalog</p><h1>Choose a catalog.</h1><p className="intro">Start with the English catalog or explore Eastern releases by language.</p><ul className="set-grid"><li><Link className="set-tile" href="/sets/english"><strong>English</strong><span>Western releases</span><span>Browse sets →</span></Link></li><li><Link className="set-tile" href="/sets/eastern"><strong>Eastern</strong><span>Japanese, Korean, and Chinese</span><span>Choose a language →</span></Link></li></ul></section>;
}
