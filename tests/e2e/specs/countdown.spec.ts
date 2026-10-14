import { expect, test } from "@playwright/test";
import { passageText, plain, roomUrl } from "./helpers";

test("the countdown beeps, focuses the passage, and any key refocuses it", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __tones: { freq: number; inSec: number }[] };
    w.__tones = [];
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      w.__tones.push({ freq: this.frequency.value, inSec: (when ?? 0) - this.context.currentTime });
      return start.call(this, when);
    };
  });
  await page.goto("/race/private");
  await expect(page).toHaveURL(roomUrl, { timeout: 20_000 });
  await page.getByRole("button", { name: "Start race" }).click();

  const input = page.getByLabel("Type the passage");
  await expect(input).toBeFocused();
  await expect(page.getByText("Go!")).toBeVisible({ timeout: 10_000 });

  const tones = await page.evaluate(
    () => (window as unknown as { __tones: { freq: number; inSec: number }[] }).__tones,
  );
  expect(tones.map((t) => t.freq)).toEqual([659, 659, 659, 988]);
  const gaps = tones.slice(1).map((t, i) => t.inSec - tones[i]!.inSec);
  for (const gap of gaps) expect(gap).toBeCloseTo(1, 1);

  const first = Array.from(await passageText(page))[0]!;
  await page.keyboard.press("Escape");
  await expect(input).not.toBeFocused();
  await page.keyboard.type(plain(first));
  await expect(input).toBeFocused();
  await expect(page.locator('.passage [data-s="c"]')).toHaveCount(1);
});
