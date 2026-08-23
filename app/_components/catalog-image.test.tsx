import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogImage } from "./catalog-image";

describe("provider artwork", () => {
  it("reserves card-art dimensions and falls back when loading fails", () => {
    render(<CatalogImage src="https://provider.example/card.webp" alt="Card artwork" kind="card" />);

    const image = screen.getByRole("img", { name: "Card artwork" });
    expect(image).toHaveAttribute("width", "490");
    expect(image).toHaveAttribute("height", "684");

    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Card artwork" })).not.toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeVisible();
    expect(document.querySelector(".image-placeholder [aria-hidden='true']")).toBeInTheDocument();
  });

  it("uses responsive Next image optimization for approved provider hosts", () => {
    render(<CatalogImage src="https://images.pokemontcg.io/base1/4_hires.png" alt="Optimized card" kind="card" />);

    const image = screen.getByRole("img", { name: "Optimized card" });
    expect(image).toHaveAttribute("sizes", "(max-width: 46rem) calc(100vw - 2rem), 490px");
    expect(image).toHaveAttribute("srcset");
    expect(image.getAttribute("src")).toContain("/_next/image?url=");
  });
});
