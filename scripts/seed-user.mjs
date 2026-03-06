import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const username = process.argv[2] || "admin"
const password = process.argv[3] || "admin123"
const role = process.argv[4] || "admin"

const sql = neon(url)
await sql`
  CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username)`
await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`
const hash = await bcrypt.hash(password, 10)
await sql`
  INSERT INTO app_users (username, password_hash, role)
  VALUES (${username}, ${hash}, ${role})
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
`
await import("./init-tables.mjs")
console.log(`User "${username}" (${role}) ready`)
