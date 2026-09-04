import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_pfexlfdptflxwdyvbayw",
  dirs: ["./trigger", "./features/workflows/tasks"],
  build: {
    // Stagehand loads its Chrome extension ZIP from its installed package.
    // Keep it and its SDK external so Trigger.dev's bundled worker retains that asset.
    external: ["@browserbasehq/stagehand", "@browserbasehq/sdk"],
  },
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 3600,
});
