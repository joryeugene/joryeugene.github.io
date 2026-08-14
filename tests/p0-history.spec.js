import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, state } from './helpers.js';

test.describe('P0 command and search history', () => {
  test('command Up and Down recall matching history and restore typed text', async ({ page }) => {
    await open(page);
    await cmd(page, 'set number');
    await cmd(page, 'colorscheme default');

    await press(page, ':');
    await type(page, 'set');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set number');
    await press(page, 'ArrowDown');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set');
  });

  test('re-entering a command moves one exact copy to the newest position', async ({ page }) => {
    await open(page);
    await cmd(page, 'set number');
    await cmd(page, 'set nonumber');
    await cmd(page, 'set number');

    await press(page, ':');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set number');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set nonumber');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set nonumber');
  });

  test('editing a recalled command continues through older matching history', async ({ page }) => {
    await open(page);
    await cmd(page, 'set number');
    await cmd(page, 'set nonumber');

    await press(page, ':');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set nonumber');
    for (let i = 0; i < 7; i++) await press(page, 'Backspace');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set n');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText(':set number');
  });

  test('search history is separate, prefix-aware, and shared by slash and question mark', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha\nalpine\nbeta');

    for (const pattern of ['alpha', 'alpine', 'beta', 'alpha']) {
      await press(page, '/');
      await type(page, pattern);
      await press(page, 'Enter');
    }

    await press(page, '/');
    await type(page, 'a');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpha');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpine');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpine');
    await press(page, 'ArrowDown');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpha');
    await press(page, 'ArrowDown');
    await expect(page.locator('#vim-cmdline')).toHaveText('/a');

    await press(page, 'Escape');
    await press(page, '?');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('?alpha');
  });

  test('recalled search previews incrementally and Escape restores the cursor', async ({ page }) => {
    await open(page);
    await seed(page, 'start\nneedle\nend');
    await press(page, '/');
    await type(page, 'needle');
    await press(page, 'Enter');
    await press(page, 'g');
    await press(page, 'g');

    await press(page, '/');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/needle');
    expect((await state(page)).pos).toBe('2,1');
    await press(page, 'Escape');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'n');
    expect((await state(page)).pos).toBe('2,1');
  });

  test('editing a recalled search continues through older matching history', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha\nalpine');
    for (const pattern of ['alpha', 'alpine']) {
      await press(page, '/');
      await type(page, pattern);
      await press(page, 'Enter');
    }

    await press(page, '/');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpine');
    for (let i = 0; i < 4; i++) await press(page, 'Backspace');
    await expect(page.locator('#vim-cmdline')).toHaveText('/al');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/alpha');
  });

  test('star search enters the shared search history', async ({ page }) => {
    await open(page);
    await seed(page, 'alpha\nalpha');
    await press(page, '*');

    await press(page, '/');
    await press(page, 'ArrowUp');
    await expect(page.locator('#vim-cmdline')).toHaveText('/\\balpha\\b');
  });
});
