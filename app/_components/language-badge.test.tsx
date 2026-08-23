import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageBadge } from "./language-badge";

describe("catalog language badge", () => {
  it.each([
    ["en", "English", "poke-ball-great"],
    ["ja", "Japanese", "poke-ball-poke"],
    ["ko", "Korean", "poke-ball-ultra"],
    ["zh-cn", "Simplified Chinese", "poke-ball-master"],
    ["zh-tw", "Traditional Chinese", "poke-ball-master"],
  ] as const)("identifies %s with text as well as a themed motif", (language, name, variantClass) => {
    const { container } = render(<LanguageBadge language={language} />);

    expect(screen.getByText(name)).toBeVisible();
    expect(container.querySelector(".poke-ball")).toHaveClass(variantClass);
  });
});
