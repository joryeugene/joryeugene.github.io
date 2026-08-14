import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines, cmd } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('insert completion cycles current-buffer identifiers within its latency budget', async ({ page }) => {
  await open(page);
  await seed(page, [
    'ULTRA_VIOLET_BEACON',
    'ULTRA_VIOLET_BEAM',
    'Report: '
  ].join('\n'));

  await keys(page, ['G', 'A']);
  await type(page, 'ULTRA_');
  await keys(page, ['Control+n', 'Control+n', 'Control+n', 'Control+p']);
  await type(page, ' confirmed');
  await press(page, 'Control+p');
  await press(page, 'Enter');
  await type(page, 'Backward: ULTRA_');
  await press(page, 'Control+p');
  await press(page, 'Escape');

  expect(await lines(page)).toEqual([
    'ULTRA_VIOLET_BEACON',
    'ULTRA_VIOLET_BEAM',
    'Report: ULTRA_VIOLET_BEAM confirmed',
    'Backward: ULTRA_VIOLET_BEAM'
  ]);

  const perfName = 'completion-10000';
  const perfLines = ['ULTRA_', 'ULTRA_VIOLET_BEACON'];
  for (let i = 0; i < 9998; i++) perfLines.push(`filler_${i}`);
  await page.evaluate(({ name, text }) => {
    localStorage.setItem(`vim_file_${name}`, text);
  }, { name: perfName, text: perfLines.join('\n') });
  await cmd(page, `e ${perfName}`);
  await press(page, 'A');

  const elapsed = await page.evaluate(() => {
    const start = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n', ctrlKey: true, bubbles: true, cancelable: true
    }));
    return performance.now() - start;
  });
  const firstLine = await page.evaluate(() => {
    return document.querySelector('#vim-content').textContent.split('\n')[0];
  });

  console.log(JSON.stringify({ lines: 10000, completionMs: elapsed }));
  expect(firstLine).toBe('ULTRA_VIOLET_BEACON');
  expect(elapsed).toBeLessThanOrEqual(100);
});
