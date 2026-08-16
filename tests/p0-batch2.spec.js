import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function seed(page, name, text) {
  await page.evaluate(({ name, text }) => localStorage.setItem('vim_file_' + name, text), { name, text });
  await cmd(page, `e ${name}`);
}

test.beforeEach(async ({ page }) => {
  await open(page);
});

test('substitute supports alternate delimiters, case flags, count-only, and empty search reuse', async ({ page }) => {
  await seed(page, 'sub.txt', 'Foo foo foo\nfoo stays');

  await cmd(page, '%s#foo#bar#gi');
  expect(await lines(page)).toEqual(['bar bar bar', 'bar stays']);
  await press(page, 'u');

  await cmd(page, '%s/foo/nope/gn');
  expect(await lines(page)).toEqual(['Foo foo foo', 'foo stays']);
  await expect(page.locator('#vim-cmdline')).toContainText('3 matches');

  await press(page, '/');
  await type(page, 'foo');
  await press(page, 'Enter');
  await cmd(page, '%s//zap/g');
  expect(await lines(page)).toEqual(['Foo zap zap', 'zap stays']);
});

test('AUTO-1 AUTO-3 AUTO-4: ranged normal is bounded, transactional, and one undo unit', async ({ page }) => {
  await seed(page, 'normal.txt', 'alpha\nbeta\ngamma');
  await cmd(page, '%normal! I# <Esc>');
  expect(await lines(page)).toEqual(['# alpha', '# beta', '# gamma']);
  await press(page, 'u');
  expect(await lines(page)).toEqual(['alpha', 'beta', 'gamma']);

  await cmd(page, '%normal! :q<CR>');
  expect(await lines(page)).toEqual(['alpha', 'beta', 'gamma']);
  await expect(page.locator('#vim-cmdline')).toContainText('excludes prompts');
});

test('FOLD-1 FOLD-3 FOLD-4: manual folds close, open, and reveal jump targets', async ({ page }) => {
  await seed(page, 'fold.txt', 'one\ntwo\nthree\nfour');
  await press(page, 'z');
  await press(page, 'f');
  await press(page, 'G');
  await expect(page.locator('#vim-content')).toContainText('lines folded');
  await expect(page.locator('#vim-content')).not.toContainText('four');

  await press(page, 'z');
  await press(page, 'o');
  await expect(page.locator('#vim-content')).toContainText('four');
  await press(page, 'z');
  await press(page, 'c');
  await expect(page.locator('#vim-content')).not.toContainText('four');

  await press(page, 'G');
  expect((await state(page)).pos).toBe('4,1');
  await expect(page.locator('#vim-content')).toContainText('four');
});

test('PERF-2: cursor-only movement does not replace the line DOM', async ({ page }) => {
  const text = Array.from({ length: 5000 }, (_, index) => `line ${index + 1}`).join('\n');
  await seed(page, 'large.txt', text);
  await page.evaluate(() => {
    window.__lineDomMutations = 0;
    new MutationObserver(records => {
      window.__lineDomMutations += records.filter(record => record.type === 'childList').length;
    }).observe(document.querySelector('#vim-content'), { childList: true, subtree: true });
  });
  for (let index = 0; index < 30; index++) await press(page, 'j');
  expect(await page.evaluate(() => window.__lineDomMutations)).toBe(0);
});
