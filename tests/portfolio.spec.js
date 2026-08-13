import { test, expect } from '@playwright/test';

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

  test('inspects every featured project without accidental navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-project-card]')).toHaveCount(3);
    await expect(page.locator('[data-project-card] h2 a')).toHaveCount(0);
    await expect(page.locator('.project-preview[href]')).toHaveCount(0);

    const cases = [
      ['Inspect Phalene-Vim', 'Phalene-Vim', /motions, macros, search, undo/i],
      ['Inspect dadbod-grip.nvim', 'dadbod-grip.nvim', /74 spec files.*1,761 assertions/i],
      ['Inspect Georgie', 'Georgie', /raised paw/i]
    ];

    for (const [buttonName, projectName, proof] of cases) {
      const button = page.getByRole('button', { name: buttonName });
      await button.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('[data-depth-project-name]')).toHaveText(projectName);
      await page.getByRole('tab', { name: 'Proof' }).click();
      await expect(page.locator('[data-depth-panel]:visible')).toContainText(proof);
    }

    const { gridBottom, drawerTop } = await page.evaluate(() => ({
      gridBottom: document.querySelector('.project-grid').getBoundingClientRect().bottom,
      drawerTop: document.querySelector('.depth-drawer').getBoundingClientRect().top
    }));
    expect(drawerTop - gridBottom).toBeGreaterThanOrEqual(40);

    const homeGeorgie = page.locator('.georgie-egg--home .georgie-egg__sprite');
    await expect(homeGeorgie).toBeVisible();
    await expect(homeGeorgie).toHaveCSS('background-image', /georgie-home-pair\.webp/);

    await expect(page.getByRole('heading', { name: 'Selected history' })).toBeVisible();
    await expect(page.getByText('Totally Reliable Delivery Service', { exact: true })).toBeVisible();
    await expect(page.getByText('Theosis', { exact: true })).toBeVisible();
    await expect(page.getByText(/four online ragdolls can form a chain and hang from a moving rocket/i)).toBeVisible();
    await expect(page.getByText(/4,017 OCA calendar days with feasts, fasts, saints, stories, and appointed readings/i)).toBeVisible();
    await expect(page.getByText(/39,891 verses across 85 books for browsing and search/i)).toBeVisible();
    await expect(page.getByText('Live web product', { exact: true })).toBeVisible();
    await expect(page.getByText(/HRIS, AI-usage, and prompt data/i)).toBeVisible();
    await expect(page.getByText(/15\+?.*ECharts|more than 15.*ECharts/i)).toHaveCount(0);
    await expect(page.getByText(/built (its )?interactive analytics and assessment workflows/i)).toHaveCount(0);
    await expect(page.getByText(/data science team's assessment outputs/i)).toBeVisible();
    await expect(page.getByText(/Nine Claude Code hooks capture facts and decisions/i)).toBeVisible();
    await expect(page.getByText(/hive verify/)).toBeVisible();
    await expect(page.locator('a[href="/blog/knowledge-sidecar/"]')).toBeVisible();
    await expect(page.locator('.archive-card h3 a')).toHaveCount(4);
  });

  test('lays out the Dadbod system as four ordered stages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Inspect dadbod-grip.nvim' }).click();
    await page.getByRole('tab', { name: 'System', exact: true }).click();

    const path = page.locator('.system-path');
    const nodes = path.locator('.system-node');
    await expect(nodes).toHaveCount(4);

    const desktop = await nodes.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right };
    }));
    expect(Math.max(...desktop.map(({ y }) => y)) - Math.min(...desktop.map(({ y }) => y))).toBeLessThanOrEqual(1);
    for (let index = 1; index < desktop.length; index += 1) {
      expect(desktop[index].x).toBeGreaterThan(desktop[index - 1].right);
    }

    await page.setViewportSize({ width: 320, height: 844 });
    await page.reload();
    const phoneNodes = page.locator('.system-path .system-node');
    await expect(phoneNodes).toHaveCount(4);
    const phone = await phoneNodes.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, bottom: box.bottom, right: box.right };
    }));
    expect(Math.abs(phone[0].y - phone[1].y)).toBeLessThanOrEqual(1);
    expect(Math.abs(phone[2].y - phone[3].y)).toBeLessThanOrEqual(1);
    expect(phone[2].y).toBeGreaterThan(Math.max(phone[0].bottom, phone[1].bottom));
    expect(Math.abs(phone[0].x - phone[2].x)).toBeLessThanOrEqual(1);
    expect(Math.abs(phone[1].x - phone[3].x)).toBeLessThanOrEqual(1);
    expect(phone.every(({ x, right }) => x >= 0 && right <= 320)).toBe(true);
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
      ['Download résumé', '/resume/Jory-Pestorious-Resume.pdf']
    ];
    for (const [name, href] of expected) {
      await expect(palette.getByRole('link', { name: new RegExp(name, 'i') })).toHaveAttribute('href', href);
    }
    await expect(palette.getByRole('link', { name: /Download résumé/i })).toHaveAttribute('download', 'Jory-Pestorious-Resume.pdf');

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
  test('process page exposes inspectable layers and rejected paths', async ({ page }) => {
    await page.goto('/process/');

    const processGeorgie = page.getByRole('button', { name: 'Let Georgie inspect this case study' });
    await processGeorgie.hover();
    await expect(processGeorgie).toHaveClass(/is-georgie-active/);

    await expect(page.getByText(/A closer look at selected projects/)).toBeVisible();
    await expect(page.getByText(/Four shipped systems/)).toHaveCount(0);
    await expect(page.getByText(/15\+?.*ECharts|more than 15.*ECharts/i)).toHaveCount(0);
    await expect(page.getByText(/built (its )?interactive analytics and assessment workflows/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Process', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('tab', { name: 'Tests' }).click();
    await expect(page.getByText('1,761 assertions', { exact: true })).toBeVisible();
    await expect(page.getByText('Separate desktop app')).toBeVisible();
    await expect(page.locator('.wrong-turn').first()).toHaveCSS('border-left-style', 'solid');

    const cases = [
      ['Dadbod Grip', /Neovim into a data workbench/i, 'https://jorypestorious.com/dadbod-grip-web/'],
      ['Totally Reliable', /four live ragdolls stay connected to one rocket/i, 'https://www.totallyreliable.com/'],
      ['Theosis', /serves calendar and Bible data from the edge/i, 'https://prayorthodox.com/'],
      ['Workhelix', /company AI usage into product decisions/i, 'https://www.workhelix.com/platform']
    ];

    for (const [tabName, deepDiveTitle, destination] of cases) {
      const tab = page.getByRole('tab', { name: tabName });
      await tab.click();
      await expect(page.locator('.process-deep-dive h2')).toContainText(deepDiveTitle);
      await expect(page.locator('[data-case-panel]:visible')).toContainText(/open|visit|view/i);
      await expect(page.locator(`[data-case-panel]:visible a[href="${destination}"]`)).toBeVisible();
      await expect(page.locator('.wrong-turns')).toHaveAttribute('data-active-case', /.+/);
      for (const layerName of ['Brief', 'Constraints', 'Changes', 'Tests', 'Visual QA']) {
        await page.getByRole('tablist', { name: 'Project evidence layers' }).getByRole('tab', { name: new RegExp(layerName) }).click();
        await expect(page.locator('[data-layer-content]:visible')).not.toBeEmpty();
      }
    }

    await page.getByRole('tab', { name: 'Theosis' }).click();
    const theosisPanel = page.locator('#case-theosis');
    await expect(page.getByText(/Turn separate calendar and Bible databases into a versioned CDN data layer/i)).toBeVisible();
    await expect(theosisPanel).toContainText('4,017 OCA calendar days');
    await expect(theosisPanel).toContainText('39,891 verses across 85 books');
    await expect(theosisPanel).toContainText('requires no API process or live database query');
    await page.getByRole('tablist', { name: 'Project evidence layers' }).getByRole('tab', { name: /Tests/ }).click();
    await expect(page.getByText(/all 4,017 dates from 2025 through 2035/)).toBeVisible();
    await expect(page.locator('a[href="https://github.com/joryeugene/theosis"]')).toHaveCount(0);
    await expect(page).toHaveURL(/#theosis$/);
    await expect(page.getByRole('tab', { name: 'Theosis' })).toHaveAttribute('href', '#theosis');

    const caseNavigationTop = await page.locator('.case-navigation').evaluate((element) => element.getBoundingClientRect().top + scrollY);
    const processStageTop = await page.locator('.process-stage').evaluate((element) => element.getBoundingClientRect().top + scrollY);
    expect(caseNavigationTop).toBeLessThan(processStageTop);
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

  test('contact page exposes direct destinations and resume', async ({ page }) => {
    await page.goto('/contact/');

    await expect(page.getByRole('link', { name: /Write a note/ })).toHaveAttribute('href', 'mailto:jory@pestorious.com');
    await expect(page.getByRole('link', { name: /See the code/ })).toHaveAttribute('href', 'https://github.com/joryeugene');
    await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('download', 'Jory-Pestorious-Resume.pdf');
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
    await page.getByRole('button', { name: 'Inspect Phalene-Vim' }).click();
    await expect(page.locator('[data-depth-project-name]')).toHaveText('Phalene-Vim');
    await expect(page.locator('.depth-drawer')).toBeInViewport();
  });

  test('keeps Process controls and copy inside the phone viewport', async ({ page }) => {
    await page.goto('/process/');

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    const buttons = await page.getByRole('tablist', { name: 'Project evidence layers' }).getByRole('tab').all();
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

  test('keeps compact tabbed surfaces stable and readable', async ({ page }) => {
    const documentTop = (selector) => page.locator(selector).evaluate((element) => (
      element.getBoundingClientRect().top + window.scrollY
    ));

    await page.goto('/');
    const historyTop = await documentTop('.archive-section');
    expect(await page.locator('[data-depth-panel]:visible').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(361);
    for (const name of ['Demo', 'System', 'Decisions', 'Proof']) {
      await page.getByRole('tab', { name, exact: true }).click();
      expect(Math.abs((await documentTop('.archive-section')) - historyTop)).toBeLessThanOrEqual(1);
    }
    for (const name of ['Inspect Phalene-Vim', 'Inspect dadbod-grip.nvim', 'Inspect Georgie']) {
      await page.getByRole('button', { name }).click();
      expect(Math.abs((await documentTop('.archive-section')) - historyTop)).toBeLessThanOrEqual(1);
    }

    await page.goto('/process/#workhelix');
    const constraints = page.getByRole('tab', { name: /Constraints/ }).locator('span').last();
    const labelLineCount = await constraints.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element.childNodes[0]);
      return range.getClientRects().length;
    });
    expect(labelLineCount).toBe(1);
    await page.getByRole('tab', { name: /Changes/ }).click();
    expect(await page.locator('#layer-changes').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });

  test('keeps the email on one line while Georgie touches its edge', async ({ page }) => {
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
    expect(Math.abs((georgie.y + georgie.height) - card.y)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
});
