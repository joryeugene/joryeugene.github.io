import { test, expect } from '@playwright/test';

test.describe('homepage asymmetric gallery', () => {
  test('leads with Dadbod and keeps every project proof inline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Useful systems with a pulse.' })).toBeVisible();
    await expect(page.locator('.intro > p')).toHaveText(
      'I build ambitious software where the interface and the engineering carry equal weight.'
    );
    expect(await page.locator('.intro').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(220);

    const projects = page.locator('[data-featured-project]');
    await expect(projects).toHaveCount(3);
    expect(await projects.evaluateAll((elements) => elements.map((element) => element.dataset.featuredProject))).toEqual([
      'dadbod-grip',
      'flight-deck',
      'phalene-vim'
    ]);

    for (const project of await projects.all()) {
      await expect(project.locator('.project-facts > div')).toHaveCount(1);
      await expect(project.locator('.project-facts dt')).toHaveCount(1);
      await expect(project.locator('.project-facts dd')).toHaveCount(1);
      await expect(project.locator('.project-links a')).toHaveCount(2);
    }

    await expect(page.locator('.depth-drawer, .depth-tabs, [data-project-inspect], [data-project-card], .is-selected')).toHaveCount(0);
  });

  test('uses the audited Dadbod, Flight Deck Week, and Phalene dashboard images', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const dadbod = page.locator('[data-featured-project="dadbod-grip"]');
    const dadbodImage = dadbod.locator('.project-media img');
    await expect(dadbodImage).toHaveAttribute(
      'src',
      '/jpg/process/dadbod-grip-full-workspace.png?v=consumer-triage-1'
    );
    await expect(dadbodImage).toHaveAttribute(
      'alt',
      /consumer incident.*expanded schema.*editable grid.*staged.*Live SQL/i
    );
    await expect(dadbodImage).toHaveCSS('object-fit', 'contain');
    await expect(dadbod.getByRole('link', { name: 'Open walkthrough' })).toHaveAttribute('href', 'https://jorypestorious.com/dadbod-grip-web/');
    await expect(dadbod.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/joryeugene/dadbod-grip.nvim');

    const pair = page.locator('.project-gallery__pair');
    const dadbodBox = await dadbod.boundingBox();
    const pairCardBox = await pair.locator('[data-featured-project]').first().boundingBox();
    expect(dadbodBox.width).toBeGreaterThan(pairCardBox.width * 1.75);

    const flightDeck = page.locator('[data-featured-project="flight-deck"]');
    const flightDeckImage = flightDeck.locator('.project-media img');
    await expect(flightDeckImage).toHaveAttribute('src', '/jpg/process/flight-deck-calendar-week.png');
    await expect(flightDeckImage).toHaveAttribute('alt', /Week.*Google and Outlook.*all-day.*overlapping.*current-time/i);
    await expect(flightDeckImage).toHaveCSS('object-fit', 'contain');
    await expect(flightDeck.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/joryeugene/omarchy-calendar');
    await expect(flightDeck.getByRole('link', { name: 'Open Flight Deck' })).toHaveAttribute('href', 'https://calendar.pestorious.com/');

    const phalene = page.locator('[data-featured-project="phalene-vim"]');
    await expect(phalene.locator('.project-media img')).toHaveAttribute('src', '/jpg/process/phalene-vim-dashboard.jpg');
    await expect(phalene.locator('.project-media img')).toHaveAttribute('alt', /Phalene-Vim.*main dashboard.*keyboard guidance/i);
    await expect(phalene.getByRole('link', { name: 'Open Phalene-Vim' })).toHaveAttribute('href', '/vim/');
    await expect(phalene.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/joryeugene/joryeugene.github.io/blob/master/js/vim.js');

    const georgie = page.locator('.georgie-egg--home');
    await expect(georgie).toHaveCount(1);
    await expect(phalene.locator('.project-media > .georgie-egg--home')).toHaveCount(1);
    await expect(georgie.locator('.georgie-egg__sprite')).toHaveCSS('background-image', /georgie-home-v2-pair\.webp/);
    await expect(page.locator('img[src*="vim-preview-current"], img[src*="phalene-vim-teacher"]')).toHaveCount(0);
  });
});

test.describe('portfolio shell', () => {
  test('publishes the Georgie social card at its real preview size', async ({ page }) => {
    const fallbackPaths = [
      '/',
      '/blog/',
      '/process/',
      '/contact/',
      '/vim/'
    ];
    for (const path of fallbackPaths) {
      await page.goto(path);
      const expected = 'https://jorypestorious.com/jpg/jory-georgie-social.png';
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', expected);
      await expect(page.locator('meta[name="twitter:image"], meta[property="twitter:image"]')).toHaveAttribute('content', expected);
    }

    await page.goto('/');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');

    const dimensions = await page.evaluate(() => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = '/jpg/jory-georgie-social.png';
    }));
    expect(dimensions).toEqual({ width: 1200, height: 630 });

    const authoredImages = new Map([
      ['/blog/friction-economy/', 'https://jorypestorious.com/blog/friction-economy/def-foo-efficiency-spectrum-optimized.png'],
      ['/blog/natural-language-first/', 'https://jorypestorious.com/blog/natural-language-first/ai-agent-friend-optimized.png'],
      ['/blog/spiritual-bliss-attractor-state/', 'https://jorypestorious.com/blog/spiritual-bliss-attractor-state/claude-word-frequency-chart.png'],
      ['/blog/trust-your-engineers/', 'https://jorypestorious.com/blog/trust-your-engineers/ai-excellence-optimized.png']
    ]);
    for (const [path, expected] of authoredImages) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', expected);
      await expect(page.locator('meta[name="twitter:image"], meta[property="twitter:image"]')).toHaveAttribute('content', expected);
    }
  });

  test('keeps Vim prominent and exposes the approved navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Open Vim' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Vim' })).toHaveAttribute('href', '/vim/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText('Work');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText('Process');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText('Writing');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText('Contact');
  });

  test('keeps selected work beneath the static project gallery', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeVisible();
    await expect(page.locator('.archive-card h3')).toHaveText([
      'Totally Reliable Delivery Service',
      'Workhelix Nucleus',
      'Calmhive',
      'keephive',
      'Pray Orthodox'
    ]);
    await expect(page.getByText(/four online ragdolls can form a flying chain beneath a jetpack/i)).toBeVisible();
    await expect(page.getByText(/resolves each day.*Midnight Office, Matins, Hours, Typika, Vespers, and Compline/i)).toBeVisible();
    await expect(page.locator('.archive-section')).not.toContainText(/4,017|39,891|saints|fasting guidance|85 books/i);
    await expect(page.getByText('Daily prayer reader', { exact: true })).toBeVisible();
    await expect(page.getByText(/HRIS, AI-usage, and prompt data/i)).toBeVisible();
    await expect(page.getByText(/15\+?.*ECharts|more than 15.*ECharts/i)).toHaveCount(0);
    await expect(page.getByText(/built (its )?interactive analytics and assessment workflows/i)).toHaveCount(0);
    await expect(page.getByText(/company-wide ROI picture/i)).toBeVisible();
    await expect(page.getByText(/Nine Claude Code hooks capture facts and decisions/i)).toBeVisible();
    await expect(page.getByText(/hive verify/)).toBeVisible();
    await expect(page.locator('a[href="/blog/knowledge-sidecar/"]')).toBeVisible();
    await expect(page.getByText(/retry path for a known usage-limit response/i)).toBeVisible();
    await expect(page.locator('.archive-card h3 a')).toHaveCount(5);
    const { gridWidth, prayWidth } = await page.evaluate(() => ({
      gridWidth: document.querySelector('.archive-grid').getBoundingClientRect().width,
      prayWidth: document.querySelector('.archive-card--wide').getBoundingClientRect().width
    }));
    expect(Math.abs(gridWidth - prayWidth)).toBeLessThanOrEqual(2);
  });

  test('opens a searchable command palette with every approved destination', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('j');
    await page.keyboard.press('k');
    await expect(page.locator('#fake-vim')).toHaveCount(0);

    await page.keyboard.press('Control+K');

    const palette = page.getByRole('dialog', { name: 'Command palette' });
    const search = palette.getByRole('searchbox', { name: 'Search commands' });
    const links = palette.getByRole('link');
    await expect(palette).toBeVisible();
    await expect(search).toBeFocused();
    await expect(links).toHaveCount(10);

    const expected = [
      ['Open Phalene-Vim', '/vim/'],
      ['Georgie, pick an essay', '/blog/'],
      ['Work', '/'],
      ['Process', '/process/'],
      ['Writing', '/blog/'],
      ['Contact', '/contact/'],
      ['GitHub', 'https://github.com/joryeugene'],
      ['LinkedIn', 'https://www.linkedin.com/in/jory-fullstack-engineer/'],
      ['Email Jory', 'mailto:jory@pestorious.com'],
      ['Book a 15-minute Sync', 'https://cal.com/jory-pestorious/celebrity']
    ];
    for (const [name, href] of expected) {
      await expect(palette.getByRole('link', { name: new RegExp(name, 'i') })).toHaveAttribute('href', href);
    }
    await expect(palette.locator('a[href*="/resume/"]')).toHaveCount(0);

    await search.fill('gh');
    await expect(palette.locator('[data-site-command]:visible')).toHaveCount(1);
    await expect(palette.getByRole('link', { name: /GitHub/i })).toBeVisible();
    await expect(palette.locator('[data-command-group]:visible h3')).toHaveText(['Connect']);

    await search.fill('no-such-command');
    await expect(palette.locator('[data-site-command]:visible')).toHaveCount(0);
    await expect(palette.getByText('No commands found', { exact: true })).toBeVisible();

    await search.fill('');
    await page.keyboard.press('ArrowDown');
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press('j');
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press('k');
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();

    await page.keyboard.press('Control+K');
    await search.fill('vim');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/vim\/$/);
  });

  test('restores focus after the palette closes by button or backdrop', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-open-palette]').first();
    const palette = page.getByRole('dialog', { name: 'Command palette' });

    await trigger.focus();
    await trigger.click();
    await palette.getByRole('button', { name: 'Close' }).click();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await palette.click({ position: { x: 2, y: 2 } });
    await expect(palette).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('loads the live Writing index when Georgie chooses an essay', async ({ page }) => {
    let releaseResponse;
    let fetches = 0;
    const responseGate = new Promise((resolve) => { releaseResponse = resolve; });
    await page.addInitScript(() => { Math.random = () => 0.999; });
    await page.route('**/blog/', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      fetches += 1;
      await responseGate;
      return route.fulfill({
        contentType: 'text/html',
        body: '<div class="writing-feature__copy"><a href="/blog/first-live-essay/">First</a></div><a class="writing-row" href="/blog/new-live-essay/">New</a>'
      });
    });
    await page.route('**/blog/new-live-essay/', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Live essay</title>' }));
    await page.goto('/');
    await page.keyboard.press('Control+K');
    const command = page.getByRole('dialog', { name: 'Command palette' }).locator('[data-command-action="essay"]');

    await command.click();
    await expect(command).toContainText('Georgie is choosing…');
    await expect(command).toHaveAttribute('aria-disabled', 'true');
    await command.dispatchEvent('click');
    await expect.poll(() => fetches).toBe(1);
    releaseResponse();

    await expect(page).toHaveURL(/\/blog\/new-live-essay\/$/);
  });

  test('excludes the current article and falls back to Writing when selection fails', async ({ page }) => {
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.route('**/blog/', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      return route.fulfill({
        contentType: 'text/html',
        body: '<div class="writing-feature__copy"><a href="/blog/ai-engineer-verification/">Current</a></div><a class="writing-row" href="/blog/another-live-essay/">Another</a>'
      });
    });
    await page.route('**/blog/another-live-essay/', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Another essay</title>' }));
    await page.goto('/blog/ai-engineer-verification/');
    await page.keyboard.press('Control+K');
    await page.getByRole('dialog', { name: 'Command palette' }).getByRole('link', { name: /Georgie, pick an essay/i }).click();
    await expect(page).toHaveURL(/\/blog\/another-live-essay\/$/);

    await page.unrouteAll({ behavior: 'wait' });
    await page.route('**/blog/', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      return route.fulfill({ status: 500, body: 'failed' });
    });
    await page.goto('/');
    await page.keyboard.press('Control+K');
    await page.getByRole('dialog', { name: 'Command palette' }).getByRole('link', { name: /Georgie, pick an essay/i }).click();
    await expect(page).toHaveURL(/\/blog\/$/);
  });

  test('uses one cohesive night background and exposes no background switcher', async ({ page }) => {
    for (const route of ['/', '/process/', '/blog/', '/contact/', '/blog/ai-engineer-verification/']) {
      await page.goto(route);
      await expect(page.getByRole('button', { name: /change background/i })).toHaveCount(0);
      await expect(page.locator('#change, #changeSpan, .bg-switcher')).toHaveCount(0);
      const background = page.locator('#portfolio-bg, #bg').first();
      await expect(background).toHaveCSS('background-image', /bg-night\.webp/);
    }
  });

  test('uses one shared spacing scale for the portfolio shell', async ({ page }) => {
    await page.goto('/');

    const spacing = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return Array.from({ length: 9 }, (_, index) => styles.getPropertyValue(`--space-${index + 1}`).trim());
    });

    expect(spacing).toEqual(['4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px', '96px']);
  });
});

test.describe('portfolio pages', () => {
  test('process page exposes four concise case narratives', async ({ page }) => {
    await page.goto('/process/');
    await expect(page.locator('.process-deep-dive, .layer-rail, .wrong-turns')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Process', exact: true })).toHaveAttribute('aria-current', 'page');
    const caseTabs = page.getByRole('tablist', { name: 'Process case studies' }).getByRole('tab');
    await expect(caseTabs).toHaveText([
      'Totally Reliable',
      'Workhelix',
      'Dadbod Grip',
      'Pray Orthodox'
    ]);
    await expect(page.getByRole('tab', { name: 'Totally Reliable' })).toHaveAttribute('aria-selected', 'true');
    for (const tab of await caseTabs.all()) {
      await tab.click();
      const panel = page.locator('[data-case-panel]:visible');
      await expect(panel.locator('.case-narrative h3')).toHaveText(['Problem', 'Decision', 'Build', 'Result']);
      await expect(panel.locator('.case-destinations a').first()).toBeVisible();
      await expect(panel.locator('.process-case-shot > .georgie-egg--process')).toHaveCount(1);
    }
  });

  test('writing search and keyboard selection are usable', async ({ page }) => {
    await page.goto('/blog/');

    const search = page.getByRole('searchbox', { name: 'Filter writing' });
    const counter = page.locator('#writing-counter');
    const feature = page.locator('.writing-feature');
    const rows = page.locator('.writing-row');
    const showAll = page.locator('#show-all-writing');
    await page.keyboard.press('/');
    await expect(search).toBeFocused();
    await expect(page.locator('#vim-search')).toHaveCount(0);

    await expect(counter).toHaveText('8 shown · 18 total');
    await expect(feature.locator('time')).toHaveAttribute('datetime', '2026-08-09');
    await expect(feature.locator('time')).toHaveText('Aug 9, 2026');
    await expect(rows.locator('time')).toHaveCount(17);
    await expect(rows.first().locator('time')).toHaveAttribute('datetime', '2026-07-06');
    await expect(showAll).toHaveText('Show 10 more essays');
    await expect(showAll).toHaveAttribute('aria-expanded', 'false');

    await search.fill('manifesto');
    await expect(feature).toBeVisible();
    await expect(page.locator('.writing-row:visible')).toHaveCount(0);
    await expect(counter).toHaveText('1 result');

    await search.fill('no matching essay');
    await expect(feature).toBeHidden();
    await expect(page.locator('.writing-row:visible')).toHaveCount(0);
    await expect(page.getByText('No essays match that search.', { exact: true })).toBeVisible();
    await expect(counter).toHaveText('0 results');

    await search.fill('complexity');
    await expect(page.locator('.writing-row:visible')).toHaveCount(1);
    await expect(page.getByText('Complexity Protects Itself', { exact: true })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByText('Complexity Protects Itself', { exact: true }).locator('..')).toBeFocused();
    await expect(page.locator('.writing-feature__art img')).toHaveAttribute('src', '/blog/portable-agent-factory/codex-desktop-won.webp');
    await expect(page.locator('.writing-feature__art')).toHaveCSS('background-image', 'none');

    await search.fill('');
    await search.blur();
    await page.keyboard.press('k');
    await expect(showAll).toBeFocused();
    await page.keyboard.press('j');
    await expect(page.locator('.writing-feature')).toHaveClass(/is-selected/);

    await page.keyboard.press('k');
    await expect(showAll).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.writing-row:visible')).toHaveCount(17);
    await expect(showAll).toHaveAttribute('aria-expanded', 'true');
    await expect(rows.nth(7)).toBeFocused();
    await expect(rows.nth(7)).toHaveClass(/is-selected/);
    await page.keyboard.press('k');
    await expect(rows.nth(6)).toBeFocused();
    await page.keyboard.press('j');
    await expect(rows.nth(7)).toBeFocused();

    await search.focus();
    await search.fill('complexity');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/blog\/complexity-protects-itself\/$/);
  });

  test('the featured essay is one card target while Georgie stays a separate button', async ({ page }) => {
    await page.goto('/blog/');
    const feature = page.locator('.writing-feature');
    const link = feature.getByRole('link', { name: 'Read I Wanted to Own the Harness. Then Codex Desktop Won.' });
    const georgie = feature.getByRole('button', { name: 'Wake Georgie on the featured essay' });

    await expect(link).toHaveAttribute('href', '/blog/portable-agent-factory/');
    await expect(georgie).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
    expect(await link.evaluate((element) => getComputedStyle(element, '::after').position)).toBe('absolute');
    expect(await link.evaluate((element) => getComputedStyle(element, '::after').inset)).toBe('0px');

    await georgie.click();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(georgie).toHaveClass(/is-georgie-active/);

    const art = await feature.locator('.writing-feature__art').boundingBox();
    expect(art).not.toBeNull();
    await page.mouse.click(art.x + 20, art.y + 20);
    await expect(page).toHaveURL(/\/blog\/portable-agent-factory\/$/);
  });

  test('contact page exposes direct destinations and the 15-minute Sync', async ({ page }) => {
    await page.goto('/contact/');

    await expect(page.getByRole('link', { name: /Write a note/ })).toHaveAttribute('href', 'mailto:jory@pestorious.com');
    await expect(page.getByRole('link', { name: /See the code/ })).toHaveAttribute('href', 'https://github.com/joryeugene');
    await expect(page.getByRole('link', { name: /Find a time/ })).toHaveAttribute('href', 'https://cal.com/jory-pestorious/celebrity');
    await expect(page.locator('a[href*="/resume/"]')).toHaveCount(0);
    await expect(page.locator('.contact-path')).toHaveCount(4);
    await expect(page.locator('.contact-path[data-jelly]')).toHaveCount(4);
    await expect(page.locator('.contact-georgie')).toHaveCSS('background-image', /georgie-contact-pair\.webp/);
    await expect(page.getByText(/\bv\b.*Vim/i)).toHaveCount(0);

    const georgie = await page.locator('.contact-georgie').boundingBox();
    const email = await page.getByRole('link', { name: /Write a note/ }).boundingBox();
    expect(georgie).not.toBeNull();
    expect(email).not.toBeNull();
    const overlap = (georgie?.x ?? 0) + (georgie?.width ?? 0) - (email?.x ?? 0);
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThanOrEqual(50);

    const github = await page.getByRole('link', { name: /See the code/ }).boundingBox();
    expect(github).not.toBeNull();
    expect((github?.x ?? 0) - ((email?.x ?? 0) + (email?.width ?? 0))).toBeGreaterThanOrEqual(32);
  });
});

test.describe('portfolio responsive behavior', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps Vim and navigation usable without horizontal overflow', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Open Vim' })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    const phalene = page.locator('[data-featured-project="phalene-vim"]');
    await expect(phalene).toBeVisible();
    await expect(phalene.locator('.project-media img')).toBeVisible();
    await expect(phalene.getByRole('link', { name: 'Open Phalene-Vim' })).toBeVisible();
  });

  test('keeps Process controls and copy inside the phone viewport', async ({ page }) => {
    await page.goto('/process/');

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    const buttons = await page.getByRole('tablist', { name: 'Process case studies' }).getByRole('tab').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    }
  });

  test('uses mobile-length writing search copy', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.getByRole('searchbox', { name: 'Filter writing' })).toHaveAttribute('placeholder', 'Search writing');
    await expect(page.locator('.writing-row__excerpt').first()).toHaveCSS('-webkit-line-clamp', '1');
  });
});

test.describe('portfolio at 320px', () => {
  test.use({ viewport: { width: 320, height: 844 } });

  test('keeps the static gallery and Process tabs stable and readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-featured-project]')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await page.goto('/process/#workhelix');
    await expect(page.getByRole('tab', { name: 'Workhelix' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-case-panel]:visible .case-narrative h3')).toHaveText(['Problem', 'Decision', 'Build', 'Result']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });

  test('keeps the email on one line while Georgie presses its right edge', async ({ page }) => {
    await page.goto('/contact/');
    const emailCard = page.locator('.contact-path').first();
    const email = emailCard.locator('p');
    const metrics = await email.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(element).lineHeight)
    }));
    expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight + 1);

    const [card, georgie] = await Promise.all([
      emailCard.boundingBox(),
      page.locator('.contact-georgie-wrap').boundingBox()
    ]);
    expect(card).not.toBeNull();
    expect(georgie).not.toBeNull();
    expect(Math.abs((georgie.x + georgie.width) - (card.x + card.width))).toBeLessThanOrEqual(1);
    expect(georgie.y).toBeGreaterThanOrEqual(card.y);
    expect(georgie.y + georgie.height).toBeLessThanOrEqual(card.y + card.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
});
