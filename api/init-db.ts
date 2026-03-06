import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const secret = process.env.INIT_SECRET
  const key = req.query.key
  if (secret && key !== secret) {
    return res.status(403).json({ error: "Invalid key" })
  }
  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)

    await sql`CREATE TABLE IF NOT EXISTS app_users (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user')`
    await sql`CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username)`

    await sql`CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', name TEXT NOT NULL, type TEXT NOT NULL, currency TEXT NOT NULL, balance NUMERIC NOT NULL DEFAULT 0, is_primary BOOLEAN DEFAULT false)`
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`
    await sql`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', name TEXT NOT NULL, type TEXT NOT NULL, parent_id TEXT, recurring BOOLEAN DEFAULT false)`
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`
    await sql`CREATE TABLE IF NOT EXISTS counterparties (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', name TEXT NOT NULL, type TEXT NOT NULL, inn TEXT, country TEXT, contact_name TEXT, contact_phone TEXT, contact_email TEXT)`
    await sql`CREATE INDEX IF NOT EXISTS idx_counterparties_user ON counterparties(user_id)`
    await sql`ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS inn TEXT`
    await sql`ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS country TEXT`
    await sql`ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS contact_name TEXT`
    await sql`ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS contact_phone TEXT`
    await sql`ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS contact_email TEXT`
    await sql`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', name TEXT NOT NULL)`
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)`
    await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', date TEXT NOT NULL, amount NUMERIC NOT NULL, currency TEXT NOT NULL, type TEXT NOT NULL, account_id TEXT NOT NULL, to_account_id TEXT, category_id TEXT, counterparty_id TEXT, project_id TEXT, comment TEXT, planned_payment_id TEXT)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`
    await sql`CREATE TABLE IF NOT EXISTS budgets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', category_id TEXT NOT NULL, year INTEGER NOT NULL, month INTEGER NOT NULL, amount NUMERIC NOT NULL, currency TEXT NOT NULL)`
    await sql`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)`
    await sql`CREATE TABLE IF NOT EXISTS planned_payments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL DEFAULT 'default', date TEXT NOT NULL, amount NUMERIC NOT NULL, currency TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, account_id TEXT, category_id TEXT, counterparty_id TEXT, recurrence TEXT, repeat_until TEXT)`
    await sql`CREATE INDEX IF NOT EXISTS idx_planned_payments_user ON planned_payments(user_id)`

    return res.status(200).json({ ok: true, message: "Tables ready" })
  } catch (err) {
    console.error("Init DB:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
