import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

test('vertical split keeps two visible buffers, two cursors, and loaded text', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher');
  await cmd(page, 'e 07-project.md');
  await press(page, 'j');
  expect((await state(page)).pos).toMatch(/^2,/);

  await cmd(page, 'vsplit 07-api.js');
  expect((await state(page)).file).toBe('07-api.js');
  await expect(page.locator('#vim-editor')).toHaveClass(/vim-split/);
  await expect(page.locator('#vim-editor')).toHaveClass(/vim-split-active-right/);
  await expect(page.locator('#vim-split-peer-file')).toContainText('07-project.md');
  await expect(page.locator('#vim-split-peer-content')).toContainText('# Project index');

  await press(page, 'j');
  await press(page, 'A');
  await type(page, ' verified');
  await press(page, 'Escape');
  expect((await state(page)).pos).toMatch(/^2,/);

  await press(page, 'Control+w');
  await press(page, 'Control+w');
  expect((await state(page)).file).toBe('07-project.md');
  expect((await state(page)).pos).toMatch(/^2,/);
  await expect(page.locator('#vim-split-peer-file')).toContainText('07-api.js');
  await expect(page.locator('#vim-split-peer-content')).toContainText('/v2/reports verified');

  await press(page, 'Control+w');
  await press(page, 'w');
  expect((await state(page)).file).toBe('07-api.js');
  expect((await state(page)).pos).toMatch(/^2,/);

  await cmd(page, 'close');
  expect((await state(page)).file).toBe('07-project.md');
  await expect(page.locator('#vim-editor')).not.toHaveClass(/vim-split/);

  await cmd(page, 'buffer 07-api.js');
  expect(await lines(page)).toContain('/v2/reports verified');
});

test(':wincmd w switches split windows without using the browser Ctrl-W shortcut', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher lesson 8');
  await cmd(page, 'e 08-report.md');
  await press(page, '/');
  await type(page, '08-source.log');
  await press(page, 'Enter');
  await cmd(page, 'wincmd f');

  expect((await state(page)).file).toBe('08-source.log');
  await cmd(page, 'wincmd w');
  expect((await state(page)).file).toBe('08-report.md');
});

test('tab pages preserve a split workspace while a second task is active', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher lesson 8');
  await cmd(page, 'e 08-report.md');
  await cmd(page, 'vsplit 08-source.log');
  await press(page, 'Control+w');
  await press(page, 'w');
  expect((await state(page)).file).toBe('08-report.md');

  await cmd(page, 'tabedit 07-project.md');
  expect((await state(page)).file).toBe('07-project.md');
  await expect(page.locator('#vim-tabbar')).toBeVisible();
  await expect(page.locator('#vim-tabbar [aria-selected="true"]')).toContainText('07-project.md');
  await press(page, 'j');

  await press(page, 'g');
  await press(page, 't');
  expect((await state(page)).file).toBe('08-report.md');
  expect((await state(page)).pos).toBe('1,1');
  await expect(page.locator('#vim-split-peer')).toBeVisible();
  await expect(page.locator('#vim-split-peer-file')).toContainText('08-source.log');

  await cmd(page, 'tabnext');
  expect((await state(page)).file).toBe('07-project.md');
  expect((await state(page)).pos).toBe('2,1');

  await press(page, 'g');
  await press(page, 'T');
  expect((await state(page)).file).toBe('08-report.md');
  await cmd(page, 'tabnext');
  expect((await state(page)).file).toBe('07-project.md');

  await cmd(page, 'tabedit 08-source.log');
  expect((await state(page)).file).toBe('08-source.log');
  await cmd(page, 'tabedit 07-api.js');
  expect((await state(page)).file).toBe('08-source.log');
  await expect(page.locator('#vim-cmdline')).toContainText('at most three tab pages');
  await cmd(page, 'tabclose');
  expect((await state(page)).file).toBe('07-project.md');

  await cmd(page, 'tabclose');
  expect((await state(page)).file).toBe('08-report.md');
  await expect(page.locator('#vim-split-peer')).toBeVisible();
  await expect(page.locator('#vim-tabbar')).toBeHidden();
});

test('workspace commands are discoverable and complete loaded filenames', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher');

  await press(page, ':');
  await type(page, 'buffer 07-pro');
  await press(page, 'Tab');
  await expect(page.locator('#vim-cmdline')).toHaveText(':buffer 07-project.md');
  await press(page, 'Escape');

  await press(page, ':');
  await type(page, 'vsplit friction');
  await press(page, 'Tab');
  await expect(page.locator('#vim-cmdline')).toHaveText(':vsplit friction');
  await press(page, 'Escape');

  await press(page, ':');
  await type(page, 'e friction');
  await press(page, 'Tab');
  await expect(page.locator('#vim-cmdline')).toHaveText(':e friction-economy');
  await press(page, 'Escape');

  await cmd(page, 'help :tabedit');
  expect((await lines(page)).join('\n')).toContain('Each tab page keeps its own window layout.');
});
