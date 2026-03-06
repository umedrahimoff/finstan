#!/usr/bin/env node
/**
 * Миграция: добавляет колонку frozen в app_users.
 * Запуск: npm run migrate (или node --env-file=.env scripts/migrate-frozen.mjs)
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required. Use: node --env-file=.env scripts/migrate-frozen.mjs")
  process.exit(1)
}

const sql = neon(url)

try {
  await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS frozen BOOLEAN NOT NULL DEFAULT false`
  console.log("Column 'frozen' added to app_users (or already exists)")
} catch (err) {
  console.error("Migration failed:", err.message)
  process.exit(1)
}
