import { expect, type Page } from "@playwright/test";

const plainKeys: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2014": "-",
  "\u2013": "-",
};

export function plain(c: string) {
  return (
    plainKeys[c] ??
    c
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .charAt(0)
  );
}

export async function passageText(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll(".passage > div:first-child > span"))
      .map((s) => s.textContent)
      .join(""),
  );
}

export async function typePassage(
  page: Page,
  opts: { upTo?: number; mistakeEvery?: number; gap?: [number, number] } = {},
) {
  const chars = Array.from(await passageText(page));
  const [lo, hi] = opts.gap ?? [60, 140];
  const end = opts.upTo ?? chars.length;
  const start = await page.locator('.passage [data-s="c"]').count();
  for (let i = start; i < end; i++) {
    if (opts.mistakeEvery && i > 0 && i % opts.mistakeEvery === 0) {
      await page.keyboard.type("~");
      await page.keyboard.press("Backspace");
    }
    await page.keyboard.type(plain(chars[i]!));
    await page.waitForTimeout(lo + Math.random() * (hi - lo));
  }
  return chars;
}

export async function signUp(page: Page, name: string) {
  await page.goto("/signup");
  await page.getByLabel("Username").fill(name);
  await page.getByLabel("Email").fill(`${name}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL("/");
}

export function uniqueName(prefix: string, browser: string) {
  return `${prefix}_${browser.slice(0, 2)}${Math.floor(Math.random() * 1e6)}`;
}

export const rewardsTimeout = 120_000;

export const roomUrl = /\/race\/[a-z0-9]+$/;

export async function joinQuickRace(page: Page) {
  await page.goto("/race");
  await expect(page).toHaveURL(roomUrl, { timeout: 20_000 });
  await expect(page.getByText("Go!")).toBeVisible({ timeout: 30_000 });
}
