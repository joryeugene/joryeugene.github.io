import { test } from "@playwright/test";

test("captures Georgie living on the real site before and after the bone", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?georgie-world=1&offline=1&test=1");
  await page.screenshot({ path: testInfo.outputPath("georgie-home-hidden-bone.png"), fullPage: false });

  const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
  const start = await bone.boundingBox();
  if (!start) throw new Error("The hidden bone has no visible drag target");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(1030, 480, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath("georgie-home-bone-found.png"), fullPage: false });

  await page.goto("/blog/endgame-keyboard/?georgie-world=1&offline=1&test=1");
  await page.getByRole("heading", { name: "Twelve Keyboards Later", exact: true }).last().waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath("georgie-article.png"), fullPage: false });
});
