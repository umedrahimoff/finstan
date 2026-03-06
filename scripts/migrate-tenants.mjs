/**
 * Миграция: tenants и tenant_id для мультитенантности.
 * Глобальный админ: tenant_id IS NULL.
 */
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)

await sql`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL`
await sql`CREATE INDEX IF NOT EXISTS idx_app_users_tenant ON app_users(tenant_id)`

console.log("Migration: tenants table and tenant_id column ready")
