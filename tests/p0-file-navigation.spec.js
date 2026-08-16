import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

async function gf(page) {
  await press(page, 'g');
  await press(page, 'f');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
});

test('gf opens a Teacher filename and Ctrl-O returns to unsaved text', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '03-release-note.txt');

  await gf(page);
  expect((await state(page)).file).toBe('03-release-note.txt');
  expect(await lines(page)).toEqual([
    'draft: release notes',
    'REMOVE: temporary placeholder',
    'keep: audit link'
  ]);

  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['03-release-note.txt']);

  await press(page, 'Control+i');
  expect((await state(page)).file).toBe('03-release-note.txt');
  expect(await lines(page)).toEqual([
    'draft: release notes',
    'REMOVE: temporary placeholder',
    'keep: audit link'
  ]);
});

test('gf opens the mission filename directly from a Teacher guide', async ({ page }) => {
  await cmd(page, 'teacher lesson 7');
  await cmd(page, 'teacher score');
  expect((await state(page)).file).toBe('[Teacher]');
  await press(page, '/');
  await type(page, '07-project.md');
  await press(page, 'Enter');
  await gf(page);

  expect((await state(page)).file).toBe('07-project.md');
  await expect(page.locator('#vim-teacher-next')).toContainText(':Ex');
});

test('gf follows a help topic and a Markdown article title', async ({ page }) => {
  await seed(page, 'registers');
  await gf(page);
  expect((await state(page)).file).toBe('[Help]');
  expect((await lines(page))[0]).toBe('*registers*');

  await cmd(page, 'enew');
  await press(page, 'i');
  await page.keyboard.type('[Friction Economy](/blog/friction-economy/)');
  await press(page, 'Escape');
  await press(page, '0');
  await gf(page);
  await expect.poll(async () => (await state(page)).file).toBe('friction-economy.md');
  expect((await lines(page)).join('\n')).toContain('Friction');
});

test('Ctrl-W f opens a target in a split and preserves the source window', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '07-api.js');
  await press(page, 'Control+w');
  await press(page, 'f');

  expect((await state(page)).file).toBe('07-api.js');
  await expect(page.locator('#vim-editor')).toHaveClass(/vim-split/);
  await expect(page.locator('#vim-split-peer-content')).toContainText('07-api.js');

  await press(page, 'Control+w');
  await press(page, 'w');
  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['07-api.js']);
});

test('Ctrl-W gf opens a target in a tab page', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '07-project.md');
  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'f');

  expect((await state(page)).file).toBe('07-project.md');
  await expect(page.locator('#vim-tabbar')).toBeVisible();
  await expect(page.locator('#vim-tabbar [aria-selected="true"]')).toContainText('07-project.md');

  await press(page, 'g');
  await press(page, 'T');
  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['07-project.md']);
});

test('gf reports missing, ambiguous, and browser URL targets without leaving', async ({ page }) => {
  await seed(page, 'missing-file.txt');
  await gf(page);
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('E447');

  await cmd(page, 'enew');
  await press(page, 'i');
  await page.keyboard.type('untitled.txt');
  await press(page, 'Escape');
  await press(page, '0');
  await gf(page);
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('E93');

  await cmd(page, 'enew');
  await press(page, 'i');
  await page.keyboard.type('https://example.com');
  await press(page, 'Escape');
  await press(page, '0');
  await gf(page);
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('Use gx');
});

test('gf distinguishes bare domains and site routes from editable article sources', async ({ page }) => {
  await seed(page, 'example.com\n/process/');
  await gf(page);
  await expect(page.locator('#vim-cmdline')).toContainText('Use gx');

  await press(page, 'j');
  await gf(page);
  await expect(page.locator('#vim-cmdline')).toContainText('Use gx');
  expect((await state(page)).file).toBe('untitled.txt');
});

test('gx opens a site route in a real browser tab', async ({ page }) => {
  await seed(page, '/blog/friction-economy/');
  const popupPromise = page.waitForEvent('popup');
  await press(page, 'g');
  await press(page, 'x');
  const popup = await popupPromise;

  await expect(popup).toHaveURL(/\/blog\/friction-economy\/$/);
  await expect(page.locator('#vim-cmdline')).toContainText('Opened: /blog/friction-economy/');
  await popup.close();
});

test('window-file chords cancel cleanly and recover after a wrong key', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '(07-api.js),');

  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'Escape');
  await expect(page.locator('#vim-cmdline')).toContainText('canceled');
  expect((await state(page)).file).toBe('untitled.txt');

  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'x');
  await expect(page.locator('#vim-cmdline')).toContainText('Ctrl-W gf');

  await press(page, '0');
  await press(page, 'l');
  await gf(page);
  expect((await state(page)).file).toBe('07-api.js');
});

test('counts before window-file chords do not leak into the next motion', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '10-trace.log');

  await press(page, '3');
  await press(page, 'Control+w');
  await press(page, 'f');
  expect((await state(page)).file).toBe('10-trace.log');
  await press(page, 'j');
  expect((await state(page)).pos).toBe('2,1');

  await press(page, 'Control+w');
  await press(page, 'w');
  await cmd(page, 'only');
  await seed(page, '10-trace.log');
  await press(page, '2');
  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'f');
  expect((await state(page)).file).toBe('10-trace.log');
  await press(page, 'j');
  expect((await state(page)).pos).toBe('2,1');
});

test('gf works from the real explorer and help surfaces', async ({ page }) => {
  await cmd(page, 'teacher');
  await cmd(page, 'Ex');
  await press(page, '/');
  await type(page, '03-release-note.txt');
  await press(page, 'Enter');
  await gf(page);
  expect((await state(page)).file).toBe('03-release-note.txt');

  await cmd(page, 'help');
  await press(page, '/');
  await type(page, 'registers');
  await press(page, 'Enter');
  await gf(page);
  expect((await state(page)).file).toBe('[Help]');
  expect((await lines(page))[0]).toBe('*registers*');
});

test('Ex lists saved and loaded files and uses the shared opener', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('vim_file_saved-note.txt', 'saved in the browser'));
  await cmd(page, 'e draft.md');
  await press(page, 'i');
  await page.keyboard.type('unsaved draft');
  await press(page, 'Escape');

  await cmd(page, 'Ex');
  await expect(page.locator('#vim-content')).toContainText('saved-note.txt');
  await expect(page.locator('#vim-content')).toContainText('draft.md');
  await press(page, '/');
  await type(page, 'saved-note.txt');
  await press(page, 'Enter');
  await press(page, 'Enter');
  expect((await state(page)).file).toBe('saved-note.txt');
  expect(await lines(page)).toEqual(['saved in the browser']);

  await cmd(page, 'Ex');
  await press(page, '/');
  await type(page, 'draft.md');
  await press(page, 'Enter');
  await gf(page);
  expect((await state(page)).file).toBe('draft.md');
  expect(await lines(page)).toEqual(['unsaved draft']);
});

test('buffers lists loaded documents and gf selects one without losing edits', async ({ page }) => {
  await cmd(page, 'teacher');
  await cmd(page, 'e 07-project.md');
  await press(page, 'A');
  await page.keyboard.type(' local draft');
  await press(page, 'Escape');
  await cmd(page, 'e 07-api.js');

  await cmd(page, 'buffers');
  expect((await state(page)).file).toBe('[Buffers]');
  await expect(page.locator('#vim-content')).toContainText('07-project.md');
  await press(page, '/');
  await type(page, '07-project.md');
  await press(page, 'Enter');
  await gf(page);

  expect((await state(page)).file).toBe('07-project.md');
  expect(await lines(page)).toContain('# Project index local draft');
});

test('file navigation reports fetch and workspace limits without changing windows', async ({ page }) => {
  await page.route('**/blog/friction-economy/friction-economy-vim-philosophy.md', route =>
    route.fulfill({ status: 503, body: 'unavailable' }));
  await seed(page, 'friction-economy');
  await gf(page);
  await expect(page.locator('#vim-cmdline')).toContainText('read error');
  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['friction-economy']);

  await cmd(page, 'teacher');
  await seed(page, '07-api.js');
  await press(page, 'Control+w');
  await press(page, 'f');
  await press(page, 'Control+w');
  await press(page, 'w');
  await press(page, 'Control+w');
  await press(page, 'f');
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('Only one split');
});

test('a delayed article read cannot replace a newer document', async ({ page }) => {
  await page.route('**/blog/friction-economy/friction-economy-vim-philosophy.md', async route => {
    await new Promise(resolve => setTimeout(resolve, 180));
    await route.fulfill({ status: 200, body: '# delayed article' });
  });
  await seed(page, 'friction-economy');
  await gf(page);
  await cmd(page, 'enew');
  await press(page, 'i');
  await page.keyboard.type('newer work');
  await press(page, 'Escape');
  await page.waitForTimeout(260);

  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['newer work']);
});

test('a delayed article opens in the requested split without losing its source', async ({ page }) => {
  await page.route('**/blog/friction-economy/friction-economy-vim-philosophy.md', async route => {
    await new Promise(resolve => setTimeout(resolve, 120));
    await route.fulfill({ status: 200, body: '# delayed split article' });
  });
  await seed(page, 'friction-economy');
  await press(page, 'Control+w');
  await press(page, 'f');

  await expect.poll(async () => (await state(page)).file).toBe('friction-economy.md');
  expect(await lines(page)).toEqual(['# delayed split article']);
  await expect(page.locator('#vim-split-peer-file')).toContainText('untitled.txt');
  await expect(page.locator('#vim-split-peer-content')).toContainText('friction-economy');
});

test('a delayed article opens in the requested tab and preserves the source tab', async ({ page }) => {
  await page.route('**/blog/friction-economy/friction-economy-vim-philosophy.md', async route => {
    await new Promise(resolve => setTimeout(resolve, 120));
    await route.fulfill({ status: 200, body: '# delayed tab article' });
  });
  await seed(page, 'friction-economy');
  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'f');

  await expect.poll(async () => (await state(page)).file).toBe('friction-economy.md');
  expect(await lines(page)).toEqual(['# delayed tab article']);
  await press(page, 'g');
  await press(page, 'T');
  expect((await state(page)).file).toBe('untitled.txt');
  expect(await lines(page)).toEqual(['friction-economy']);
});

test('Ctrl-W gf respects the three-tab limit', async ({ page }) => {
  await cmd(page, 'teacher');
  await seed(page, '07-project.md');

  for (let i = 0; i < 2; i++) {
    await press(page, 'Control+w');
    await press(page, 'g');
    await press(page, 'f');
    await press(page, '1');
    await press(page, 'g');
    await press(page, 't');
  }
  expect((await state(page)).file).toBe('untitled.txt');

  await press(page, 'Control+w');
  await press(page, 'g');
  await press(page, 'f');
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('at most three tab pages');
});
