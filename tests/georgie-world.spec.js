import { test, expect } from '@playwright/test';

const prototypeUrl = '/?georgie-world=1&georgies=2&seed=31';

test.use({ viewport: { width: 1440, height: 900 } });

test('feature-gated porch adopts one Georgie and renders the requested visitors', async ({ page }) => {
  await page.goto(prototypeUrl);

  await expect(page.locator('[data-georgie-world]')).toHaveCount(1);
  await expect(page.locator('[data-georgie-resident]')).toHaveCount(1);
  await expect(page.locator('[data-visitor-light]')).toHaveCount(2);
  await expect(page.locator('[data-room-count]')).toHaveText('2 here');
  await expect(page.locator('[data-georgie-resident]')).toHaveAttribute('data-georgie-state', 'peeking');
});

test('Georgie makes one quick pounce and the visitor light escapes', async ({ page }) => {
  await page.goto(`${prototypeUrl}&scene=missed-pounce`);

  const world = page.locator('[data-georgie-world]');
  const resident = page.locator('[data-georgie-resident]');
  const target = page.locator('[data-visitor-role="target"]');

  await expect(target).toHaveCount(1);
  await expect(world).toHaveAttribute('data-georgie-scene', 'missed', { timeout: 2500 });
  await expect(resident).toHaveAttribute('data-georgie-state', 'missed');
  await expect(target).toHaveAttribute('data-visitor-state', 'escaped');
});

test('feature-gated porch keeps Georgie and the visitor lights off interactive content', async ({ page }) => {
  await page.goto(prototypeUrl);

  const worldBoxes = await page.locator('[data-georgie-resident], [data-visitor-light], [data-room-count]').evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  }));

  const contentBoxes = await page.locator('h1:visible, h2:visible, a:visible, button:visible, [role="dialog"]:visible').evaluateAll((elements) => elements
    .filter((element) => !element.matches('[data-georgie-resident], [data-georgie-world] *'))
    .map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }));

  const overlaps = worldBoxes.flatMap((worldBox, worldIndex) => contentBoxes
    .map((contentBox, contentIndex) => ({ worldBox, contentBox, worldIndex, contentIndex }))
    .filter(({ worldBox: world, contentBox: content }) => world.left < content.right
      && world.right > content.left
      && world.top < content.bottom
      && world.bottom > content.top));

  expect(overlaps).toEqual([]);

  for (const box of worldBoxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(1440);
    expect(box.bottom).toBeLessThanOrEqual(900);
  }
});

test('Phalene-Vim adopts its existing Georgie instead of creating another resident', async ({ page }) => {
  await page.goto('/vim/?georgie-world=1&georgies=2&seed=31');

  await expect(page.locator('[data-georgie-resident]')).toHaveCount(1);
  await expect(page.locator('#vim-dashboard-pet')).toHaveAttribute('data-georgie-resident', '');
  await expect(page.locator('[data-visitor-light]')).toHaveCount(2);
});
