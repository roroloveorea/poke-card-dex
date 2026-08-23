import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CardPrinting } from "@/src/catalog/catalog";
import { EasternCardGrid } from "./eastern-card-grid";

describe("Eastern card grid", () => {
  it("shows provider artwork and the mapped EUR market price", () => {
    const set = { id: "tdx-ja-set-SV1a", language: "ja" as const, name: "トリプレットビート", releaseDate: "2023-03-10" };
    const quote = { variant: "Normal · Average", amount: 0.05, currency: "EUR" as const, source: "Cardmarket via TCGdex", observedAt: "2026-08-24T00:00:00.000Z", stale: false };
    const card: CardPrinting = { id: "tdx-ja-card-SV1a-001", language: "ja", name: "トロピウス", collectorNumber: "001", imageUrl: "https://assets.tcgdex.net/ja/SV/SV1a/001/low.webp", set, priceQuotes: [quote], summaryPrice: quote };

    render(<EasternCardGrid cards={[card]} catalogSlug="japanese" />);

    expect(screen.getByRole("img", { name: /トロピウス/ })).toHaveAttribute("src", card.imageUrl);
    expect(screen.getByText("€0.05 EUR")).toBeVisible();
  });
});
