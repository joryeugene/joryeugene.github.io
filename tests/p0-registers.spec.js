import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines } from './helpers.js';

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
