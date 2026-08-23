import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PokeBall } from "./poke-ball";

describe("Poké Ball theme motif", () => {
  it.each(["poke", "great", "ultra", "master"] as const)("renders the %s variant through one API", (variant) => {
    const { container } = render(<PokeBall variant={variant} label={`${variant} ball`} size="badge" />);

    expect(screen.getByRole("img", { name: `${variant} ball` })).toBeVisible();
    expect(container.firstChild).toHaveClass("poke-ball", `poke-ball-${variant}`, "poke-ball-badge");
  });

  it("stays out of the accessibility tree when decorative", () => {
    const { container } = render(<PokeBall variant="poke" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("only opts into motion when requested", () => {
    const { container } = render(<PokeBall variant="great" motion size="decorative" />);

    expect(container.firstChild).toHaveClass("poke-ball-motion", "poke-ball-decorative");
  });
});
