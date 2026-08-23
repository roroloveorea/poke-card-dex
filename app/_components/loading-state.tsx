import type { ReactNode } from "react";
import { PokeBall } from "./poke-ball";

export function LoadingState({ children }: { children: ReactNode }) {
  return <div className="loading-state" role="status"><PokeBall variant="poke" size="badge" motion /><span>{children}</span></div>;
}
