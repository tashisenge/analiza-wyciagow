import { defineConfig, devices } from "@playwright/test";

const port = process.env["CI"] ? "3100" : "3000";
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? `http://localhost:${port}`;
const reuseServer = !process.env["CI"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "smoke-public",
      testMatch: /smoke-public\.spec\.ts/,
    },
    {
      name: "smoke-app",
      testMatch: /smoke-app\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "playwright/.auth/demo.json" },
    },
    {
      name: "smoke-import",
      testMatch: /import-smoke\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "playwright/.auth/demo.json" },
    },
  ],
  webServer: {
    command: process.env["CI"]
      ? `npm run build && PORT=${port} npm run start`
      : "npm run build && npm run start",
    url: `${baseURL}/login`,
    reuseExistingServer: reuseServer,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
