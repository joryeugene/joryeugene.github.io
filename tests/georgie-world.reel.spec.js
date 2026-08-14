import { expect, test } from "@playwright/test";

test.use({ video: "on" });

test("records Georgie's solo interaction reel", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?georgie-world=1&offline=1&test=1");

  await page.evaluate(() => window.__georgieWorld.runRoutine("chase-moth"));
  await expect(page.locator("[data-georgie-reaction]")).toHaveText(
    "A moth made a terrible tactical decision.",
  );
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("01-moth-chase.png") });
  await page.waitForTimeout(1_800);

  const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
  const start = await bone.boundingBox();
  if (!start) throw new Error("The hidden bone has no visible drag target");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(1_025, 440, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("src", /bone-wag\.gif$/);
  await page.waitForTimeout(600);
  await page.screenshot({ path: testInfo.outputPath("02-bone-delight.png") });
  await page.waitForTimeout(2_000);

  await page.evaluate(() => {
    window.__georgieWorld.behavior.random = () => 0.1;
  });
  const georgie = page.getByRole("button", { name: "Invite Georgie over" });
  await georgie.click();
  await expect(page.locator("[data-georgie-reaction]")).toHaveText(
    "Georgie heard you. He is pretending he did not.",
  );
  await page.screenshot({ path: testInfo.outputPath("03-ignore.png") });
  await page.waitForTimeout(1_200);

  await georgie.click();
  await expect(page.locator("[data-georgie-reaction]")).toHaveText(
    "Georgie looked over. That is not the same as coming.",
  );
  await page.screenshot({ path: testInfo.outputPath("04-looked-over.png") });
  await page.waitForTimeout(1_200);

  await georgie.click();
  await expect(page.locator("[data-georgie-overlay]")).toHaveAttribute("data-state", "leaving");
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath("05-leaving.png") });
  await page.waitForTimeout(1_000);
});
