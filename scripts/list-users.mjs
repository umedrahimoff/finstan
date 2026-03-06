/**
 * Список пользователей и их tenant_id.
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)
const rows = await sql`SELECT id, username, role, tenant_id FROM app_users ORDER BY username`
console.log(rows.map((r) => ({ ...r, isGlobalAdmin: r.tenant_id == null })))
