// Shared Playwright helpers for the vim suite. Each spec imports from here
// rather than copy-pasting the same boilerplate; that way a change to
// keystroke timing or buffer-state reading touches one file instead of six.

export async function open(page, path = '/vim/') {
  await page.goto(path + '?v=' + Date.now());
  await page.waitForSelector('#vim-content');
  await page.waitForTimeout(80);
}

export async function press(page, key, wait = 10) {
  await page.keyboard.press(key);
  await page.waitForTimeout(wait);
}

export async function type(page, text) {
  for (const ch of text) {
    if (ch === ' ') await page.keyboard.press('Space');
    else if (ch === '\n') await page.keyboard.press('Enter');
    else await page.keyboard.press(ch);
    await page.waitForTimeout(5);
  }
}

export async function cmd(page, text) {
  await press(page, ':');
  await type(page, text);
  await press(page, 'Enter');
}

export async function seed(page, text) {
  await cmd(page, 'enew');
  await press(page, 'i');
  await type(page, text);
  await press(page, 'Escape');
  await press(page, 'g');
  await press(page, 'g');
  await page.keyboard.press('0');
}

export async function seedAt(page, text, col) {
  await seed(page, text);
  for (let i = 0; i < col; i++) await press(page, 'l');
}

export async function lines(page) {
  return await page.evaluate(() => {
    const el = document.querySelector('#vim-content');
    return el ? el.innerText.split('\n') : [];
  });
}

export async function state(page) {
  return await page.evaluate(() => ({
    mode: document.querySelector('#vim-status-mode')?.textContent?.trim(),
    pos:  document.querySelector('#vim-status-pos')?.textContent?.trim(),
    file: document.querySelector('#vim-status-file')?.textContent?.trim()
  }));
}
