import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt"
import { sql } from "../../lib/db"

const GLOBAL_ADMIN_TG_ID = process.env.TELEGRAM_GLOBAL_ADMIN_ID || ""

async function requireAdmin(req: VercelRequest): Promise<boolean> {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return false
  const payload = await verifyToken(token)
  if (!payload) return false
  const rows = await sql`SELECT role, telegram_id FROM users WHERE id = ${payload.uid} LIMIT 1`
  const u = rows[0] as Record<string, unknown> | undefined
  if (!u) return false
  return u.role === "admin" || (u.telegram_id as string) === GLOBAL_ADMIN_TG_ID
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await requireAdmin(req))) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM users ORDER BY updated_at DESC`
    const users = rows.map((r: Record<string, unknown>) => ({
      uid: r.id,
      telegramId: r.telegram_id,
      username: r.username,
      displayName: r.display_name,
      role:
        (r.telegram_id as string) === GLOBAL_ADMIN_TG_ID ? "admin" : r.role,
    }))
    return res.status(200).json(users)
  }

  return res.status(405).json({ error: "Method not allowed" })
}
