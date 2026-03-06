import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getGlobalAdmin(req: VercelRequest, sql: { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> }) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  if (payload.tenantId != null) return null
  const rows = await sql`SELECT id FROM app_users WHERE id = ${payload.uid} AND frozen = false AND tenant_id IS NULL LIMIT 1`
  return rows.length > 0 ? { uid: payload.uid } : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const auth = await getGlobalAdmin(req, sql as { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> })
  if (!auth) return res.status(403).json({ error: "Только глобальный админ может управлять организациями" })

  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT u.id, u.username, u.role, u.tenant_id, t.created_at
        FROM app_users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.tenant_id IS NOT NULL
        ORDER BY t.created_at DESC
      `.catch(() => [])
      return res.status(200).json(rows)
    } catch (err) {
      console.error("Management list:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  try {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }
    const u = (username ?? "").trim()
    const p = password ?? ""
    if (!u || u.length < 2) return res.status(400).json({ error: "Логин минимум 2 символа" })
    if (!p || p.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" })

    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `
    await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL`

    const existing = await sql`SELECT id FROM app_users WHERE username = ${u} LIMIT 1`
    if (existing.length > 0) return res.status(400).json({ error: "Логин уже занят" })

    const bcrypt = (await import("bcryptjs")).default
    const hash = await bcrypt.hash(p, 10)

    const [tenantRow] = await sql`INSERT INTO tenants DEFAULT VALUES RETURNING id`
    const tenantId = (tenantRow as { id: string }).id

    const userId = crypto.randomUUID()
    await sql`
      INSERT INTO app_users (id, username, password_hash, role, tenant_id)
      VALUES (${userId}, ${u}, ${hash}, 'admin', ${tenantId})
    `

    return res.status(200).json({
      id: userId,
      username: u,
      role: "admin",
      tenantId,
      message: "Пользователь создан. Он может войти и создать свою компанию.",
    })
  } catch (err) {
    console.error("Management create user:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
