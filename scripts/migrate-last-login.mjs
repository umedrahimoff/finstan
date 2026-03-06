/**
 * Миграция: last_login_at в app_users
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)
await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`
console.log("last_login_at migration done")
