import Link from "next/link";

export default function EasternSetsPage() {
  return <section className="page-shell"><Link className="text-link" href="/sets">← Catalogs</Link><p className="eyebrow">Eastern catalog</p><h1>Choose a language.</h1><p className="intro">Each catalog contains sets verified by the language-specific card database.</p><ul className="set-grid"><li><Link className="set-tile" href="/sets/eastern/japanese"><strong>Japanese</strong><span>日本語</span><span>Browse sets →</span></Link></li><li><Link className="set-tile" href="/sets/eastern/korean"><strong>Korean</strong><span>한국어</span><span>Browse sets →</span></Link></li><li><Link className="set-tile" href="/sets/eastern/chinese"><strong>Chinese</strong><span>简体中文 and 繁體中文</span><span>Browse sets →</span></Link></li></ul></section>;
}
