import { defineConfig } from '@playwright/test';

const previewBaseURL = process.env.GEORGIE_PREVIEW_BASE_URL;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['motion.spec.js', 'unit/**', 'worker/**'],
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: previewBaseURL || 'http://localhost:8767',
    actionTimeout: 5000,
    navigationTimeout: 10000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  webServer: previewBaseURL ? undefined : {
    command: 'python -m http.server 8767',
    url: 'http://localhost:8767/',
    reuseExistingServer: false,
    timeout: 5000
  }
});
