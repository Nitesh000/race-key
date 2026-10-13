import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const external = process.env.DATABASE_URL;
const databaseUrl = external ?? "postgres://postgres:postgres@localhost:5433/postgres";
const ci = !!process.env.CI;

const webServer: NonNullable<PlaywrightTestConfig["webServer"]> = [
  ...(external
    ? []
    : [
        {
          command: "pnpm --filter @race-key/db dev:db",
          url: "http://localhost:5434",
          reuseExistingServer: !ci,
          timeout: 180_000,
          env: { LOCAL_DB_THROWAWAY: "1" },
        },
      ]),
  {
    command: `pnpm --filter @race-key/realtime exec wrangler dev --port 8787 --var ENVIRONMENT:development --var DATABASE_URL:${databaseUrl}`,
    url: "http://localhost:8787/health",
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
  {
    command: "pnpm --filter @race-key/web exec next start -p 3100",
    url: "http://localhost:3100/practice",
    reuseExistingServer: !ci,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234",
      BETTER_AUTH_URL: "http://localhost:3100",
      REALTIME_SHARED_SECRET: "race-key-dev-secret",
      AUTH_RATE_LIMIT: "off",
      NEXT_PUBLIC_REALTIME_URL: "http://localhost:8787",
    },
  },
];

export default defineConfig({
  testDir: "specs",
  timeout: 90_000,
  fullyParallel: true,
  workers: ci ? 2 : 3,
  retries: ci ? 1 : 0,
  reporter: ci ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer,
});
