#!/usr/bin/env node
/**
 * Миграция: переводит пользователей с ролью user в moderator.
 * Запуск: node --env-file=.env scripts/migrate-user-to-moderator.mjs
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required. Use: node --env-file=.env scripts/migrate-user-to-moderator.mjs")
  process.exit(1)
}

const sql = neon(url)

try {
  const before = await sql`SELECT count(*)::int as n FROM app_users WHERE role = 'user'`
  const count = before[0]?.n ?? 0
  if (count > 0) {
    await sql`UPDATE app_users SET role = 'moderator' WHERE role = 'user'`
    console.log(`Converted ${count} user(s) to moderator`)
  } else {
    console.log("No users with role 'user' found")
  }
} catch (err) {
  console.error("Migration failed:", err.message)
  process.exit(1)
}
