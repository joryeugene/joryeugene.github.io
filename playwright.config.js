import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'motion.spec.js',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8767',
    actionTimeout: 5000,
    navigationTimeout: 10000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'python -m http.server 8767',
    url: 'http://localhost:8767/',
    reuseExistingServer: false,
    timeout: 5000
  }
});
