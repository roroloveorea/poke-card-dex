"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { displayCurrencies, type DisplayCurrency, type ExchangeRateSnapshot } from "@/src/currency/exchange-rates";

type RateStatus = "loading" | "ready" | "stale" | "unavailable";
type CurrencyContextValue = {
  currency: DisplayCurrency;
  rates?: ExchangeRateSnapshot;
  status: RateStatus;
  enabled: boolean;
  setCurrency: (currency: DisplayCurrency) => void;
};

const storageKey = "display-currency";
const CurrencyContext = createContext<CurrencyContextValue>({ currency: "USD", status: "unavailable", enabled: false, setCurrency: () => undefined });

function isDisplayCurrency(value: string | null): value is DisplayCurrency {
  return displayCurrencies.some((currency) => currency === value);
}

function isSnapshot(value: unknown): value is ExchangeRateSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExchangeRateSnapshot>;
  return candidate.base === "EUR" && candidate.source === "European Central Bank" && typeof candidate.observedAt === "string" && typeof candidate.stale === "boolean" && displayCurrencies.every((currency) => Number.isFinite(candidate.rates?.[currency]) && (candidate.rates?.[currency] ?? 0) > 0);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<ExchangeRateSnapshot>();
  const [status, setStatus] = useState<RateStatus>("loading");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(storageKey); } catch { /* Browser storage is optional. */ }
    if (isDisplayCurrency(saved)) setCurrencyState(saved);

    let active = true;
    fetch("/api/exchange-rates")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Exchange-rate endpoint returned ${response.status}.`);
        const snapshot: unknown = await response.json();
        if (!isSnapshot(snapshot)) throw new Error("Exchange-rate endpoint returned an invalid snapshot.");
        if (active) {
          setRates(snapshot);
          setStatus(snapshot.stale ? "stale" : "ready");
        }
      })
      .catch(() => { if (active) setStatus("unavailable"); });

    return () => { active = false; };
  }, []);

  const setCurrency = useCallback((nextCurrency: DisplayCurrency) => {
    setCurrencyState(nextCurrency);
    try { localStorage.setItem(storageKey, nextCurrency); } catch { /* The live preference still applies. */ }
    try { document.cookie = `${storageKey}=${nextCurrency}; Path=/; Max-Age=31536000; SameSite=Lax`; } catch { /* Cookies are optional. */ }
  }, []);
  const value = useMemo(() => ({ currency, rates, status, enabled: true, setCurrency }), [currency, rates, setCurrency, status]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencySelector() {
  const { currency, setCurrency, status } = useCurrency();
  return (
    <div className="currency-selector" data-rate-status={status}>
      <label htmlFor="display-currency">Display prices in</label>
      <select id="display-currency" value={currency} onChange={(event) => setCurrency(event.target.value as DisplayCurrency)}>
        {displayCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <span className="currency-status" aria-live="polite">
        {status === "stale" ? "Rates stale" : status === "unavailable" ? "Rates unavailable" : ""}
      </span>
    </div>
  );
}
