import { expect, test } from "@playwright/test";
import { joinQuickRace, rewardsTimeout, signUp, typePassage, uniqueName } from "./helpers";

test.describe.configure({ timeout: 240_000 });

test("a guest keeps their coins after signing up", async ({ page, browserName }) => {
  await joinQuickRace(page);
  await typePassage(page);
  await expect(page.getByText(/^\+\d+$/).first()).toBeVisible({ timeout: rewardsTimeout });
  const coins = async () =>
    Number((await page.locator("header").getByTitle("Coins").innerText()).replace(/\D/g, ""));
  await expect.poll(coins).toBeGreaterThan(0);
  const earned = await coins();

  await signUp(page, uniqueName("saver", browserName));
  await expect.poll(coins).toBe(earned);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("buy and equip a skin in the locker", async ({ page, browserName }) => {
  await signUp(page, uniqueName("shopper", browserName));
  await page.goto("/locker");
  const turtle = page.locator("li").filter({ hasText: "Turtle" });
  await turtle.getByRole("button", { name: "Equip" }).click();
  await expect(turtle.getByText("Equipped")).toBeVisible();
  await expect(
    page.locator("li").filter({ hasText: "Sedan" }).getByRole("button", { name: /Buy/ }),
  ).toBeDisabled();
});
