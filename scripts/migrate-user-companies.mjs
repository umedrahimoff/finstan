/**
 * Миграция: таблицы companies и user_companies для привязки пользователей к компаниям.
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)

await sql`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    archived BOOLEAN NOT NULL DEFAULT false
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS user_companies (
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, company_id)
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id)`

console.log("Migration: companies and user_companies tables ready")
