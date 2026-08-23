import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogImage } from "./catalog-image";

describe("provider artwork", () => {
  it("reserves card-art dimensions and falls back when loading fails", () => {
    render(<CatalogImage src="https://provider.example/card.webp" alt="Card artwork" kind="card" />);

    const image = screen.getByRole("img", { name: "Card artwork" });
    expect(image).toHaveAttribute("width", "245");
    expect(image).toHaveAttribute("height", "342");

    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Card artwork" })).not.toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeVisible();
    expect(document.querySelector(".image-placeholder [aria-hidden='true']")).toBeInTheDocument();
  });
});
