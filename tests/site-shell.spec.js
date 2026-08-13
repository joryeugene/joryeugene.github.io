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
