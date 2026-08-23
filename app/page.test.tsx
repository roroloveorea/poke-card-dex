import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import HomePage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));

describe("Home", () => {
  it("offers prominent search and newest English sets", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([
      { id: "new", language: "en", name: "Newest", releaseDate: "2026/01/01", cardCount: 100 },
    ]) } as unknown as Catalog);
    render(await HomePage());
    expect(screen.getByRole("search")).toBeVisible();
    expect(screen.getByPlaceholderText(/name, number, or set/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Newest/ })).toHaveAttribute("href", "/sets/new");
    expect(screen.getByText(/unofficial collector reference/i)).toBeVisible();
    const heroArtwork = document.querySelector(".hero-artwork img");
    expect(heroArtwork).toHaveAttribute("alt", "");
    expect(heroArtwork).toHaveAttribute("width", "1248");
    expect(heroArtwork).toHaveAttribute("height", "832");
  });

  it("uses a themed, accessible empty state when no sets are available", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([]) } as unknown as Catalog);

    render(await HomePage());

    expect(screen.getByText(/no sets are available/i)).toBeVisible();
    expect(document.querySelector(".empty-state [aria-hidden='true']")).toBeInTheDocument();
  });
});
