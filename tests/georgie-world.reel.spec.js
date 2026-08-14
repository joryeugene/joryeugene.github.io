import { expect, test } from "@playwright/test";

test.use({ video: "on" });

const views = [
  { width: 1280, height: 720 },
  { width: 1440, height: 1000 },
];

async function beginTrip(page, target, direction) {
  await page.evaluate(({ x, y }) => {
    window.__georgieReelTrip = window.__georgieWorld.moveTo(x, y);
  }, target);
  await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", direction);
  await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "run");
  await expect(page.locator("[data-georgie-dog]")).toHaveClass(/is-travelling/);
}

async function finishTrip(page) {
  const result = await page.evaluate(() => window.__georgieReelTrip);
  expect(result.status).toBe("arrived");
  await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-action-phase", "settle");
  await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "still");
  await expect(page.locator("[data-georgie-dog]")).not.toHaveClass(/is-travelling/);
}

for (const view of views) {
  test(`records the eight-direction motion reel at ${view.width}x${view.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(view);
    await page.goto("/?georgie-world=1&offline=1&test=1");
    await page.evaluate(() => window.__georgieWorld.moveTo(0.5, 0.5));

    const runs = [
      [{ x: 0.8, y: 0.5 }, "right", "left"],
      [{ x: 0.2, y: 0.5 }, "left", "right"],
      [{ x: 0.5, y: 0.8 }, "front", "rear"],
      [{ x: 0.5, y: 0.2 }, "rear", "front"],
      [{ x: 0.8, y: 0.8 }, "front-right", "rear-left"],
      [{ x: 0.2, y: 0.8 }, "front-left", "rear-right"],
      [{ x: 0.8, y: 0.2 }, "rear-right", "front-left"],
      [{ x: 0.2, y: 0.2 }, "rear-left", "front-right"],
    ];

    for (const [target, outward, returning] of runs) {
      await beginTrip(page, target, outward);
      await page.waitForTimeout(150);
      if (outward === "front-right") {
        await page.screenshot({ path: testInfo.outputPath("01-front-right-run.png") });
      }
      await finishTrip(page);
      await beginTrip(page, { x: 0.5, y: 0.5 }, returning);
      await page.waitForTimeout(150);
      await finishTrip(page);
    }

    await page.screenshot({ path: testInfo.outputPath("02-centered-still.png") });

    const retarget = await page.evaluate(async () => {
      const first = window.__georgieWorld.moveTo(0.88, 0.18);
      await new Promise((resolve) => setTimeout(resolve, 140));
      const second = window.__georgieWorld.moveTo(0.18, 0.82);
      window.__georgieReelRetarget = Promise.all([first, second]);
      return document.querySelector("[data-georgie-dog]").dataset.direction;
    });
    expect(retarget).toBe("front-left");
    await page.waitForTimeout(160);
    await page.screenshot({ path: testInfo.outputPath("03-retarget-without-jump.png") });
    const [cancelled, arrived] = await page.evaluate(() => window.__georgieReelRetarget);
    expect(cancelled.status).toBe("cancelled");
    expect(arrived.status).toBe("arrived");
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "still");

    const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
    const start = await bone.boundingBox();
    if (!start) throw new Error("The hidden bone has no visible drag target");
    await page.mouse.move(start.x + start.width / 2, start.y + start.height * 0.75);
    await page.mouse.down();
    await page.mouse.move(view.width * 0.72, view.height * 0.45, { steps: 16 });
    await page.mouse.up();
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "reaction");
    await expect(page.locator("[data-georgie-dog]")).not.toHaveClass(/is-travelling/);
    await page.screenshot({ path: testInfo.outputPath("04-bone-wag-after-stop.png") });
  });
}
