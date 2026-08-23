export type PokeBallVariant = "poke" | "great" | "ultra" | "master";
export type PokeBallSize = "icon" | "badge" | "decorative";

export function PokeBall({
  variant,
  size = "icon",
  label,
  motion = false,
  className = "",
}: {
  variant: PokeBallVariant;
  size?: PokeBallSize;
  label?: string;
  motion?: boolean;
  className?: string;
}) {
  const semantics = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  const classes = ["poke-ball", `poke-ball-${variant}`, `poke-ball-${size}`, motion && "poke-ball-motion", className].filter(Boolean).join(" ");

  return <span className={classes} {...semantics}><span className="poke-ball-button" /></span>;
}
