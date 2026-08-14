import { test, expect } from '@playwright/test';

test.describe('shared blog reader', () => {
  test('keeps the reader styled when the common stylesheet is cached without its import', async ({ page }) => {
    await page.route('**/css/blog-common.css', (route) => route.fulfill({
      contentType: 'text/css',
      body: 'body { margin: 0; }',
    }));

    await page.goto('/blog/portable-agent-factory/');

    await expect(page.locator('.reader-site-header')).toHaveCSS('display', 'grid');
  });

  test('uses one clear desktop navigation hierarchy', async ({ page }) => {
    await page.goto('/blog/ai-engineer-verification/');

    await expect(page.locator('body')).toHaveClass(/reader-page/);
    await expect(page.getByRole('banner')).toContainText('Jory Pestorious');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText('Writing');
    await expect(page.getByRole('link', { name: 'Open Vim' })).toHaveAttribute('href', '/vim/');

    const context = page.locator('.reader-context');
    await expect(context.getByRole('link', { name: 'Back to Writing' })).toHaveAttribute('href', '/blog/');
    await expect(context).toContainText('AI Engineer World\'s Fair 2026: Takeaways & Verification');
    await expect(context.locator('[data-reader-progress]')).toHaveText('0%');
    await expect(context.getByRole('button', { name: 'Change background' })).toHaveCount(0);
    await expect(context).not.toContainText('Contents');

    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(toc).toBeVisible();
    await expect(toc.getByText('On this page', { exact: true })).toHaveCount(1);
    expect(await toc.getByRole('link').count()).toBeGreaterThan(2);
    await expect(page.getByText('Contents', { exact: true })).toHaveCount(0);
  });

  test('uses measured chrome geometry with a narrower article and readable contents rail', async ({ page }) => {
    await page.goto('/blog/portable-agent-factory/');
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(page.locator('.reader-toc')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const chrome = document.querySelector('.reader-chrome').getBoundingClientRect();
      const article = document.querySelector('.markdown-body').getBoundingClientRect();
      const toc = document.querySelector('.reader-toc').getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      const rail = getComputedStyle(document.querySelector('.reader-rail-slot'));
      return {
        chromeHeight: chrome.height,
        articleWidth: article.width,
        tocWidth: toc.width,
        gap: toc.left - article.right,
        scrollPaddingTop: parseFloat(root.scrollPaddingTop),
        railTop: parseFloat(rail.top),
      };
    });

    expect(geometry.articleWidth).toBeGreaterThanOrEqual(760);
    expect(geometry.articleWidth).toBeLessThanOrEqual(790);
    expect(geometry.tocWidth).toBeGreaterThanOrEqual(210);
    expect(geometry.tocWidth).toBeLessThanOrEqual(230);
    expect(geometry.gap).toBeGreaterThanOrEqual(30);
    expect(geometry.gap).toBeLessThanOrEqual(60);
    expect(geometry.scrollPaddingTop).toBeCloseTo(geometry.chromeHeight + 16, 0);
    expect(geometry.railTop).toBeCloseTo(geometry.scrollPaddingTop, 0);
  });

  test('gives article Georgie a sleeping and waking state without changing pages', async ({ page }) => {
    await page.goto('/blog/ai-engineer-verification/');
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(page.locator('.reader-toc')).toBeVisible();
    await expect(page.locator('.markdown-body h1')).toContainText('Takeaways & Verification');
    const georgie = page.getByRole('button', { name: 'Wake Georgie' });
    const sprite = georgie.locator('.reader-georgie__sprite');
    const bed = georgie.locator('.reader-georgie__bed');

    await expect(georgie).toBeVisible();
    await expect(bed).toBeVisible();
    await expect(bed).toHaveCSS('background-image', /georgie-reader-bed\.webp/);
    await expect(sprite).toHaveCSS('background-image', /georgie-reader-pair\.webp/);
    await expect(sprite).toHaveCSS('background-position-x', /^0(?:px|%)$/);
    await expect.poll(async () => {
      const [georgieBox, tocBox, articleBox] = await Promise.all([
        georgie.boundingBox(),
        page.locator('.reader-toc').boundingBox(),
        page.locator('.markdown-body').boundingBox()
      ]);
      if (!georgieBox || !tocBox || !articleBox) return false;
      return georgieBox.x >= articleBox.x + articleBox.width
        && georgieBox.x + georgieBox.width <= tocBox.x + tocBox.width + 1
        && georgieBox.y >= tocBox.y + tocBox.height - 1;
    }).toBe(true);
    await expect.poll(async () => {
      const [georgieBox, bedBox, railBox, articleBox] = await Promise.all([
        georgie.boundingBox(),
        bed.boundingBox(),
        page.locator('.reader-rail-slot').boundingBox(),
        page.locator('.markdown-body').boundingBox()
      ]);
      if (!georgieBox || !bedBox || !railBox || !articleBox) return false;
      const supportsGeorgie = bedBox.y < georgieBox.y + georgieBox.height
        && bedBox.y + bedBox.height > georgieBox.y + georgieBox.height * 0.62;
      const touchesRail = bedBox.y < railBox.y + railBox.height
        && bedBox.y + bedBox.height > railBox.y;
      const clearsArticle = bedBox.x >= articleBox.x + articleBox.width;
      return supportsGeorgie && touchesRail && clearsArticle;
    }).toBe(true);

    await georgie.hover();
    await expect(georgie).toHaveClass(/is-awake/);
    await expect.poll(async () => sprite.evaluate((element) => getComputedStyle(element).backgroundPositionX))
      .toBe('100%');
    await page.mouse.move(2, 2);
    await expect(georgie).not.toHaveClass(/is-awake/);

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(georgie).toHaveClass(/is-awake/, { timeout: 1500 });
    await expect(georgie).not.toHaveClass(/is-awake/, { timeout: 1200 });
  });

  test('reveals Georgie only after the generated contents rail has its final geometry', async ({ page }) => {
    let releaseMarkdown;
    const markdownReady = new Promise((resolve) => { releaseMarkdown = resolve; });
    await page.route('**/ai-engineer-verification.md', async (route) => {
      await markdownReady;
      await route.continue();
    });

    await page.goto('/blog/ai-engineer-verification/', { waitUntil: 'domcontentloaded' });
    const georgie = page.getByRole('button', { name: 'Wake Georgie' });
    await expect(georgie).toHaveClass(/is-loading/);
    await expect(georgie).toHaveCSS('opacity', '0');
    await expect(page.locator('.reader-toc')).toHaveCount(0);

    releaseMarkdown();
    await expect(page.locator('.reader-toc')).toHaveCount(1);
    await expect(georgie).toHaveClass(/is-ready/);
    await expect(georgie).toHaveCSS('opacity', '1');
  });

  test('keeps Georgie and his bed below the sticky chrome when an article has no contents list', async ({ page }) => {
    await page.goto('/blog/pig-security-wisdom/');
    await expect(page.locator('.markdown-body h1')).toBeVisible();
    await expect(page.locator('.reader-toc')).toHaveCount(0);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 520);
    });

    const geometry = await page.evaluate(() => {
      const box = (selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      };
      return {
        chrome: box('.reader-chrome'),
        georgie: box('.reader-georgie'),
        bed: box('.reader-georgie__bed'),
        rail: box('.reader-rail-slot'),
      };
    });

    expect(geometry.rail.height).toBeGreaterThanOrEqual(geometry.georgie.height);
    expect(geometry.georgie.top).toBeGreaterThanOrEqual(geometry.chrome.bottom);
    expect(geometry.bed.top).toBeLessThan(geometry.georgie.bottom);
    expect(geometry.bed.bottom).toBeGreaterThan(geometry.georgie.top + geometry.georgie.height * 0.62);
  });

  test('keeps reading controls functional and gives buttons a jelly response', async ({ page }) => {
    await page.goto('/blog/ai-engineer-verification/');

    await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', /stable/);
    const beforePalette = await page.locator('.reader-site-header').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, width: rect.width };
    });

    await expect(page.locator('#bg')).toHaveCSS('background-image', /bg-night\.webp/);
    await expect(page.getByRole('button', { name: /change background/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open command palette' }).click();
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    const trigger = page.getByRole('button', { name: 'Open command palette' });
    const search = palette.getByRole('searchbox', { name: 'Search commands' });
    await expect(palette).toBeVisible();
    await expect(search).toBeFocused();
    const duringPalette = await page.locator('.reader-site-header').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, width: rect.width };
    });
    expect(duringPalette.left).toBeCloseTo(beforePalette.left, 1);
    expect(duringPalette.width).toBeCloseTo(beforePalette.width, 1);
    const links = palette.getByRole('link');
    await expect(links).toHaveCount(10);
    await expect(palette.getByRole('link', { name: /Open Phalene-Vim/i })).toHaveAttribute('href', '/vim/');
    await expect(palette.getByRole('link', { name: /GitHub/i })).toHaveAttribute('href', 'https://github.com/joryeugene');
    await expect(palette.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute('href', 'https://www.linkedin.com/in/jory-fullstack-engineer/');
    await expect(palette.getByRole('link', { name: /Email Jory/i })).toHaveAttribute('href', 'mailto:jory@pestorious.com');
    await expect(palette.getByRole('link', { name: /Download résumé/i })).toHaveAttribute('href', '/resume/Jory-Pestorious-Resume.pdf');

    await search.fill('cv');
    await expect(palette.locator('[data-site-command]:visible')).toHaveCount(1);
    await expect(palette.getByRole('link', { name: /Download résumé/i })).toBeVisible();
    await search.fill('');
    await page.keyboard.press('ArrowDown');
    await expect(links.nth(0)).toBeFocused();
    const scrollBeforeNavigation = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('j');
    await expect(links.nth(1)).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBeforeNavigation);
    await page.keyboard.press('k');
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Meta+K');
    await expect(palette).toBeVisible();
    await expect(search).toBeFocused();
    await palette.click({ position: { x: 2, y: 2 } });
    await expect(palette).toBeHidden();
  });

  test('uses smooth reader Vim scrolling without restoring the legacy HUD', async ({ page }) => {
    await page.goto('/blog/ai-engineer-verification/');
    await expect(page.locator('#vim-hud')).toHaveCount(0);
    await page.evaluate(() => {
      window.__readerWindowScrollCalls = [];
      const originalScrollBy = window.scrollBy.bind(window);
      const originalScrollTo = window.scrollTo.bind(window);
      window.scrollBy = (...args) => {
        window.__readerWindowScrollCalls.push({ method: 'by', args });
        return originalScrollBy(...args);
      };
      window.scrollTo = (...args) => {
        window.__readerWindowScrollCalls.push({ method: 'to', args });
        return originalScrollTo(...args);
      };
    });

    const start = await page.evaluate(() => window.scrollY);
    await page.keyboard.down('j');
    await page.waitForTimeout(180);
    await page.keyboard.up('j');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(start);
    expect(await page.evaluate(() => window.__readerWindowScrollCalls.at(-1))).toEqual({
      method: 'by',
      args: [{ top: 120, behavior: 'smooth' }]
    });

    const afterJ = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('k');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(afterJ);

    await page.keyboard.press('Shift+g');
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY + window.innerHeight)))
      .toBe(await page.evaluate(() => document.documentElement.scrollHeight));
    await page.keyboard.press('g');
    await page.keyboard.press('g');
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);

    await page.getByRole('button', { name: 'Open command palette' }).click();
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await page.keyboard.press('ArrowDown');
    const first = palette.getByRole('link').first();
    const second = palette.getByRole('link').nth(1);
    await expect(first).toBeFocused();
    const beforePaletteKey = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('j');
    await expect(second).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(beforePaletteKey);
  });

  test('smooth-scrolls generated contents links without loading the page again', async ({ page }) => {
    const documentRequests = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documentRequests.push(request.url());
    });
    await page.goto('/blog/portable-agent-factory/');
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(page.locator('.reader-toc')).toBeVisible();
    await page.evaluate(() => {
      window.__readerScrollCalls = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function recordScroll(options) {
        window.__readerScrollCalls.push({ id: this.id, options });
        return original.call(this, options);
      };
      document.querySelector('.reader-main').dataset.readerIdentity = 'preserved';
    });

    const link = page.locator('.reader-toc-link').nth(1);
    const href = await link.getAttribute('href');
    await link.click();

    await expect(page).toHaveURL(new RegExp(`${href.replace('#', '#')}$`));
    await expect(page.locator('.reader-main')).toHaveAttribute('data-reader-identity', 'preserved');
    expect(documentRequests).toHaveLength(1);
    const scrollCall = await page.evaluate(() => window.__readerScrollCalls.at(-1));
    expect(scrollCall.id).toBe(href.slice(1));
    expect(scrollCall.options).toMatchObject({ behavior: 'smooth', block: 'start' });
  });

  test('activates a section before its heading reaches the sticky chrome', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/blog/portable-agent-factory/');
    const link = page.locator('.reader-toc-link').nth(3);
    const href = await link.getAttribute('href');

    const geometry = await page.evaluate((targetId) => {
      const target = document.getElementById(targetId);
      const readingOffset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - readingOffset - 96);
      return { readingOffset };
    }, href.slice(1));

    await expect.poll(() => link.getAttribute('aria-current')).toBe('location');
    const headingTop = await page.locator(href).evaluate((heading) => heading.getBoundingClientRect().top);
    expect(headingTop).toBeGreaterThan(geometry.readingOffset);
  });

  test('keeps each clicked contents section highlighted after scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/blog/portable-agent-factory/');
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(page.locator('.reader-toc')).toBeVisible();

    const links = page.locator('.reader-toc-link');
    for (let index = 1; index < await links.count(); index += 1) {
      const link = links.nth(index);
      await link.click();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(link).toHaveAttribute('aria-current', 'location');
    }
  });

  test('updates progress and keeps the active contents link in the visible rail', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/blog/portable-agent-factory/');
    await page.evaluate(() => window.scrollTo(0, 520));
    await expect(page.locator('.reader-toc')).toBeVisible();

    const links = page.locator('.reader-toc-link');
    const last = links.last();
    await last.click();
    await expect(last).toHaveAttribute('aria-current', 'location');
    await expect.poll(async () => Number((await page.locator('.reader-toc-progress span').innerText()).replace('%', '')))
      .toBeGreaterThan(0);

    const visibility = await page.evaluate(() => {
      const toc = document.querySelector('.reader-toc').getBoundingClientRect();
      const active = document.querySelector('.reader-toc-link.active').getBoundingClientRect();
      return { tocTop: toc.top, tocBottom: toc.bottom, activeTop: active.top, activeBottom: active.bottom };
    });
    expect(visibility.activeTop).toBeGreaterThanOrEqual(visibility.tocTop);
    expect(visibility.activeBottom).toBeLessThanOrEqual(visibility.tocBottom + 1);
  });

  test('leaves the presentation reader untouched', async ({ page }) => {
    await page.goto('/blog/ai-dev-tooling-presentation/');
    await expect(page.locator('body')).not.toHaveClass(/reader-page/);
    await expect(page.locator('.reveal')).toBeVisible();
    await expect(page.locator('.reader-site-header')).toHaveCount(0);
  });
});

test.describe('shared blog reader on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('collapses contents into a usable sheet without overflow', async ({ page }) => {
    await page.goto('/blog/ai-engineer-verification/');

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeHidden();
    const trigger = page.locator('.reader-mobile-trigger');
    await expect(trigger).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toHaveAttribute('tabindex', '-1');

    const initialHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, 420));
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-hidden', 'false');
    await expect(trigger).toHaveAttribute('tabindex', '0');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(initialHeight);
    await expect(page.getByRole('button', { name: /Open article contents/ })).toBeVisible();
    await trigger.click();

    const sheet = page.getByRole('dialog', { name: 'Article controls' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'On this page' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Change background' })).toHaveCount(0);
    await expect(sheet.getByText('Appearance', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(trigger).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps article copy readable at narrow phone widths', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/blog/dadbod-grip/');

    const articleBox = await page.locator('.markdown-body').boundingBox();
    expect(articleBox).not.toBeNull();
    expect(articleBox.x).toBeGreaterThanOrEqual(0);
    expect(articleBox.x + articleBox.width).toBeLessThanOrEqual(320);
    await expect(page.locator('.markdown-body h1')).toBeVisible();
    expect(await page.locator('.reader-context').innerText()).not.toContain('·');

    const georgie = page.getByRole('button', { name: 'Wake Georgie' });
    const georgieBox = await georgie.boundingBox();
    expect(georgieBox).not.toBeNull();
    expect(georgieBox.x).toBeGreaterThanOrEqual(0);
    expect(georgieBox.x + georgieBox.width).toBeLessThanOrEqual(320);

    await georgie.dispatchEvent('pointerenter', { pointerType: 'touch' });
    await expect(georgie).not.toHaveClass(/is-awake/);
    await georgie.dispatchEvent('click');
    await expect(georgie).toHaveClass(/is-awake/);
    await expect(georgie).not.toHaveClass(/is-awake/, { timeout: 1200 });
  });
});
