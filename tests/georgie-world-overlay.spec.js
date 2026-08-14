import { expect, test } from "@playwright/test";

const previewRoutes = [
  "/",
  "/process/",
  "/blog/",
  "/blog/endgame-keyboard/",
  "/vim/",
  "/contact/",
];

test.describe("Georgie world across the real site", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  test("does not change the default public page before approval", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-georgie-overlay]")).toHaveCount(0);
  });

  test("gives an empty site a visible Georgie beat within two seconds", async ({ page }, testInfo) => {
    const startedAt = Date.now();
    await page.goto("/?georgie-world=1&offline=1");
    await expect(page.locator("[data-georgie-reaction]")).toHaveText(
      "A moth made a terrible tactical decision.",
      { timeout: 2_000 },
    );
    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs).toBeLessThan(2_000);
    await testInfo.attach("first-solo-beat.json", {
      body: JSON.stringify({ elapsedMs }),
      contentType: "application/json",
    });
  });

  for (const route of previewRoutes) {
    test(`mounts one non-blocking Georgie world on ${route}`, async ({ page }) => {
      await page.goto(`${route}?georgie-world=1&offline=1&test=1`);

      await expect(page.locator("[data-georgie-overlay]")).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Georgie's hidden bone" })).toHaveCount(1);
      await expect(page.locator('[data-presence-kind="moth"]')).toHaveCount(3);
      await expect(page.locator('[data-presence-kind="visitor"]')).toHaveCount(0);
      await expect(page.locator("[data-georgie-overlay]")).not.toHaveAttribute("data-speaking", "true");
      await expect(page.locator("[data-georgie-reaction]")).toHaveCSS("opacity", "0");

      await expect(page.locator("[data-georgie-overlay]")).toHaveCSS("pointer-events", "none");
      if (route !== "/vim/") {
        const topLink = page.locator('header a[href]:visible').first();
        await expect(topLink).toBeVisible();
        await topLink.click({ trial: true });
      }
    });
  }

  test("keeps the same local recognition when moving between pages", async ({ page }) => {
    await page.goto("/?georgie-world=1&offline=1&test=1");
    await page.goto("/process/?georgie-world=1&offline=1&test=1");

    await expect(page.locator("[data-recognition-copy]")).toContainText("remembers this browser");
  });

  test("hides the bone in a different stable place on different pages", async ({ page }) => {
    await page.goto("/?georgie-world=1&offline=1&test=1");
    const home = await page.getByRole("button", { name: "Georgie's hidden bone" }).boundingBox();
    await page.reload();
    const homeAgain = await page.getByRole("button", { name: "Georgie's hidden bone" }).boundingBox();
    await page.goto("/process/?georgie-world=1&offline=1&test=1");
    const process = await page.getByRole("button", { name: "Georgie's hidden bone" }).boundingBox();

    expect(home).toEqual(homeAgain);
    expect(process).not.toEqual(home);
  });

  test("lets the hidden bone lead Georgie across a real page", async ({ page }) => {
    await page.goto("/process/?georgie-world=1&offline=1&test=1");
    const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
    const start = await bone.boundingBox();
    if (!start) throw new Error("The hidden bone has no visible drag target");

    await page.mouse.move(start.x + start.width / 2, start.y + start.height * 0.75);
    await page.mouse.down();
    await page.mouse.move(1040, 430, { steps: 8 });
    await page.mouse.up();

    await expect(bone).toHaveAttribute("data-found", "true");
    await expect(page.locator("[data-georgie-overlay]")).toHaveAttribute("data-state", "bone-found");
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("src", /bone-wag\.gif$/);
    await expect(page.locator("[data-georgie-reaction]")).toContainText("tail is still going");
  });

  test("makes Georgie run away instead of vanishing after repeated invitations", async ({ page }) => {
    await page.goto("/?georgie-world=1&offline=1&test=1");
    const georgie = page.getByRole("button", { name: "Invite Georgie over" });
    await georgie.click();
    await georgie.click();
    await georgie.click();

    await expect(page.locator("[data-georgie-overlay]")).toHaveAttribute("data-state", "leaving");
    await expect(georgie).toBeVisible();
    await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", /left|right/);
    await expect(page.locator("[data-georgie-overlay]")).toHaveAttribute("data-state", "gone");
    await expect(georgie).toBeHidden();
  });
});
