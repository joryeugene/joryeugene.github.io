import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines } from './helpers.js';

async function search(page, text) {
  await press(page, '/');
  await type(page, text);
  await press(page, 'Enter');
}

async function selectRegister(page, name) {
  await press(page, '"');
  await press(page, name);
}

test('registers preserve and assemble incident evidence', async ({ page }) => {
  await open(page);
  await seed(page, [
    'KEEP',
    'DELETE ONE',
    'DELETE TWO',
    'SMALL',
    'EVIDENCE A',
    'EVIDENCE B',
    'xy--',
    'zw--',
    '....',
    '....'
  ].join('\n'));

  await press(page, 'y'); await press(page, 'y');
  await press(page, 'j');
  await press(page, 'd'); await press(page, 'd');
  await press(page, 'd'); await press(page, 'd');
  await selectRegister(page, '0'); await press(page, 'P');
  await selectRegister(page, '2'); await press(page, 'P');

  await selectRegister(page, '_');
  await press(page, 'd'); await press(page, 'd');
  await press(page, 'p');

  await search(page, 'SMALL');
  await press(page, 'x');
  await selectRegister(page, '-'); await press(page, 'P');

  await search(page, 'EVIDENCE A');
  await selectRegister(page, 'a');
  await press(page, 'y'); await press(page, 'y');
  await search(page, 'EVIDENCE B');
  await selectRegister(page, 'A');
  await press(page, 'y'); await press(page, 'y');
  await press(page, 'G');
  await selectRegister(page, 'a'); await press(page, 'p');

  await search(page, 'xy--');
  await press(page, 'Control+v');
  await press(page, 'j'); await press(page, 'l');
  await selectRegister(page, 'b'); await press(page, 'y');
  await search(page, '\\.\\.\\.\\.');
  await selectRegister(page, 'b'); await press(page, 'P');

  const assembled = [
    'KEEP',
    'KEEP',
    'DELETE TWO',
    'SMALL',
    'EVIDENCE A',
    'EVIDENCE B',
    'xy--',
    'zw--',
    'xy....',
    'zw....',
    'EVIDENCE A',
    'EVIDENCE B'
  ];
  expect(await lines(page)).toEqual(assembled);

  await search(page, 'DENCE A');
  await press(page, 'v'); await press(page, 'j');
  await selectRegister(page, 'c'); await press(page, 'y');
  await search(page, 'DELETE TWO');
  await selectRegister(page, 'c'); await press(page, 'P');

  expect(await lines(page)).toEqual([
    'KEEP',
    'KEEP',
    'DENCE A',
    'EVIDDELETE TWO',
    'SMALL',
    'EVIDENCE A',
    'EVIDENCE B',
    'xy--',
    'zw--',
    'xy....',
    'zw....',
    'EVIDENCE A',
    'EVIDENCE B'
  ]);
  await expect(page.locator('#vim-status-pos')).toHaveText('4,4');

  await press(page, 'u');
  expect(await lines(page)).toEqual(assembled);
});

test('command and search prompts accept registers and clipboard text', async ({ page }) => {
  await open(page);
  await seed(page, 'friction-economy\nneedle');

  await press(page, 'y'); await press(page, 'y');
  await press(page, ':');
  await type(page, 'e ');
  await press(page, 'Control+r');
  await press(page, '0');
  await expect(page.locator('#vim-cmdline')).toHaveText(':e friction-economy');
  await press(page, 'Escape');

  await press(page, '/');
  await press(page, 'Control+r');
  await press(page, '0');
  await expect(page.locator('#vim-cmdline')).toHaveText('/friction-economy');
  await press(page, 'Escape');

  await press(page, ':');
  await type(page, 'e ');
  await page.evaluate(() => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', 'portable-agent-factory');
    document.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData
    }));
  });
  await expect(page.locator('#vim-cmdline')).toHaveText(':e portable-agent-factory');
  await press(page, 'Escape');

  await press(page, '/');
  await page.evaluate(() => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', 'needle');
    document.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData
    }));
  });
  await expect(page.locator('#vim-cmdline')).toHaveText('/needle');

  await press(page, 'Escape');
  await cmd(page, 'teacher map');
  await press(page, ':');
  await type(page, 'e ');
  await press(page, 'Control+r');
  await press(page, '0');
  await expect(page.locator('#vim-cmdline')).toHaveText(':e friction-economy');

  await press(page, 'Escape');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => navigator.clipboard.writeText('friction-economy'));
  await press(page, ':');
  await type(page, 'e ');
  await press(page, 'Control+v');
  await expect(page.locator('#vim-cmdline')).toHaveText(':e friction-economy');
});
