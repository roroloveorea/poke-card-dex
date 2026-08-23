import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/src/catalog/catalog";
import { getCatalog } from "@/src/catalog/server-catalog";
import SetPage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ get: vi.fn() }) }));

describe("English set checklist", () => {
  it("filters by partial name, resets zero results, and orders prices with unavailable last", async () => {
    const set = { id: "base1", language: "en" as const, name: "Base", releaseDate: "1999/01/09" };
    vi.mocked(getCatalog).mockReturnValue({
      getSet: vi.fn().mockResolvedValue(set),
      listSetRarities: vi.fn().mockResolvedValue(["Rare Holo", "Special Illustration Rare"]),
      getCardPrintingPage: vi.fn().mockResolvedValue({ page: 1, pageSize: 12, totalCount: 13, items: [
        { id: "base1-1", language: "en", name: "Alakazam", collectorNumber: "1", set, rarity: "Rare Holo", priceQuotes: [] },
        { id: "base1-4", language: "en", name: "Charizard", collectorNumber: "4", set, rarity: "Rare Holo", priceQuotes: [], summaryPrice: { variant: "Holofoil", amount: 300, currency: "USD", source: "TCGplayer", observedAt: "2026/08/20", stale: false } },
      ] }),
    } as unknown as Catalog);
    render(await SetPage({ params: Promise.resolve({ id: "base1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("link", { name: /Charizard/ })).toHaveAttribute("href", "/card-printings/base1-4");
    fireEvent.change(screen.getByLabelText(/filter this page by card name/i), { target: { value: "zard" } });
    expect(screen.queryByText("Alakazam")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/filter this page by card name/i), { target: { value: "missing" } });
    expect(screen.getByText(/no card printings match/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByText("Alakazam")).toBeVisible();
    expect(screen.getByRole("option", { name: "Special Illustration Rare (SIR)" })).toBeVisible();
    expect(screen.getByRole("option", { name: "Price high to low" })).toBeVisible();
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute("href", "/sets/base1?page=2");
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("href", "/sets/base1?page=2");
    expect(screen.getByText("1", { selector: "[aria-current='page']" })).toBeVisible();
  });
});
