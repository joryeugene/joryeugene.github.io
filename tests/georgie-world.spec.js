import { expect, test } from "@playwright/test";

test.describe("Georgie's living web prototype", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  test("stays alive without pretending ambient moths are visitors", async ({ page }) => {
    await page.goto("/georgie-lab/?offline=1&test=1");

    await expect(page.locator("[data-georgie-world]")).toBeVisible();
    await expect(page.locator('[data-presence-kind="moth"]')).toHaveCount(3);
    await expect(page.locator('[data-presence-kind="visitor"]')).toHaveCount(0);
    await expect(page.locator("[data-room-copy]")).toHaveText("Just Georgie tonight");
    await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", /right|left|front|rear/);
  });

  test("caps real visitor lights without turning the page into cursor soup", async ({ page }) => {
    await page.goto("/georgie-lab/?offline=1&test=1");
    await page.evaluate(() => window.__georgieWorld.setPresence(500));

    await expect(page.locator('[data-presence-kind="visitor"]')).toHaveCount(4);
    await expect(page.locator("[data-presence-aggregate]")).toHaveText("5+ here");
    await expect(page.locator("[data-room-copy]")).toHaveText("A small crowd is here");
  });

  test("uses directional Pixel Georgie motion and lets him leave", async ({ page }) => {
    await page.goto("/georgie-lab/?offline=1&test=1");

    await page.evaluate(() => {
      window.__georgieWorld.moveTo(0.16, 0.2);
      window.__georgieWorld.moveTo(0.82, 0.78);
    });
    await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", "front-right");
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("src", /run-front-right\.gif$/);

    const invite = page.getByRole("button", { name: "Invite Georgie over" });
    await invite.click();
    await invite.click();
    await invite.click();
    await expect(page.locator("[data-georgie-world]")).toHaveAttribute("data-state", "gone");
    await expect(page.locator("[data-georgie-dog]")).toBeHidden();
    await expect(page.locator("[data-georgie-reaction]")).toHaveText("Georgie has had enough. He left.");
  });

  test("follows the discovered bone instead of following the cursor", async ({ page }) => {
    await page.goto("/georgie-lab/?offline=1&test=1");
    const dog = page.locator("[data-georgie-dog]");
    const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
    const arena = page.locator("[data-georgie-arena]");

    const originalDirection = await dog.getAttribute("data-direction");
    await page.mouse.move(900, 160);
    await expect(dog).toHaveAttribute("data-direction", originalDirection);

    await expect(bone).toHaveAttribute("data-found", "false");
    const boneBox = await bone.boundingBox();
    const arenaBox = await arena.boundingBox();
    await page.mouse.move(boneBox.x + boneBox.width / 2, boneBox.y + boneBox.height * 0.78);
    await page.mouse.down();
    await page.mouse.move(arenaBox.x + arenaBox.width * 0.76, arenaBox.y + arenaBox.height * 0.4, { steps: 8 });

    await expect(bone).toHaveAttribute("data-found", "true");
    await expect(page.locator("[data-georgie-world]")).toHaveAttribute("data-state", "following-bone");
    await expect(page.locator("[data-georgie-hearts] > span")).toHaveCount(3);
    await expect(page.locator("[data-georgie-reaction]")).toContainText("bone");
    await page.mouse.up();
    await expect(page.locator("[data-georgie-world]")).toHaveAttribute("data-state", "bone-found");
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("src", /bone-wag\.gif$/);
  });

  test("keeps seven-day recognition local and provides Forget me", async ({ page }) => {
    await page.goto("/georgie-lab/?offline=1&test=1");
    await page.reload();

    await expect(page.locator("[data-recognition-copy]")).toContainText("remembers this browser");
    await page.getByRole("button", { name: "Forget me" }).click();
    await expect(page.locator("[data-recognition-copy]")).toHaveText("This browser is new to Georgie.");
    expect(await page.evaluate(() => localStorage.getItem("georgie-world-recognition-v1"))).toBeNull();
  });

  test("uses a still Pixel Georgie frame when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/georgie-lab/?offline=1&test=1");

    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("src", /still-right\.png$/);
    const before = await page.locator("[data-georgie-dog]").boundingBox();
    await page.waitForTimeout(700);
    const after = await page.locator("[data-georgie-dog]").boundingBox();
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
  });
});
