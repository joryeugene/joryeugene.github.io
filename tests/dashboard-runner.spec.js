import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

test.describe('dashboard and runner experience', () => {
  test('dashboard renders its visual identity and launcher hint', async ({ page }) => {
    await open(page);
    await expect(page.locator('#vim-editor')).toHaveClass(/dashboard/);
    await expect(page.locator('#vim-content')).toContainText('PHALENE-VIM v1.1');
    await expect(page.locator('#vim-content')).not.toContainText('JORYVIM');
    await expect(page.locator('#vim-content')).not.toContainText('GEORGIE // PHALENE');
    await expect(page.locator('#vim-content')).not.toContainText('browser-native modal lab');
    await expect(page.locator('#vim-content')).toContainText('Ctrl-P');
    await expect(page.locator('#vim-dashboard-pet')).toBeVisible();

    const before = await page.locator('#vim-body').evaluate(el => getComputedStyle(el, '::after').backgroundPosition);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);
    const after = await page.locator('#vim-body').evaluate(el => getComputedStyle(el, '::after').backgroundPosition);
    expect(after).not.toBe(before);
  });

  test('dashboard remains centered across viewport changes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const narrowPet = await page.locator('#vim-dashboard-pet').boundingBox();
    const narrowTitle = await page.locator('.vim-dashboard-title').boundingBox();
    const narrowTitleCenter = await page.locator('.vim-dashboard-title').evaluate(span => {
      const text = 'PHALENE-VIM v1.1';
      const start = span.firstChild.textContent.indexOf(text);
      const range = document.createRange();
      range.setStart(span.firstChild, start);
      range.setEnd(span.firstChild, start + text.length);
      const rect = range.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    expect(Math.abs(narrowPet.x + narrowPet.width / 2 - 195)).toBeLessThan(3);
    expect(Math.abs(narrowPet.x + narrowPet.width / 2 - narrowTitleCenter)).toBeLessThan(6);
    expect(narrowTitle.y - (narrowPet.y + narrowPet.height)).toBeGreaterThanOrEqual(20);
    expect(narrowTitle.y - (narrowPet.y + narrowPet.height)).toBeLessThanOrEqual(45);
    await expect(page.locator('#vim-content')).toContainText(':tutor guided lesson');
    await expect(page.locator('#vim-content')).toContainText(':moth kinetic field');
    await expect(page.locator('#vim-content')).toContainText('h (left) < + > l (right)');
    await expect(page.locator('#vim-content')).toContainText('/aquarium Enter');
    await expect(page.locator('#vim-content')).not.toContainText('/GEORGIE Enter');
    await expect(page.locator('#vim-content')).toContainText('type :tutor then press Enter');
    await expect(page.locator('#vim-content')).toContainText(':e friction-economy then press Enter');
    await expect(page.locator('#vim-content')).not.toContainText('[[ ]]');
    const narrowRows = (await page.locator('#vim-content').innerText()).split('\n');
    const narrowCommands = ['Ctrl-P', ':tutor', ':Ex'].map(text => narrowRows.find(row => row.includes(text)));
    expect(new Set(narrowCommands.map(row => row.search(/\S/))).size).toBe(1);
    expect(narrowCommands.map(row => row.indexOf(row.trim().split(/\s{2,}/)[1]))).toEqual([16, 16, 16].map(col => col + narrowCommands[0].search(/\S/)));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(150);
    const widePet = await page.locator('#vim-dashboard-pet').boundingBox();
    const wideTitle = await page.locator('.vim-dashboard-title').boundingBox();
    const wideTitleCenter = await page.locator('.vim-dashboard-title').evaluate(span => {
      const text = 'PHALENE-VIM v1.1';
      const start = span.firstChild.textContent.indexOf(text);
      const range = document.createRange();
      range.setStart(span.firstChild, start);
      range.setEnd(span.firstChild, start + text.length);
      const rect = range.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    expect(Math.abs(widePet.x + widePet.width / 2 - 640)).toBeLessThan(3);
    expect(Math.abs(widePet.x + widePet.width / 2 - wideTitleCenter)).toBeLessThan(6);
    expect(wideTitle.y - (widePet.y + widePet.height)).toBeGreaterThanOrEqual(20);
    expect(wideTitle.y - (widePet.y + widePet.height)).toBeLessThanOrEqual(45);
    await expect(page.locator('#vim-content')).toContainText(':tutor       guided lesson');
    await expect(page.locator('#vim-content')).not.toContainText('[[ ]]');
    const wideRows = (await page.locator('#vim-content').innerText()).split('\n');
    const wideCommands = ['Ctrl-P', ':Ex', ':help'].map(text => wideRows.find(row => row.includes(text)));
    expect(new Set(wideCommands.map(row => row.search(/\S/))).size).toBe(1);
    expect(wideCommands.map(row => row.indexOf(row.trim().split(/\s{2,}/)[1]))).toEqual([16, 16, 16].map(col => col + wideCommands[0].search(/\S/)));
    const pairGaps = wideCommands.map(row => {
      const trimmed = row.trimStart();
      const cells = trimmed.split(/\s{2,}/);
      return trimmed.indexOf(cells[2]) - (trimmed.indexOf(cells[1]) + cells[1].length);
    });
    expect(Math.min(...pairGaps)).toBeGreaterThanOrEqual(8);
  });

  test('Ctrl-P filters and runs commands', async ({ page }) => {
    await open(page);
    await press(page, 'Control+p');
    await expect(page.locator('#vim-palette')).toBeVisible();
    await page.locator('#vim-palette-input').fill('tutor');
    await expect(page.locator('.vim-palette-item')).toHaveCount(1);
    await press(page, 'Enter');
    await expect(page.locator('#vim-content')).toContainText('Lesson 1.1:  MOVING THE CURSOR');
    await expect(page.locator('#vim-palette')).toBeHidden();
  });

  test('dashboard blog example opens the recommended post', async ({ page }) => {
    await open(page);
    await cmd(page, 'e friction-economy');
    await expect(page.locator('#vim-content')).toContainText('Friction Economy: Unconscious Productivity Drains');
  });

  test('Snake starts and returns to the untouched buffer', async ({ page }) => {
    await open(page);
    const before = await lines(page);
    await cmd(page, 'snake');
    await expect(page.locator('#vim-status-mode')).toHaveText('--SNAKE--');
    await press(page, 'j');
    await press(page, 'Escape');
    expect(await lines(page)).toEqual(before);
  });

  test('kinetic moth rotates, flaps, and returns to the untouched buffer', async ({ page }) => {
    await open(page);
    const before = await lines(page);
    await cmd(page, 'moth');
    await expect(page.locator('#vim-moth')).toBeVisible();
    await expect(page.locator('#vim-moth-title')).toHaveText('PHALENE // KINETIC FIELD');

    await page.keyboard.down('l');
    await page.keyboard.down('j');
    await page.keyboard.down('e');
    await expect.poll(() => page.locator('#vim-moth').evaluate(el => {
      const style = getComputedStyle(el);
      return Math.min(
        parseFloat(style.getPropertyValue('--moth-rx')),
        parseFloat(style.getPropertyValue('--moth-ry')),
        parseFloat(style.getPropertyValue('--moth-rz'))
      );
    })).toBeGreaterThan(4);
    await expect(page.locator('#vim-moth')).toHaveClass(/moving/);
    await page.keyboard.up('l');
    await page.keyboard.up('j');
    await page.keyboard.up('e');

    await page.keyboard.down('l');
    await expect.poll(() => page.locator('#vim-moth').evaluate(el =>
      parseFloat(getComputedStyle(el).getPropertyValue('--moth-ry'))
    )).toBeGreaterThan(24);
    await page.keyboard.up('l');

    await press(page, 'x');
    await expect(page.locator('#vim-moth')).toHaveClass(/ripple/);
    await expect(page.locator('.vim-moth-wire').first()).toHaveCSS('animation-name', 'moth-ripple');
    await press(page, 'Enter');
    await expect(page.locator('#vim-moth')).toHaveClass(/pulse/);
    await expect(page.locator('.vim-moth-flap-left')).toHaveCSS('animation-name', 'moth-flap-left');
    await page.waitForTimeout(180);
    await expect(page.locator('.vim-moth-flap-left')).toHaveCSS('transform', /matrix3d/);

    await press(page, 'Escape');
    await expect(page.locator('#vim-moth')).toBeHidden();
    expect(await lines(page)).toEqual(before);
  });

  test('commands produce global touch feedback', async ({ page }) => {
    await open(page);
    await press(page, 'Control+p');
    await expect(page.locator('#vim-editor')).toHaveClass(/vim-touch/);
  });
});

test.describe('missing Vim motions and settings', () => {
  test('[[ ]] [] ][ navigate section boundaries', async ({ page }) => {
    await open(page);
    await seed(page, 'top\n{\none\n}\nmid\n{\ntwo\n}\nend');

    await press(page, ']'); await press(page, ']');
    expect((await state(page)).pos).toBe('2,1');
    await press(page, ']'); await press(page, ']');
    expect((await state(page)).pos).toBe('6,1');
    await press(page, '['); await press(page, '[');
    expect((await state(page)).pos).toBe('2,1');
    await press(page, ']'); await press(page, '[');
    expect((await state(page)).pos).toBe('4,1');
    await press(page, ']'); await press(page, '[');
    expect((await state(page)).pos).toBe('8,1');
    await press(page, '['); await press(page, ']');
    expect((await state(page)).pos).toBe('4,1');
  });

  test('line motions preserve standard - _ | and g_ behavior', async ({ page }) => {
    await open(page);
    await seed(page, '  alpha\n    beta tail  \n  gamma');
    await press(page, 'j');
    await press(page, '-');
    expect((await state(page)).pos).toBe('1,3');
    await press(page, '2'); await press(page, '_');
    expect((await state(page)).pos).toBe('2,5');
    await press(page, '3'); await press(page, '|');
    expect((await state(page)).pos).toBe('2,3');
    await press(page, 'g'); await press(page, '_');
    expect((await state(page)).pos).toBe('2,13');
  });

  test('shiftwidth persists and controls indentation', async ({ page }) => {
    await open(page);
    await cmd(page, 'set shiftwidth=4');
    await page.reload();
    await page.waitForSelector('#vim-content');
    await seed(page, 'x');
    await press(page, '>'); await press(page, '>');
    expect((await lines(page))[0]).toBe('    x');
  });
});
