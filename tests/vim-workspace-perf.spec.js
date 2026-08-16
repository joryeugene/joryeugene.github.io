import { test, expect } from '@playwright/test';
import { open, press, type, cmd } from './helpers.js';

test('PERF-2: 5000-line cursor movement stays below 50 ms p95', async ({ page }) => {
  test.skip(!process.env.VIM_PERF, 'set VIM_PERF=1 to run latency acceptance');
  await open(page);
  const text = Array.from({ length: 5000 }, (_, index) => `line ${index + 1}`).join('\n');
  await page.evaluate(text => localStorage.setItem('vim_file_cursor-perf.txt', text), text);
  await cmd(page, 'e cursor-perf.txt');

  const samples = await page.evaluate(() => {
    const durations = [];
    for (let index = 0; index < 110; index++) {
      const start = performance.now();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j', bubbles: true, cancelable: true
      }));
      if (index >= 10) durations.push(performance.now() - start);
    }
    return durations.sort((a, b) => a - b);
  });
  const p95 = samples[Math.floor(samples.length * 0.95)];
  console.log(JSON.stringify({ journey: 'cursor-5000', p95 }));
  expect(p95).toBeLessThan(50);
});

test('QF-17 PERF-3: a 2 MiB Quickfix scan finishes within its device budgets', async ({ page }) => {
  test.skip(!process.env.VIM_PERF, 'set VIM_PERF=1 to run latency acceptance');
  await open(page);
  const text = `${'ordinary searchable workspace text '.repeat(59000)}\nneedle-never-present`;
  await page.evaluate(text => localStorage.setItem('vim_file_scan-perf.log', text), text);

  async function measure(width, height, budget) {
    await page.setViewportSize({ width, height });
    await press(page, ':');
    await type(page, 'vimgrep /absent-pattern/j scan-perf.log');
    const elapsed = await page.evaluate(() => new Promise(resolve => {
      const status = document.querySelector('#vim-cmdline');
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (/Quickfix match/.test(status.textContent)) {
          observer.disconnect();
          resolve(performance.now() - start);
        }
      });
      observer.observe(status, { childList: true, subtree: true, characterData: true });
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true, cancelable: true
      }));
    }));
    console.log(JSON.stringify({ journey: `quickfix-${width}x${height}`, elapsed, budget }));
    expect(elapsed).toBeLessThan(budget);
  }

  await measure(1280, 800, 150);
  await measure(390, 844, 300);
});
