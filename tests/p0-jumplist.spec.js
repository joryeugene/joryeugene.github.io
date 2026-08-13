import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

test.describe('P0 jumplist', () => {
  test('search, Ctrl-O, Ctrl-I, and Tab traverse significant jumps', async ({ page }) => {
    await open(page);
    await seed(page, 'start\nmiddle target\nend target');

    await press(page, '/');
    await type(page, 'target');
    await press(page, 'Enter');
    expect((await state(page)).pos).toBe('2,8');

    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'Control+i');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+o');
    await press(page, 'Tab');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+i');
    await expect(page.locator('#vim-cmdline')).toContainText('E663: At end of jumplist');
  });

  test('ordinary motions do not enter the jumplist', async ({ page }) => {
    await open(page);
    await seed(page, 'one two\nthree four\nfive six\nseven eight');
    await cmd(page, 'clearjumps');
    await press(page, '2'); await press(page, 'j');
    await press(page, 'k'); await press(page, 'l'); await press(page, 'h');
    await press(page, 'w'); await press(page, 'b');
    const before = (await state(page)).pos;
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe(before);
    await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
  });

  test('counts traverse jumps and do not leak', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, '3'); await press(page, 'G');

    await press(page, '2'); await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('5,1');
    await press(page, '2'); await press(page, 'Control+i');
    expect((await state(page)).pos).toBe('3,1');
    await press(page, '2'); await press(page, 'j');
    expect((await state(page)).pos).toBe('5,1');
  });

  test('a new jump after Ctrl-O preserves newer entries', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, 'Control+o');
    await press(page, '3'); await press(page, 'G');
    await press(page, '2'); await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
  });

  test('Ctrl-O and Ctrl-I restore edited browser documents', async ({ page }) => {
    await open(page);
    await seed(page, 'beta one\nbeta two');
    await cmd(page, 'w beta');

    await cmd(page, 'enew');
    await press(page, 'i'); await type(page, 'alpha one\nalpha two'); await press(page, 'Escape');
    await cmd(page, 'w alpha');
    await press(page, 'G');
    await press(page, 'A'); await type(page, ' unsaved'); await press(page, 'Escape');

    await cmd(page, 'e beta');

    await press(page, 'Control+o');
    expect((await state(page)).file).toContain('alpha');
    expect(await lines(page)).toEqual(['alpha one', 'alpha two unsaved']);
    expect((await state(page)).pos).toBe('2,17');

    await press(page, 'Control+i');
    expect((await state(page)).file).toContain('beta');
    expect(await lines(page)).toEqual(['beta one', 'beta two']);
  });

  test(':jumps displays entries and :clearjumps resets traversal', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');
    await cmd(page, 'jumps');
    await expect(page.locator('#vim-content')).toContainText('jump line  col file');
    await expect(page.locator('#vim-content')).toContainText('untitled.txt');
    await press(page, 'u');
    await cmd(page, 'clearjumps');
    const before = (await state(page)).pos;
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe(before);
    await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
  });
});
