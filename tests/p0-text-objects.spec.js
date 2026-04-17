import { test, expect } from '@playwright/test';
import { open, press, seedAt, lines } from './helpers.js';

test.describe('P0.1 bracket and quote text objects', () => {
  test('ci( removes inside parentheses', async ({ page }) => {
    await open(page);
    await seedAt(page, 'foo(bar)baz', 5); // cursor inside 'bar'
    await press(page, 'c');
    await press(page, 'i');
    await press(page, '(');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('foo()baz');
  });

  test('da" removes the quoted string including quotes', async ({ page }) => {
    await open(page);
    await seedAt(page, 'foo "bar" baz', 6); // cursor inside 'bar'
    await press(page, 'd');
    await press(page, 'a');
    await press(page, '"');
    const ls = await lines(page);
    expect(ls[0]).toBe('foo  baz');
  });

  test("ci' clears inside single quotes", async ({ page }) => {
    await open(page);
    await seedAt(page, "a 'b' c", 3); // cursor inside 'b'
    await press(page, 'c');
    await press(page, 'i');
    await press(page, "'");
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe("a '' c");
  });

  test('di{ empties the block contents', async ({ page }) => {
    await open(page);
    await seedAt(page, '{abc}', 2); // cursor inside 'abc'
    await press(page, 'd');
    await press(page, 'i');
    await press(page, '{');
    const ls = await lines(page);
    expect(ls[0]).toBe('{}');
  });

  test('ib alias works like i(', async ({ page }) => {
    await open(page);
    await seedAt(page, '(xyz)', 2);
    await press(page, 'c');
    await press(page, 'i');
    await press(page, 'b');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('()');
  });
});
