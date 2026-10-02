import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://127.0.0.1:5173', launchOptions: { channel: 'chrome' }, trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 } } }],
  reporter: 'list',
  webServer: { command: 'npm run preview -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true }
});
