import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetControls } from "./set-controls";

describe("set controls", () => {
  it("retains the selected whole-set order for later set visits", () => {
    render(<SetControls action="/sets/me5" rarities={[]} rarity="" order="collector" />);
    fireEvent.change(screen.getByLabelText("Order the whole set"), { target: { value: "price-high" } });
    expect(document.cookie).toContain("catalog-order=price-high");
  });
});
