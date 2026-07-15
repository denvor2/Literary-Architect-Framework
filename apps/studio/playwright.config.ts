import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

const USE_SCRATCH_SERVER = !!process.env.SCRATCH_PORT;
const BASE_PORT = USE_SCRATCH_SERVER ? process.env.SCRATCH_PORT : "3000";
const BASE_URL = `http://127.0.0.1:${BASE_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: USE_SCRATCH_SERVER ? undefined : {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
