import { defineConfig } from '@playwright/test';

// Локально можно использовать установленный браузер: PW_CHANNEL=msedge npx playwright test
const channel = process.env.PW_CHANNEL;
const port = 3200;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}`, ...(channel ? { channel } : {}) },
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
