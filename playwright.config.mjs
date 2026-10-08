import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4179' },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
  ],
  webServer: { command: 'npx vite --host 127.0.0.1 --port 4179 --strictPort', url: 'http://127.0.0.1:4179/browser/', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
