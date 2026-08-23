import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CurrencyProvider, CurrencySelector } from "./currency";
import { Price } from "./price";

const quote = { variant: "Holofoil", amount: 12, currency: "USD" as const, source: "TCGplayer", observedAt: "2026-08-20", stale: false };
const snapshot = { base: "EUR", rates: { EUR: 1, USD: 1.2, JPY: 180 }, observedAt: "2026-08-24", source: "European Central Bank", stale: false };

describe("display currency preference", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "display-currency=; Max-Age=0; Path=/";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restores, converts, explains, and persists the selected currency", async () => {
    localStorage.setItem("display-currency", "JPY");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot))));

    render(<CurrencyProvider><CurrencySelector /><Price quote={quote} /></CurrencyProvider>);

    await waitFor(() => expect(screen.getByLabelText("Display prices in")).toHaveValue("JPY"));
    expect(await screen.findByText("¥1,800 JPY")).toBeVisible();
    expect(screen.getByText(/Converted from \$12\.00 USD/)).toHaveTextContent(/European Central Bank.*August 24, 2026/);

    fireEvent.change(screen.getByLabelText("Display prices in"), { target: { value: "EUR" } });
    expect(localStorage.getItem("display-currency")).toBe("EUR");
    expect(document.cookie).toContain("display-currency=EUR");
  });

  it("shows the original quote rather than converting with stale rates", async () => {
    localStorage.setItem("display-currency", "JPY");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...snapshot, stale: true }))));

    render(<CurrencyProvider><Price quote={quote} /></CurrencyProvider>);

    expect(await screen.findByText("$12.00 USD")).toBeVisible();
    expect(await screen.findByText(/conversion unavailable because ECB rates are stale/i)).toBeVisible();
    expect(screen.queryByText("¥1,800 JPY")).not.toBeInTheDocument();
  });

  it("keeps the original quote when rates are unavailable", async () => {
    localStorage.setItem("display-currency", "EUR");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<CurrencyProvider><Price quote={quote} /></CurrencyProvider>);

    expect(await screen.findByText(/conversion temporarily unavailable/i)).toBeVisible();
    expect(screen.getByText("$12.00 USD")).toBeVisible();
  });
});
