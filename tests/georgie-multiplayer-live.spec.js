import { expect, test } from "@playwright/test";

test.skip(!process.env.GEORGIE_LIVE_ROOM, "Runs only against the development Cloudflare room");

test("two real browser contexts share lights and invitations without cursors", async ({ browser }) => {
  const firstContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const secondContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();

  try {
    await first.goto("/georgie-lab/?test=1");
    await second.goto("/georgie-lab/?test=1");

    await expect(first.locator('[data-presence-kind="visitor"]')).toHaveCount(2, { timeout: 10_000 });
    await expect(second.locator('[data-presence-kind="visitor"]')).toHaveCount(2, { timeout: 10_000 });
    await expect(first.locator('[data-presence-kind="moth"]')).toHaveCount(3);
    await expect(second.locator('[data-presence-kind="moth"]')).toHaveCount(3);

    await first.getByRole("button", { name: "Invite Georgie over" }).click();
    await expect(second.locator("[data-georgie-reaction]")).toHaveText("A visitor invited Georgie. He will decide.");

    await second.goto("/404.html");
    await expect(first.locator('[data-presence-kind="visitor"]')).toHaveCount(1, { timeout: 10_000 });
  } finally {
    await firstContext.close();
    if (secondContext.pages().length) await secondContext.close();
  }
});
