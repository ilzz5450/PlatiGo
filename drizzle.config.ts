import { defineConfig } from "drizzle-kit"
import path from "node:path"

// drizzle-kit auto-loads `.env` but not `.env.local`. Load it explicitly so
// `DATABASE_URL_UNPOOLED` (used for migrations) resolves correctly.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"))
} catch {
  // .env.local is optional; fall back to any env already set
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "",
  },
  migrations: {
    schema: "public",
  },
  strict: true,
  verbose: true,
})
