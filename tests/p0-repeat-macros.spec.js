import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('dot and macros normalize a malformed incident log', async ({ page }) => {
  await open(page);
  await seed(page, [
    'lamp-7 offline',
    'lamp-8 offline',
    'BAD moth count',
    'BAD lamp count',
    '!!!!!!keep',
    '??????keep',
    'MOTH|one|LOUD',
    'MOTH|two|LOUD',
    'MOTH|three|LOUD',
    'MOTH|four|LOUD'
  ].join('\n'));

  await press(page, 'i'); await type(page, '[ACK] '); await press(page, 'Escape');
  await keys(page, ['j', '0', '.']);

  await keys(page, ['j', '0', 'c', 'w']);
  await type(page, 'GOOD'); await press(page, 'Escape');
  await keys(page, ['j', '0', '.']);

  await keys(page, ['j', '0', '3', 'x']);
  await keys(page, ['j', '0', '2', '.']);

  await keys(page, ['j', '0', 'q', 'a', '0', 'f', '|', 'r', ':', ';', 'r', ':', 'j', 'q']);
  await keys(page, ['@', 'a', '@', '@', 'Q']);

  const normalized = [
    '[ACK] lamp-7 offline',
    '[ACK] lamp-8 offline',
    'GOOD moth count',
    'GOOD lamp count',
    '!!!keep',
    '????keep',
    'MOTH:one:LOUD',
    'MOTH:two:LOUD',
    'MOTH:three:LOUD',
    'MOTH:four:LOUD'
  ];
  expect(await lines(page)).toEqual(normalized);

  await keys(page, ['q', 'b', '@', 'b', 'q', '@', 'b']);
  await expect(page.locator('#vim-cmdline')).toContainText('recursion limit');
  expect(await lines(page)).toEqual(normalized);
});
