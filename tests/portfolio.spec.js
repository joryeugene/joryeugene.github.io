import { test, expect } from '@playwright/test';

test.describe('portfolio shell', () => {
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
      ['Inspect dadbod-grip.nvim', 'dadbod-grip.nvim', /staged changes.*SQL preview/i],
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
    await expect(page.getByText(/web build is online-first, database-free/)).toBeVisible();
    await expect(page.locator('.archive-card h3 a')).toHaveCount(4);
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

    await expect(page.getByText(/Four selected case studies/)).toBeVisible();
    await expect(page.getByText(/Four shipped systems/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Process', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('tab', { name: 'Tests' }).click();
    await expect(page.getByText('Preview the SQL before execution.')).toBeVisible();
    await expect(page.getByText('Separate desktop app')).toBeVisible();
    await expect(page.locator('.wrong-turn').first()).toHaveCSS('border-left-style', 'solid');

    const cases = [
      ['Dadbod Grip', /dadbod-grip\.nvim stays inspectable/i, 'https://github.com/joryeugene/dadbod-grip.nvim'],
      ['Totally Reliable', /physics playful online/i, 'https://www.totallyreliable.com/'],
      ['Theosis', /native and web/i, 'https://prayorthodox.com/'],
      ['Workhelix', /Bubble to a production platform used through Series A/i, 'https://www.workhelix.com/']
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
    await expect(page.getByText(/Native stays offline while the web build loads route-sized data on demand/)).toBeVisible();
    await expect(page.getByText(/public web path removed database and WASM startup/)).toBeVisible();
    await expect(page).toHaveURL(/#theosis$/);
    await expect(page.getByRole('tab', { name: 'Theosis' })).toHaveAttribute('href', '#theosis');

    const caseNavigationTop = await page.locator('.case-navigation').evaluate((element) => element.getBoundingClientRect().top + scrollY);
    const processStageTop = await page.locator('.process-stage').evaluate((element) => element.getBoundingClientRect().top + scrollY);
    expect(caseNavigationTop).toBeLessThan(processStageTop);
  });

  test('writing search and keyboard selection are usable', async ({ page }) => {
    await page.goto('/blog/');

    const search = page.getByRole('searchbox', { name: 'Filter writing' });
    await page.keyboard.press('/');
    await expect(search).toBeFocused();
    await expect(page.locator('#vim-search')).toHaveCount(0);
    await search.fill('complexity');
    await expect(page.locator('.writing-row:visible')).toHaveCount(1);
    await expect(page.getByText('Complexity Protects Itself', { exact: true })).toBeVisible();
    await expect(page.locator('.writing-feature__art img')).toHaveAttribute('src', '/blog/portable-agent-factory/codex-desktop-won.webp');
    await expect(page.locator('.writing-feature__art')).toHaveCSS('background-image', 'none');

    await search.fill('');
    await search.blur();
    await page.keyboard.press('j');
    await expect(page.locator('.writing-feature')).toHaveClass(/is-selected/);
    await page.keyboard.press('j');
    await expect(page.locator('.writing-row.is-selected')).toHaveCount(1);
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
  });
});
