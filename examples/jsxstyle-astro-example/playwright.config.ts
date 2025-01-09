import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const reporter: PlaywrightTestConfig['reporter'] = [
  ['html', { open: 'never' }],
];

export default defineConfig({
  testDir: '__tests__',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter,
  timeout: 5000,

  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: 'http://localhost:4321/',
    actionTimeout: 0,
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: !process.env.CI
    ? [
        {
          name: 'chrome',
          use: {
            launchOptions: {
              executablePath:
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            },
          },
        },
      ]
    : [
        {
          name: 'chrome',
          use: devices['Desktop Chrome'],
        },
        {
          name: 'firefox',
          use: devices['Desktop Firefox'],
        },
        {
          name: 'webkit',
          use: devices['Desktop Safari'],
        },
      ],
});
