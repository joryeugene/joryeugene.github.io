import { test, expect } from '@playwright/test';
import { open, press, seed, lines, state } from './helpers.js';

test.describe('P0.3 gv reselect last visual range', () => {
  test('after v2l Esc, gv restores the visual selection', async ({ page }) => {
    await open(page);
    await seed(page, 'hello world');
    await press(page, 'v');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'Escape');
    // Cursor is now in normal mode, selection stored.
    await press(page, 'g');
    await press(page, 'v');
    const s = await state(page);
    expect(s.mode).toBe('--VISUAL--');
  });

  test('gv then d deletes the previously selected range', async ({ page }) => {
    await open(page);
    await seed(page, 'abcdef');
    await press(page, 'v');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'Escape');
    await press(page, 'g');
    await press(page, 'v');
    await press(page, 'd');
    const ls = await lines(page);
    expect(ls[0]).toBe('def');
  });
});

test.describe('P0.4 o in visual swaps cursor and anchor', () => {
  test('v then l then o moves cursor to the other end', async ({ page }) => {
    await open(page);
    await seed(page, 'abcde');
    await press(page, 'v');
    await press(page, 'l');
    await press(page, 'l');
    // cursor at col 2 (0-indexed) after 2x l. anchor at col 0.
    const before = await state(page);
    expect(before.pos).toBe('1,3');
    await press(page, 'o');
    const after = await state(page);
    expect(after.pos).toBe('1,1');
  });

  test('o does not change the underlying selection', async ({ page }) => {
    await open(page);
    await seed(page, 'abcde');
    await press(page, 'v');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'o');
    await press(page, 'd');
    const ls = await lines(page);
    expect(ls[0]).toBe('de');
  });
});
