import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('vim_file_')) localStorage.removeItem(key);
    }
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('#vim-content');
});

test('SAVE-1 SAVE-4 SAVE-5: modified state clears only after durable browser save', async ({ page }) => {
  await cmd(page, 'e notes.txt');
  await press(page, 'i');
  await type(page, 'draft');
  await press(page, 'Escape');
  await expect(page.locator('#vim-status-file')).toContainText('[+]');

  await cmd(page, 'download');
  await expect(page.locator('#vim-status-file')).toContainText('[+]');

  await cmd(page, 'w');
  await expect(page.locator('#vim-status-file')).not.toContainText('[+]');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_notes.txt'))).toBe('draft');
});

test('SAVE-6: storage failure stays dirty and reports the failure', async ({ page }) => {
  await cmd(page, 'e denied.txt');
  await press(page, 'i');
  await type(page, 'keep me');
  await press(page, 'Escape');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'vim_file_denied.txt') throw new DOMException('denied', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });

  await cmd(page, 'w');
  await expect(page.locator('#vim-status-file')).toContainText('[+]');
  await expect(page.locator('#vim-cmdline')).toContainText('write failed');
});

test('DOC-5 SAVE-7 SAVE-8: normalized browser filenames cannot collide', async ({ page }) => {
  await cmd(page, 'e Notes.txt');
  await press(page, 'i');
  await type(page, 'first');
  await press(page, 'Escape');
  await cmd(page, 'w');

  await page.reload();
  await page.waitForSelector('#vim-content');
  await cmd(page, 'enew');
  await press(page, 'i');
  await type(page, 'second');
  await press(page, 'Escape');
  await cmd(page, 'w notes.TXT');

  await expect(page.locator('#vim-cmdline')).toContainText('File exists');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_Notes.txt'))).toBe('first');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_notes.TXT'))).toBeNull();

  await cmd(page, 'w! notes.TXT');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_Notes.txt'))).toBe('second');
  expect((await state(page)).file).toBe('Notes.txt');
});

test('VIEW-3 VIEW-4: q closes a split first and blocks final dirty exit', async ({ page }) => {
  await cmd(page, 'e source.txt');
  await press(page, 'i');
  await type(page, 'unsaved');
  await press(page, 'Escape');
  await cmd(page, 'e test.txt');
  await cmd(page, 'vsplit source.txt');

  await cmd(page, 'q');
  await expect(page.locator('#vim-editor')).not.toHaveClass(/vim-split/);
  await expect(page).toHaveURL(/\/vim\//);

  await cmd(page, 'q');
  await expect(page).toHaveURL(/\/vim\//);
  await expect(page.locator('#vim-cmdline')).toContainText('E37');
  expect((await state(page)).file).toContain('source.txt');
});

test('VIEW-11 VIEW-13: Ctrl-caret toggles the per-view alternate file', async ({ page }) => {
  await cmd(page, 'e alpha.txt');
  await press(page, 'i');
  await type(page, 'alpha');
  await press(page, 'Escape');
  await cmd(page, 'e beta.txt');
  await press(page, 'i');
  await type(page, 'beta');
  await press(page, 'Escape');

  await press(page, 'Control+^');
  expect((await state(page)).file).toContain('alpha.txt');
  expect(await lines(page)).toEqual(['alpha']);
  await press(page, 'Control+^');
  expect((await state(page)).file).toContain('beta.txt');
});

test('HIST-1: undo is local to the active document', async ({ page }) => {
  await cmd(page, 'e one.txt');
  await press(page, 'i');
  await type(page, 'one');
  await press(page, 'Escape');
  await cmd(page, 'e two.txt');
  await press(page, 'i');
  await type(page, 'two');
  await press(page, 'Escape');

  await press(page, 'u');
  expect((await state(page)).file).toContain('two.txt');
  expect(await lines(page)).toEqual([' ']);
  await cmd(page, 'buffer one.txt');
  expect(await lines(page)).toEqual(['one']);
});

test('REC-3 REC-5 REC-6: reload discovers and restores a dirty session draft', async ({ page }) => {
  await cmd(page, 'e recovered.txt');
  await press(page, 'i');
  await type(page, 'survives reload');
  await press(page, 'Escape');
  await page.waitForTimeout(350);
  page.once('dialog', dialog => dialog.accept());
  await page.reload();
  await page.waitForSelector('#vim-content');

  expect((await state(page)).file).toContain('[Recovery]');
  await expect(page.locator('#vim-content')).toContainText('recovered.txt');
  await press(page, 'Enter');
  expect((await state(page)).file).toContain('recovered.txt');
  expect(await lines(page)).toEqual(['survives reload']);
  await expect(page.locator('#vim-status-file')).toContainText('[+]');
});

test('SAVE-9: a newer browser copy cannot be silently overwritten', async ({ context, page }) => {
  const otherPage = await context.newPage();
  await open(otherPage);
  await cmd(page, 'e shared.txt');
  await cmd(otherPage, 'e shared.txt');
  await press(otherPage, 'i');
  await type(otherPage, 'newer copy');
  await press(otherPage, 'Escape');
  await cmd(otherPage, 'w');

  await press(page, 'i');
  await type(page, 'older copy');
  await press(page, 'Escape');
  await cmd(page, 'w');

  await expect(page.locator('#vim-cmdline')).toContainText('changed in browser storage');
  await expect(page.locator('#vim-status-file')).toContainText('[+]');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_shared.txt'))).toBe('newer copy');
  await otherPage.close();
});

test('REC-7: keeping a current draft clears modified state only after storage succeeds', async ({ page }) => {
  await cmd(page, 'e keep.txt');
  await press(page, 'i');
  await type(page, 'protected work');
  await press(page, 'Escape');
  await page.waitForTimeout(350);

  await cmd(page, 'recover');
  await press(page, 's');
  await cmd(page, 'buffer keep.txt');

  await expect(page.locator('#vim-status-file')).not.toContainText('[+]');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_keep.txt'))).toBe('protected work');
});

test('SAVE-9 REC-4 REC-7: keeping recovery refuses a newer durable copy', async ({ page }) => {
  await cmd(page, 'e conflict.txt');
  await press(page, 'i');
  await type(page, 'recovery draft');
  await press(page, 'Escape');
  await page.waitForTimeout(350);
  await page.evaluate(() => localStorage.setItem('vim_file_conflict.txt', 'newer durable copy'));

  await cmd(page, 'recover');
  await press(page, 's');

  await expect(page.locator('#vim-cmdline')).toContainText('Recovery conflicts');
  expect(await page.evaluate(() => localStorage.getItem('vim_file_conflict.txt'))).toBe('newer durable copy');
  expect(await page.evaluate(() => Object.keys(sessionStorage).some(key => key.startsWith('vim_recovery_v1:')))).toBe(true);
});
