import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_E2E_USER_EMAIL: 'e2e-user@example.com',
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
    },
  },
  projects: [
    {
      name: 'ui-mocked',
      testMatch: /.*\.mocked\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'ui-real-smoke',
      testMatch: /.*\.smoke-ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'api-real-smoke',
      testMatch: /.*\.smoke-api\.spec\.ts/,
      use: {
        baseURL: process.env.E2E_BACKEND_URL ?? 'http://127.0.0.1:8000',
      },
    },
  ],
});
