import { describe, expect, it } from "vitest";
import { convertCurrency, parseEcbReferenceRates } from "./exchange-rates";

const xml = `<?xml version="1.0"?><Envelope><Cube><Cube time="2026-08-21"><Cube currency="USD" rate="1.2"/><Cube currency="JPY" rate="180"/></Cube></Cube></Envelope>`;

describe("ECB display-currency conversion", () => {
  it("converts through the ECB euro base with a worked cross-rate", () => {
    const snapshot = parseEcbReferenceRates(xml, new Date("2026-08-24T00:00:00Z"));

    expect(convertCurrency(12, "USD", "JPY", snapshot)).toBe(1800);
    expect(convertCurrency(10, "EUR", "USD", snapshot)).toBe(12);
  });

  it("marks rates older than four days stale", () => {
    const snapshot = parseEcbReferenceRates(xml, new Date("2026-08-26T00:00:01Z"));

    expect(snapshot.stale).toBe(true);
    expect(snapshot.observedAt).toBe("2026-08-21");
    expect(snapshot.source).toBe("European Central Bank");
  });

  it("rejects an incomplete or malformed ECB response", () => {
    expect(() => parseEcbReferenceRates("<broken />")).toThrow(/USD and JPY/i);
  });
});
