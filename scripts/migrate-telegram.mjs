/**
 * Миграция: Telegram OTP — telegram_chat_id в app_users, таблицы для привязки и OTP
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)

await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT`
await sql`CREATE INDEX IF NOT EXISTS idx_app_users_telegram ON app_users(telegram_chat_id)`

await sql`
  CREATE TABLE IF NOT EXISTS telegram_link_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_telegram_link_expires ON telegram_link_codes(expires_at)`

await sql`
  CREATE TABLE IF NOT EXISTS telegram_otp_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_telegram_otp_user_expires ON telegram_otp_codes(user_id, expires_at)`

await sql`
  CREATE TABLE IF NOT EXISTS telegram_reg_codes (
    code TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_telegram_reg_expires ON telegram_reg_codes(expires_at)`

console.log("Telegram migration done")
