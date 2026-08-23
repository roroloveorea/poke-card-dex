import type { ReactNode } from "react";
import { PokeBall } from "./poke-ball";

export function EmptyState({ children, role }: { children: ReactNode; role?: "alert" | "status" }) {
  return (
    <div className="empty-state" role={role}>
      <PokeBall variant="great" size="badge" className="empty-state-motif" />
      <div>{children}</div>
    </div>
  );
}
