import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/browser-report.json" }],
  ],
  webServer: {
    command: "node --import tsx tests/e2e-server.ts",
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
