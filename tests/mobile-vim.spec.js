import { test, expect } from '@playwright/test';
import { open, press, seed, lines, state } from './helpers.js';

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
    expect(await lines(page)).toEqual(['a']);

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

    const scrollTop = await page.locator('#vim-body').evaluate(body => {
      body.scrollTop = Math.min(40, body.scrollHeight - body.clientHeight);
      return body.scrollTop;
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
