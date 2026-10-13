import { expect, test } from "@playwright/test";
import { passageText, plain, roomUrl } from "./helpers";

test("two players race a private room, chat and taunt", async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await a.goto("/race/private");
  await expect(a).toHaveURL(roomUrl, { timeout: 20_000 });
  await expect(a.getByText("Lobby")).toBeVisible();
  await b.goto(a.url());
  await expect(b.getByText("Waiting for the host to start")).toBeVisible({ timeout: 20_000 });

  await a.getByLabel("Chat message").fill("good luck");
  await a.getByRole("button", { name: "Send" }).click();
  await expect(b.getByText("good luck")).toBeVisible();

  await a.getByRole("button", { name: "Start race" }).click();
  await expect(a.getByText("Go!")).toBeVisible({ timeout: 15_000 });
  const chars = Array.from(await passageText(a));
  for (const c of chars.slice(0, 10)) await a.keyboard.type(plain(c));
  await a.keyboard.down("Tab");
  await a.keyboard.press("Digit3");
  await a.keyboard.up("Tab");
  await expect(b.locator(".taunt-bubble img")).toHaveAttribute("alt", "🔥");
  await expect(a.locator('.passage [data-s="w"]')).toHaveCount(0);
});
