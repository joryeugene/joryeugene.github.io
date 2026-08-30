import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('homepage moves directly from its premise into the work', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-credibility], .credibility')).toHaveCount(0);
  await expect(page.locator('main > section').nth(1)).toHaveClass(/project-gallery/);
  await expect(page.getByRole('heading', { name: 'Selected work' })).toBeVisible();
  await expect(page.locator('.project-index')).toHaveCount(0);

  for (const project of await page.locator('[data-featured-project]').all()) {
    await expect(project.locator('.project-facts > div')).toHaveCount(1);
    const imageLink = project.locator('.project-media > a');
    await expect(imageLink).toHaveCount(1);
    await expect(imageLink).toHaveAttribute('href', await project.locator('.project-media img').getAttribute('src'));
  }
});

test('mobile header keeps the personality without crushing navigation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');

  await expect(page.locator('.site-header .vim-cta')).toBeHidden();
  await expect(page.locator('.intro .vim-cta--mobile')).toBeVisible();
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brandLines: Math.round(document.querySelector('.site-name').getBoundingClientRect().height
      / parseFloat(getComputedStyle(document.querySelector('.site-name')).lineHeight)),
    smallestNavText: Math.min(...Array.from(document.querySelectorAll('.site-nav a'))
      .map((link) => parseFloat(getComputedStyle(link).fontSize)))
  }));
  expect(metrics.overflow).toBeLessThanOrEqual(0);
  expect(metrics.brandLines).toBe(1);
  expect(metrics.smallestNavText).toBeGreaterThanOrEqual(14);
});

test('portfolio command palette uses the native dialog contract', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[data-open-palette]');
  await trigger.focus();
  await page.keyboard.press('Control+K');

  const palette = page.locator('#command-palette');
  await expect(palette).toHaveJSProperty('nodeName', 'DIALOG');
  await expect(palette).toHaveJSProperty('open', true);
  await expect(palette.getByRole('searchbox', { name: 'Search commands' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(palette).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();
});

test('Process presents one public narrative per case', async ({ page }) => {
  await page.goto('/process/');

  await expect(page.locator('.page-lede')).toHaveText(
    'Each case study starts with the constraint that shaped the product.'
  );
  await expect(page.locator('[data-case-panel]')).toHaveCount(4);
  await expect(page.locator('.process-deep-dive, .layer-rail, .wrong-turns')).toHaveCount(0);

  for (const tab of await page.getByRole('tablist', { name: 'Process case studies' }).getByRole('tab').all()) {
    await tab.click();
    const panel = page.locator('[data-case-panel]:visible');
    await expect(panel.locator('.case-narrative h3')).toHaveText(['Problem', 'Decision', 'Build', 'Result']);
    await expect(panel.locator('.process-case-shot > .georgie-egg--process')).toHaveCount(1);
  }

  await page.getByRole('tab', { name: 'Workhelix' }).click();
  const workhelix = page.locator('[data-case-panel]:visible');
  await expect(workhelix).toContainText('AI ROI is not the same as AI adoption.');
  await expect(workhelix).toContainText('A high adoption rate cannot masquerade as high ROI.');
  await expect(workhelix).toContainText('rank opportunities by potential impact');
  await expect(workhelix).not.toContainText(/prototype|second interface|one place/i);

  await page.getByRole('tab', { name: 'Totally Reliable' }).click();
  const totallyReliable = page.locator('[data-case-panel]:visible');
  await expect(totallyReliable).toContainText('relevant bodies × update rate × bits per update');
  await expect(totallyReliable).toContainText('spatial filtering');
  await expect(totallyReliable).toContainText('deallocation defects');

  await page.getByRole('tab', { name: 'Dadbod Grip' }).click();
  const dadbod = page.locator('[data-case-panel]:visible');
  await expect(dadbod).toContainText('Grip is a standalone client');
  await expect(dadbod).toContainText('exact UPDATE, INSERT, and DELETE statements');
  await expect(dadbod).not.toContainText('Dadbod remains responsible');

  await page.getByRole('tab', { name: 'Pray Orthodox' }).click();
  const theosis = page.locator('[data-case-panel]:visible');
  await expect(theosis).toContainText('The system would rather show a gap than invent a prayer.');
  await expect(theosis).toContainText('If the evidence stops, the service stops.');
  await expect(theosis).toContainText('For each of 4,017 dates');
  await expect(theosis).not.toContainText(/compiled before publication|incomplete appointments stay out/i);
});

test('Writing and Contact use direct complete sentences', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator('.page-lede')).toContainText(
    'I write about AI systems, developer tools, and what it takes to make them useful.'
  );

  await page.goto('/contact/');
  await expect(page.locator('.page-lede')).toHaveText(
    'Email me, find me elsewhere, or book a 15-minute Sync.'
  );
});

test('articles contain their Markdown content before JavaScript runs', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/blog/portable-agent-factory/');

  const article = page.locator('article#content');
  await expect(article).toHaveAttribute('data-markdown-source', '/blog/portable-agent-factory/portable-agent-factory.md');
  await expect(article.locator('h1')).toContainText('I Wanted to Own the Harness');
  expect((await article.innerText()).length).toBeGreaterThan(4000);
  await expect(page.locator('script[src="/js/marked.min.js"]')).toHaveCount(0);
  await context.close();
});

test('search metadata exposes canonical URLs and every public page', async ({ page }) => {
  for (const path of ['/', '/process/', '/blog/', '/contact/', '/blog/portable-agent-factory/']) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://jorypestorious.com${path}`);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.length).toBeGreaterThan(0);
    for (const schema of schemas) expect(() => JSON.parse(schema)).not.toThrow();
  }

  const robots = await (await page.request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://jorypestorious.com/sitemap.xml');
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  for (const path of ['/', '/process/', '/blog/', '/contact/', '/blog/portable-agent-factory/']) {
    expect(sitemap).toContain(`<loc>https://jorypestorious.com${path}</loc>`);
  }
});

test('article synchronization is committed and legacy payloads are absent', async () => {
  const article = await readFile('blog/portable-agent-factory/index.html', 'utf8');
  expect(article).not.toContain('markdownPath:');
  expect(article).not.toContain('id="change"');
  expect(article).not.toContain('/js/marked.min.js');

  const portfolioCss = await readFile('css/portfolio.css', 'utf8');
  expect(portfolioCss).toContain('/jpg/georgie-home-v2-pair.webp');
  expect(portfolioCss).not.toContain('/jpg/georgie-home-v2-pair.png');
});
