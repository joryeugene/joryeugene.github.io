import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'motion.spec.js',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-results/motion',
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report/motion', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:8771',
    actionTimeout: 5000,
    navigationTimeout: 10000,
    screenshot: 'only-on-failure',
    trace: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 }
    }
  },
  webServer: {
    command: 'python -m http.server 8771 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8771/',
    reuseExistingServer: false,
    timeout: 5000
  }
});
