import { describe, expect, it } from "vitest";
import { automaticEnglishSetName } from "./eastern-set-english-names";

describe("automatic English Eastern set names", () => {
  it("returns a clearly secondary translation for a known Eastern set", () => {
    expect(automaticEnglishSetName({ id: "tdx-ja-set-M5", language: "ja", name: "アビスアイ" })).toBe("Abyss Eye");
  });

  it("does not translate English sets", () => {
    expect(automaticEnglishSetName({ id: "tdx-ja-set-M5", language: "en", name: "Abyss Eye" })).toBeUndefined();
  });

  it("hides stale translations when the provider corrects a source name", () => {
    expect(automaticEnglishSetName({ id: "tdx-ja-set-M5", language: "ja", name: "Corrected name" })).toBeUndefined();
  });
});
