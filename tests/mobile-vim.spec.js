import { test, expect } from '@playwright/test';
import { open, press, cmd, seed, lines, state } from './helpers.js';

async function mobileText(page, text) {
  await page.locator('#vim-mobile-input').evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: value,
      inputType: 'insertText'
    }));
  }, text);
}

async function mobileBeforeInput(page, inputType) {
  await page.locator('#vim-mobile-input').evaluate((input, type) => {
    input.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: null,
      inputType: type
    }));
  }, inputType);
}

async function tapKey(page, key) {
  await page.locator(`#vim-mobile-keys [data-vim-key="${key}"]`).tap();
}

async function mobileComposition(page, text) {
  await page.locator('#vim-mobile-input').evaluate((input, value) => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = value;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: value,
      inputType: 'insertCompositionText',
      isComposing: true
    }));
    input.dispatchEvent(new CompositionEvent('compositionend', {
      bubbles: true,
      data: value
    }));
  }, text);
}

test.describe('mobile Vim input', () => {
  test.use({ hasTouch: true });

  test('tap focuses the native input bridge and routes text into Vim', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);

    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });

    await expect(page.locator('#vim-mobile-input')).toBeFocused();
    await mobileText(page, 'i');
    expect((await state(page)).mode).toBe('--INSERT--');
    await mobileText(page, 'hello');
    expect((await lines(page)).some(line => line.includes('hello'))).toBe(true);
  });

  test('mobile key strip runs a command and returns to normal mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });

    await expect(page.locator('#vim-mobile-keys')).toBeVisible();
    await tapKey(page, ':');
    await mobileText(page, 'tutor');
    await mobileBeforeInput(page, 'insertLineBreak');
    await expect(page.locator('#vim-content')).toContainText('Lesson 1.1:  MOVING THE CURSOR');

    await mobileText(page, 'i');
    expect((await state(page)).mode).toBe('--INSERT--');
    await tapKey(page, 'Escape');
    expect((await state(page)).mode).toBe('--NORMAL--');
  });

  test('mobile learner follows the visible first action into the work file', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });

    await tapKey(page, ':');
    await mobileText(page, 'teacher');
    await mobileBeforeInput(page, 'insertLineBreak');
    await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
    await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
    const panelOverflow = await page.locator('#vim-teacher-next').evaluate(panel =>
      panel.scrollWidth - panel.clientWidth);
    expect(panelOverflow).toBeLessThanOrEqual(0);
    const mobileLayout = await page.evaluate(() => {
      const panel = document.querySelector('#vim-teacher-next').getBoundingClientRect();
      const body = document.querySelector('#vim-body').getBoundingClientRect();
      return { panelBottom: panel.bottom, bodyTop: body.top };
    });
    expect(mobileLayout.panelBottom).toBeLessThanOrEqual(mobileLayout.bodyTop);

    await tapKey(page, ':');
    await mobileText(page, 'e 01-handoff.txt');
    await mobileBeforeInput(page, 'insertLineBreak');
    expect((await state(page)).file).toBe('01-handoff.txt');
    await expect(page.locator('#vim-teacher-next')).toContainText('press j');

    await mobileText(page, 'jA');
    await mobileText(page, 't');
    await tapKey(page, 'Escape');
    expect(await lines(page)).toContain('status: draft');
    await expect(page.locator('#vim-teacher-next')).toContainText(':w');

    await tapKey(page, ':');
    await mobileText(page, 'w');
    await mobileBeforeInput(page, 'insertLineBreak');
    await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 COMPLETE');
  });

  test('mobile deletion and composed text are committed exactly once', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'iab');

    await mobileBeforeInput(page, 'deleteContentBackward');
    await mobileComposition(page, '蝶');

    expect(await lines(page)).toEqual(['a蝶']);
  });

  test('mobile deletion removes a complete Unicode grapheme', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'i');
    await mobileText(page, '👨‍👩‍👧‍👦');

    expect(await lines(page)).toEqual(['👨‍👩‍👧‍👦']);
    await mobileBeforeInput(page, 'deleteContentBackward');

    expect((await lines(page))[0].trim()).toBe('');
  });

  test('Safari composition keydown does not add a newline after IME commit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'i');
    await mobileComposition(page, '蝶');

    await page.locator('#vim-mobile-input').evaluate(input => {
      input.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        keyCode: 229,
        which: 229
      }));
    });

    expect(await lines(page)).toEqual(['蝶']);
  });

  test('normal-mode movement and x stay on Unicode grapheme boundaries', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'ia😀b');
    await tapKey(page, 'Escape');
    await mobileText(page, '0');
    await tapKey(page, 'l');
    await mobileText(page, 'x');

    expect(await lines(page)).toEqual(['ab']);
  });

  test('replace mode swaps one Unicode grapheme without corrupting neighbors', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'ia😀b');
    await tapKey(page, 'Escape');
    await mobileText(page, '0');
    await tapKey(page, 'l');
    await mobileText(page, 'R');
    await mobileText(page, '🦋');
    await tapKey(page, 'Escape');

    expect(await lines(page)).toEqual(['a🦋b']);
  });

  test('hardware special keys still reach Vim while the mobile bridge is focused', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await mobileText(page, 'i');
    expect((await state(page)).mode).toBe('--INSERT--');

    await page.locator('#vim-mobile-input').press('Escape');

    expect((await state(page)).mode).toBe('--NORMAL--');
  });

  test('Ctrl is a visible one-shot modifier for the next mobile key', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator('#vim-body').tap({ position: { x: 20, y: 20 } });
    await tapKey(page, ':');
    await mobileText(page, 'enew');
    await mobileBeforeInput(page, 'insertLineBreak');
    await mobileText(page, 'iab');
    await tapKey(page, 'Escape');
    await mobileText(page, 'u');
    expect(await lines(page)).toEqual([' ']);

    const ctrl = page.locator('#vim-mobile-keys [data-vim-modifier="Control"]');
    await ctrl.tap();
    await expect(ctrl).toHaveAttribute('aria-pressed', 'true');
    await mobileText(page, 'r');

    expect(await lines(page)).toEqual(['ab']);
    await expect(ctrl).toHaveAttribute('aria-pressed', 'false');
  });

  test('mobile one-shot Ctrl traverses the jumplist', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');

    const ctrl = page.locator('#vim-mobile-keys [data-vim-modifier="Control"]');
    await ctrl.tap(); await mobileText(page, 'o');
    expect((await state(page)).pos).toBe('1,1');
    await ctrl.tap(); await mobileText(page, 'i');
    expect((await state(page)).pos).toBe('3,1');
  });

  test('mobile one-shot Ctrl opens filenames in splits and tab pages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
    await open(page);
    await cmd(page, 'teacher');
    await seed(page, '07-api.js');

    const ctrl = page.locator('#vim-mobile-keys [data-vim-modifier="Control"]');
    await ctrl.tap(); await mobileText(page, 'w');
    await mobileText(page, 'f');
    expect((await state(page)).file).toBe('07-api.js');
    await expect(page.locator('#vim-split-peer')).toBeVisible();

    await ctrl.tap(); await mobileText(page, 'w');
    await mobileText(page, 'w');
    expect((await state(page)).file).toBe('untitled.txt');
    await cmd(page, 'only');
    await seed(page, '07-project.md');

    await ctrl.tap(); await mobileText(page, 'w');
    await mobileText(page, 'g');
    await mobileText(page, 'f');
    expect((await state(page)).file).toBe('07-project.md');
    await expect(page.locator('#vim-tabbar [aria-selected="true"]')).toContainText('07-project.md');
  });

  test('mobile dashboard advertises the tap-anywhere interaction', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);

    await expect(page.locator('#vim-content')).toContainText('tap anywhere to type');
  });

  test('keeps the dashboard mascot clear of text while the mobile buffer scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 655 });
    await open(page);

    const readGap = () => page.evaluate(() => {
      const pet = document.querySelector('#vim-dashboard-pet').getBoundingClientRect();
      const title = document.querySelector('.vim-dashboard-title').getBoundingClientRect();
      return title.top - pet.bottom;
    });

    await expect(page.locator('#vim-dashboard-pet')).toBeVisible();
    expect(await readGap()).toBeGreaterThanOrEqual(18);

    const scrollTop = await page.locator('#vim-active-window').evaluate(viewport => {
      viewport.scrollTop = Math.min(40, viewport.scrollHeight - viewport.clientHeight);
      return viewport.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(0);
    expect(await readGap()).toBeGreaterThanOrEqual(18);
  });

  test('Vim Georgie responds with a second pose and settles after a tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const pet = page.locator('#vim-dashboard-pet');
    const sprite = pet.locator('.vim-dashboard-pet__sprite');

    await expect(pet).toBeVisible();
    await expect(sprite).toHaveCSS('background-image', /georgie-vim-pair\.webp/);
    await expect(sprite).toHaveCSS('background-position-x', /^0(?:px|%)$/);
    await pet.tap();
    await expect(pet).toHaveClass(/is-georgie-active/);
    await expect(sprite).toHaveCSS('background-position-x', '100%');
    await expect(pet).not.toHaveClass(/is-georgie-active/, { timeout: 1600 });
  });

  test('all mobile Vim keys fit without horizontal scrolling at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);

    const fit = await page.locator('#vim-mobile-keys').evaluate(keys => {
      const last = keys.querySelector('[data-vim-key="l"]').getBoundingClientRect();
      const bounds = keys.getBoundingClientRect();
      return {
        scrollOverflow: keys.scrollWidth - keys.clientWidth,
        lastRight: last.right,
        boundsRight: bounds.right
      };
    });

    expect(fit.scrollOverflow).toBeLessThanOrEqual(0);
    expect(fit.lastRight).toBeLessThanOrEqual(fit.boundsRight);
  });

  test('teacher tab pages stay inside the mobile editor', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
    await open(page);
    await cmd(page, 'teacher lesson 9');
    await cmd(page, 'e 09-review.md');
    await cmd(page, 'vsplit 09-change.diff');
    await cmd(page, 'tabedit 09-tests.log');

    const fit = await page.evaluate(() => {
      const tabBar = document.querySelector('#vim-tabbar');
      const selected = tabBar.querySelector('[aria-selected="true"]');
      const bounds = tabBar.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      return {
        documentX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tabCount: tabBar.children.length,
        barLeft: bounds.left,
        barRight: bounds.right,
        selectedLeft: selectedBounds.left,
        selectedRight: selectedBounds.right
      };
    });

    expect(fit.documentX).toBeLessThanOrEqual(0);
    expect(fit.tabCount).toBe(2);
    expect(fit.barLeft).toBeGreaterThanOrEqual(0);
    expect(fit.barRight).toBeLessThanOrEqual(320);
    expect(fit.selectedLeft).toBeGreaterThanOrEqual(fit.barLeft);
    expect(fit.selectedRight).toBeLessThanOrEqual(fit.barRight + 0.5);
    await expect(page.locator('#vim-tabbar [aria-selected="true"]')).toContainText('09-tests.log');
  });

  for (const viewport of [
    { width: 390, height: 480 },
    { width: 320, height: 568 }
  ]) {
    test(`dashboard fits ${viewport.width}x${viewport.height} without overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page);

      const metrics = await page.evaluate(() => {
        const body = document.querySelector('#vim-body');
        const content = document.querySelector('#vim-content').getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        return {
          documentX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          bodyX: body.scrollWidth - body.clientWidth,
          bodyY: body.scrollHeight - body.clientHeight,
          contentTop: content.top,
          contentBottom: content.bottom,
          bodyTop: bodyRect.top,
          bodyBottom: bodyRect.bottom
        };
      });

      expect(metrics.documentX).toBeLessThanOrEqual(0);
      expect(metrics.bodyX).toBeLessThanOrEqual(0);
      expect(metrics.bodyY).toBeLessThanOrEqual(0);
      expect(metrics.contentTop).toBeGreaterThanOrEqual(metrics.bodyTop);
      expect(metrics.contentBottom).toBeLessThanOrEqual(metrics.bodyBottom);
      await expect(page.locator('#vim-dashboard-pet')).toBeHidden();
    });
  }
});
