import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogWithSetPages } from "@/src/catalog/rarebit-catalog";
import { getEasternCatalog } from "@/src/catalog/server-catalog";
import EasternLanguageSetsPage from "./page";

vi.mock("@/src/catalog/server-catalog", () => ({ getEasternCatalog: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("not found"); }) }));

describe("Eastern language set directory", () => {
  it("renders Japanese sets with language-scoped links", async () => {
    vi.mocked(getEasternCatalog).mockReturnValue({ listSets: vi.fn().mockResolvedValue([
      { id: "tdx-ja-set-SV4a", language: "ja", name: "シャイニートレジャーex", releaseDate: "", cardCount: 190 },
    ]) } as unknown as CatalogWithSetPages);

    render(await EasternLanguageSetsPage({ params: Promise.resolve({ language: "japanese" }) }));

    expect(getEasternCatalog).toHaveBeenCalledWith("ja");
    expect(screen.getByRole("link", { name: /シャイニートレジャーex/ })).toHaveAttribute("href", "/sets/eastern/japanese/tdx-ja-set-SV4a");
    expect(screen.getByText("Japanese")).toBeVisible();
  });

  it("combines Simplified and Traditional Chinese as separate verified groups", async () => {
    vi.mocked(getEasternCatalog).mockImplementation((language) => ({ listSets: vi.fn().mockResolvedValue([
      { id: `tdx-${language}-set-one`, language, name: language === "zh-cn" ? "简体套装" : "繁體套裝", releaseDate: "", cardCount: 10 },
    ]) } as unknown as CatalogWithSetPages));

    render(await EasternLanguageSetsPage({ params: Promise.resolve({ language: "chinese" }) }));

    expect(getEasternCatalog).toHaveBeenCalledWith("zh-cn");
    expect(getEasternCatalog).toHaveBeenCalledWith("zh-tw");
    expect(screen.getByText("Simplified Chinese")).toBeVisible();
    expect(screen.getByText("Traditional Chinese")).toBeVisible();
  });
});
