import { expect, test } from "@playwright/test";

test.skip(!process.env.GEORGIE_LIVE_ROOM, "Runs only against the development Cloudflare room");

test("two real browser contexts share lights and invitations without cursors", async ({ browser }) => {
  test.setTimeout(80_000);
  const firstContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const secondContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();

  try {
    await first.goto("/process/?georgie-world=1&test=1");
    await second.goto("/blog/endgame-keyboard/?georgie-world=1&test=1");

    await expect(first.locator('[data-presence-kind="visitor"]')).toHaveCount(2, { timeout: 10_000 });
    await expect(second.locator('[data-presence-kind="visitor"]')).toHaveCount(2, { timeout: 10_000 });
    await expect(first.locator('[data-presence-kind="moth"]')).toHaveCount(3);
    await expect(second.locator('[data-presence-kind="moth"]')).toHaveCount(3);

    await expect.poll(async () => {
      const [firstBeat, secondBeat] = await Promise.all([
        first.locator("[data-georgie-overlay]").getAttribute("data-shared-beat"),
        second.locator("[data-georgie-overlay]").getAttribute("data-shared-beat"),
      ]);
      return firstBeat && firstBeat === secondBeat ? firstBeat : "mismatch";
    }).toMatch(/^\d+$/);

    const [firstScene, secondScene] = await Promise.all([first, second].map((page) => page.evaluate(() => ({
      beat: document.querySelector("[data-georgie-overlay]").dataset.sharedBeat,
      direction: document.querySelector("[data-georgie-dog]").dataset.direction,
      left: document.querySelector("[data-georgie-dog]").style.left,
      top: document.querySelector("[data-georgie-dog]").style.top,
    }))));
    expect(secondScene).toEqual(firstScene);

    await first.getByRole("button", { name: "Invite Georgie over" }).click();
    await expect(first.locator("[data-georgie-reaction]")).toHaveText("Georgie looked over. That is not the same as coming.");
    await expect(second.locator("[data-georgie-reaction]")).toHaveText("Georgie looked over. That is not the same as coming.");
    await expect(first.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", "front");
    await expect(second.locator("[data-georgie-dog]")).toHaveAttribute("data-direction", "front");

    const bone = first.getByRole("button", { name: "Georgie's hidden bone" });
    const boneBox = await bone.boundingBox();
    if (!boneBox) throw new Error("The live bone has no drag target");
    await first.mouse.move(boneBox.x + boneBox.width / 2, boneBox.y + boneBox.height * 0.75);
    await first.mouse.down();
    await first.mouse.move(930, 460, { steps: 8 });
    await first.mouse.up();
    await expect(second.locator("[data-georgie-sprite]")).toHaveAttribute("src", /bone-wag\.gif$/);
    await expect(second.locator("[data-georgie-reaction]")).toHaveText("Someone found Georgie's bone. He knows.");

    await secondContext.close();
    await expect(first.locator('[data-presence-kind="visitor"]')).toHaveCount(1, { timeout: 65_000 });
  } finally {
    await firstContext.close();
    if (secondContext.pages().length) await secondContext.close();
  }
});
