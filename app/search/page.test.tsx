import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import SearchPage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));

describe("English catalog search", () => {
  it("normalizes URL input and renders identifiable results with prices", async () => {
    const set = { id: "base1", language: "en" as const, name: "Base", releaseDate: "1999/01/09" };
    const searchCardPrintings = vi.fn().mockResolvedValue([{ id: "base1-4", language: "en", name: "Charizard", collectorNumber: "4", imageUrl: "image", set, priceQuotes: [] }]);
    vi.mocked(getCatalog).mockReturnValue({ searchCardPrintings } as unknown as Catalog);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "  ChAr  " }) }));
    expect(searchCardPrintings).toHaveBeenCalledWith("ChAr");
    expect(screen.getByRole("heading", { name: /results for “ChAr”/i })).toBeVisible();
    expect(screen.getByText("English · Base · 4")).toBeVisible();
    expect(screen.getByText("Price unavailable")).toBeVisible();
  });

  it("does not contact the provider for whitespace", async () => {
    const searchCardPrintings = vi.fn();
    vi.mocked(getCatalog).mockReturnValue({ searchCardPrintings } as unknown as Catalog);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "   " }) }));
    expect(searchCardPrintings).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a card name or collector number/i)).toBeVisible();
  });

  it("keeps combined name and collector-number terms in the shareable search journey", async () => {
    const set = { id: "set-a", language: "en" as const, name: "Alpha", releaseDate: "2025/01/01" };
    const searchCardPrintings = vi.fn().mockResolvedValue([
      { id: "set-a-01a", language: "en", name: "Charizard ex", collectorNumber: "01a", set, priceQuotes: [] },
    ]);
    vi.mocked(getCatalog).mockReturnValue({ searchCardPrintings } as unknown as Catalog);

    render(await SearchPage({ searchParams: Promise.resolve({ q: "  charizard   01  " }) }));

    expect(searchCardPrintings).toHaveBeenCalledWith("charizard 01");
    expect(screen.getByDisplayValue("charizard 01")).toBeVisible();
    expect(screen.getByRole("link", { name: /Charizard ex/i })).toHaveAttribute("href", "/card-printings/set-a-01a");
    expect(screen.getByText("English · Alpha · 01a")).toBeVisible();
  });

  it("keeps query, search, navigation, and retry available after failure", async () => {
    vi.mocked(getCatalog).mockReturnValue({ searchCardPrintings: vi.fn().mockRejectedValue(new Error()) } as unknown as Catalog);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "Charizard" }) }));
    expect(screen.getByRole("search")).toBeVisible();
    expect(screen.getByDisplayValue("Charizard")).toBeVisible();
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute("href", "/search?q=Charizard");
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });
});
