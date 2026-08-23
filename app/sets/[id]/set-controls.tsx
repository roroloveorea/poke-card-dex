"use client";

const rarityLabels: Record<string, string> = {
  "Illustration Rare": "Illustration Rare (IR)",
  "Special Illustration Rare": "Special Illustration Rare (SIR)",
  "Ultra Rare": "Ultra Rare (UR/SR)",
};

export function SetControls({ action, rarities, rarity, order }: {
  action: string; rarities: string[]; rarity: string; order: string;
}) {
  return <form className="rarity-filter" action={action}><label>Filter the whole set by rarity<select name="rarity" defaultValue={rarity}><option value="">All rarities</option>{rarities.map((value) => <option key={value} value={value}>{rarityLabels[value] ?? value}</option>)}</select></label><label>Order the whole set<select name="order" defaultValue={order} onChange={(event) => { document.cookie = `catalog-order=${event.target.value}; Path=/; Max-Age=31536000; SameSite=Lax`; }}><option value="collector">Collector number</option><option value="price-high">Price high to low</option><option value="price-low">Price low to high</option></select></label><button className="button" type="submit">Apply</button></form>;
}
