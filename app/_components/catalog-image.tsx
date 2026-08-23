"use client";

import { useState } from "react";
import { PokeBall } from "./poke-ball";

const dimensions = {
  card: { width: 245, height: 342 },
  set: { width: 300, height: 112 },
};

export function CatalogImage({ src, alt, kind, eager = false }: { src?: string; alt: string; kind: keyof typeof dimensions; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = dimensions[kind];

  if (!src || failed) {
    return <div className={`image-placeholder image-placeholder-${kind}`}><PokeBall variant="ultra" size="badge" /><span>Image unavailable</span></div>;
  }

  return <img src={src} alt={alt} width={size.width} height={size.height} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}
