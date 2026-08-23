import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import EnglishSetsPage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));

describe("English set directory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows every set with stable links and metadata", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([
      { id: "new", language: "en", name: "Newest", releaseDate: "2026/01/01", cardCount: 100, logoUrl: "new.png" },
      { id: "old", language: "en", name: "Older", releaseDate: "2025/01/01", cardCount: 50 },
    ]) } as unknown as Catalog);
    render(await EnglishSetsPage());
    expect(screen.getByRole("link", { name: /Newest/ })).toHaveAttribute("href", "/sets/new");
    expect(screen.getByText("100 cards")).toBeVisible();
    expect(screen.getByRole("img", { name: "Newest logo" })).toBeVisible();
  });

  it("distinguishes empty and retryable failure states", async () => {
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockRejectedValue(new Error()) } as unknown as Catalog);
    const { rerender } = render(await EnglishSetsPage());
    expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i);
    vi.mocked(getCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([]) } as unknown as Catalog);
    rerender(await EnglishSetsPage());
    expect(screen.getByText(/no English sets/i)).toBeVisible();
  });
});
