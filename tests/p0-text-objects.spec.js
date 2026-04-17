import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/vim/?v=' + Date.now());
  await page.waitForSelector('#vim-content');
  await page.waitForTimeout(80);
}

async function press(page, key) {
  await page.keyboard.press(key);
  await page.waitForTimeout(10);
}

async function type(page, text) {
  for (const ch of text) {
    if (ch === ' ') await page.keyboard.press('Space');
    else if (ch === '\n') await page.keyboard.press('Enter');
    else await page.keyboard.press(ch);
    await page.waitForTimeout(5);
  }
}

async function cmd(page, text) {
  await press(page, ':');
  await type(page, text);
  await press(page, 'Enter');
}

async function lines(page) {
  return await page.evaluate(() => {
    const el = document.querySelector('#vim-content');
    return el ? el.innerText.split('\n') : [];
  });
}

// Seed helper that moves the cursor to a specific column inside the line so
// text-object tests can start inside the target pair.
async function seedAt(page, text, col) {
  await cmd(page, 'enew');
  await press(page, 'i');
  await type(page, text);
  await press(page, 'Escape');
  await press(page, 'g');
  await press(page, 'g');
  await page.keyboard.press('0');
  for (let i = 0; i < col; i++) await press(page, 'l');
}

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
