import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })

  const { code, username, companyName } = (req.body ?? {}) as {
    code?: string
    username?: string
    companyName?: string
  }
  const c = (code ?? "").trim().toUpperCase()
  const u = (username ?? "").trim()
  const cn = (companyName ?? "").trim()

  if (!c || c.length < 6) return res.status(400).json({ error: "Введите код из Telegram" })
  if (!u || u.length < 2) return res.status(400).json({ error: "Логин минимум 2 символа" })
  if (!cn || cn.length < 1) return res.status(400).json({ error: "Введите название компании" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const regRows = await sql`
    SELECT chat_id FROM telegram_reg_codes WHERE code = ${c} AND expires_at > now() LIMIT 1
  `
  const reg = regRows[0] as { chat_id: string } | undefined
  if (!reg) return res.status(400).json({ error: "Код истёк или неверный. Отправьте /start боту заново." })

  const existingUser = await sql`SELECT id FROM app_users WHERE username = ${u} LIMIT 1`
  if (existingUser.length > 0) return res.status(400).json({ error: "Логин уже занят" })

  const bcrypt = (await import("bcryptjs")).default
  const hash = await bcrypt.hash(crypto.randomUUID(), 10)

  await sql`CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL`
  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      archived BOOLEAN NOT NULL DEFAULT false
    )
  `.catch(() => {})
  await sql`CREATE TABLE IF NOT EXISTS user_companies (user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE, PRIMARY KEY (user_id, company_id))`.catch(() => {})

  const [tenantRow] = await sql`INSERT INTO tenants DEFAULT VALUES RETURNING id`
  const tenantId = (tenantRow as { id: string }).id
  const userId = crypto.randomUUID()
  const companyId = crypto.randomUUID()

  await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`
  await sql`
    INSERT INTO app_users (id, username, password_hash, role, tenant_id, telegram_chat_id, last_login_at)
    VALUES (${userId}, ${u}, ${hash}, 'admin', ${tenantId}, ${reg.chat_id}, now())
  `
  await sql`
    INSERT INTO companies (id, name, owner_user_id)
    VALUES (${companyId}, ${cn}, ${userId})
  `
  await sql`DELETE FROM telegram_reg_codes WHERE code = ${c}`

  const { createToken } = await import("../../lib/jwt.js")
  const token = await createToken({
    uid: userId,
    username: u,
    role: "admin",
    tenantId,
  })

  return res.status(200).json({ token })
}
