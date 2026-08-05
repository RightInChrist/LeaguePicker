import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Deliberately NOT the fleet-generic APP_URL: that variable is
    // exported globally on dev machines (pointing at unrelated local
    // services), which silently retargets the whole suite. Use the
    // app-specific override instead.
    baseURL: process.env.LEAGUEPICKER_URL || 'http://localhost:8917',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'python3 -m http.server 8917',
    url: 'http://localhost:8917',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
