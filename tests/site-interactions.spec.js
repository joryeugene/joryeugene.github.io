import { test, expect } from '@playwright/test';

const coreRoutes = ['/', '/process/', '/blog/', '/contact/', '/blog/ai-engineer-verification/'];
const georgieRoutes = [
  { route: '/', selector: '.georgie-egg--home', target: '[data-featured-project="phalene-vim"] .project-media', asset: 'georgie-home-v2-pair.png' },
  { route: '/process/', selector: '.georgie-egg--process', target: '.process-stage', asset: 'georgie-process-pair.webp' },
  { route: '/blog/', selector: '.georgie-egg--writing', target: '.writing-feature', asset: 'georgie-writing-pair.webp' },
  { route: '/contact/', selector: '.georgie-egg--contact', target: '.contact-grid', asset: 'georgie-contact-pair.webp' }
];

test('homepage gallery keeps keyboard order, Georgie state, and four viewport contracts', async ({ page }) => {
  const requiredViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 740 }
  ];

  for (const viewport of requiredViewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const measurements = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('[data-featured-project] .project-media img'));
      const actions = Array.from(document.querySelectorAll('[data-featured-project] .project-links a'));
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const gallery = document.querySelector('.project-gallery').getBoundingClientRect();
      const dog = document.querySelector('.georgie-egg--home').getBoundingClientRect();
      const phaleneMedia = document.querySelector('[data-featured-project="phalene-vim"] .project-media').getBoundingClientRect();
      const phaleneRail = document.querySelector('[data-featured-project="phalene-vim"] .project-rail').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headerBottom: header.bottom,
        galleryTop: gallery.top,
        images: images.map((image) => ({
          fit: getComputedStyle(image).objectFit,
          naturalRatio: image.naturalWidth / image.naturalHeight,
          boxRatio: image.getBoundingClientRect().width / image.getBoundingClientRect().height
        })),
        actions: actions.map((action) => {
          const box = action.getBoundingClientRect();
          return { x: box.x, right: box.right, width: box.width, height: box.height };
        }),
        dog: { x: dog.x, y: dog.y, right: dog.right, bottom: dog.bottom },
        phaleneMedia: { x: phaleneMedia.x, y: phaleneMedia.y, right: phaleneMedia.right, bottom: phaleneMedia.bottom },
        phaleneRail: { x: phaleneRail.x, y: phaleneRail.y, right: phaleneRail.right, bottom: phaleneRail.bottom }
      };
    });

    expect(measurements.overflow, `${viewport.width}px horizontal overflow`).toBeLessThanOrEqual(1);
    expect(measurements.galleryTop, `${viewport.width}px header collision`).toBeGreaterThanOrEqual(measurements.headerBottom);
    for (const image of measurements.images) {
      expect(image.fit).toBe('contain');
      expect(Math.abs(image.boxRatio - image.naturalRatio), `${viewport.width}px image ratio changed`).toBeLessThan(0.02);
    }
    for (const action of measurements.actions) {
      expect(action.x).toBeGreaterThanOrEqual(-1);
      expect(action.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(action.width).toBeGreaterThan(0);
      expect(action.height).toBeGreaterThanOrEqual(40);
    }
    expect(measurements.dog.x).toBeGreaterThanOrEqual(measurements.phaleneMedia.x - 1);
    expect(measurements.dog.right).toBeLessThanOrEqual(measurements.phaleneMedia.right + 1);
    expect(measurements.dog.y).toBeGreaterThanOrEqual(measurements.phaleneMedia.y - 1);
    expect(measurements.dog.bottom).toBeLessThanOrEqual(measurements.phaleneMedia.bottom + 1);
    const dogOverlapsRail = measurements.dog.x < measurements.phaleneRail.right
      && measurements.dog.right > measurements.phaleneRail.x
      && measurements.dog.y < measurements.phaleneRail.bottom
      && measurements.dog.bottom > measurements.phaleneRail.y;
    expect(dogOverlapsRail, `${viewport.width}px Georgie covers Phalene proof`).toBe(false);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const expectedOrder = ['Open walkthrough', 'View source', 'View source', 'Read privacy', 'Try the editor', 'View source'];
  const projectActions = page.locator('[data-featured-project] .project-links a');
  for (let index = 0; index < expectedOrder.length; index += 1) {
    await page.keyboard.press('j');
    await expect(projectActions.nth(index)).toHaveText(expectedOrder[index]);
    await expect(projectActions.nth(index)).toBeFocused();
  }
  await page.keyboard.press('k');
  await expect(page.getByRole('link', { name: 'Try the editor' })).toBeFocused();

  const egg = page.locator('.georgie-egg--home');
  const sprite = egg.locator('.georgie-egg__sprite');
  const phaleneMedia = page.locator('[data-featured-project="phalene-vim"] .project-media');
  const mediaMetrics = () => phaleneMedia.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x + window.scrollX, y: box.y + window.scrollY, width: box.width, height: box.height };
  });
  const idleBox = await mediaMetrics();
  await egg.hover();
  await expect(sprite).toHaveCSS('background-position-x', '100%');
  expect(await mediaMetrics()).toEqual(idleBox);
  await page.mouse.move(2, 2);
  await egg.focus();
  await expect(sprite).toHaveCSS('background-position-x', '100%');
  expect(await mediaMetrics()).toEqual(idleBox);
  await egg.blur();
  await egg.click();
  await expect(egg).toHaveClass(/is-georgie-active/);
  await expect(egg).not.toHaveClass(/is-georgie-active/, { timeout: 1600 });
});
const viewports = [
  { name: 'wide desktop', width: 1920, height: 1080 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'landscape tablet', width: 1024, height: 768 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'small tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'narrow phone', width: 320, height: 740 }
];

const contactViewports = [
  { name: 'narrow phone', width: 320, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'small tablet', width: 768, height: 1024 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'landscape tablet', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide desktop', width: 1920, height: 1080 }
];

const commandViewports = [
  { name: 'narrow phone', width: 320, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide desktop', width: 1920, height: 1080 }
];

function collectRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://localhost:8767/') && response.status() >= 400) {
      failures.push(`${response.status()}: ${response.url()}`);
    }
  });
  return failures;
}

for (const viewport of viewports) {
  test(`${viewport.name} keeps every core page inside the viewport without runtime failures`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const failures = collectRuntimeFailures(page);

    for (const route of coreRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.scrollWidth, `${route} overflowed at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1);

      const actions = page.locator('a:visible, button:visible, input:visible');
      for (let index = 0; index < await actions.count(); index += 1) {
        const action = actions.nth(index);
        const box = await action.boundingBox();
        if (!box) continue;
        const name = await action.getAttribute('aria-label') || await action.innerText().catch(() => '') || await action.getAttribute('placeholder');
        const actionLabel = `${route} action ${index} (${name?.trim() || 'unnamed'})`;
        expect(box.x, `${actionLabel} starts outside the viewport`).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width, `${actionLabel} ends outside the viewport`).toBeLessThanOrEqual(viewport.width + 1);
        expect(name?.trim(), `${route} action ${index} has no accessible text`).toBeTruthy();
      }
    }

    expect(failures).toEqual([]);
  });
}

for (const viewport of commandViewports) {
  test(`portfolio and reader palettes fit and scroll at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    const cases = [
      { route: '/', trigger: '[data-open-palette]', panel: '.palette-panel' },
      { route: '/blog/ai-engineer-verification/', trigger: '[data-open-reader-palette]', panel: '.reader-palette-panel' }
    ];

    for (const pageCase of cases) {
      await page.goto(pageCase.route);
      const trigger = page.locator(pageCase.trigger).first();
      await expect(trigger).toBeVisible();
      if (viewport.width <= 390) {
        const compactLabel = await trigger.evaluate((element) => getComputedStyle(element, '::after').content);
        expect(compactLabel).toContain('⌘K');
      }
      await trigger.click();

      const palette = page.getByRole('dialog', { name: 'Command palette' });
      const panel = palette.locator(pageCase.panel);
      const search = palette.getByRole('searchbox', { name: 'Search commands' });
      await expect(palette).toBeVisible();
      await expect(search).toBeFocused();
      await expect(palette.getByRole('link')).toHaveCount(10);

      const panelBox = await panel.boundingBox();
      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(panelBox.y).toBeGreaterThanOrEqual(0);
      expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height + 1);
      await expect(palette.locator('[data-command-groups]')).toHaveCSS('overflow-y', 'auto');

      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      await page.keyboard.press('Escape');
      await expect(palette).toBeHidden();
    }
  });
}

for (const viewport of contactViewports) {
  test(`Georgie stays fully visible and attached to Email at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/contact/');
    const georgie = await page.locator('.contact-georgie-wrap').boundingBox();
    const email = await page.locator('.contact-path').first().boundingBox();
    const emailNumber = await page.locator('.contact-path').first().locator('.contact-number').boundingBox();
    expect(georgie).not.toBeNull();
    expect(email).not.toBeNull();
    expect(emailNumber).not.toBeNull();
    expect(georgie.x).toBeGreaterThanOrEqual(0);
    expect(georgie.x + georgie.width).toBeLessThanOrEqual(viewport.width);
    expect(georgie.y).toBeGreaterThanOrEqual(0);

    const horizontalTouch = georgie.x + georgie.width >= email.x - 2
      && georgie.x <= email.x + 50;
    const topEdgeTouch = georgie.y + georgie.height >= email.y - 2
      && georgie.y <= email.y + 60;
    expect(horizontalTouch || topEdgeTouch).toBe(true);

    if (viewport.width > 600 && viewport.width <= 900) {
      expect(emailNumber.x).toBeGreaterThanOrEqual(georgie.x + georgie.width);
    }
  });
}

for (const route of georgieRoutes) {
  test(`${route.route} Georgie and his nearby surface move through two kinetic stages`, async ({ page }) => {
    await page.goto(route.route);
    const egg = page.locator(route.selector);
    const sprite = egg.locator('.georgie-egg__sprite');
    const target = page.locator(route.target);

    await expect(egg).toBeVisible();
    await expect(sprite).toHaveCSS('background-image', new RegExp(route.asset.replace('.', '\\.')));
    await expect(sprite).toHaveCSS('background-position-x', /^0(?:px|%)$/);

    await egg.hover();
    await expect(egg).toHaveClass(/is-georgie-active/);
    await expect(target).toHaveClass(/is-georgie-active/);
    await expect(sprite).toHaveCSS('background-position-x', '100%');

    await page.mouse.move(2, 2);
    await expect(egg).not.toHaveClass(/is-georgie-active/);
    await expect(target).not.toHaveClass(/is-georgie-active/);

    await egg.click();
    await expect(egg).toHaveClass(/is-georgie-active/);
    await expect(sprite).toHaveCSS('background-position-x', '100%');
    await expect(egg).not.toHaveClass(/is-georgie-active/, { timeout: 1600 });
  });
}

test('homepage Georgie leaves the header navigation actionable at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const header = await page.locator('.site-header').boundingBox();
  const georgie = await page.locator('.georgie-egg--home').boundingBox();
  expect(georgie.y).toBeGreaterThanOrEqual(header.y + header.height);

  for (const name of ['Work', 'Process']) {
    const link = page.getByRole('link', { name, exact: true });
    expect(await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return element === hit || element.contains(hit);
    }), `${name} is covered at its center`).toBe(true);
  }
});

test('Georgie stays clipped to Phalene while the other route mascots keep their seams', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('/');
  const homeDog = await page.locator('.georgie-egg--home').boundingBox();
  const phaleneMedia = await page.locator('[data-featured-project="phalene-vim"] .project-media').boundingBox();
  expect(homeDog.x).toBeGreaterThanOrEqual(phaleneMedia.x);
  expect(homeDog.x + homeDog.width).toBeLessThanOrEqual(phaleneMedia.x + phaleneMedia.width + 1);
  expect(homeDog.y).toBeGreaterThanOrEqual(phaleneMedia.y);
  expect(homeDog.y + homeDog.height).toBeLessThanOrEqual(phaleneMedia.y + phaleneMedia.height + 1);

  await page.locator('.georgie-egg--home').hover();
  const homeEgg = page.locator('.georgie-egg--home');
  await expect(homeEgg).toHaveCSS('animation-name', 'georgie-egg-react');
  await expect(homeEgg.locator('.georgie-egg__sprite')).toHaveCSS('background-position-x', '100%');
  await page.locator('.intro h1').hover();
  await expect(homeEgg).not.toHaveClass(/is-georgie-active/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mobileDog = await page.locator('.georgie-egg--home').boundingBox();
  const mobilePhaleneMedia = await page.locator('[data-featured-project="phalene-vim"] .project-media').boundingBox();
  expect(mobileDog.x).toBeGreaterThanOrEqual(mobilePhaleneMedia.x);
  expect(mobileDog.x + mobileDog.width).toBeLessThanOrEqual(mobilePhaleneMedia.x + mobilePhaleneMedia.width + 1);
  expect(mobileDog.y + mobileDog.height).toBeLessThanOrEqual(mobilePhaleneMedia.y + mobilePhaleneMedia.height + 1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/process/');
  const processEgg = page.locator('.georgie-egg--process');
  const processDog = await processEgg.boundingBox();
  const processRailLocator = page.locator('.layer-rail');
  const processPanelLocator = page.locator('.process-panel');
  const processRail = await processRailLocator.boundingBox();
  const processPanel = await processPanelLocator.boundingBox();
  const processScrollY = await page.evaluate(() => window.scrollY);
  const processHeading = await page.locator('.process-deep-dive h2').boundingBox();
  const processSeam = (processRail.x + processRail.width + processPanel.x) / 2;
  expect(Math.abs(processDog.x + processDog.width / 2 - processSeam)).toBeLessThanOrEqual(2);
  expect(processDog.y + processDog.height - processPanel.y).toBeGreaterThanOrEqual(13);
  expect(processDog.y + processDog.height - processPanel.y).toBeLessThanOrEqual(18);
  expect(processPanel.y - processHeading.y - processHeading.height).toBeLessThanOrEqual(102);

  await processEgg.hover();
  await page.waitForTimeout(450);
  const activeProcessRail = await processRailLocator.boundingBox();
  const activeProcessPanel = await processPanelLocator.boundingBox();
  const activeProcessScrollY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(activeProcessRail.y - activeProcessPanel.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(
    (activeProcessRail.y + activeProcessScrollY) - (processRail.y + processScrollY)
  )).toBeLessThanOrEqual(0.5);
  expect(await processPanelLocator.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  expect(await processPanelLocator.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');

  await page.goto('/blog/');
  const writingDog = page.locator('.georgie-egg--writing');
  const writingBox = await page.locator('.writing-feature').boundingBox();
  const writingDogBox = await writingDog.boundingBox();
  const writingLinkBox = await page.locator('.writing-feature a').boundingBox();
  expect(await writingDog.evaluate((dog) => dog.closest('.writing-feature__art') === null)).toBe(true);
  const writingRightInset = writingBox.x + writingBox.width - writingDogBox.x - writingDogBox.width;
  expect(writingRightInset).toBeGreaterThanOrEqual(12);
  expect(writingRightInset).toBeLessThanOrEqual(32);
  expect(writingDogBox.y).toBeLessThan(writingBox.y + writingBox.height);
  expect(writingDogBox.y + writingDogBox.height - writingBox.y - writingBox.height).toBeGreaterThanOrEqual(13);
  expect(writingDogBox.y + writingDogBox.height - writingBox.y - writingBox.height).toBeLessThanOrEqual(17);
  expect(writingBox.y + writingBox.height - writingLinkBox.y - writingLinkBox.height).toBeLessThanOrEqual(56);

  await page.mouse.move(2, 2);
  await page.locator('.writing-feature__link').hover();
  await expect(writingDog).toHaveClass(/is-georgie-active/);
  await expect.poll(async () => {
    const dogBox = await writingDog.boundingBox();
    const featureBox = await page.locator('.writing-feature').boundingBox();
    return dogBox.y + dogBox.height - featureBox.y - featureBox.height;
  }).toBeLessThanOrEqual(12);
  await page.locator('.writing-feature__copy').hover();
  await expect(writingDog).toHaveClass(/is-georgie-active/);
  await page.mouse.move(2, 2);
  await expect(writingDog).not.toHaveClass(/is-georgie-active/);
});

test('Georgie easter eggs stay inside a narrow viewport without covering their page headings', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of georgieRoutes) {
    await page.goto(route.route);
    const egg = page.locator(route.selector);
    await egg.scrollIntoViewIfNeeded();
    const box = await egg.boundingBox();
    const heading = await page.locator('main h1').first().boundingBox();
    expect(box).not.toBeNull();
    expect(heading).not.toBeNull();
    expect(box.x, `${route.route} Georgie starts outside the viewport`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${route.route} Georgie ends outside the viewport`).toBeLessThanOrEqual(320);
    const overlapsHeading = box.x < heading.x + heading.width
      && box.x + box.width > heading.x
      && box.y < heading.y + heading.height
      && box.y + box.height > heading.y;
    expect(overlapsHeading, `${route.route} Georgie covers the page heading`).toBe(false);
  }

  await page.goto('/blog/');
  const writingDog = await page.locator('.georgie-egg--writing').boundingBox();
  const writingCopy = await page.locator('.writing-feature__copy').boundingBox();
  expect(writingDog).not.toBeNull();
  expect(writingCopy).not.toBeNull();
  expect(writingDog.x + writingDog.width).toBeLessThanOrEqual(writingCopy.x + writingCopy.width + 1);
});

test('homepage static projects, keyboard passage, and command palette work without runtime failures', async ({ page }) => {
  await page.goto('/');
  const failures = collectRuntimeFailures(page);

  await expect(page.locator('[data-featured-project]')).toHaveCount(3);
  await expect(page.locator('.depth-drawer, [data-project-inspect]')).toHaveCount(0);
  await page.keyboard.press('j');
  await expect(page.getByRole('link', { name: 'Open walkthrough' })).toBeFocused();
  await page.keyboard.press('j');
  await expect(page.locator('[data-featured-project="dadbod-grip"]').getByRole('link', { name: 'View source' })).toBeFocused();

  const archiveTarget = page.getByRole('link', { name: 'Totally Reliable Delivery Service' });
  for (let index = 0; index < 20 && !(await archiveTarget.evaluate((element) => element === document.activeElement)); index += 1) {
    await page.keyboard.press('j');
  }
  await expect(archiveTarget).toBeFocused();

  await page.getByRole('button', { name: 'Commands' }).click();
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
  expect(failures).toEqual([]);
});

test('portfolio command palette keeps the page frame stable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', /stable/);
  const before = await page.locator('.portfolio-shell').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  });
  await page.getByRole('button', { name: 'Commands' }).click();
  const after = await page.locator('.portfolio-shell').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  });
  expect(after.left).toBeCloseTo(before.left, 1);
  expect(after.width).toBeCloseTo(before.width, 1);
});

test('shared portfolio actions respond to keyboard focus without moving', async ({ page }) => {
  const documentBox = (locator) => locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  });
  const cases = [
    { route: '/', name: 'Try the editor' },
    { route: '/process/', name: 'Visit the official site', arrow: '.case-destinations a' },
    { route: '/contact/', name: /Write a note/, arrow: '.contact-action' }
  ];

  for (const item of cases) {
    await page.goto(item.route);
    const action = page.getByRole('link', { name: item.name }).first();
    const before = await documentBox(action);

    await action.focus();
    await expect(action).toBeFocused();
    if (item.arrow) {
      const arrow = page.locator(item.arrow).first();
      await expect.poll(() => arrow.evaluate((element) => getComputedStyle(element, '::after').transform)).not.toBe('none');
    } else {
      await expect(action).toHaveCSS('outline-style', 'solid');
    }

    const after = await documentBox(action);
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
    expect(after.width).toBeCloseTo(before.width, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
  }
});

test('Process summaries show local product evidence in a stable landscape frame', async ({ page }) => {
  const cases = [
    ['Totally Reliable', '/jpg/process/totally-reliable-ragdoll-chain.jpg', 'Four Totally Reliable Delivery Service ragdolls hanging in a chain beneath a flying jetpack.'],
    ['Workhelix', '/jpg/process/nucleus-ai-assessment.png', 'Nucleus AI Assessment dashboard with opportunity metrics, a business-unit chart, and a use-case treemap.'],
    ['Dadbod Grip', '/jpg/process/dadbod-grip-live.png', 'Dadbod Grip in Neovim with schema navigation, a query editor, staged grid changes, and generated SQL.'],
    ['Pray Orthodox', '/jpg/process/pray-orthodox-reader.png', 'Pray Orthodox showing the selected church day beside the Third Hour Reader office with its sources collapsed.']
  ];

  await page.goto('/process/');

  for (const [name, src, alt] of cases) {
    await page.getByRole('tab', { name, exact: true }).click();
    const image = page.locator('[data-case-panel]:visible .process-case-shot img');
    await expect(image).toHaveAttribute('src', src);
    await expect(image).toHaveAttribute('alt', alt);
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect(image).toBeVisible();
    expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    const dimensions = await image.evaluate((element) => ({
      declaredWidth: Number(element.getAttribute('width')),
      declaredHeight: Number(element.getAttribute('height')),
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight
    }));
    expect(dimensions.declaredWidth, `${name} width metadata`).toBe(dimensions.naturalWidth);
    expect(dimensions.declaredHeight, `${name} height metadata`).toBe(dimensions.naturalHeight);
    const box = await page.locator('[data-case-panel]:visible .process-case-shot').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
  }
});

test('Process stacked summaries do not reserve blank space below the selected evidence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/process/');

  for (const name of ['Totally Reliable', 'Workhelix', 'Dadbod Grip', 'Pray Orthodox']) {
    await page.getByRole('tab', { name, exact: true }).click();
    const unusedHeight = await page.locator('[data-case-panel]:visible').evaluate((article) => {
      const articleBottom = article.getBoundingClientRect().bottom;
      const imageBottom = article.querySelector('.process-case-shot').getBoundingClientRect().bottom;
      return articleBottom - imageBottom;
    });
    expect(unusedHeight, `${name} leaves empty stacked-summary space`).toBeLessThanOrEqual(1);
  }
});

test('every Process case updates its summary, destination, deep dive, layers, and wrong turns', async ({ page }) => {
  await page.goto('/process/');
  const failures = collectRuntimeFailures(page);
  const caseTabs = page.getByRole('tablist', { name: 'Process case studies' }).getByRole('tab');
  const layerTabs = page.getByRole('tablist', { name: 'Project evidence layers' }).getByRole('tab');

  await expect(page.getByRole('tab', { name: 'Totally Reliable' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /Changes/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Workhelix' }).hover();
  await expect(page.getByRole('tab', { name: 'Workhelix' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /Changes/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Tests/ }).hover();
  await expect(page.getByRole('tab', { name: /Tests/ })).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('j');
  await expect(page.getByRole('tab', { name: 'Totally Reliable' })).toBeFocused();
  await page.keyboard.press('j');
  await expect(page.getByRole('tab', { name: 'Workhelix' })).toBeFocused();
  await page.getByRole('tab', { name: /Changes/ }).focus();
  await page.keyboard.press('j');
  await expect(page.getByRole('tab', { name: /Tests/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: /Tests/ })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('k');
  await expect(page.getByRole('tab', { name: /Changes/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: /Changes/ })).toHaveAttribute('aria-selected', 'true');

  for (let caseIndex = 0; caseIndex < await caseTabs.count(); caseIndex += 1) {
    const caseTab = caseTabs.nth(caseIndex);
    await caseTab.click();
    await expect(caseTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-case-panel]:visible .case-destinations a').first()).toBeVisible();
    const caseName = await page.locator('.wrong-turns').getAttribute('data-active-case');
    expect(caseName).toBeTruthy();

    for (let layerIndex = 0; layerIndex < await layerTabs.count(); layerIndex += 1) {
      const layerTab = layerTabs.nth(layerIndex);
      await layerTab.click();
      await expect(layerTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-layer-content]:visible h2')).toBeVisible();
    }

    const paragraph = page.locator('[data-layer-content]:visible > p').last();
    const decision = page.locator('[data-layer-content]:visible > .decision-note');
    if (await paragraph.count() && await decision.count()) {
      const gap = await page.evaluate(({ paragraph, decision }) => (
        decision.getBoundingClientRect().top - paragraph.getBoundingClientRect().bottom
      ), { paragraph: await paragraph.elementHandle(), decision: await decision.elementHandle() });
      expect(gap).toBeGreaterThanOrEqual(24);
    }
  }

  expect(failures).toEqual([]);
});

test('Process keyboard selection ignores hover until the pointer moves again', async ({ page }) => {
  await page.goto('/process/');
  const changes = page.getByRole('tab', { name: /Changes/ });
  const tests = page.getByRole('tab', { name: /Tests/ });

  await tests.hover();
  await expect(tests).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('j');
  await tests.focus();
  await page.keyboard.press('Enter');

  await changes.dispatchEvent('pointerenter', { pointerType: 'mouse', isPrimary: true });
  await expect(tests).toHaveAttribute('aria-selected', 'true');

  await changes.dispatchEvent('pointermove', { pointerType: 'mouse', isPrimary: true, bubbles: true });
  await changes.dispatchEvent('pointerenter', { pointerType: 'mouse', isPrimary: true });
  await expect(changes).toHaveAttribute('aria-selected', 'true');
});

test('mobile Process cursor passage does not switch tabs before a completed tap', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  const tap = async (locator) => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    // A unique query forces a fresh document between widths instead of a hash-only
    // navigation that preserves the previous iteration's selected tab.
    await page.goto(`/process/?touch=${width}#totally-reliable`);
    const totallyReliable = page.getByRole('tab', { name: 'Totally Reliable' });
    const theosis = page.getByRole('tab', { name: 'Pray Orthodox' });
    const changes = page.getByRole('tab', { name: /Changes/ });
    const tests = page.getByRole('tab', { name: /Tests/ });

    await theosis.dispatchEvent('pointerenter', { pointerType: 'touch', isPrimary: true });
    await tests.dispatchEvent('pointerenter', { pointerType: 'touch', isPrimary: true });
    await theosis.dispatchEvent('pointerenter', { pointerType: 'mouse', isPrimary: true });
    await tests.dispatchEvent('pointerenter', { pointerType: 'mouse', isPrimary: true });
    await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'instant' }));
    await expect(totallyReliable).toHaveAttribute('aria-selected', 'true');
    await expect(changes).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/#totally-reliable$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await tap(theosis);
    await expect(theosis).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/#theosis$/);
    await tap(tests);
    await expect(tests).toHaveAttribute('aria-selected', 'true');
  }

  await context.close();
});

test('Process tabbed surfaces reserve their layout height across content changes', async ({ page }) => {
  const documentTop = (selector) => page.locator(selector).evaluate((element) => (
    element.getBoundingClientRect().top + window.scrollY
  ));

  for (const width of [320, 390, 768, 994, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/process/');
    const deepDiveTop = await documentTop('.process-deep-dive');
    const processStageTop = await documentTop('.process-stage');

    for (const name of ['Totally Reliable', 'Workhelix', 'Dadbod Grip', 'Pray Orthodox']) {
      await page.getByRole('tab', { name, exact: true }).click();
      if (width > 1120) {
        expect(
          Math.abs((await documentTop('.process-deep-dive')) - deepDiveTop),
          `${name} moved the Deep dive heading at ${width}px`
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs((await documentTop('.process-stage')) - processStageTop),
          `${name} moved the Process stage at ${width}px`
        ).toBeLessThanOrEqual(1);
      }
    }
  }
});

test('Writing search, reveal, keyboard selection, and article navigation all work', async ({ page }) => {
  await page.goto('/blog/');
  const failures = collectRuntimeFailures(page);
  const search = page.getByRole('searchbox', { name: 'Filter writing' });

  await search.fill('complexity');
  await expect(page.locator('.writing-row:visible')).toHaveCount(1);
  await search.fill('');
  const writingCount = await page.locator('.writing-row').count();
  await page.getByRole('button', { name: /Show \d+ more essays/i }).click();
  await expect(page.locator('.writing-row:visible')).toHaveCount(writingCount);
  await expect(page.locator('.writing-row').nth(7)).toBeFocused();
  await search.blur();
  await page.keyboard.press('j');
  await expect(page.locator('.writing-row').nth(8)).toHaveClass(/is-selected/);
  await page.keyboard.press('j');
  await expect(page.locator('.writing-row.is-selected')).toHaveCount(1);

  await page.locator('.writing-row').first().click();
  await expect(page.locator('body')).toHaveClass(/reader-page/);
  expect(failures).toEqual([]);
});

test('Contact keeps text stable while Georgie deforms the Email edge', async ({ page }) => {
  await page.goto('/contact/');
  const failures = collectRuntimeFailures(page);
  const paths = page.locator('.contact-path');
  const contactGrid = page.locator('.contact-grid');
  const georgie = page.locator('.contact-georgie-wrap');
  const expected = ['mailto:jory@pestorious.com', 'https://github.com/joryeugene', 'https://www.linkedin.com/in/jory-fullstack-engineer/', 'https://cal.com/jory-pestorious/celebrity'];

  await page.keyboard.press('j');
  await expect(paths.first()).toBeFocused();
  await page.keyboard.press('j');
  await expect(paths.nth(1)).toBeFocused();
  await page.keyboard.press('k');
  await expect(paths.first()).toBeFocused();

  await paths.evaluateAll((elements) => elements.forEach((element) => element.addEventListener('click', (event) => event.preventDefault())));
  await paths.first().hover();
  await expect(contactGrid).toHaveClass(/is-georgie-press/);
  await expect(georgie.locator('.contact-georgie')).toHaveCSS('background-position-x', '100%');
  const activeEdge = await paths.first().evaluate((element) => getComputedStyle(element, '::before').clipPath);
  expect(activeEdge).toContain('polygon');
  expect(await paths.first().evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await paths.nth(1).hover();
  await expect(contactGrid).not.toHaveClass(/is-georgie-press/);
  const idleEdge = await paths.first().evaluate((element) => getComputedStyle(element, '::before').clipPath);
  expect(idleEdge).not.toBe(activeEdge);

  for (let index = 0; index < await paths.count(); index += 1) {
    const path = paths.nth(index);
    await expect(path).toHaveAttribute('href', expected[index]);
    await path.dispatchEvent('pointerdown');
    expect(await path.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
    await path.dispatchEvent('pointerup');
    await path.click();
  }

  expect(failures).toEqual([]);
});

test('Georgie keeps the press state without motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact/');

  const email = page.locator('.contact-path').first();
  await email.hover();

  await expect(page.locator('.contact-grid')).toHaveClass(/is-georgie-press/);
  await expect(page.locator('.contact-georgie')).toHaveCSS('background-position-x', '100%');

  await page.goto('/');
  await page.locator('.georgie-egg--home').hover();
  const homeSprite = page.locator('.georgie-egg--home .georgie-egg__sprite');
  await expect(homeSprite).toHaveCSS('background-position-x', '100%');

  const projectAction = page.getByRole('link', { name: 'Try the editor' });
  await projectAction.focus();
  expect(await projectAction.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
});

test('all same-origin destinations exposed by the main pages resolve', async ({ page, request, baseURL }) => {
  const destinations = new Set();
  for (const route of ['/', '/process/', '/blog/', '/contact/']) {
    await page.goto(route);
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    hrefs.filter(Boolean).forEach((href) => {
      const url = new URL(href, baseURL);
      if (url.origin === new URL(baseURL).origin && !href.startsWith('#') && !url.pathname.startsWith('/resume/')) destinations.add(url.pathname);
    });
  }

  for (const destination of destinations) {
    const response = await request.get(destination);
    expect(response.status(), `${destination} did not resolve`).toBeLessThan(400);
  }
});
