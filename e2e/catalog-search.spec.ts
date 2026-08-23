import { expect, test } from "@playwright/test";

test("searches all identity fields, removes duplicates, and ranks deterministically", async ({ page }) => {
  await page.goto("/search?q=charizard%2001");
  const results = page.locator(".search-results li");
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toContainText("Charizard");
  await expect(results.nth(0)).toContainText("01");
  await expect(results.nth(1)).toContainText("Charizard ex");

  await page.goto("/search?q=01");
  await expect(page.locator(".search-results li")).toHaveCount(4);
  await page.goto("/search?q=rocket");
  await expect(page.locator(".search-results li")).toHaveCount(3);
  await expect(page.locator(".search-results li").nth(0)).toContainText("Charizard ex");
  await page.reload();
  await expect(page.locator(".search-results li")).toHaveCount(3);
});

test("keeps Japanese printing identity and JPY summary distinct", async ({ page }) => {
  await page.goto(`/search?q=${encodeURIComponent("ピカチュウ 011 未来")}`);
  const result = page.locator(".search-results li");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Japanese");
  await expect(result).toContainText("未来の一閃 · 011/100");
  await expect(result).toContainText("JPY");
  await expect(result.locator("a")).toHaveAttribute("href", "/card-printings/rb-card-jp-01");
});

test("preserves URL search state through submit, back, forward, timeout, and retry", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("search");
  await search.getByLabel("Search card printings").fill("charizard 01");
  await search.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/search\?q=charizard\+01$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.getByRole("textbox", { name: "Search card printings" })).toHaveValue("charizard 01");

  await page.goto("/search?q=timeout");
  const timeoutState = page.locator(".empty-state[role=alert]");
  await expect(timeoutState).toContainText("temporarily unavailable");
  await expect(timeoutState.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/search?q=timeout");
});

test("supports empty and no-result states without leaking provider internals", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText(/Enter a card name/)).toBeVisible();
  await page.goto("/search?q=missing");
  await expect(page.locator(".empty-state").filter({ hasText: /No card printings found/ }).last()).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("e2e-server-only-secret");
  expect(html).not.toContain("127.0.0.1:3199");
  expect(html).not.toContain("set.name:");
});

test("is keyboard usable without horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.getByRole("link", { name: "Search card printings" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("textbox", { name: "Search card printings" }).fill("charizard");
  await page.getByRole("button", { name: "Search" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=charizard/);
});
