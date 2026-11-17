import { defineConfig, devices } from '@playwright/test';

// Set PW_EXECUTABLE to use a preinstalled Chromium (for example /opt/pw-browsers/chromium).
const launchOptions = process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4173', trace: 'off', launchOptions },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 780 }, launchOptions } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1100 }, launchOptions } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 }, launchOptions } },
  ],
});
