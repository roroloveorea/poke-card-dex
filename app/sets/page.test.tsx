import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import SetsPage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));

describe("English set directory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows every set newest first with stable links and metadata", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([
      { id: "new", language: "en", name: "Newest", releaseDate: "2026/01/01", cardCount: 100, logoUrl: "new.png" },
      { id: "old", language: "en", name: "Older", releaseDate: "2025/01/01", cardCount: 50 },
    ]) } as unknown as Catalog);
    render(await SetsPage());
    const links = screen.getAllByRole("link", { name: /Newest|Older/ });
    expect(links[0]).toHaveAttribute("href", "/sets/new");
    expect(screen.getByText("100 cards")).toBeVisible();
    expect(screen.getByRole("img", { name: "Newest logo" })).toBeVisible();
  });

  it("uses a set symbol when no logo is available", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([
      { id: "symbol", language: "en", name: "Symbol Set", releaseDate: "2026/01/01", symbolUrl: "symbol.png", cardCount: 12 },
    ]) } as unknown as Catalog);
    render(await SetsPage());
    expect(screen.getByRole("img", { name: "Symbol Set symbol" })).toHaveAttribute("src", "symbol.png");
  });

  it("distinguishes empty and retryable failure states", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockRejectedValue(new Error()) } as unknown as Catalog);
    const { rerender } = render(await SetsPage());
    expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute("href", "/sets");
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([]) } as unknown as Catalog);
    rerender(await SetsPage());
    expect(screen.getByText(/no sets/i)).toBeVisible();
  });
});
