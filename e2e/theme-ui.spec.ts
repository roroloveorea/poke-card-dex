import { expect, test, type Locator, type Page } from "@playwright/test";

const journeys = [
  ["home", "/"],
  ["set-directory", "/sets"],
  ["set-detail", "/sets/rocket"],
  ["search-results", "/search?q=charizard"],
  ["printing-detail", "/card-printings/rocket-01"],
] as const;

async function waitForStableUi(page: Page) {
  await page.waitForLoadState("load");
  await expect(page.getByLabel("Display prices in")).toBeVisible();
  await expect(page.locator(".currency-selector")).toHaveAttribute("data-rate-status", /ready|stale|unavailable/);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
}

function colorChannels(value: string) {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported color: ${value}`);
  return channels;
}

function luminance(channels: number[]) {
  const normalized = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
}

async function contrastRatio(locator: Locator) {
  const colors = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  const foreground = luminance(colorChannels(colors.foreground));
  const background = luminance(colorChannels(colors.background));
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

test("captures intentional visual baselines for each catalog journey", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const [name, path] of journeys) {
    await page.goto(path);
    await waitForStableUi(page);
    await expect(page).toHaveScreenshot(`${name}-desktop.png`, { fullPage: true, animations: "disabled" });
  }
});

test("has no horizontal overflow from 320px through desktop", async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [, path] of journeys) {
      await page.goto(path);
      await waitForStableUi(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflowed at ${width}px`).toBeLessThanOrEqual(0);
    }
  }

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page).toHaveScreenshot("home-mobile.png", { fullPage: true, animations: "disabled" });
});

test("exposes keyboard focus, semantics, contrast, and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const focus = await page.getByRole("link", { name: "Skip to content" }).evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(Number.parseFloat(focus)).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Footer navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  for (const selector of ["body", ".button:not(:disabled)", ".button-secondary", ".status-success", ".status-warning", ".status-error"]) {
    expect(await contrastRatio(page.locator(selector).first()), `${selector} text contrast`).toBeGreaterThanOrEqual(4.5);
  }

  for (const [, path] of journeys) {
    await page.goto(path);
    await waitForStableUi(page);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const unnamedControls = await page.locator("a:visible, button:visible, input:visible, select:visible").evaluateAll((elements) => elements.filter((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) return element.labels?.length === 0 && !element.getAttribute("aria-label");
      return !element.textContent?.trim() && !element.getAttribute("aria-label");
    }).length);
    expect(unnamedControls, `${path} has unnamed interactive controls`).toBe(0);
  }

  await page.goto("/design-system");

  const motionDuration = await page.locator(".poke-ball-motion").first().evaluate((element) => getComputedStyle(element).animationDuration);
  const motionMilliseconds = motionDuration.endsWith("ms") ? Number.parseFloat(motionDuration) : Number.parseFloat(motionDuration) * 1_000;
  expect(motionMilliseconds).toBeLessThanOrEqual(0.01);
});

test("covers state motifs and ships efficient local hero artwork", async ({ page, request }) => {
  await page.goto("/design-system");
  await expect(page.locator(".ball-showcase [role=img]")).toHaveCount(4);
  for (const motif of await page.locator(".ball-showcase [role=img]").all()) {
    const box = await motif.boundingBox();
    expect(Math.abs((box?.width ?? 0) - (box?.height ?? 0))).toBeLessThan(0.1);
  }

  await page.goto("/search");
  await expect(page.locator(".empty-state")).toContainText("Enter a card name or collector number");
  await page.goto("/search?q=missing");
  await expect(page.locator(".empty-state")).toContainText("No card printings found");
  await page.goto("/search?q=timeout");
  await expect(page.locator(".empty-state[role=alert]")).toContainText("temporarily unavailable");
  await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();

  const artwork = await request.get("/artwork/catalog-hero-pikachu.webp");
  expect(artwork.ok()).toBe(true);
  expect(artwork.headers()["content-type"]).toContain("image/webp");
  expect((await artwork.body()).byteLength).toBeLessThan(150_000);
});

test("persists display currency and does not reorder card selections", async ({ page }) => {
  await page.goto("/search?q=charizard");
  const links = page.locator(".search-results a");
  const originalOrder = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));

  await page.getByLabel("Display prices in").selectOption("JPY");
  await expect(page.locator(".search-results").getByText(/JPY/).first()).toBeVisible();
  await expect(page.locator(".search-results").getByText(/European Central Bank/).first()).toBeVisible();
  expect(await links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")))).toEqual(originalOrder);

  await page.reload();
  await expect(page.getByLabel("Display prices in")).toHaveValue("JPY");
  expect(await links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")))).toEqual(originalOrder);
});
