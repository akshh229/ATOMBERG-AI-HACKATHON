import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- -p 3200",
    url: "http://localhost:3200",
    env: {
      ...process.env,
      NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO: "true",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
