import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines, state } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('line text objects compose with operators and Visual mode', async ({ page }) => {
  await open(page);
  await seed(page, '  launch claim: moon-grade metrics  \nArchive');

  await keys(page, ['c', 'i', 'l']);
  expect((await state(page)).mode).toBe('--INSERT--');
  await type(page, 'launch claim: measured moth activity');
  await press(page, 'Escape');
  await press(page, '0');
  await keys(page, ['v', 'i', 'l', 'U']);

  expect(await lines(page)).toEqual([
    '  LAUNCH CLAIM: MEASURED MOTH ACTIVITY  ',
    'Archive'
  ]);

  await seed(page, 'Impact: 14 moths\nCause: desk lamp');
  await press(page, 'j');
  await keys(page, ['y', 'a', 'l']);
  await keys(page, ['G', 'p']);
  await keys(page, ['g', 'g', 'v', 'a', 'l', '>']);

  expect(await lines(page)).toEqual([
    '  Impact: 14 moths',
    '  Cause: desk lamp',
    '  Impact: 14 moths',
    '  Cause: desk lamp'
  ]);
});
