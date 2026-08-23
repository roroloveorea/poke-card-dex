import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EasternSetsPage from "./page";

describe("Eastern language chooser", () => {
  it("offers Japanese, Korean, and Chinese catalogs", () => {
    render(<EasternSetsPage />);
    expect(screen.getByRole("link", { name: /Japanese/ })).toHaveAttribute("href", "/sets/eastern/japanese");
    expect(screen.getByRole("link", { name: /Korean/ })).toHaveAttribute("href", "/sets/eastern/korean");
    expect(screen.getByRole("link", { name: /Chinese/ })).toHaveAttribute("href", "/sets/eastern/chinese");
  });
});
