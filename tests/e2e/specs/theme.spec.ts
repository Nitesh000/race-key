import { expect, test } from "@playwright/test";

test("picked theme and mode are in the first html, so there is no flash", async ({
  page,
  request,
}) => {
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("button", { name: /Ocean/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ocean");

  const cookies = await page.context().cookies();
  const header = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const html = await (await request.get("/practice", { headers: { cookie: header } })).text();
  expect(html).toMatch(/<html[^>]*data-theme="ocean"/);
  expect(html).toMatch(/<html[^>]*data-mode="dark"/);

  await page.goto("/practice");
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(bg).toBe("rgb(11, 22, 34)");
});
