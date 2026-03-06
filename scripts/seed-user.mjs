import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const username = process.argv[2] || "admin"
const password = process.argv[3] || "admin123"

const sql = neon(url)
await sql`
  CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username)`
const hash = await bcrypt.hash(password, 10)
await sql`
  INSERT INTO app_users (username, password_hash)
  VALUES (${username}, ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
`
console.log(`User "${username}" ready`)
