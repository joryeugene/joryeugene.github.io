import { test, expect } from '@playwright/test';
import { open, press, cmd, lines, state } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    localStorage.setItem('vim_file_api.log', [
      '09:14 req_42 warning',
      '09:15 req_42 timeout timeout'
    ].join('\n'));
    localStorage.setItem('vim_file_trace.log', [
      'start',
      '09:16 timeout req_42'
    ].join('\n'));
  });
});

test('QF-9 QF-11 QF-13 QF-23 QF-24: builds, displays, and opens a bounded result list', async ({ page }) => {
  await cmd(page, 'vimgrep /timeout/gj *.log');
  await expect(page.locator('#vim-cmdline')).toContainText('3 Quickfix matches');
  expect((await state(page)).file).not.toContain('[Quickfix]');

  await cmd(page, 'copen');
  expect((await state(page)).file).toContain('[Quickfix]');
  const content = (await lines(page)).join('\n');
  expect(content).toContain('api.log | 2 14 | 09:15 req_42 timeout timeout');
  expect(content).toContain('trace.log | 2 7 | 09:16 timeout req_42');

  await press(page, 'Enter');
  expect((await state(page)).file).toContain('api.log');
  expect((await state(page)).pos).toBe('2,14');
  await press(page, 'Control+o');
  expect((await state(page)).file).toContain('[Quickfix]');
});

test('QF-10 QF-14 QF-15 QF-19: first-per-line, atomic errors, and valid empty results', async ({ page }) => {
  await cmd(page, 'vimgrep /timeout/j api.log');
  await cmd(page, 'copen');
  expect((await lines(page)).filter(line => line.includes('api.log |')).length).toBe(1);
  await press(page, 'Control+o');

  await cmd(page, 'vimgrep /[/j api.log');
  await expect(page.locator('#vim-cmdline')).toContainText('invalid pattern');
  await cmd(page, 'copen');
  expect((await lines(page)).filter(line => line.includes('api.log |')).length).toBe(1);
  await press(page, 'Control+o');

  await cmd(page, 'vimgrep /does-not-exist/j api.log');
  await expect(page.locator('#vim-cmdline')).toContainText('0 Quickfix matches');
  await cmd(page, 'copen');
  await expect(page.locator('#vim-content')).toContainText('No matches.');
  await press(page, 'Control+o');

  await cmd(page, 'vimgrep /timeout/j missing.log');
  await expect(page.locator('#vim-cmdline')).toContainText('No match: missing.log');
});

test('QF-22: cnext and cprevious stop at list boundaries', async ({ page }) => {
  await cmd(page, 'vimgrep /timeout/gj *.log');
  await cmd(page, 'cc 3');
  expect((await state(page)).file).toContain('trace.log');
  await cmd(page, 'cnext');
  await expect(page.locator('#vim-cmdline')).toContainText('No more items after');

  await cmd(page, 'cc 1');
  await cmd(page, 'cprevious');
  await expect(page.locator('#vim-cmdline')).toContainText('No more items before');
});

test('QF-23 VIRT-1: Quickfix remains readonly', async ({ page }) => {
  await cmd(page, 'vimgrep /timeout/j *.log');
  await cmd(page, 'copen');
  const before = await lines(page);
  await press(page, 'd');
  expect(await lines(page)).toEqual(before);
  await expect(page.locator('#vim-cmdline')).toContainText('modifiable');
});
