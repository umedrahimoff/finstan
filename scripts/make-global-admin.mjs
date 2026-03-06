/**
 * Делает пользователя глобальным админом (tenant_id = NULL).
 * Использование: node --env-file=.env scripts/make-global-admin.mjs <username>
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const username = process.argv[2]
if (!username) {
  console.error("Usage: node --env-file=.env scripts/make-global-admin.mjs <username>")
  process.exit(1)
}

const sql = neon(url)
const r = await sql`UPDATE app_users SET tenant_id = NULL WHERE username = ${username} RETURNING id`
if (r.length === 0) {
  console.error(`User "${username}" not found`)
  process.exit(1)
}
console.log(`User "${username}" is now global admin`)
