import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Global pool singleton so hot reload in Next.js dev does not exhaust the
 * connection limit. Reuses `pg.Pool` created once per module instance.
 */
const globalForDb = globalThis as unknown as {
  pool?: Pool
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in the environment")
  }
  return new Pool({ connectionString })
}

const pool = globalForDb.pool ?? createPool()
if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
export { schema }
export type Database = typeof db
