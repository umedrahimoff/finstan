import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const sql = neon(url)

await sql`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    is_primary BOOLEAN DEFAULT false
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id TEXT,
    recurring BOOLEAN DEFAULT false
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS counterparties (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    type TEXT NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_counterparties_user ON counterparties(user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    type TEXT NOT NULL,
    account_id TEXT NOT NULL,
    to_account_id TEXT,
    category_id TEXT,
    counterparty_id TEXT,
    project_id TEXT,
    comment TEXT,
    planned_payment_id TEXT
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`

await sql`
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    category_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)`

await sql`
  CREATE TABLE IF NOT EXISTS planned_payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL DEFAULT 'default',
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    account_id TEXT,
    category_id TEXT,
    counterparty_id TEXT,
    recurrence TEXT,
    repeat_until TEXT
  )
`
await sql`CREATE INDEX IF NOT EXISTS idx_planned_payments_user ON planned_payments(user_id)`

console.log("Tables ready")
