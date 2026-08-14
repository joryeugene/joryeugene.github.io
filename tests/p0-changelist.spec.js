import { test, expect } from '@playwright/test';
import { open, press, type, seed, state, lines } from './helpers.js';

test.describe('P0 changelist and automatic marks', () => {
  test('g; and g, traverse changed positions without recording ordinary motion', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');

    await press(page, 'i');
    await type(page, 'X');
    await press(page, 'Escape');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, '!');
    await press(page, 'Escape');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');
    expect((await state(page)).pos).toBe('1,1');

    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('3,6');
    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'g');
    await press(page, ',');
    expect((await state(page)).pos).toBe('3,6');
    await press(page, '2');
    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('3,5');
  });

  test('g, stays put before changelist traversal begins', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, '!');
    await press(page, 'Escape');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');

    await press(page, 'g');
    await press(page, ',');
    expect((await state(page)).pos).toBe('1,1');
  });

  test('save-as keeps the changelist attached to the renamed document', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, '!');
    await press(page, 'Escape');
    await press(page, ':');
    await type(page, 'w renamed.txt');
    await press(page, 'Enter');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');

    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('2,4');
  });

  test('saved changes follow line insertions without moving the new change anchor', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, '!');
    await press(page, 'Escape');

    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');
    await press(page, 'O');
    await type(page, 'new');
    await press(page, 'Escape');
    await press(page, 'G');
    await press(page, '0');

    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('1,3');
    await press(page, 'g');
    await press(page, ';');
    expect((await state(page)).pos).toBe('4,6');
  });

  test('backtick-dot jumps to the exact latest change', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, '!');
    await press(page, 'Escape');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');

    await press(page, '`');
    await press(page, '.');
    expect((await state(page)).pos).toBe('2,4');
  });

  test('backtick-caret returns to the end of the last insert', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await press(page, 'G');
    await press(page, 'A');
    await type(page, 'abc');
    await press(page, 'Escape');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '0');

    await press(page, '`');
    await press(page, '^');
    expect((await state(page)).pos).toBe('2,6');
  });

  test('bracket marks bound the last operated or yanked text', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha beta');
    await press(page, 'y');
    await press(page, 'i');
    await press(page, 'w');
    await press(page, '$');

    await press(page, '`');
    await press(page, '[');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, '`');
    await press(page, ']');
    expect((await state(page)).pos).toBe('1,5');
  });

  test('automatic marks follow line insertions above their text', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');
    await press(page, 'y');
    await press(page, 'i');
    await press(page, 'w');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'O');
    await type(page, 'new');
    await press(page, 'Escape');

    await press(page, '`');
    await press(page, '[');
    expect((await state(page)).pos).toBe('4,1');
  });

  test('angle marks bound the previous Visual selection', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha beta');
    await press(page, 'v');
    await press(page, 'e');
    await press(page, 'Escape');
    await press(page, '$');

    await press(page, '`');
    await press(page, '<');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, '`');
    await press(page, '>');
    expect((await state(page)).pos).toBe('1,5');
  });

  test('Visual delete keeps angle marks on the original selection', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha beta');
    await press(page, 'v');
    await press(page, 'e');
    await press(page, 'd');

    await press(page, '`');
    await press(page, '<');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, '`');
    await press(page, '>');
    expect((await state(page)).pos).toBe('1,5');
  });

  test('Visual colon preserves its range for the first ranged command', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha\nalpha\nalpha');
    await press(page, 'V');
    await press(page, 'j');
    await press(page, ':');
    await type(page, 's/alpha/X/');
    await press(page, 'Enter');

    expect(await lines(page)).toEqual(['X', 'X', 'alpha']);
  });

  test('block insert keeps angle marks on the original rectangle', async ({ page }) => {
    await open(page);
    await seed(page, 'abcd\nefgh');
    await press(page, 'Control+v');
    await press(page, 'j');
    await press(page, 'l');
    await press(page, 'I');
    await type(page, 'X');
    await press(page, 'Escape');

    await press(page, '`');
    await press(page, '<');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, '`');
    await press(page, '>');
    expect((await state(page)).pos).toBe('2,2');
  });

  test('undo restores a mark inside deleted lines to its exact row', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour');
    await press(page, 'j');
    await press(page, 'm');
    await press(page, 'a');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '3');
    await press(page, 'd');
    await press(page, 'd');
    await press(page, 'u');

    await press(page, '`');
    await press(page, 'a');
    expect((await state(page)).pos).toBe('2,1');
  });

  test('gv restores the Visual range for the current document only', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha beta\nsecond');
    await press(page, 'v');
    await press(page, 'e');
    await press(page, 'Escape');

    await press(page, ':');
    await type(page, 'enew');
    await press(page, 'Enter');
    await press(page, 'i');
    await type(page, 'one\ntwo');
    await press(page, 'Escape');
    await press(page, 'V');
    await press(page, 'Escape');

    await press(page, 'Control+o');
    await press(page, 'g');
    await press(page, 'v');
    await press(page, 'd');
    expect(await lines(page)).toEqual([' beta', 'second']);
  });
});
