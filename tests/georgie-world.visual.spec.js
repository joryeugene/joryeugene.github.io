import { test } from "@playwright/test";

test("captures Georgie's desktop scene before and after the hidden bone is found", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/georgie-lab/?offline=1&test=1");
  await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });

  const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
  const arena = page.locator("[data-georgie-arena]");
  const boneBox = await bone.boundingBox();
  const arenaBox = await arena.boundingBox();
  await page.mouse.move(boneBox.x + boneBox.width / 2, boneBox.y + boneBox.height * 0.78);
  await page.mouse.down();
  await page.mouse.move(arenaBox.x + arenaBox.width * 0.72, arenaBox.y + arenaBox.height * 0.42, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("bone-found.png"), fullPage: true });
});
