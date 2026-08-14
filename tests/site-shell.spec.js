import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/404.html',
  '/blog/',
  '/blog/ai-dev-tooling-presentation/',
  '/blog/ai-engineer-spec/',
  '/blog/ai-engineer-verification/',
  '/blog/calmhive/',
  '/blog/claude-code-setups/',
  '/blog/complexity-protects-itself/',
  '/blog/dadbod-grip/',
  '/blog/emergent-religion/',
  '/blog/endgame-keyboard/',
  '/blog/friction-economy/',
  '/blog/knowledge-sidecar/',
  '/blog/natural-language-first/',
  '/blog/pig-security-wisdom/',
  '/blog/portable-agent-factory/',
  '/blog/spiritual-bliss-attractor-state/',
  '/blog/terminal-velocity/',
  '/blog/trust-your-engineers/',
  '/blog/what-the-model-learned/',
  '/contact/',
  '/process/',
  '/vim/',
];

const mainRoutes = ['/', '/process/', '/blog/', '/contact/'];

test('every public page uses the canonical site icons', async ({ page }) => {
  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('link[rel="icon"]'), `${route} favicon`).toHaveAttribute('href', '/favicon.png');
    await expect(page.locator('link[rel="apple-touch-icon"]'), `${route} touch icon`).toHaveAttribute('href', '/apple-touch-icon.png');
  }
});

test('reader desktop header matches the main site header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const capture = async (selectors) => page.evaluate(({ header, brand, nav, actions }) => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x: rect.x, width: rect.width, height: rect.height };
    };

    return {
      header: box(header),
      brand: { ...box(brand), fontSize: getComputedStyle(document.querySelector(brand)).fontSize },
      navGap: getComputedStyle(document.querySelector(nav)).gap,
      actionsGap: getComputedStyle(document.querySelector(actions)).gap,
    };
  }, selectors);

  await page.goto('/');
  const mainHeader = await capture({
    header: '.site-header',
    brand: '.site-name',
    nav: '.site-nav',
    actions: '.header-actions',
  });

  await page.goto('/blog/terminal-velocity/');
  const readerHeader = await capture({
    header: '.reader-site-header',
    brand: '.reader-brand',
    nav: '.reader-primary-nav',
    actions: '.reader-header-actions',
  });

  expect(readerHeader.header.x).toBeCloseTo(mainHeader.header.x, 0);
  expect(readerHeader.header.width).toBeCloseTo(mainHeader.header.width, 0);
  expect(readerHeader.header.height).toBeCloseTo(mainHeader.header.height, 0);
  expect(readerHeader.brand.fontSize).toBe(mainHeader.brand.fontSize);
  expect(readerHeader.navGap).toBe(mainHeader.navGap);
  expect(readerHeader.actionsGap).toBe(mainHeader.actionsGap);
  await expect(page.locator('.markdown-body')).toHaveCSS('max-width', '780px');
});

test('main page footers show the current copyright year', async ({ page }) => {
  const currentYear = String(new Date().getFullYear());

  for (const route of mainRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-footer__copyright')).toHaveText(`© ${currentYear} Jory Pestorious`);
    await expect(page.locator('[data-current-year]')).toHaveAttribute('datetime', currentYear);
  }
});

test('Writing keeps its edge content around a centered copyright on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });

  const positions = await page.locator('.site-footer').evaluate((footer) => {
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, center: rect.left + rect.width / 2 };
    };

    return {
      footer: box(footer),
      left: box(footer.querySelector('.desktop-hints')),
      copyright: box(footer.querySelector('.site-footer__copyright')),
      right: box(footer.querySelector('.site-footer__note')),
    };
  });

  expect(positions.left.left).toBeCloseTo(positions.footer.left, 0);
  expect(positions.copyright.center).toBeCloseTo(positions.footer.center, 0);
  expect(positions.right.right).toBeCloseTo(positions.footer.right, 0);
});

test('main page copyright remains visible and Writing stacks on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of mainRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-footer__copyright')).toBeVisible();
    await expect(page.locator('.desktop-hints')).toBeHidden();
  }

  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  const note = await page.locator('.site-footer__note').boundingBox();
  const copyright = await page.locator('.site-footer__copyright').boundingBox();
  expect(note.y + note.height).toBeLessThanOrEqual(copyright.y);
});

test('reader footer remains article-specific', async ({ page }) => {
  await page.goto('/blog/terminal-velocity/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.footer')).toHaveText('© 2026 Jory Pestorious');
  await expect(page.locator('.site-footer__copyright')).toHaveCount(0);
});
