"use client";

import { useState } from "react";
import Image from "next/image";
import { PokeBall } from "./poke-ball";

const dimensions = {
  card: { width: 490, height: 684, sizes: "(max-width: 46rem) calc(100vw - 2rem), 490px" },
  set: { width: 600, height: 224, sizes: "(max-width: 46rem) calc(100vw - 2rem), 300px" },
};
const optimizedProviderHosts = new Set(["images.pokemontcg.io", "assets.tcgdex.net"]);

function usesImageOptimizer(src: string) {
  try { return optimizedProviderHosts.has(new URL(src).hostname); } catch { return false; }
}

export function CatalogImage({ src, alt, kind, eager = false }: { src?: string; alt: string; kind: keyof typeof dimensions; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = dimensions[kind];

  if (!src || failed) {
    return <div className={`image-placeholder image-placeholder-${kind}`}><PokeBall variant="ultra" size="badge" /><span>Image unavailable</span></div>;
  }

  const shared = { src, alt, width: size.width, height: size.height, sizes: size.sizes, loading: eager ? "eager" as const : "lazy" as const, onError: () => setFailed(true) };
  return usesImageOptimizer(src) ? <Image {...shared} /> : <img {...shared} decoding="async" />;
}
