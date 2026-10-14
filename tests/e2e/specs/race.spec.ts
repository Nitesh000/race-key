import { expect, test } from "@playwright/test";
import { joinQuickRace, rewardsTimeout, roomUrl, typePassage } from "./helpers";

test.describe.configure({ timeout: 240_000 });

test("a quick race fills with bots, never moves the text and pays rewards", async ({ page }) => {
  await page.goto("/race");
  await expect(page).toHaveURL(roomUrl, { timeout: 20_000 });
  await expect(page.locator(".passage")).toBeVisible();
  const passageBox = await page.locator(".passage").boundingBox();
  await expect(page.getByText("Go!")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".bg-lane, .bg-lane-you")).toHaveCount(5);
  expect(await page.locator(".passage").boundingBox()).toEqual(passageBox);

  await typePassage(page, { mistakeEvery: 45 });
  await expect(page.getByRole("heading", { name: /Results|Waiting/ })).toBeVisible();
  await expect(page.getByText(/^\+\d+$/).first()).toBeVisible({ timeout: rewardsTimeout });
});

test("the race survives a short network drop", async ({ page, context }) => {
  await joinQuickRace(page);
  await typePassage(page, { upTo: 20 });
  await context.setOffline(true);
  await expect(page.getByText("Reconnecting…")).toBeVisible({ timeout: 10_000 });
  await context.setOffline(false);
  await expect(page.getByText("Reconnecting…")).toBeHidden({ timeout: 15_000 });
  await typePassage(page);
  await expect(page.getByText(/^\+\d+$/).first()).toBeVisible({ timeout: rewardsTimeout });
});
