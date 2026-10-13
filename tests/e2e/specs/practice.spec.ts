import { expect, test } from "@playwright/test";
import { typePassage } from "./helpers";

test("practice a passage with plain keys and see the result and its source", async ({ page }) => {
  await page.goto("/practice");
  const input = page.getByLabel("Type the passage");
  await input.focus();
  await page.keyboard.type("~");
  await expect(page.locator('.passage [data-s="w"]')).toHaveCount(1);
  await page.keyboard.press("Backspace");
  await typePassage(page, { gap: [0, 10] });
  await expect(page.getByRole("heading", { name: "Result" })).toBeVisible();
  await expect(page.getByText("From the book")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the full book" })).toHaveAttribute(
    "href",
    /gutenberg\.org\/ebooks\/\d+/,
  );
});

test("the hidden input never makes Safari zoom and Escape releases focus", async ({ page }) => {
  await page.goto("/practice");
  const input = page.getByLabel("Type the passage");
  const size = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
  await input.focus();
  await page.keyboard.press("Escape");
  await expect(input).not.toBeFocused();
});

test("keystrokes stay fast", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Event Timing API is Chromium only");
  await page.goto("/practice");
  await page.getByLabel("Type the passage").focus();
  await page.evaluate(() => {
    const w = window as unknown as { __durations: number[] };
    w.__durations = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as PerformanceEventTiming[]) {
        if (e.name === "keydown") w.__durations.push(e.processingEnd - e.processingStart);
      }
    }).observe({ type: "event", durationThreshold: 0, buffered: true } as PerformanceObserverInit);
  });
  await typePassage(page, { upTo: 80, gap: [20, 40] });
  const durations = await page.evaluate(
    () => (window as unknown as { __durations: number[] }).__durations,
  );
  durations.sort((a, b) => a - b);
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  expect(p95).toBeLessThan(16);
});
