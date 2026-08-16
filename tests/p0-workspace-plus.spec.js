import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('vim_file_')) localStorage.removeItem(key);
    }
  });
});

test('VIEW-2 VIEW-9 DOC-2: hidden buffers retain work and buffer numbers are not reused', async ({ page }) => {
  await cmd(page, 'e one.txt');
  await press(page, 'i');
  await type(page, 'one');
  await press(page, 'Escape');
  await cmd(page, 'e two.txt');
  await cmd(page, 'buffers');
  const firstList = await lines(page);
  const oneLine = firstList.find(line => line.includes('one.txt'));
  const twoLine = firstList.find(line => line.includes('two.txt'));
  expect(oneLine).toMatch(/h\+/);
  const oneNumber = Number(oneLine.match(/\d+/)[0]);
  const twoNumber = Number(twoLine.match(/\d+/)[0]);

  await press(page, 'Control+o');
  await cmd(page, `buffer ${oneNumber}`);
  expect((await state(page)).file).toBe('one.txt');
  await cmd(page, 'bdelete one.txt');
  await expect(page.locator('#vim-cmdline')).toContainText('E89');
  await cmd(page, 'bdelete! one.txt');
  await cmd(page, 'enew');
  await cmd(page, 'buffers');
  const newestLine = (await lines(page)).find(line => line.includes('untitled.txt'));
  const newestNumber = Number(newestLine.match(/\d+/)[0]);
  expect(newestNumber).toBeGreaterThan(Math.max(oneNumber, twoNumber));
});

test('gn and dgn select and edit the next search match as one operation', async ({ page }) => {
  await cmd(page, 'e matches.txt');
  await press(page, 'i');
  await type(page, 'alpha target omega target');
  await press(page, 'Escape');
  await press(page, '0');
  await press(page, '/');
  await type(page, 'target');
  await press(page, 'Enter');
  await press(page, '0');
  await press(page, 'd');
  await press(page, 'g');
  await press(page, 'n');
  expect(await lines(page)).toEqual(['alpha  omega target']);
  await press(page, 'u');
  expect(await lines(page)).toEqual(['alpha target omega target']);
});

test('gF opens file-line targets and Help tag jumps return with Ctrl-T', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('vim_file_target.txt', 'first\nsecond\nthird'));
  await cmd(page, 'e source.txt');
  await press(page, 'i');
  await type(page, 'target.txt:2');
  await press(page, 'Escape');
  await press(page, '0');
  await press(page, 'g');
  await press(page, 'F');
  expect((await state(page)).file).toBe('target.txt');
  expect((await state(page)).pos).toBe('2,1');

  await cmd(page, 'help');
  await press(page, '/');
  await type(page, 'vimgrep');
  await press(page, 'Enter');
  await press(page, 'Control+]');
  await expect(page.locator('#vim-content')).toContainText('Search loaded, browser-saved');
  await press(page, 'Control+t');
  await expect(page.locator('#vim-content')).toContainText('PHALENE-VIM');
});

test('HIST-10: changes and command or search histories show stored state', async ({ page }) => {
  await cmd(page, 'e history.txt');
  await press(page, 'i');
  await type(page, 'needle');
  await press(page, 'Escape');
  await press(page, '/');
  await type(page, 'needle');
  await press(page, 'Enter');

  await cmd(page, 'changes');
  await expect(page.locator('#vim-content')).toContainText('needle');
  await press(page, 'Control+o');
  await cmd(page, 'history :');
  await expect(page.locator('#vim-content')).toContainText(':changes');
  await press(page, 'Control+o');
  await cmd(page, 'history /');
  await expect(page.locator('#vim-content')).toContainText('/needle');
});

test('REL-2: every shipped workspace command resolves to focused Help', async ({ page }) => {
  await open(page);
  for (const [topic, canonical] of [
    [':w!', ':w'], [':wq', ':w'], ['ZZ', ':w'], [':qa!', ':q'], ['ZQ', ':q'],
    [':bd', ':buffer'], ['Ctrl-^', ':buffer'], [':recover!', ':recover'],
    [':cc', ':vimgrep'], [':cnext', ':vimgrep'], [':normal!', ':normal'],
    ['gn', 'gn'], ['gF', 'gF'], ['Ctrl-]', 'Ctrl-]'], ['za', 'folds'],
    [':changes', ':changes'], [':history', ':history']
  ]) {
    await cmd(page, `help ${topic}`);
    expect((await lines(page))[0]).toBe(`*${topic}*`);
    const firstLine = await page.evaluate(name => window.VIM_HELP_TOPICS[name][0], canonical);
    expect((await lines(page)).join('\n')).toContain(firstLine.trim());
  }
});
