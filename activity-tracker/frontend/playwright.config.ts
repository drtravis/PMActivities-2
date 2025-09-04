import { defineConfig, devices } from '@playwright/test';

// Base URL where the Next.js app is running.
// Override in CI/local with E2E_BASE_URL, e.g. E2E_BASE_URL=http://localhost:3003
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90 * 1000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

