import { defineConfig } from '@playwright/test';

const port = process.env.PHALENE_PLAYWRIGHT_PORT || '8767';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'motion.spec.js',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    actionTimeout: 5000,
    navigationTimeout: 10000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: `python -m http.server ${port}`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
    timeout: 5000
  }
});
