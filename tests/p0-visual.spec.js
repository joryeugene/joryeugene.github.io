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

async function seed(page, text) {
  await cmd(page, 'enew');
  await press(page, 'i');
  await type(page, text);
  await press(page, 'Escape');
  await press(page, 'g');
  await press(page, 'g');
  await page.keyboard.press('0');
}

async function state(page) {
  return await page.evaluate(() => ({
    mode: document.querySelector('#vim-status-mode')?.textContent?.trim(),
    pos: document.querySelector('#vim-status-pos')?.textContent?.trim()
  }));
}

async function lines(page) {
  return await page.evaluate(() => {
    const el = document.querySelector('#vim-content');
    return el ? el.innerText.split('\n') : [];
  });
}

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
