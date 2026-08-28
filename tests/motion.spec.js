import { expect, test } from '@playwright/test';

async function box(locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value;
}

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

async function expectResponsiveGeorgie(page, surface, viewport) {
  const dog = await box(page.locator(surface.target));
  const anchor = await box(page.locator(surface.anchor));
  const readable = await box(page.locator(surface.readable));

  expect(dog.x, `${surface.path} Georgie starts outside ${viewport.width}px`).toBeGreaterThanOrEqual(-0.5);
  expect(dog.x + dog.width, `${surface.path} Georgie ends outside ${viewport.width}px`).toBeLessThanOrEqual(viewport.width + 0.5);
  const anchored = surface.edge === 'top'
    ? dog.x < anchor.x + anchor.width
      && dog.x + dog.width > anchor.x
      && dog.y + dog.height >= anchor.y - 2
      && dog.y <= anchor.y + 60
    : surface.edge === 'right'
      ? dog.x >= anchor.x
        && dog.x <= anchor.x + anchor.width + 80
        && dog.y < anchor.y + anchor.height
        && dog.y + dog.height > anchor.y
      : overlaps(dog, anchor);
  expect(anchored, `${surface.path} Georgie detached from its surface`).toBe(true);
  expect(overlaps(dog, readable), `${surface.path} Georgie covers readable content`).toBe(false);
}

async function attachPausedFrames(page, target, testInfo, prefix) {
  const frameTimes = [0, 0.25, 0.5, 0.75, 1];
  const animations = await page.evaluate(() => {
    const active = document.getAnimations().filter((animation) => {
      const timing = animation.effect?.getComputedTiming();
      return timing && Number.isFinite(timing.endTime) && timing.endTime > 0;
    });
    active.forEach((animation) => animation.pause());
    window.__motionQaAnimations = active;
    return active.length;
  });
  expect(animations).toBeGreaterThan(0);

  for (const progress of frameTimes) {
    await page.evaluate((value) => {
      window.__motionQaAnimations.forEach((animation) => {
        const timing = animation.effect.getComputedTiming();
        animation.currentTime = Math.max(0, Math.min(timing.endTime, timing.endTime * value));
      });
    }, progress);
    await testInfo.attach(`${prefix}-${String(Math.round(progress * 100)).padStart(3, '0')}`, {
      body: await target.screenshot({ animations: 'allow' }),
      contentType: 'image/png'
    });
  }
}

async function expectStableTextDuring(page, trigger, text) {
  const initial = await box(text);
  await trigger();
  for (let index = 0; index < 12; index += 1) {
    await page.waitForTimeout(28);
    const current = await box(text);
    expect(Math.abs(current.x - initial.x)).toBeLessThan(0.6);
    expect(Math.abs(current.y - initial.y)).toBeLessThan(0.6);
    expect(Math.abs(current.width - initial.width)).toBeLessThan(0.6);
    expect(Math.abs(current.height - initial.height)).toBeLessThan(0.6);
  }
}

test('portfolio motion keeps content stable and records the expressive surfaces', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const background = page.locator('#portfolio-bg');
  await page.mouse.move(1278, 718);
  await page.waitForTimeout(240);
  const parallax = await background.evaluate((element) => ({
    x: Number.parseFloat(element.style.getPropertyValue('--bg-x')),
    y: Number.parseFloat(element.style.getPropertyValue('--bg-y'))
  }));
  expect(Math.abs(parallax.x)).toBeLessThanOrEqual(4.1);
  expect(Math.abs(parallax.y)).toBeLessThanOrEqual(3.1);

  const homeDog = page.locator('.georgie-egg--home');
  await homeDog.hover();
  const media = page.locator('[data-featured-project="phalene-vim"] .project-media');
  const before = await media.boundingBox();
  await attachPausedFrames(page, media, testInfo, 'home-georgie');
  expect(await media.boundingBox()).toEqual(before);

  await page.goto('/contact/');
  const email = page.locator('.contact-path').first();
  const emailTitle = email.locator('h2');
  const contactDog = page.locator('.contact-georgie-wrap');
  await expectStableTextDuring(page, () => contactDog.hover(), emailTitle);
  expect(await email.evaluate((element) => getComputedStyle(element).transform)).toBe('none');

  await page.reload();
  await page.locator('.contact-georgie-wrap').hover();
  await attachPausedFrames(page, page, testInfo, 'contact-paw');

  await page.goto('/blog/');
  const feature = page.locator('.writing-feature');
  await expectStableTextDuring(page, () => feature.hover(), feature.locator('h2'));
  expect(await feature.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
});

test('palette and reader motion stay compact, stable, and touch-safe', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const palette = page.locator('#command-palette');
  await expect(palette).toBeVisible();
  await expect(palette.locator('.site-command-list a')).toHaveCount(10);
  const commandMetrics = await palette.locator('.site-command-groups').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight
  }));
  expect(commandMetrics.scrollHeight, JSON.stringify(commandMetrics)).toBeLessThanOrEqual(commandMetrics.clientHeight + 1);

  const firstCommand = palette.locator('.site-command-list a').first();
  await firstCommand.focus();
  expect(await firstCommand.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await attachPausedFrames(page, palette.locator('.palette-panel'), testInfo, 'portfolio-palette');

  await page.goto('/blog/portable-agent-factory/');
  await page.evaluate(() => window.scrollTo(0, 520));
  await expect(page.locator('.reader-toc')).toBeVisible();
  const readerDog = page.locator('.reader-georgie');
  await readerDog.click();
  expect(await page.locator('.reader-toc').evaluate((element) => getComputedStyle(element).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await attachPausedFrames(page, page, testInfo, 'reader-georgie');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.locator('.reader-mobile-trigger').click();
  const sheet = page.locator('.reader-sheet-panel');
  await expect(sheet).toBeVisible();
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const sheetBox = await box(sheet);
  expect(sheetBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(sheetBox.x + sheetBox.width).toBeLessThanOrEqual(viewportWidth + 0.5);
});

test('reduced motion keeps the same states without animated movement', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  await page.goto('/contact/');
  await page.locator('.contact-path').first().hover();
  await expect(page.locator('.contact-grid')).toHaveClass(/is-georgie-active/);
  expect(await page.locator('.contact-georgie-wrap').evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  expect(await page.locator('.contact-path').first().evaluate((element) => getComputedStyle(element).transform)).toBe('none');

  await page.goto('/');
  await page.mouse.move(1278, 898);
  await page.waitForTimeout(50);
  expect(await page.locator('#portfolio-bg').evaluate((element) => element.style.getPropertyValue('--bg-x'))).toBe('');
  await context.close();
});

test('responsive motion surfaces stay inside the viewport and leave visual artifacts', async ({ page }, testInfo) => {
  const viewports = [
    { name: 'narrow-phone', width: 320, height: 568 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'wide', width: 1440, height: 900 }
  ];
  const surfaces = [
    { name: 'home-georgie', path: '/', target: '.georgie-egg--home', anchor: '[data-featured-project="phalene-vim"] .project-media', readable: '[data-featured-project="phalene-vim"] .project-rail', trigger: '.georgie-egg--home' },
    { name: 'process-georgie', path: '/process/', target: '.georgie-egg--process', anchor: '.layer-rail', readable: '.process-panel [data-layer-content]:not([hidden]) h2', trigger: '.georgie-egg--process' },
    { name: 'writing-georgie', path: '/blog/', target: '.georgie-egg--writing', anchor: '.writing-feature', readable: '.writing-feature h2', trigger: '.writing-feature' },
    { name: 'contact-georgie', path: '/contact/', target: '.contact-georgie-wrap', anchor: '.contact-path:first-of-type', readable: '.contact-path:first-of-type .contact-action', trigger: '.contact-georgie-wrap', edge: 'top' },
    { name: 'reader-georgie', path: '/blog/portable-agent-factory/', target: '.reader-georgie', anchor: '.reader-rail-slot', readable: '.markdown-body', trigger: '.reader-georgie', click: true }
  ];
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const surface of surfaces) {
      await page.goto(surface.path);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(surface.target).scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${surface.path} at ${viewport.width}px`).toBeLessThanOrEqual(1);
      await expectResponsiveGeorgie(page, surface, viewport);

      await testInfo.attach(`${viewport.name}-${surface.name}-idle`, {
        body: await page.screenshot(),
        contentType: 'image/png'
      });

      if (surface.click) await page.locator(surface.trigger).click();
      else await page.locator(surface.trigger).hover();
      await page.waitForTimeout(90);
      await expectResponsiveGeorgie(page, surface, viewport);
      await testInfo.attach(`${viewport.name}-${surface.name}-active`, {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
    }
  }

  expect(runtimeErrors).toEqual([]);
});
