import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CardPrintingPage from "./page";
import { getCatalog } from "@/src/catalog/server-catalog";
import type { Catalog } from "@/src/catalog/catalog";

vi.mock("@/src/catalog/server-catalog", () => ({ getCatalog: vi.fn() }));

describe("exact card-printing page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the exact English card printing identity", async () => {
    vi.mocked(getCatalog).mockReturnValue({
      getCardPrinting: vi.fn().mockResolvedValue({
        id: "base1-4",
        language: "en",
        name: "Charizard",
        collectorNumber: "4",
        imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
        set: { id: "base1", language: "en", name: "Base", releaseDate: "1999/01/09" },
        rarity: "Rare Holo",
        artist: "Mitsuhiro Arita",
        priceQuotes: [{ variant: "Holofoil", amount: 321.5, currency: "USD", source: "TCGplayer", observedAt: "2026/08/20", stale: false }],
      }),
    } as unknown as Catalog);

    render(
      await CardPrintingPage({ params: Promise.resolve({ id: "base1-4" }) }),
    );

    expect(screen.getByRole("heading", { name: "Charizard" })).toBeVisible();
    expect(screen.getByText("English")).toBeVisible();
    expect(screen.getByText("Base · 4")).toBeVisible();
    expect(screen.getByRole("img", { name: "Charizard from Base, card 4" })).toBeVisible();
    expect(screen.getByText("Rare Holo")).toBeVisible();
    expect(screen.getByText("Mitsuhiro Arita")).toBeVisible();
    expect(screen.getByText("$321.50")).toBeVisible();
    expect(screen.getByText(/indicative/i)).toBeVisible();
  });

  it("keeps navigation and a retry path when the provider fails", async () => {
    vi.mocked(getCatalog).mockReturnValue({
      getCardPrinting: vi.fn().mockRejectedValue(new Error("provider timeout")),
    } as unknown as Catalog);

    render(
      await CardPrintingPage({ params: Promise.resolve({ id: "base1-4" }) }),
    );

    expect(
      screen.getByRole("heading", { name: "The catalog took too long to respond." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      "/card-printings/base1-4",
    );
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("omits unavailable optional details and never renders a missing price as zero", async () => {
    vi.mocked(getCatalog).mockReturnValue({ getCardPrinting: vi.fn().mockResolvedValue({
      id: "base1-4", language: "en", name: "Charizard", collectorNumber: "4", priceQuotes: [],
      set: { id: "base1", language: "en", name: "Base", releaseDate: "1999/01/09" },
    }) } as unknown as Catalog);
    render(await CardPrintingPage({ params: Promise.resolve({ id: "base1-4" }) }));
    expect(screen.getByText("Price unavailable")).toBeVisible();
    expect(screen.queryByText("Artist")).not.toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });
});
