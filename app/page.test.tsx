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
    expect(screen.getByPlaceholderText(/card name or collector number/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /Newest/ })).toHaveAttribute("href", "/sets/new");
    expect(screen.getByText(/unofficial collector reference/i)).toBeVisible();
  });
});
