import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8765',
    actionTimeout: 5000,
    navigationTimeout: 10000
  },
  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://localhost:8765/',
    reuseExistingServer: true,
    timeout: 5000
  }
});
