import { test, expect } from '@playwright/test';
import { open, cmd } from './helpers.js';

test('ordinary j latency stays within jumplist baseline', async ({ page }) => {
  test.skip(!process.env.VIM_PERF, 'set VIM_PERF=1 to run latency acceptance');
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const cases = [
    { size: 1000, limit: 5.5 },
    { size: 10000, limit: 88.44 }
  ];

  for (const entry of cases) {
    const name = `perf-${entry.size}`;
    const text = Array.from({ length: entry.size }, (_, i) => `line ${i}`).join('\n');
    await page.evaluate(({ name, text }) => localStorage.setItem(`vim_file_${name}`, text), { name, text });
    await cmd(page, `e ${name}`);
    const samples = await page.evaluate(() => {
      const values = [];
      for (let i = 0; i < 110; i++) {
        const start = performance.now();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true, cancelable: true }));
        if (i >= 10) values.push(performance.now() - start);
      }
      return values.sort((a, b) => a - b);
    });
    const median = samples[Math.floor(samples.length / 2)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    console.log(JSON.stringify({ lines: entry.size, median, p95 }));
    expect(median).toBeLessThanOrEqual(entry.limit);
  }
});
