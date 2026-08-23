import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SetsPage from "./page";

describe("set catalog chooser", () => {
  it("separates English and Eastern catalogs", async () => {
    render(await SetsPage());
    expect(screen.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/sets/english");
    expect(screen.getByRole("link", { name: /Eastern/ })).toHaveAttribute("href", "/sets/eastern");
    expect(screen.getByText(/Japanese, Korean, and Chinese/)).toBeVisible();
  });
});
